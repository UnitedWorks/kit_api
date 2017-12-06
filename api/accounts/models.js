import bcrypt from 'bcrypt-nodejs';
import { bookshelf } from '../orm';
import { Task } from '../tasks/models';
import * as IntegrationModels from '../integrations/models';
import * as ConversationModels from '../conversations/models';
import { Service } from '../services/models';
import { Place } from '../places/models';
import { Person } from '../persons/models';
import { Vehicle } from '../vehicles/models';
import { Phone } from '../phones/models';
import { Address } from '../geo/models';

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
  tasks() {
    return this.hasMany(Task, 'constituent_id');
  },
  facebookEntry() {
    return this.hasOne(ConversationModels.MessageEntry, 'facebook_entry_id', 'facebook_entry_id');
  },
  smsEntry() {
    return this.hasOne(ConversationModels.MessageEntry, 'phone_number', 'entry_phone_number');
  },
});

export const Organization = bookshelf.Model.extend({
  tableName: 'organizations',
  representatives() {
    return this.hasMany(Representative, 'organization_id');
  },
  integrations() {
    return this.belongsToMany(IntegrationModels.Integration, 'organizations_integrations');
  },
  address() {
    return this.hasOne(Address, 'organization_id');
  },
  addresses() {
    return this.belongsToMany(Address, 'addresss_entity_associations', 'organization_id', 'address_id');
  },
  messageEntries() {
    return this.hasMany(ConversationModels.MessageEntry, 'organization_id');
  },
  services() {
    return this.belongsToMany(Service, 'organizations_entity_associations');
  },
  places() {
    return this.belongsToMany(Place, 'organizations_entity_associations');
  },
  persons() {
    return this.belongsToMany(Person, 'organizations_entity_associations');
  },
  vehicles() {
    return this.belongsToMany(Vehicle, 'organizations_entity_associations');
  },
  phones() {
    return this.belongsToMany(Phone, 'organizations_entity_associations');
  },
});
