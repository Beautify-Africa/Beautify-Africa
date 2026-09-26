// scripts/restoreDatabase.js
const fs = require('fs');
const crypto = require('crypto');
const { sequelize } = require('../config/db');
const models = require('../models');
const { MODEL_EXPORT_ORDER } = require('./backupDatabase');
const logger = require('../utils/logger');

/**
 * Validates the SHA-256 integrity of a backup manifest.
 *
 * @param {Object} manifest Parsed backup manifest
 * @returns {boolean}
 */
function verifyBackupIntegrity(manifest) {
  if (!manifest || !manifest.data || !manifest.sha256) {
    return false;
  }
  const computedHash = crypto
    .createHash('sha256')
    .update(JSON.stringify(manifest.data))
    .digest('hex');

  return computedHash === manifest.sha256;
}

/**
 * Restores database state from an integrity-verified backup file or manifest.
 * Executes inside an atomic transaction with automatic rollback upon any failure.
 *
 * @param {string|Object} backupSource File path to backup JSON, or manifest object directly
 * @param {Object} [options]
 * @param {boolean} [options.skipTruncate=false]
 * @returns {Promise<{ success: boolean, restoredCounts: Object }>}
 */
async function restoreDatabase(backupSource, options = {}) {
  let manifest;

  if (typeof backupSource === 'string') {
    if (!fs.existsSync(backupSource)) {
      throw new Error(`Backup file not found at path: ${backupSource}`);
    }
    const rawContent = fs.readFileSync(backupSource, 'utf-8');
    manifest = JSON.parse(rawContent);
  } else if (typeof backupSource === 'object' && backupSource !== null) {
    manifest = backupSource;
  } else {
    throw new Error('Invalid backup source: expected file path string or manifest object.');
  }

  // 1. Verify SHA-256 cryptographic integrity hash
  const isValid = verifyBackupIntegrity(manifest);
  if (!isValid) {
    throw new Error('Backup integrity verification failed: SHA-256 checksum mismatch. Restoration aborted.');
  }

  const restoredCounts = {};
  const reversedOrder = [...MODEL_EXPORT_ORDER].reverse();

  // 2. Perform restoration atomically
  await sequelize.transaction(async (t) => {
    // A. Purge in reverse dependency order
    if (!options.skipTruncate) {
      for (const modelName of reversedOrder) {
        const model = models[modelName] || sequelize.models[modelName];
        if (model && typeof model.destroy === 'function') {
          try {
            await model.destroy({ where: {}, truncate: false, transaction: t });
          } catch (err) {
            logger.warn({ modelName, err: err.message }, 'Truncate warning during restore');
          }
        }
      }
    }

    // B. Bulk insert in forward dependency order
    for (const modelName of MODEL_EXPORT_ORDER) {
      const model = models[modelName] || sequelize.models[modelName];
      const records = manifest.data[modelName];

      if (model && Array.isArray(records) && records.length > 0) {
        await model.bulkCreate(records, {
          transaction: t,
          validate: false,
          hooks: false,
        });
        restoredCounts[modelName] = records.length;
      } else {
        restoredCounts[modelName] = 0;
      }
    }
  });

  logger.info({ restoredCounts }, 'Database restored successfully from backup');
  return { success: true, restoredCounts };
}

if (require.main === module) {
  const targetFile = process.argv[2];
  if (!targetFile) {
    console.error('Usage: node scripts/restoreDatabase.js <path-to-backup.json>');
    process.exit(1);
  }

  restoreDatabase(targetFile)
    .then((result) => {
      console.log('Restoration completed successfully:');
      console.log('Restored counts:', result.restoredCounts);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Restoration failed:', err.message);
      process.exit(1);
    });
}

module.exports = {
  restoreDatabase,
  verifyBackupIntegrity,
};
