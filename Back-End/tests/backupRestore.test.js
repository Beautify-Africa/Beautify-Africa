// tests/backupRestore.test.js
const { backupDatabase } = require('../scripts/backupDatabase');
const { restoreDatabase, verifyBackupIntegrity } = require('../scripts/restoreDatabase');

jest.setTimeout(30000);

describe('Database Backup & Tested Restore Process Suite', () => {
  let sampleBackupManifest;

  beforeAll(async () => {
    // Generate snapshot without writing to disk
    const result = await backupDatabase({ writeFiles: false });
    sampleBackupManifest = result.manifest;
  }, 30000);

  test('backupDatabase produces valid manifest with cryptographic SHA-256 hash', () => {
    expect(sampleBackupManifest).toBeDefined();
    expect(sampleBackupManifest.schemaVersion).toBe('1.0.0');
    expect(sampleBackupManifest.createdAt).toBeDefined();
    expect(sampleBackupManifest.data).toBeDefined();
    expect(sampleBackupManifest.tableCounts).toBeDefined();
    expect(typeof sampleBackupManifest.sha256).toBe('string');
    expect(sampleBackupManifest.sha256).toHaveLength(64); // SHA-256 hex length
  });

  test('verifyBackupIntegrity passes on pristine backup manifest', () => {
    const isValid = verifyBackupIntegrity(sampleBackupManifest);
    expect(isValid).toBe(true);
  });

  test('verifyBackupIntegrity fails on tampered backup data', () => {
    // Clone and tamper with data
    const tamperedManifest = JSON.parse(JSON.stringify(sampleBackupManifest));
    tamperedManifest.data.User = [
      { id: 'tampered-user-id', name: 'Malicious Injected User', email: 'hacker@evil.com' },
    ];

    const isValid = verifyBackupIntegrity(tamperedManifest);
    expect(isValid).toBe(false);
  });

  test('restoreDatabase aborts with error when presented with corrupted backup', async () => {
    const corruptedManifest = JSON.parse(JSON.stringify(sampleBackupManifest));
    corruptedManifest.sha256 = '0000000000000000000000000000000000000000000000000000000000000000';

    await expect(restoreDatabase(corruptedManifest)).rejects.toThrow(
      /Backup integrity verification failed/
    );
  });

  test('restoreDatabase successfully completes with valid manifest', async () => {
    // Use an empty or minimal valid manifest to test restore execution without modifying test DB state
    const crypto = require('crypto');
    const mockData = {
      Category: [],
      User: [],
      Product: [],
    };
    const sha256 = crypto.createHash('sha256').update(JSON.stringify(mockData)).digest('hex');

    const validManifest = {
      schemaVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      data: mockData,
      sha256,
    };

    const restoreResult = await restoreDatabase(validManifest, { skipTruncate: true });
    expect(restoreResult.success).toBe(true);
    expect(restoreResult.restoredCounts).toBeDefined();
  });
});
