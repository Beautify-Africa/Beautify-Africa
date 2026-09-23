const express = require('express');
const request = require('supertest');

jest.mock('../config/db', () => ({
  sequelize: {
    query: jest.fn(),
  },
}));

jest.mock('../config/redis', () => ({
  ping: jest.fn(),
}));

const { sequelize } = require('../config/db');
const redisClient = require('../config/redis');
const healthRoutes = require('../routes/healthRoutes');

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', healthRoutes);
  app.use('/', healthRoutes);
  return app;
}

describe('Observability & Health Probes Suite (/health & /ready)', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();
    app = createApp();
  });

  describe('GET /api/health (Liveness Probe)', () => {
    test('returns 200 OK with runtime diagnostics and memory statistics', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
      expect(response.body.service).toBe('beautify-africa-api');
      expect(response.body.timestamp).toBeDefined();
      expect(typeof response.body.uptimeSeconds).toBe('number');
      expect(response.body.memory).toBeDefined();
      expect(response.body.memory.heapUsedMb).toBeGreaterThan(0);
      expect(response.body.memory.heapTotalMb).toBeGreaterThan(0);
    });

    test('serves liveness probe on root path /health for load balancers', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('GET /api/ready (Readiness Probe)', () => {
    test('returns 200 OK when database and redis dependencies are healthy', async () => {
      sequelize.query.mockResolvedValueOnce([{ '?column?': 1 }]);
      redisClient.ping.mockResolvedValueOnce('PONG');

      const response = await request(app).get('/api/ready');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ready');
      expect(response.body.checks.database.status).toBe('healthy');
      expect(response.body.checks.database.latencyMs).toBeDefined();
      expect(response.body.checks.redis.status).toBe('healthy');
      expect(response.body.checks.redis.latencyMs).toBeDefined();
      expect(response.body.checks.memory.status).toBe('healthy');
    });

    test('returns 503 Service Unavailable when database query fails', async () => {
      sequelize.query.mockRejectedValueOnce(new Error('Connection terminated unexpectedly'));
      redisClient.ping.mockResolvedValueOnce('PONG');

      const response = await request(app).get('/api/ready');

      expect(response.status).toBe(503);
      expect(response.body.status).toBe('degraded');
      expect(response.body.checks.database.status).toBe('unhealthy');
      expect(response.body.checks.database.error).toContain('Connection terminated');
      expect(response.body.checks.redis.status).toBe('healthy');
    });
  });
});
