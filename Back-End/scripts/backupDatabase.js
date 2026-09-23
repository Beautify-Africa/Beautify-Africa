// scripts/backupDatabase.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { sequelize } = require('../config/db');
const models = require('../models');
const logger = require('../utils/logger');

// Dependency-safe export order
const MODEL_EXPORT_ORDER = [
  'Category',
  'User',
  'Product',
  'ProductVariant',
  'InventoryLedger',
  'InventoryNotification',
  'Order',
  'OrderItem',
  'OrderShippingAddress',
  'AdminTimelineEntry',
  'Review',
  'Cart',
  'Wishlist',
  'NewsletterSubscriber',
  'WebhookEvent',
];

/**
 * Creates an integrity-verified snapshot of all database tables.
 * Computes a SHA-256 cryptographic hash over the serialized data manifest.
 *
 * @param {Object} [options]
 * @param {string} [options.outputDir] Target directory to store the backup
 * @param {boolean} [options.writeFiles=true] Whether to persist to disk
 * @returns {Promise<{ success: boolean, backupPath?: string, sha256: string, manifest: Object }>}
 */
async function backupDatabase(options = {}) {
  const outputDir = options.outputDir || path.resolve(__dirname, '../backups');
  const writeFiles = options.writeFiles !== undefined ? options.writeFiles : true;

  if (writeFiles && !fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tableData = {};
  const tableCounts = {};

  // Extract records for every registered model
  for (const modelName of MODEL_EXPORT_ORDER) {
    const model = models[modelName] || sequelize.models[modelName];
    if (model && typeof model.findAll === 'function') {
      try {
        const records = await model.findAll({ raw: true });
        tableData[modelName] = records;
        tableCounts[modelName] = records.length;
      } catch (err) {
        logger.warn({ modelName, err: err.message }, 'Failed to export model records');
        tableData[modelName] = [];
        tableCounts[modelName] = 0;
      }
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const rawPayload = JSON.stringify(tableData);
  const sha256 = crypto.createHash('sha256').update(rawPayload).digest('hex');

  const manifest = {
    schemaVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    tableCounts,
    sha256,
    data: tableData,
  };

  let backupPath = null;
  if (writeFiles) {
    backupPath = path.join(outputDir, `backup-${timestamp}.json`);
    const checksumPath = `${backupPath}.sha256`;

    fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2), 'utf-8');
    fs.writeFileSync(checksumPath, sha256, 'utf-8');

    logger.info({ backupPath, sha256 }, 'Database backup created successfully');
  }

  return {
    success: true,
    backupPath,
    sha256,
    manifest,
  };
}

if (require.main === module) {
  backupDatabase()
    .then((result) => {
      console.log('Backup completed successfully:');
      console.log('File:', result.backupPath);
      console.log('SHA256:', result.sha256);
      console.log('Table counts:', result.manifest.tableCounts);
      process.exit(0);
    })
    .catch((err) => {
      console.error('Backup failed:', err);
      process.exit(1);
    });
}

module.exports = {
  backupDatabase,
  MODEL_EXPORT_ORDER,
};
