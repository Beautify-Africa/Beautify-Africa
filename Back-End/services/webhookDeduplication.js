// services/webhookDeduplication.js
const redisClient = require('../config/redis');
const WebhookEvent = require('../models/WebhookEvent');
const logger = require('../utils/logger');

const WEBHOOK_DEDUP_TTL_SECONDS = 172800; // 48 hours

/**
 * Check if an incoming webhook event has already been processed.
 * Employs a two-tier deduplication check:
 *  1. Fast-path Redis check (webhook:dedup:<gateway>:<eventId>)
 *  2. Durable fallback via PostgreSQL WebhookEvent model
 *
 * @param {Object} params
 * @param {string} params.gateway Gateway name (e.g. 'stripe', 'paystack')
 * @param {string} params.eventId Unique provider event ID
 * @param {string} [params.eventType] Type of the event
 * @param {Object} [params.payload] Raw event payload
 * @returns {Promise<{ isDuplicate: boolean, status?: string }>}
 */
async function checkOrClaimWebhookEvent({ gateway, eventId, eventType = 'unknown', payload = {} }) {
  if (!eventId) {
    return { isDuplicate: false };
  }

  const redisKey = `webhook:dedup:${gateway}:${eventId}`;

  // 1. Fast-path: Redis L1 check
  try {
    const cachedStatus = await redisClient.get(redisKey);
    if (cachedStatus === 'processed') {
      logger.info({ gateway, eventId }, 'Duplicate webhook detected via Redis cache (processed)');
      return { isDuplicate: true, status: 'processed' };
    }
  } catch (redisErr) {
    logger.warn({ err: redisErr.message }, 'Redis error during webhook deduplication check; falling back to DB');
  }

  // 2. Persistent path: WebhookEvent model L2 check
  try {
    const existingDbEvent = await WebhookEvent.findByPk(eventId);
    if (existingDbEvent && existingDbEvent.status === 'processed') {
      logger.info({ gateway, eventId }, 'Duplicate webhook detected via WebhookEvent DB (processed)');
      // Backfill Redis cache
      redisClient.set(redisKey, 'processed', 'EX', WEBHOOK_DEDUP_TTL_SECONDS).catch(() => {});
      return { isDuplicate: true, status: 'processed' };
    }

    // Register / findOrCreate event in DB with pending status
    await WebhookEvent.findOrCreate({
      where: { id: eventId },
      defaults: {
        type: eventType,
        status: 'pending',
        payload: payload || {},
      },
    });

    // Mark as in-flight in Redis (5-minute transient lock or 48h placeholder)
    redisClient.set(redisKey, 'processing', 'EX', 3600).catch(() => {});

    return { isDuplicate: false, status: 'pending' };
  } catch (dbErr) {
    logger.warn({ err: dbErr.message, eventId }, 'Database error during webhook idempotency check');
    return { isDuplicate: false };
  }
}

/**
 * Mark a webhook event as successfully processed in both Redis and DB.
 *
 * @param {Object} params
 * @param {string} params.gateway
 * @param {string} params.eventId
 * @param {Object} [params.transaction] Optional Sequelize transaction
 */
async function markWebhookProcessed({ gateway, eventId, transaction = null }) {
  if (!eventId) return;

  const redisKey = `webhook:dedup:${gateway}:${eventId}`;

  try {
    await redisClient.set(redisKey, 'processed', 'EX', WEBHOOK_DEDUP_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to set processed status in Redis for webhook');
  }

  try {
    await WebhookEvent.update(
      { status: 'processed', processedAt: new Date() },
      { where: { id: eventId }, ...(transaction ? { transaction } : {}) }
    );
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to update WebhookEvent to processed in DB');
  }
}

/**
 * Mark a webhook event as failed so it can be safely retried.
 *
 * @param {Object} params
 * @param {string} params.gateway
 * @param {string} params.eventId
 * @param {string} params.errorMessage
 */
async function markWebhookFailed({ gateway, eventId, errorMessage }) {
  if (!eventId) return;

  const redisKey = `webhook:dedup:${gateway}:${eventId}`;

  try {
    await redisClient.del(redisKey);
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to clear webhook Redis key on failure');
  }

  try {
    await WebhookEvent.update(
      { status: 'failed', errorMessage: String(errorMessage) },
      { where: { id: eventId } }
    );
  } catch (err) {
    logger.warn({ err: err.message }, 'Failed to update WebhookEvent to failed in DB');
  }
}

module.exports = {
  checkOrClaimWebhookEvent,
  markWebhookProcessed,
  markWebhookFailed,
  WEBHOOK_DEDUP_TTL_SECONDS,
};
