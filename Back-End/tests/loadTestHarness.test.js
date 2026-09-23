const {
  calculatePercentiles,
  createMockServer,
  runBenchmark,
} = require('../scripts/runLoadTest');

describe('Performance, Concurrency & SLA Benchmark Harness Suite', () => {
  describe('calculatePercentiles', () => {
    test('accurately calculates min, mean, p50, p90, p95, and p99 statistics', () => {
      // 100 values from 1 to 100
      const latencies = Array.from({ length: 100 }, (_, i) => i + 1);
      const stats = calculatePercentiles(latencies);

      expect(stats.min).toBe(1);
      expect(stats.max).toBe(100);
      expect(stats.mean).toBe(50.5);
      expect(stats.p50).toBe(51);
      expect(stats.p90).toBe(91);
      expect(stats.p95).toBe(96);
      expect(stats.p99).toBe(100);
      expect(stats.count).toBe(100);
    });

    test('handles empty and single-element latency arrays safely', () => {
      const empty = calculatePercentiles([]);
      expect(empty.count).toBe(0);
      expect(empty.p50).toBe(0);

      const single = calculatePercentiles([42.5]);
      expect(single.min).toBe(42.5);
      expect(single.max).toBe(42.5);
      expect(single.mean).toBe(42.5);
      expect(single.p50).toBe(42.5);
      expect(single.count).toBe(1);
    });
  });

  describe('runBenchmark against live mock server', () => {
    let mockServer;
    let baseUrl;

    beforeAll(async () => {
      const setup = await createMockServer();
      mockServer = setup.server;
      baseUrl = setup.baseUrl;
    });

    afterAll((done) => {
      mockServer.close(done);
    });

    test('runs concurrent synthetic requests and enforces SLA metrics', async () => {
      const result = await runBenchmark({
        baseUrl,
        endpoints: ['/api/health', '/api/products'],
        concurrency: 5,
        totalRequests: 20,
        timeoutMs: 3000,
      });

      expect(result.summary.totalRequests).toBe(20);
      expect(result.summary.successes).toBe(20);
      expect(result.summary.failures).toBe(0);
      expect(result.summary.errorRatePercent).toBe(0);
      expect(result.summary.requestsPerSecond).toBeGreaterThan(0);

      expect(result.latencyStats.p50).toBeGreaterThan(0);
      expect(result.latencyStats.p95).toBeGreaterThanOrEqual(result.latencyStats.p50);
      expect(result.latencyStats.max).toBeGreaterThanOrEqual(result.latencyStats.p95);
    });
  });
});
