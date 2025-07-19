const dhlService = require('./services/dhlService');
const configService = require('./services/configService');

async function testDHLAPI() {
    console.log('🔍 测试DHL API配置...\n');

    try {
        // 测试默认配置
        console.log('1. 测试默认配置:');
        const defaultStatus = await dhlService.checkServiceStatus();
        console.log('   状态:', defaultStatus.status);
        console.log('   消息:', defaultStatus.message);

        // 测试项目配置
        console.log('\n2. 测试项目配置 (项目ID: 1):');
        const projectConfig = await configService.getDHLConfig(1);
        console.log('   API Key:', projectConfig.apiKey ? '已配置' : '未配置');
        console.log('   API Secret:', projectConfig.apiSecret ? '已配置' : '未配置');

        const projectStatus = await dhlService.checkServiceStatus(1);
        console.log('   状态:', projectStatus.status);
        console.log('   消息:', projectStatus.message);

        // 测试实际追踪号（如果有的话）
        console.log('\n3. 测试实际追踪号:');
        const testTrackingNumber = '1234567890'; // 替换为真实的追踪号
        console.log('   追踪号:', testTrackingNumber);
        
        try {
            const result = await dhlService.trackShipment(testTrackingNumber, 1);
            console.log('   结果:', result.found ? '找到包裹' : '未找到包裹');
            if (result.found) {
                console.log('   状态:', result.status);
                console.log('   事件数量:', result.events.length);
            }
        } catch (error) {
            console.log('   错误:', error.message);
        }

    } catch (error) {
        console.error('❌ 测试失败:', error.message);
    }
}

// 运行测试
testDHLAPI().then(() => {
    console.log('\n✅ 测试完成');
    process.exit(0);
}).catch(error => {
    console.error('❌ 测试异常:', error);
    process.exit(1);
}); 