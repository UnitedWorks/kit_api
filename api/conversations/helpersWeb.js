export function webhookHitByWeb(req, res) {
  const data = req.body;
  // Iterate over each source (incase it's a batched request)
  data.source.forEach((sourceEntry) => {
    // Iterate over messaging event
    sourceEntry.messaging.forEach((messagingEvent) => {
      if (messagingEvent.message) {
        receivedMessage(messagingEvent);
      } else {
        logger.info("Webhook received unknown messagingEvent: ", messagingEvent);
      }
    });
  });
  res.sendStatus(200);
}
