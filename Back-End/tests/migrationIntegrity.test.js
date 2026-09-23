const path = require('path');
const { inspectMigrations, MIGRATION_NAME_REGEX } = require('../scripts/testMigrationIntegrity');

describe('Database Migration Integrity & Idempotency Suite', () => {
  test('all migrations in Back-End/migrations satisfy naming conventions and up/down contracts', () => {
    const result = inspectMigrations();

    expect(result.totalFiles).toBeGreaterThan(0);
    expect(result.issues).toEqual([]);
    expect(result.validCount).toBe(result.totalFiles);

    result.validMigrations.forEach((migration) => {
      expect(migration.hasUp).toBe(true);
      expect(migration.hasDown).toBe(true);
      expect(migration.timestamp).toMatch(/^\d{14}$/);
      expect(migration.name.length).toBeGreaterThan(0);
    });
  });

  test('regex properly validates standard timestamped migration filenames', () => {
    expect('20260914000000-baseline-schema.js').toMatch(MIGRATION_NAME_REGEX);
    expect('20260920000001-add-strategic-performance-indexes.js').toMatch(MIGRATION_NAME_REGEX);
    expect('invalid-name.js').not.toMatch(MIGRATION_NAME_REGEX);
    expect('12345-too-short.js').not.toMatch(MIGRATION_NAME_REGEX);
  });
});
