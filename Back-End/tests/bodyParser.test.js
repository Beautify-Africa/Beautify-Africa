const express = require('express');
const request = require('supertest');
const {
  createJsonBodyParser,
  createUrlEncodedBodyParser,
  handleBodySizeLimitError,
} = require('../middlewares/bodyParser');

function createApp() {
  const app = express();
  app.use(createJsonBodyParser());
  app.use(createUrlEncodedBodyParser());

  app.post('/echo', (req, res) => {
    res.status(200).json({ status: 'success', size: JSON.stringify(req.body).length });
  });

  app.use(handleBodySizeLimitError);

  return app;
}

describe('body parser size limit middleware', () => {
  beforeEach(() => {
    process.env.REQUEST_BODY_LIMIT = '100b';
  });

  afterEach(() => {
    delete process.env.REQUEST_BODY_LIMIT;
  });

  test('accepts payloads under configured limit', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/echo')
      .send({ message: 'small payload' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('success');
  });

  test('returns 413 with stable payload-too-large response', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/echo')
      .send({ message: 'x'.repeat(500) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      status: 'error',
      message: 'Request body is too large. Maximum size is 100b.',
    });
  });
});
