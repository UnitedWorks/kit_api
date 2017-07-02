import { knex } from '../orm';
import * as PromptModels from './models';
import Clients from '../conversations/clients';
import { NarrativeSession } from '../narratives/models';
import { sureNoThanksTemplates } from '../narratives/templates/quick-replies';

export function getPrompt(params, options = { returnJSON: true }) {
  return PromptModels.Prompt.where(params)
    .fetch({ withRelated: ['steps'] })
    .then((promptModel) => {
      return options.returnJSON ? promptModel.toJSON() : promptModel;
    }).catch(err => err);
}

export function getPrompts(params = {}, options = { returnJSON: true }) {
  return PromptModels.Prompt.query((qb) => {
    qb.where('organization_id', '=', params.organization_id).orWhere('template', '=', true);
  }).fetchAll({ withRelated: ['steps'] })
    .then(promptModels => options.returnJSON ? promptModels.toJSON() : promptModels)
    .catch(err => err);
}

export function createPrompt({ prompt, steps = [], organization }, options = { returnJSON: true }) {
  return PromptModels.Prompt.forge({ ...prompt, organization_id: organization.id })
    .save(null, { method: 'insert' })
    .then((newPromptModel) => {
      if (steps.length > 0) {
        const modifiedSteps = steps.map((step, index) => {
          return PromptModels.PromptStep.forge(Object.assign(step, {
            position: index,
            prompt_id: newPromptModel.get('id'),
          })).save(null, { method: 'insert' });
        });
        return Promise.all(modifiedSteps)
          .then((newStepModels) => {
            return options.returnJSON ? Object.assign(newPromptModel.toJSON(), {
              steps: newStepModels.toJSON(),
            }) : { prompt: newPromptModel.toJSON(), steps: newStepModels.toJSON() };
          }).catch(err => err);
      }
      return options.returnJSON ? newPromptModel.toJSON() : newPromptModel;
    }).catch(err => err);
}

export function updatePrompt(promptProps, options = { returnJSON: true }) {
  if (!promptProps.id) throw new Error('No Prompt ID provided');
  return PromptModels.Prompt.where({ id: promptProps.id })
    .save(promptProps, { method: 'update' })
    .then((updatedModel) => {
      return options.returnJSON ? updatedModel.toJSON() : updatedModel;
    }).catch((err) => {
      throw new Error(err);
    });
}

export function deletePrompt({ id }) {
  return PromptModels.PromptStep.where({ prompt_id: id })
    .fetchAll({ withRelated: 'responses' })
    .then((stepModels) => {
      const destroyResponses = [];
      stepModels.models.forEach((model) => {
        destroyResponses.push(model.related('responses').invokeThen('destroy'));
      });
      // Destroy Answers
      return Promise.all(destroyResponses).then(() => {
        // Destroy Questions
        return stepModels.invokeThen('destroy').then(() => {
          // Destroy Prompt
          return PromptModels.Prompt.forge({ id }).destroy().then(() => {
            return { id };
          }).catch(err => err);
        }).catch(err => err);
      }).catch(err => err);
    }).catch(err => err);
}

export function broadcastPrompt(prompt = {}) {
  if (!prompt.id) throw new Error('No Prompt ID provided');
  return PromptModels.Prompt.where({ id: prompt.id }).fetch({ withRelated: ['steps'] })
    .then((foundPrompt) => {
      return NarrativeSession.where({ organization_id: foundPrompt.get('organization_id') })
        .fetchAll({ withRelated: ['constituent', 'constituent.facebookEntry', 'constituent.smsEntry'] })
        .then((sessions) => {
          const message = `Hey there! Do you have a moment to help me with a quick prompt, "${foundPrompt.get('name')}"?`;
          sessions.models.forEach((session) => {
            // Set state to waiting for acceptance
            session.save({
              state_machine_name: 'prompt',
              state_machine_current_state: 'waiting_for_acceptance',
              data_store: Object.assign(session.get('data_store'), {
                prompt: foundPrompt.toJSON(),
              }),
            }).then(() => {
              // Send Message
              if (session.related('constituent').get('facebook_id')) {
                new Clients.FacebookMessengerClient({
                  constituent: session.related('constituent').toJSON(),
                }).send(message, sureNoThanksTemplates);
              } else if (session.related('constituent').get('phone')) {
                new Clients.TwilioSMSClient({
                  constituent: session.related('constituent').toJSON(),
                }).send(message, sureNoThanksTemplates);
              }
            });
          });
        }).catch(err => err);
    }).catch(err => err);
}

export function savePromptResponses(steps, constituent) {
  const responsesToForge = [];
  steps.forEach((step) => {
    responsesToForge.push(PromptModels.PromptResponse.forge({
      constituent_id: constituent.id,
      prompt_step_id: step.id,
      response: step.response,
    }).save());
  });
  return Promise.all(responsesToForge)
    .then(data => data)
    .catch(error => error);
}

export function getPromptResponsesAsTable(params) {
  if (!params.id) throw new Error('No prompt id');
  return knex.raw(`SELECT replace(lower(prompt_steps.instruction), ' ', '_') AS prompt, prompt_responses.constituent_id AS constituent_id, prompt_responses.response->>'text' AS response, date_trunc('hour', prompt_responses.created_at) AS answered_on
    FROM prompt_responses
    LEFT JOIN prompt_steps ON prompt_responses.prompt_step_id = prompt_steps.id
    WHERE prompt_steps.prompt_id = ${params.id} ${params.fromNow ? `AND EXTRACT(EPOCH FROM (now() - prompt_responses.created_at)) < ${params.fromNow}` : ''}
  `).then((data) => {
    // One day we'll be able to use crosstabview and wont need to do any mutations funk
    // \crosstabview constituent_id prompt response;
    const responseDataHash = {};
    data.rows.forEach((row) => {
      if (!responseDataHash[row.constituent_id]) {
        responseDataHash[row.constituent_id] = {};
      }
      if (!responseDataHash[row.constituent_id][row.answered_on]) {
        responseDataHash[row.constituent_id][row.answered_on] = {};
      }
      responseDataHash[row.constituent_id][row.answered_on][row.instruction] = row.response;
    });
    const finalFormat = [];
    Object.keys(responseDataHash).forEach((cId) => {
      Object.keys(responseDataHash[cId]).forEach((dt) => {
        const constituentObj = {
          constituent_id: cId,
          answered_on: dt,
        };
        Object.keys(responseDataHash[cId][dt]).forEach((key) => {
          constituentObj[key] = responseDataHash[cId][dt][key];
        });
        finalFormat.push(constituentObj);
      });
    });
    // Update Last Downloaded

    // Return
    return { rows: finalFormat };
  });
}
