import http from 'http';
import assert from 'assert';

import '../api/start.js';

describe('Node Server', () => {
  it('health check should return 200', done => {
    http.get('http://127.0.0.1:5000/health_check', res => {
      assert.equal(200, res.statusCode);
      done();
    });
  });
});
