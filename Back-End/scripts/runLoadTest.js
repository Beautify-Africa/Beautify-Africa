/**
 * Beautify Africa - Performance, Concurrency & Latency SLA Stress Engine
 *
 * Simulates high-concurrency synthetic traffic against key API endpoints
 * and measures throughput (RPS), error rates, and latency percentiles (P50, P90, P95, P99).
 *
 * Usage:
 *   node scripts/runLoadTest.js [--url=http://localhost:5000] [--concurrency=20] [--requests=100]
 *   node scripts/runLoadTest.js --self-test
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

/**
 * Calculates statistical percentiles from an array of numeric latencies (in milliseconds)
 */
function calculatePercentiles(latencies) {
  if (!latencies || latencies.length === 0) {
    return { min: 0, max: 0, mean: 0, p50: 0, p90: 0, p95: 0, p99: 0, count: 0 };
  }

  const sorted = [...latencies].sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = Math.round((sum / count) * 100) / 100;

  const getPercentile = (p) => {
    const idx = Math.min(Math.floor((p / 100) * count), count - 1);
    return Math.round(sorted[idx] * 100) / 100;
  };

  return {
    min: Math.round(sorted[0] * 100) / 100,
    max: Math.round(sorted[count - 1] * 100) / 100,
    mean,
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
    count,
  };
}

/**
 * Executes a single HTTP/S request and measures response latency
 */
function executeRequest(targetUrl, timeoutMs = 5000) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === 'https:' ? https : http;
    const startTime = process.hrtime.bigint();

    const req = client.request(
      targetUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'BeautifyAfrica-LoadTester/1.0',
          Accept: 'application/json, text/plain, */*',
        },
        timeout: timeoutMs,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const endTime = process.hrtime.bigint();
          const latencyMs = Number(endTime - startTime) / 1e6;
          resolve({
            statusCode: res.statusCode,
            latencyMs,
            success: res.statusCode >= 200 && res.statusCode < 400,
            error: null,
          });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 408,
        latencyMs,
        success: false,
        error: 'ETIMEDOUT',
      });
    });

    req.on('error', (err) => {
      const endTime = process.hrtime.bigint();
      const latencyMs = Number(endTime - startTime) / 1e6;
      resolve({
        statusCode: 0,
        latencyMs,
        success: false,
        error: err.code || err.message,
      });
    });

    req.end();
  });
}

/**
 * Runs a concurrency pool against target URLs
 */
async function runBenchmark({
  baseUrl = 'http://localhost:5000',
  endpoints = ['/api/health'],
  concurrency = 10,
  totalRequests = 50,
  timeoutMs = 5000,
}) {
  const results = [];
  let currentIndex = 0;
  const startTime = Date.now();

  async function worker() {
    while (currentIndex < totalRequests) {
      const reqIndex = currentIndex++;
      const endpoint = endpoints[reqIndex % endpoints.length];
      const targetUrl = new URL(endpoint, baseUrl).toString();
      const result = await executeRequest(targetUrl, timeoutMs);
      results.push({ ...result, endpoint });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, totalRequests) }, () => worker());
  await Promise.all(workers);

  const totalDurationSec = (Date.now() - startTime) / 1000;
  const latencies = results.map((r) => r.latencyMs);
  const stats = calculatePercentiles(latencies);
  const successes = results.filter((r) => r.success).length;
  const failures = results.length - successes;
  const rps = Math.round((results.length / totalDurationSec) * 100) / 100;
  const errorRate = Math.round((failures / results.length) * 10000) / 100;

  return {
    summary: {
      totalRequests: results.length,
      successes,
      failures,
      errorRatePercent: errorRate,
      totalDurationSec: Math.round(totalDurationSec * 100) / 100,
      requestsPerSecond: rps,
      concurrency,
    },
    latencyStats: stats,
    rawResults: results,
  };
}

/**
 * Starts an ephemeral mock HTTP server for standalone validation
 */
function createMockServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/api/health' || req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
      } else if (req.url === '/api/products') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, count: 5, products: [] }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      const baseUrl = `http://127.0.0.1:${port}`;
      resolve({ server, baseUrl });
    });
  });
}

/**
 * Pretty prints benchmark report to stdout
 */
function printReport(report, title = 'LOAD & SLA STRESS REPORT') {
  console.log('\n========================================================');
  console.log(`  BEAUTIFY AFRICA - ${title}`);
  console.log('========================================================');
  console.log(`Total Requests:      ${report.summary.totalRequests}`);
  console.log(`Successful (2xx):    ${report.summary.successes}`);
  console.log(`Failed / Errors:     ${report.summary.failures} (${report.summary.errorRatePercent}%)`);
  console.log(`Concurrency Level:   ${report.summary.concurrency}`);
  console.log(`Total Duration:      ${report.summary.totalDurationSec}s`);
  console.log(`Throughput:          ${report.summary.requestsPerSecond} req/sec`);
  console.log('--------------------------------------------------------');
  console.log('Latency Statistics (ms):');
  console.log(`  Min:               ${report.latencyStats.min} ms`);
  console.log(`  Mean:              ${report.latencyStats.mean} ms`);
  console.log(`  P50 (Median):      ${report.latencyStats.p50} ms`);
  console.log(`  P90:               ${report.latencyStats.p90} ms`);
  console.log(`  P95 (SLA Target):  ${report.latencyStats.p95} ms`);
  console.log(`  P99:               ${report.latencyStats.p99} ms`);
  console.log(`  Max:               ${report.latencyStats.max} ms`);
  console.log('========================================================\n');
}

/**
 * Main CLI runner
 */
async function main() {
  const args = process.argv.slice(2);
  const isSelfTest = args.includes('--self-test');
  const urlArg = args.find((a) => a.startsWith('--url='))?.split('=')[1];
  const concArg = parseInt(args.find((a) => a.startsWith('--concurrency='))?.split('=')[1], 10);
  const reqArg = parseInt(args.find((a) => a.startsWith('--requests='))?.split('=')[1], 10);

  const concurrency = !isNaN(concArg) ? concArg : 15;
  const totalRequests = !isNaN(reqArg) ? reqArg : 60;

  if (isSelfTest) {
    console.log('Starting ephemeral mock server for self-test verification...');
    const { server, baseUrl } = await createMockServer();
    try {
      const report = await runBenchmark({
        baseUrl,
        endpoints: ['/api/health', '/api/products'],
        concurrency: 10,
        totalRequests: 50,
      });

      printReport(report, 'SELF-TEST VERIFICATION HARNESS');

      if (report.summary.failures > 0) {
        console.error('FAILED: Self-test encountered unexpected request failures.');
        process.exit(1);
      }
      console.log('SUCCESS: Self-test load harness executed flawlessly with 0 failures.\n');
    } finally {
      server.close();
    }
    return;
  }

  const targetUrl = urlArg || 'http://localhost:5000';
  console.log(`Executing benchmark against ${targetUrl}...`);

  try {
    const report = await runBenchmark({
      baseUrl: targetUrl,
      endpoints: ['/api/health', '/health'],
      concurrency,
      totalRequests,
    });

    printReport(report);

    // SLA Check: Error rate <= 5%
    if (report.summary.errorRatePercent > 5) {
      console.error(`SLA VIOLATION: Error rate was ${report.summary.errorRatePercent}% (> 5%)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Load test execution failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Fatal benchmark error:', err);
    process.exit(1);
  });
}

module.exports = {
  calculatePercentiles,
  executeRequest,
  runBenchmark,
  createMockServer,
};
