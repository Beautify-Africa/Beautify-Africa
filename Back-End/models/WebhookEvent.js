// models/WebhookEvent.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class WebhookEvent extends Model {}

WebhookEvent.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      comment: 'Provider event ID (e.g., Stripe evt_xxx)',
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: 'Event name/type (e.g., payment_intent.succeeded)',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'failed'),
      allowNull: false,
      defaultValue: 'pending',
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'WebhookEvent',
    tableName: 'webhook_events',
    timestamps: true,
    indexes: [{ fields: ['type'] }, { fields: ['status'] }, { fields: ['createdAt'] }],
  }
);

module.exports = WebhookEvent;
