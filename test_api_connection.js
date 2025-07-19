const dhlService = require('./services/dhlService');
const seventeentrackService = require('./services/seventeentrackService');
const axios = require('axios');

async function testAPIConnections() {
    console.log('🔧 开始测试API连接状态...\n');
    
    // 测试DHL API
    console.log('📦 测试DHL API...');
    try {
        const dhlStatus = await dhlService.checkServiceStatus();
        console.log(`DHL API状态: ${dhlStatus.status} - ${dhlStatus.message}`);
        
        // 测试实际追踪
        console.log('正在测试DHL实际追踪...');
        const dhlTest = await dhlService.trackShipment('1234567890');
        console.log(`DHL测试结果: ${dhlTest.success ? '成功' : '失败'} - ${dhlTest.message || 'OK'}`);
    } catch (error) {
        console.error(`DHL API测试失败: ${error.message}`);
    }
    
    console.log('');
    
    // 测试17track API
    console.log('🌐 测试17track API...');
    try {
        const seventeentrackStatus = await seventeentrackService.checkServiceStatus();
        console.log(`17track API状态: ${seventeentrackStatus.status} - ${seventeentrackStatus.message}`);
        
        // 测试实际追踪
        console.log('正在测试17track实际追踪...');
        const seventeentrackTest = await seventeentrackService.trackShipment('test123456789', 'dhl');
        console.log(`17track测试结果: ${seventeentrackTest.success ? '成功' : '失败'} - ${seventeentrackTest.message || 'OK'}`);
    } catch (error) {
        console.error(`17track API测试失败: ${error.message}`);
    }
    
    console.log('');
    
    // 检查环境变量
    console.log('🔑 检查环境变量配置...');
    console.log(`DHL_API_KEY: ${process.env.DHL_API_KEY ? '已配置' : '未配置'}`);
    console.log(`DHL_API_SECRET: ${process.env.DHL_API_SECRET ? '已配置' : '未配置'}`);
    console.log(`SEVENTEENTRACK_API_KEY: ${process.env.SEVENTEENTRACK_API_KEY ? '已配置' : '未配置'}`);
    
    console.log('');
    
    // 网络连通性测试
    console.log('🌍 测试网络连通性...');
    try {
        // 测试DHL API端点
        console.log('测试DHL API端点...');
        const dhlPing = await axios.get('https://api-eu.dhl.com', { timeout: 5000 });
        console.log(`DHL API端点: 可访问 (${dhlPing.status})`);
    } catch (error) {
        console.log(`DHL API端点: 不可访问 (${error.message})`);
    }
    
    try {
        // 测试17track API端点
        console.log('测试17track API端点...');
        const seventeentrackPing = await axios.get('https://api.17track.net', { timeout: 5000 });
        console.log(`17track API端点: 可访问 (${seventeentrackPing.status})`);
    } catch (error) {
        console.log(`17track API端点: 不可访问 (${error.message})`);
    }
    
    console.log('\n✅ API连接测试完成！');
}

// 运行测试
if (require.main === module) {
    testAPIConnections().catch(console.error);
}

module.exports = testAPIConnections; 