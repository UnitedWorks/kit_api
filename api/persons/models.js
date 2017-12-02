import { bookshelf } from '../orm';
import { KnowledgeCategory } from '../knowledge-base/models';
import { Organization } from '../accounts/models';

export const Person = bookshelf.Model.extend({
  tableName: 'persons',
  hasTimestamps: true,
  organization() {
    return this.belongsTo(Organization, 'organization_id');
  },
  knowledgeCategories() {
    return this.belongsToMany(KnowledgeCategory, 'knowledge_categorys_persons', 'person_id');
  },
});
