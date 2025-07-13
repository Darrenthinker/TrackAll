const { sequelize } = require('../config/database');

// 导入所有模型
const User = require('./User');
const QueryLog = require('./QueryLog');

// 定义模型关联关系
User.hasMany(QueryLog, {
  foreignKey: 'user_id',
  as: 'queryLogs'
});

QueryLog.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 数据库同步函数
const syncDatabase = async (force = false) => {
  try {
    console.log('🔄 开始同步数据库...');
    
    // 同步所有模型到数据库
    await sequelize.sync({ force });
    
    console.log('✅ 数据库同步完成！');
    
    // 如果是强制同步，插入初始数据
    if (force) {
      await seedInitialData();
    }
    
  } catch (error) {
    console.error('❌ 数据库同步失败:', error);
    throw error;
  }
};

// 插入初始数据
const seedInitialData = async () => {
  try {
    console.log('🌱 插入初始数据...');
    
    // 创建管理员用户
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    const admin = await User.findOrCreate({
      where: { email: 'admin@example.com' },
      defaults: {
        email: 'admin@example.com',
        password_hash: adminPassword,
        user_type: 'admin'
      }
    });
    
    console.log('✅ 管理员用户创建成功: admin@example.com / admin123');
    
    // 创建示例查询记录
    const sampleQueries = [
      {
        user_id: admin[0].id,
        tracking_number: '1Z999AA1234567890',
        carrier: 'UPS',
        query_result: 'success',
        response_time: 1500,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      {
        user_id: admin[0].id,
        tracking_number: '1234567890',
        carrier: 'DHL',
        query_result: 'success',
        response_time: 1200,
        ip_address: '127.0.0.1',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    ];
    
    await QueryLog.bulkCreate(sampleQueries);
    console.log('✅ 示例查询记录创建成功');
    
  } catch (error) {
    console.error('❌ 初始数据插入失败:', error);
  }
};

module.exports = {
  sequelize,
  User,
  QueryLog,
  syncDatabase
}; 