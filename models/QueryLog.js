const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// 查询记录模型
const QueryLog = sequelize.define('QueryLog', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  tracking_number: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  carrier: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  query_result: {
    type: DataTypes.ENUM('success', 'failed', 'not_found'),
    allowNull: false
  },
  response_time: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '响应时间(毫秒)'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: false
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'query_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['tracking_number']
    },
    {
      fields: ['carrier']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = QueryLog; 