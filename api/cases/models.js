import lodash from 'lodash';
import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';
import * as KnowledgeBaseModels from '../knowledge-base/models';
import { Media } from '../media/models';

export const CaseCategory = bookshelf.Model.extend({
  tableName: 'case_categorys',
  parent: function() {
    return this.hasOne(CaseCategory, 'parent_category_id');
  },
});

export const CaseLocations = bookshelf.Model.extend({
  tableName: 'cases_locations',
});

export const CaseMedia = bookshelf.Model.extend({
  tableName: 'cases_medias',
});

export const OrganizationsCases = bookshelf.Model.extend({
  tableName: 'organizations_cases',
});

export const Case = bookshelf.Model.extend({
  tableName: 'cases',
  hasTimeStamps: true,
  organizations: function() {
    return this.belongsToMany(AccountModels.Organization, 'organizations_cases');
  },
  category: function() {
    return this.belongsTo(CaseCategory, 'category_id');
  },
  constituent: function() {
    return this.belongsTo(AccountModels.Constituent, 'constituent_id');
  },
  locations: function() {
    return this.belongsToMany(KnowledgeBaseModels.Location, 'cases_locations');
  },
  media: function() {
    return this.belongsToMany(Media, 'cases_medias');
  },
});
