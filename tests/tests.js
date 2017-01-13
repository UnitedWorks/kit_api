import axios from 'axios';
import { assert, expect, should } from 'chai';

import '../api/start.js';

describe('Node Server', () => {
  it('health check should return 200', done => {
    axios.get('http://127.0.0.1:5000/health_check').then((response) => {
      assert.equal(200, response.status);
      done();
    });
  });
});

describe('Environment Variables', () => {
  it('should be in test environment', () => {
    assert.equal(process.env.NODE_ENVIRONMENT, 'test', 'in test environment');
  });
  it('should have ApiAi values', () => {
    assert.isDefined(process.env.API_AI_CLIENT_ACCESS_TOKEN, 'ApiAi is defined');
  });
  it('should have AWS values', () => {
    assert.isDefined(process.env.AWS_DEFAULT_REGION, 'region is defined');
    assert.isDefined(process.env.AWS_ACCESS_KEY_ID, 'access key is defined');
    assert.isDefined(process.env.AWS_SECRET_ACCESS_KEY, 'secret access key is defined');
  });
  it('should have Facebook values', () => {
    assert.isDefined(process.env.FB_APP_SECRET, 'app secret is defined');
    assert.isDefined(process.env.FB_PAGE_TOKEN, 'page token is defined');
    assert.isDefined(process.env.FB_VERIFY_TOKEN, 'verify token is defined');
  });
  it('should have SendGrid values', () => {
    assert.isDefined(process.env.SENDGRID_API_KEY, 'api key is defined');
  });
});

describe('Conversation Webhook', () => {
  const payload = {
    object: 'web',
    entry: [{
      id: '1',
      time: 1482371439168,
      messaging: [{
        sender: {
          id: '2'
        },
        recipient: {
          id: '3'
        },
        timestamp: 1482371439098,
        message: {
          mid: 'mid.1482371439098:ae07c2a413',
          seq: 1,
          text: 'hi'
        }
      }]
    }]
  };
  it('should return 200 when sending a web message', done => {
    axios({
      url: 'http://127.0.0.1:5000/conversations/webhook',
      method: 'post',
      data: payload,
      headers: {
        'Origin': 'localhost'
      }
    }).then((response) => {
      assert.equal(200, response.status);
      done();
    });
  });
  it('should return error when trying to send a Facebook message', (done) => {
    const modifiedPayload = payload;
    modifiedPayload.object = 'page';
    // Test Verification Error
    axios({
      url: 'http://127.0.0.1:5000/conversations/webhook',
      method: 'post',
      data: modifiedPayload,
    }).catch((error) => {
      expect(error).to.be.an('error');
      done();
    });
  });
});
