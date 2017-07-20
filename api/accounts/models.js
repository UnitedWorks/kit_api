import bcrypt from 'bcrypt-nodejs';
import { bookshelf } from '../orm';
import * as KnowledgeModels from '../knowledge-base/models';
import { Task } from '../tasks/models';
import * as IntegrationModels from '../integrations/models';
import * as ConversationModels from '../conversations/models';

export const Representative = bookshelf.Model.extend({
  tableName: 'representatives',
  hasTimeStamps: true,
  initialize() {
    this.on('creating', (model) => {
      if (model.attributes.password) {
        return new Promise((resolve, reject) => {
          bcrypt.genSalt(10, (err, salt) => {
            if (err) reject();
            bcrypt.hash(model.attributes.password, salt, null, (err, hash) => {
              if (err) reject();
              model.attributes.password = hash;
              resolve();
            });
          });
        });
      }
    });
  },
  hidden: ['_pivot_knowledge_category_id', '_pivot_representative_id', 'email_confirmed', 'created_at'],
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
});

export const Constituent = bookshelf.Model.extend({
  tableName: 'constituents',
  organizations: function () {
    return this.belongsToMany(Organization, 'organizations_constituents');
  },
  tasks: function() {
    return this.hasMany(Task, 'constituent_id');
  },
  facebookEntry: function() {
    return this.hasOne(ConversationModels.MessageEntry, 'facebook_entry_id', 'facebook_entry_id');
  },
  smsEntry: function() {
    return this.hasOne(ConversationModels.MessageEntry, 'phone_number', 'entry_phone_number');
  },
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives: function () {
    return this.hasMany(Representative, 'organization_id');
  },
  constituents: function () {
    return this.belongsToMany(Constituent, 'organizations_constiuents');
  },
  integrations: function () {
    return this.belongsToMany(IntegrationModels.Integration, 'organizations_integrations');
  },
  location: function () {
    return this.belongsTo(KnowledgeModels.Location, 'location_id');
  },
  messageEntries: function() {
    return this.hasMany(ConversationModels.MessageEntry, 'organization_id');
  },
});
