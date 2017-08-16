import amqp from 'amqp';
import { logger } from '../logger';

export default () => {
  const connection = amqp.createConnection({ host: 'kit-rabbit' });

  connection.on('ready', () => {
    logger.info({ test: 'hello' });
    connection.queue('messages', (q) => {
      // Catch all messages
      q.bind('# ');

      // Receive messages
      q.subscribe((message) => {
        // Print messages to stdout
        logger.info({ message });
      });
    });
    connection.publish('ammessages', { message: 'wow' });
  });

  connection.on('error', (err) => {
    logger.info(err);
  });
}
