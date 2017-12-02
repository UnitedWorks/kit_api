import Mixpanel from 'mixpanel';
import { logger } from '../logger';

const client = Mixpanel.init(process.env.MIXPANEL_ID, {
  protocol: 'https',
});

export function EventTracker(label, { question, session }, custom = {}) {
  try {
    client.track('answer_sent', {
      distinct_id: session.snapshot.constituent.id,
      constituent_id: session.snapshot.constituent.id,
      organization_id: session.get('organization').id,
      knowledge_category_id: question ? question.knowledge_category_id : null,
      knowledge_question_id: question ? question.id : null,
      interface: session.messagingClient.provider,
      ...custom,
    });
  } catch (e) {
    logger.error(e);
  }
}

export default client;
