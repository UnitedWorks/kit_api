import amqp from 'amqp';
import { logger } from '../logger';

export default function () {
  let connection = amqp.createConnection({ host: 'kit-rabbit' });

  connection.on('ready', function() {
  	logger.info({ test: 'hello'});
    connection.queue('messages', function() {
      // Catch all messages
      q.bind('#	');
    
      // Receive messages
      q.subscribe(function (message) {
        // Print messages to stdout
        logger.info({ message });
      });

    });
  	connection.publish('ammessages', { message: 'wow'});
  });

  connection.on('error', function(err) {
  	logger.info(err);
  });
}