export default class BaseClient {
  constructor(config) {
    this.config = config;
    if (this.init) {
      this.init();
    }
  }
  send(session, message) {
    // do nothing for now
  }
  isTyping(session) {
    // do nothing for now
  }
}
