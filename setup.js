const fs = require('fs');
const path = require('path');

// 创建环境变量配置文件
const createEnvFile = () => {
  const envContent = `# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=tracking_system
DB_USER=root
DB_PASSWORD=

# 服务器配置
PORT=3007
NODE_ENV=development

# API密钥（稍后填写）
DHL_API_KEY=
UPS_CLIENT_ID=
UPS_CLIENT_SECRET=
FEDEX_API_KEY=
FEDEX_SECRET_KEY=
FEDEX_API_BASE_URL=https://apis.fedex.com

# 邮件服务配置（稍后填写）
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=
EMAIL_FROM=noreply@huodaiagent.com

# 域名配置
DOMAIN=trackall.huodaiagent.com
SITE_URL=https://trackall.huodaiagent.com`;

  const envPath = path.join(__dirname, '.env');
  
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env 文件创建成功！');
    console.log('📝 请修改 .env 文件中的数据库配置信息');
  } else {
    console.log('⚠️  .env 文件已存在');
  }
};

// 测试数据库连接
const testDatabase = async () => {
  try {
    const { testConnection } = require('./config/database');
    await testConnection();
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    console.log('💡 请检查 .env 文件中的数据库配置');
  }
};

// 初始化数据库
const initDatabase = async () => {
  try {
    const { syncDatabase } = require('./models');
    await syncDatabase(true); // force: true 会重新创建所有表
    console.log('🎉 数据库初始化完成！');
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
  }
};

// 主函数
const main = async () => {
  console.log('🚀 开始初始化项目...\n');
  
  // 1. 创建环境变量文件
  createEnvFile();
  
  // 2. 等待用户配置数据库
  console.log('\n📋 接下来请执行以下步骤：');
  console.log('1. 购买阿里云RDS MySQL或安装本地MySQL');
  console.log('2. 修改 .env 文件中的数据库配置');
  console.log('3. 运行 npm run setup:db 初始化数据库');
  console.log('4. 运行 npm start 启动服务器');
  
  console.log('\n🔧 如果已经配置好数据库，请运行：');
  console.log('npm run setup:db');
};

// 如果直接运行此脚本
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--env')) {
    createEnvFile();
  } else if (args.includes('--test')) {
    testDatabase();
  } else if (args.includes('--init')) {
    initDatabase();
  } else {
    main();
  }
}

module.exports = {
  createEnvFile,
  testDatabase,
  initDatabase
}; 