const { Sequelize } = require('sequelize');

// 数据库配置
const config = {
  // 开发环境配置
  development: {
    host: process.env.DB_HOST || 'rm-bp19c413117y10tq0vo.mysql.rds.aliyuncs.com',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'tracking_system',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'TrackAll2025!',
    dialect: 'mysql',
    timezone: '+08:00',
    logging: console.log, // 开发环境显示SQL日志
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  },
  
  // 生产环境配置
  production: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    dialect: 'mysql',
    timezone: '+08:00',
    logging: false, // 生产环境不显示SQL日志
    pool: {
      max: 10,
      min: 2,
      acquire: 60000,
      idle: 10000
    }
  }
};

// 根据环境变量选择配置
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

// 创建Sequelize实例
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

// 测试数据库连接
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功！');
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
  }
};

module.exports = {
  sequelize,
  testConnection
}; 