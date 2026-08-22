// models/User.js
const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const validator = require('validator');
const { sequelize } = require('../config/db');

class User extends Model {
  // Virtual _id getter so all existing code using user._id keeps working
  get _id() {
    return this.id;
  }

  async comparePassword(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Name is required' },
        len: { args: [2, 255], msg: 'Name must be at least 2 characters' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: { msg: 'Email is required' },
        isEmailValid(value) {
          if (!validator.isEmail(value)) {
            throw new Error('Please provide a valid email address');
          }
        },
      },
      set(value) {
        this.setDataValue('email', value ? value.toLowerCase().trim() : value);
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Password is required' },
        len: { args: [8, 1024], msg: 'Password must be at least 8 characters' },
      },
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    passwordResetToken: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    passwordResetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

// Index for password reset token lookups
User.afterSync(() => {
  sequelize
    .query(
      `CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users ("passwordResetToken") WHERE "passwordResetToken" IS NOT NULL`
    )
    .catch(() => {});
});

module.exports = User;
