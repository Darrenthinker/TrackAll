const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 用户模型
const User = sequelize.define('User', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'deleted'),
    defaultValue: 'active'
  },
  user_type: {
    type: DataTypes.ENUM('regular', 'vip', 'admin'),
    defaultValue: 'regular'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = User; 