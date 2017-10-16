import knex from 'knex';
import { ShoutOut, ShoutOutTrigger } from '../shouts/models';
import { createTask } from '../tasks/helpers';

export async function createShoutOut(label, params, config = {}) {
  if (!label || !params) throw new Error('Missing Values');
  // Create Shout Out?
  const newShoutOut = await ShoutOut.forge({
    label,
    constituent_id: config.constituent_id,
    params,
  }).save().then(m => m.toJSON());
  // Run Triggers? (ex: create task, with SCF management)
  const trigger = await ShoutOutTrigger.where({ organization_id: config.organization_id, label })
    .fetch().then(d => (d ? d.toJSON().config : null));
  if (trigger && trigger.create_task) {
    const newTask = await createTask(params, {
      organization_id: config.organization_id,
      constituent_id: config.constituent_id,
    }, {
      see_click_fix: trigger.see_click_fix,
    });
    // Update Shout Out with Task ID & Assignment Time
    return ShoutOut.where({ id: newShoutOut.id }).save({
      task_id: newTask.id,
      assigned_at: knex.raw('now()'),
    }, { patch: true, method: 'update' }).then(s => s.toJSON());
  }
  return newShoutOut;
}

export function assignShoutOutToTask(shoutOutId, taskId) {
  if (!shoutOutId) throw new Error('No Shout Out ID');
  const newProps = {};
  if (taskId) {
    newProps.task_id = taskId;
    newProps.assigned_at = knex.raw('now()');
  } else {
    newProps.task_id = null;
    newProps.assigned_at = null;
  }
  return ShoutOut.where({ id: shoutOutId })
    .save(newProps, { patch: true, method: 'update' })
    .then(s => s.toJSON());
}

export function paramsToPromptSteps(params) {
  const stepsArray = [];
  Object.keys(params).forEach((param) => {
    stepsArray.push({ ...params[param], key: param });
  });
  return stepsArray;
}

export function promptStepsToParamValues(steps) {
  const paramsObj = {};
  steps.forEach(step => (paramsObj[step.key] = step.value));
  return paramsObj;
}
