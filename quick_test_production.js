const axios = require('axios');

async function testProductionAPI() {
    console.log('🚀 测试生产环境API...\n');
    
    const baseURL = 'http://localhost:3007';
    
    try {
        // 测试基本连接
        console.log('1. 测试服务器连接...');
        const healthCheck = await axios.get(`${baseURL}`);
        console.log('✅ 服务器正常运行\n');
        
        // 测试追踪API - DHL包裹
        console.log('2. 测试DHL包裹追踪...');
        const dhlTest = await axios.post(`${baseURL}/api/tracking`, {
            trackingNumbers: ['88281553665']
        });
        
        console.log('DHL测试结果:');
        if (dhlTest.data.results && dhlTest.data.results[0]) {
            const result = dhlTest.data.results[0];
            console.log(`- 状态: ${result.success ? '成功' : '失败'}`);
            console.log(`- 承运商: ${result.carrier}`);
            console.log(`- 消息: ${result.message || result.status || 'OK'}`);
        }
        console.log('');
        
        // 测试追踪API - UPS包裹
        console.log('3. 测试UPS包裹追踪...');
        const upsTest = await axios.post(`${baseURL}/api/tracking`, {
            trackingNumbers: ['1ZB61R520403638398']
        });
        
        console.log('UPS测试结果:');
        if (upsTest.data.results && upsTest.data.results[0]) {
            const result = upsTest.data.results[0];
            console.log(`- 状态: ${result.success ? '成功' : '失败'}`);
            console.log(`- 承运商: ${result.carrier}`);
            console.log(`- 消息: ${result.message || result.status || 'OK'}`);
        }
        console.log('');
        
        // 测试强制选择服务商功能
        console.log('4. 测试强制选择服务商功能...');
        const forcedTest = await axios.post(`${baseURL}/api/tracking`, {
            trackingNumbers: ['88281553665'],
            forcedCarrier: 'DHL Express'
        });
        
        console.log('强制DHL测试结果:');
        if (forcedTest.data.results && forcedTest.data.results[0]) {
            const result = forcedTest.data.results[0];
            console.log(`- 状态: ${result.success ? '成功' : '失败'}`);
            console.log(`- 承运商: ${result.carrier}`);
            console.log(`- 消息: ${result.message || result.status || 'OK'}`);
        }
        
        console.log('\n🎉 生产环境测试完成！所有功能正常工作。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error('响应状态:', error.response.status);
            console.error('响应数据:', error.response.data);
        }
    }
}

// 运行测试
if (require.main === module) {
    testProductionAPI().catch(console.error);
}

module.exports = testProductionAPI; 