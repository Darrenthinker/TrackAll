const axios = require('axios');

async function testProductionDirect() {
    console.log('🌐 直接测试生产环境追踪功能...\n');
    
    const productionURL = 'https://trackall.huodaiagent.com/api/tracking';
    
    const testCases = [
        { numbers: ['6879768243'], description: '有效的DHL单号' },
        { numbers: ['882815536685'], description: '另一个DHL单号' },
        { numbers: ['1ZB61R520403638398'], description: 'UPS单号格式' }
    ];
    
    for (const testCase of testCases) {
        console.log(`📦 测试: ${testCase.description}`);
        console.log(`🔍 单号: ${testCase.numbers.join(', ')}`);
        
        try {
            const response = await axios.post(productionURL, {
                trackingNumbers: testCase.numbers
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 30000
            });
            
            console.log(`✅ 响应状态: ${response.status}`);
            console.log('📋 响应数据:');
            
            if (response.data.results && response.data.results.length > 0) {
                response.data.results.forEach((result, index) => {
                    console.log(`  结果 ${index + 1}:`);
                    console.log(`    成功: ${result.success}`);
                    console.log(`    承运商: ${result.carrier}`);
                    console.log(`    状态: ${result.status || result.message}`);
                    if (result.events && result.events.length > 0) {
                        console.log(`    事件数量: ${result.events.length}`);
                    }
                });
            } else {
                console.log('  无结果数据');
                console.log('  完整响应:', JSON.stringify(response.data, null, 2));
            }
            
        } catch (error) {
            console.log(`❌ 请求失败:`);
            console.log(`   状态码: ${error.response?.status || 'N/A'}`);
            console.log(`   错误类型: ${error.code || error.name}`);
            console.log(`   错误消息: ${error.message}`);
            
            if (error.response?.data) {
                console.log('   响应数据:', JSON.stringify(error.response.data, null, 2));
            }
            
            // 详细的错误分析
            if (error.code === 'ENOTFOUND') {
                console.log('   → DNS解析失败，域名可能未正确配置');
            } else if (error.code === 'ECONNREFUSED') {
                console.log('   → 连接被拒绝，服务器可能未运行');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   → 请求超时，服务器响应太慢');
            } else if (error.response?.status === 500) {
                console.log('   → 服务器内部错误，可能是环境变量或代码问题');
            } else if (error.response?.status === 404) {
                console.log('   → API路径不存在，检查路由配置');
            }
        }
        
        console.log(''); // 空行分隔
    }
    
    // 测试首页是否可访问
    console.log('🏠 测试首页可访问性...');
    try {
        const homeResponse = await axios.get('https://trackall.huodaiagent.com/', {
            timeout: 10000
        });
        console.log(`✅ 首页可访问 (${homeResponse.status})`);
    } catch (error) {
        console.log(`❌ 首页不可访问: ${error.message}`);
    }
}

testProductionDirect().catch(console.error); 