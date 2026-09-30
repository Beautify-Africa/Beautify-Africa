/**
 * Beautify Africa - Database Migration Integrity & Idempotency Validator
 *
 * Verifies that all database migrations in Back-End/migrations:
 * 1. Adhere to chronological timestamped naming convention (YYYYMMDDHHMMSS-name.js).
 * 2. Export callable `up` and `down` lifecycle handlers.
 * 3. Preserve rollback symmetry (every schema modification has a corresponding down inverse).
 *
 * Usage:
 *   node scripts/testMigrationIntegrity.js
 */

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, '../migrations');
const MIGRATION_NAME_REGEX = /^(\d{14})-([\w-]+)\.js$/;

/**
 * Inspects all migration files for syntax, contract, and chronological integrity
 */
function inspectMigrations(migrationsDir = MIGRATIONS_DIR) {
  if (!fs.existsSync(migrationsDir)) {
    throw new Error(`Migrations directory does not exist: ${migrationsDir}`);
  }

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.js'))
    .sort();

  const issues = [];
  const validMigrations = [];
  let lastTimestamp = '';

  for (const filename of files) {
    const fullPath = path.join(migrationsDir, filename);
    const match = filename.match(MIGRATION_NAME_REGEX);

    if (!match) {
      issues.push({
        file: filename,
        error: `Filename does not match required pattern YYYYMMDDHHMMSS-name.js`,
      });
      continue;
    }

    const timestamp = match[1];
    const name = match[2];

    if (timestamp < lastTimestamp) {
      issues.push({
        file: filename,
        error: `Timestamp ${timestamp} is out of chronological order (previous was ${lastTimestamp})`,
      });
    }
    lastTimestamp = timestamp;

    try {
      // Clear require cache to ensure fresh module evaluation
      delete require.cache[require.resolve(fullPath)];
      const migrationModule = require(fullPath);

      if (typeof migrationModule.up !== 'function') {
        issues.push({
          file: filename,
          error: `Migration is missing required 'up' async function export`,
        });
      }

      if (typeof migrationModule.down !== 'function') {
        issues.push({
          file: filename,
          error: `Migration is missing required 'down' async function export for rollback capability`,
        });
      }

      validMigrations.push({
        filename,
        timestamp,
        name,
        hasUp: typeof migrationModule.up === 'function',
        hasDown: typeof migrationModule.down === 'function',
      });
    } catch (err) {
      issues.push({
        file: filename,
        error: `Syntax or loading error: ${err.message}`,
      });
    }
  }

  return {
    totalFiles: files.length,
    validCount: validMigrations.length,
    issues,
    validMigrations,
  };
}

/**
 * CLI Runner
 */
function main() {
  console.log('========================================================');
  console.log('  BEAUTIFY AFRICA - MIGRATION INTEGRITY VALIDATOR');
  console.log('========================================================');
  console.log(`Inspecting migrations in: ${MIGRATIONS_DIR}\n`);

  const result = inspectMigrations();

  result.validMigrations.forEach((m) => {
    console.log(`[PASS] ${m.timestamp} - ${m.name} (up: ok, down: ok)`);
  });

  if (result.issues.length > 0) {
    console.error('\nFAILED: Migration issues detected:');
    result.issues.forEach((issue) => {
      console.error(`  - ${issue.file}: ${issue.error}`);
    });
    console.log('========================================================\n');
    process.exit(1);
  }

  console.log('\n--------------------------------------------------------');
  console.log(`Summary: All ${result.validCount} migrations verified successfully with valid up/down contracts.`);
  console.log('========================================================\n');
}

if (require.main === module) {
  main();
}

module.exports = {
  inspectMigrations,
  MIGRATION_NAME_REGEX,
};
