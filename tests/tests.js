import http from 'http';
import { assert, expect, should } from 'chai';

import '../api/start.js';

describe('Node Server', () => {
  it('health check should return 200', done => {
    http.get('http://127.0.0.1:5000/health_check', res => {
      assert.equal(200, res.statusCode);
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
