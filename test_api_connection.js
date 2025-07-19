const axios = require('axios');

console.log('🔧 环境变量检查:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DHL_API_KEY:', process.env.DHL_API_KEY ? '已配置' : '未配置');
console.log('DHL_API_SECRET:', process.env.DHL_API_SECRET ? '已配置' : '未配置');
console.log('SEVENTEENTRACK_API_KEY:', process.env.SEVENTEENTRACK_API_KEY ? '已配置' : '未配置');

console.log('\n🚀 测试DHL API连接...');

async function testDHLConnection() {
    try {
        const response = await axios.get('https://api-eu.dhl.com/track/shipments?trackingNumber=6879768243', {
            headers: {
                'DHL-API-Key': process.env.DHL_API_KEY || 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7',
                'Accept': 'application/json'
            },
            timeout: 10000
        });
        
        console.log('✅ DHL API连接成功!');
        console.log('📦 包裹状态:', response.data.shipments[0].status.description);
        return true;
    } catch (error) {
        console.log('❌ DHL API连接失败:', error.response?.status, error.response?.data?.detail || error.message);
        return false;
    }
}

testDHLConnection(); 