import lodash from 'lodash';
import { bookshelf } from '../orm';
import * as AccountModels from '../accounts/models';

export const CaseCategory = bookshelf.Model.extend({
  tableName: 'case_categorys',
  parent: function() {
    return this.hasOne(CaseCategory, 'parent_category_id');
  },
});

export const Case = bookshelf.Model.extend({
  tableName: 'cases',
  parse: (attr) => {
    return lodash.reduce(attr, (record, val, key) => {
      record[lodash.camelCase(key)] = val;
      return record;
    }, {});
  },
  format: (attr) => {
    return lodash.reduce(attr, (record, val, key) => {
      record[lodash.snakeCase(key)] = val;
      return record;
    }, {});
  },
  category: function() {
    return this.belongsTo(CaseCategory, 'category_id');
  },
  constituent: function() {
    return this.belongsTo(AccountModels.Constituent, 'constituent_id');
  },
});

export const OrganizationsCases = bookshelf.Model.extend({
  tableName: 'organizations_cases',
});

export const RepresentativesCases = bookshelf.Model.extend({
  tableName: 'representatives_cases',
});

export const CaseCategoryAssignments = bookshelf.Model.extend({
  tableName: 'case_category_representative_assignments',
});
