import { knex } from '../orm';
import * as PromptModels from './models';
import Clients from '../conversations/clients';
import { NarrativeSession } from '../narratives/models';
import { sureNoThanksTemplates } from '../narratives/templates/quick-replies';
import * as PROMPT_CONST from '../constants/prompts';

export function getPrompt(params, options = { returnJSON: true }) {
  return PromptModels.Prompt.where(params)
    .fetch({ withRelated: ['steps', 'actions'] })
    .then((promptModel) => {
      return options.returnJSON ? promptModel.toJSON() : promptModel;
    }).catch(err => err);
}

export function getPrompts(params = {}, options = { returnJSON: true }) {
  return PromptModels.Prompt.query((qb) => {
    qb.where('organization_id', '=', params.organization_id);
  }).fetchAll({ withRelated: ['steps', 'actions'] })
    .then(promptModels => options.returnJSON ? promptModels.toJSON() : promptModels)
    .catch(err => err);
}

export async function createPrompt({ prompt, steps = [], actions = [] }, options = { returnJSON: true }) {
  const newPrompt = await PromptModels.Prompt.forge(prompt).save(null, { method: 'insert' }).then(p => p.toJSON());
  if (steps.length > 0) {
    const newStepModels = await Promise.all(steps.map((step) => {
      return PromptModels.PromptStep.forge({
        ...step,
        prompt_id: newPrompt.id,
        type: step.type || PROMPT_CONST.TEXT,
      }).save(null, { method: 'insert' }).then(s => s.toJSON());
    }));
    const newActionModels = await Promise.all(actions.map((action) => {
      const actionObj = {
        prompt_id: newPrompt.id,
        type: action.type,
      };
      if (actionObj.type === PROMPT_CONST.EMAIL_RESPONSES && action.config.contact.id) {
        actionObj.config = { contact: { id: Number(action.config.contact.id) } };
        return PromptModels.PromptAction.forge(actionObj)
          .save(null, { method: 'insert' }).then(a => a.toJSON());
      }
    }));
    // Compile and Return!
    return {
      ...newPrompt,
      steps: newStepModels,
      actions: newActionModels,
    };
  }
  return options.returnJSON ? newPrompt.toJSON() : newPrompt;
}

export async function updatePrompt(prompt) {
  if (!prompt.id) throw new Error('No Prompt ID provided');
  const steps = prompt.steps;
  const actions = prompt.actions;
  delete prompt.steps;
  delete prompt.actions;
  const updatedPrompt = await PromptModels.Prompt.where({ id: prompt.id }).save(prompt, { method: 'update' }).then(p => p.toJSON());
  const updatedSteps = await PromptModels.PromptStep.where({ prompt_id: prompt.id }).fetchAll()
    .then((fetchedStepModels) => {
      const stepCrudOperations = [];
      // Compile Create/Updates
      steps.forEach((step, index) => {
        if (step.id) {
          stepCrudOperations.push(PromptModels.PromptStep.forge({ ...step }).save(null, { method: 'update' }).then(s => s.toJSON()));
        } else {
          stepCrudOperations.push(PromptModels.PromptStep.forge({ ...step, prompt_id: prompt.id }).save(null, { method: 'insert' }).then(s => s.toJSON()));
        }
      });
      // Compile Deletes
      fetchedStepModels.toJSON()
        .filter(fetched => steps.filter(s => s.id == fetched.id).length === 0)
        .forEach(f => PromptModels.PromptResponse.where({ prompt_step_id: f.id }).destroy().then(
            () => PromptModels.PromptStep.where({ id: f.id }).destroy({ require: true })));
      return Promise.all(stepCrudOperations);
    });
  const updatedActions = await PromptModels.PromptAction.where({ prompt_id: prompt.id }).fetchAll()
    .then((fetchedActionModels) => {
      const actionCrudOperations = [];
      // Compile Create/Updates
      actions.forEach((action) => {
        if (action.id) {
          actionCrudOperations.push(PromptModels.PromptAction.forge(action).save(null, { method: 'update' }).then(s => s.toJSON()));
        } else {
          actionCrudOperations.push(PromptModels.PromptAction.forge({ ...action, prompt_id: prompt.id }).save(null, { method: 'insert' }).then(s => s.toJSON()));
        }
      });
      // Compile Deletes
      fetchedActionModels.toJSON()
        .filter(fetched => actions.filter(a => a.id == fetched.id).length === 0)
        .forEach(f => PromptModels.PromptAction.where({ id: f.id }).destroy({ require: true }));
      return Promise.all(actionCrudOperations);
    });
  return {
    ...updatedPrompt,
    steps: updatedSteps,
    actions: updatedActions,
  };
}

export function upsertPrompt(prompt, options = { returnJSON: true }) {
  if (!prompt.steps || prompt.steps.length === 0) throw new Error('No steps for prompt');
  // If prompt has id, update
  if (prompt.id) {
    return updatePrompt(prompt, options);
  }
  // Otherwise create prompt
  const steps = prompt.steps;
  const actions = prompt.actions;
  delete prompt.steps;
  delete prompt.actions;
  return createPrompt({ prompt, steps, actions }, options);
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
  return PromptModels.Prompt.where({ id: prompt.id }).fetch({ withRelated: ['steps', 'actions'] })
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
