const axios = require('axios');

async function testVercelRoutes() {
    console.log('🔍 测试Vercel路由配置...\n');
    
    const baseUrl = 'https://trackall.huodaiagent.com';
    
    const testRoutes = [
        '/',
        '/index.html',
        '/api',
        '/api/',
        '/api/tracking',
        '/api/tracking/',
        '/server.js'
    ];
    
    for (const route of testRoutes) {
        const url = baseUrl + route;
        console.log(`🌐 测试: ${url}`);
        
        try {
            const response = await axios.get(url, {
                timeout: 10000,
                validateStatus: () => true // 接受所有状态码
            });
            
            console.log(`   状态: ${response.status}`);
            
            if (response.status === 200) {
                console.log('   ✅ 可访问');
            } else if (response.status === 404) {
                console.log('   ❌ 未找到');
            } else if (response.status === 500) {
                console.log('   💥 服务器错误');
            } else {
                console.log(`   ⚠️  其他状态: ${response.status}`);
            }
            
        } catch (error) {
            if (error.code === 'ENOTFOUND') {
                console.log('   ❌ DNS解析失败');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   ⏰ 超时');
            } else {
                console.log(`   ❌ 错误: ${error.message}`);
            }
        }
        
        console.log('');
    }
    
    // 专门测试POST请求到API
    console.log('📤 测试POST请求到API...');
    try {
        const response = await axios.post(baseUrl + '/api/tracking', {
            trackingNumbers: ['test']
        }, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 15000,
            validateStatus: () => true
        });
        
        console.log(`   POST状态: ${response.status}`);
        if (response.data) {
            console.log('   响应类型:', typeof response.data);
            if (typeof response.data === 'object') {
                console.log('   响应键:', Object.keys(response.data));
            }
        }
        
    } catch (error) {
        console.log(`   POST错误: ${error.message}`);
    }
}

testVercelRoutes().catch(console.error); 