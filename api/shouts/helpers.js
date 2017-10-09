import { ShoutOut, ShoutOutTrigger } from '../shouts/models';
import { createTask } from '../tasks/helpers';

export async function createShoutOut(label, params, config = {}) {
  if (!label || !params) throw new Error('Missing Values');
  const trigger = await ShoutOutTrigger.where({ organization_id: config.organization_id, label: 'property_building_homes.mold' }).fetch()
    .then(d => (d ? d.toJSON().config : null));
  // Create Shout Out?
  const newShoutOut = await ShoutOut.forge({
    label,
    constituent_id: config.constituent_id,
    params,
  }).save().then(m => m.toJSON());
  // Run Triggers? (ex: create task, with SCF management)
  if (trigger && trigger.create_task) {
    const newTask = await createTask(params, {
      organization_id: config.organization_id,
      constituent_id: config.constituent_id,
    }, {
      see_click_fix: trigger.see_click_fix,
    });
    // Update Shout Out
    return ShoutOut.where({ id: newShoutOut.id }).save({ task_id: newTask.id }, { patch: true, method: 'update' }).then(s => s.toJSON());
  }
  return newShoutOut;
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
