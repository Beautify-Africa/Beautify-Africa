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

  isLocked() {
    return Boolean(this.lockUntil && new Date(this.lockUntil) > new Date());
  }

  async recordFailedLogin() {
    this.failedLoginAttempts = (this.failedLoginAttempts || 0) + 1;
    if (this.failedLoginAttempts >= 5) {
      // 15-minute temporary lockout
      this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    }
    return this.save();
  }

  async recordSuccessfulLogin() {
    if (this.failedLoginAttempts > 0 || this.lockUntil) {
      this.failedLoginAttempts = 0;
      this.lockUntil = null;
      return this.save();
    }
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
    role: {
      type: DataTypes.ENUM('customer', 'admin', 'manager', 'support'),
      defaultValue: 'customer',
    },
    isAdmin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    failedLoginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockUntil: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
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
    indexes: [{ unique: true, fields: ['email'] }, { fields: ['passwordResetToken'] }],
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          user.password = await bcrypt.hash(user.password, 12);
        }
      },
    },
  }
);

module.exports = User;
