// models/Newsletter.js
const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Newsletter extends Model {
  get _id() { return this.id; }
}

Newsletter.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: { msg: 'Please provide a valid email address' },
      },
      set(value) {
        this.setDataValue('email', value ? value.toLowerCase().trim() : value);
      },
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
    unsubscribeToken: { type: DataTypes.STRING, allowNull: true, defaultValue: null },
    unsubscribeTokenExpires: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
    unsubscribedAt: { type: DataTypes.DATE, allowNull: true, defaultValue: null },
  },
  {
    sequelize,
    modelName: 'Newsletter',
    tableName: 'newsletters',
    timestamps: true,
  }
);

// Index for unsubscribe token lookups
Newsletter.afterSync(() => {
  sequelize
    .query(
      `CREATE INDEX IF NOT EXISTS idx_newsletters_unsub_token ON newsletters ("unsubscribeToken") WHERE "unsubscribeToken" IS NOT NULL`
    )
    .catch(() => {});
});

module.exports = Newsletter;
