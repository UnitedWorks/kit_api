import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

export const PromptResponse = bookshelf.Model.extend({
  tableName: 'prompt_responses',
  hasTimeStamps: true,
  step() {
    return this.hasOne(PromptStep, 'prompt_step_id');
  },
  constituent() {
    return this.hasOne(AccountModels.Constituent, 'constituent_id');
  },
});

export const PromptStep = bookshelf.Model.extend({
  tableName: 'prompt_steps',
  hasTimeStamps: true,
  responses() {
    return this.hasMany(PromptResponse, 'prompt_step_id');
  },
});

export const PromptAction = bookshelf.Model.extend({
  tableName: 'prompt_actions',
  hasTimeStamps: true,
});

export const Prompt = bookshelf.Model.extend({
  tableName: 'prompts',
  hasTimeStamps: true,
  steps() {
    return this.hasMany(PromptStep, 'prompt_id');
  },
  actions() {
    return this.hasMany(PromptAction, 'prompt_id');
  },
  organization() {
    return this.hasOne(AccountModels.Organization, 'organization_id');
  },
});
