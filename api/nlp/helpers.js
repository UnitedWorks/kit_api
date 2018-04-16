import { nlp, WitInstance } from '../utils/nlp';
import { KnowledgeQuestion } from '../knowledge-base/models';

export async function getQuestionContext(statement, orgId) {
  if (!statement || statement.length === 0) return { nlp: null, question: null };
  const witEntities = await nlp.message(statement).then(n => n.entities);
  if (!witEntities.intent) return null;
  const foundIntent = witEntities.intent[0].value;
  // If org ID was passed, lets get answers
  const question = await KnowledgeQuestion.where({ label: foundIntent }).fetch(orgId ? {
    withRelated: [{
      answers: q => q.where('owner_organization_id', orgId).whereNotNull('approved_at'),
    }, 'category', 'answers.place', 'answers.place.addresses', 'answers.place.availabilitys', 'answers.service',
      'answers.service.addresses', 'answers.service.availabilitys', 'answers.person', 'answers.person.phones', 'answers.phone', 'answers.feed',
      'answers.media', 'answers.resource', 'answers.resource.media', 'answers.organization',
      'answers.organization.phones', 'answers.organization.addresses', 'answers.organization.services',
      'answers.organization.places', 'answers.organization.places.addresses', 'answers.organization.persons'],
  } : {}).then(q => (q ? q.toJSON() : null));

  return {
    nlp: witEntities,
    question,
  };
}
