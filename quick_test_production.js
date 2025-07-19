const axios = require('axios');
require('dotenv').config();

// 生产环境API密钥
const DHL_API_KEY = process.env.DHL_API_KEY || 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7';
const DHL_API_SECRET = process.env.DHL_API_SECRET || '9yE31yUNHsE5hfYB';
const SEVENTEENTRACK_API_KEY = process.env.SEVENTEENTRACK_API_KEY || 'D5D021BFC8A9F142EFE33A2E3EDD247C';

console.log('🚀 生产环境API测试开始...\n');

// 测试DHL API
async function testDHL() {
    console.log('📦 测试DHL API连接...');
    
    const testNumbers = ['882815536685', '6879768243'];
    
    for (const trackingNumber of testNumbers) {
        try {
            console.log(`\n🔍 测试单号: ${trackingNumber}`);
            
            const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`;
            console.log(`📡 请求URL: ${url}`);
            
            const response = await axios.get(url, {
                headers: {
                    'DHL-API-Key': DHL_API_KEY,
                    'Accept': 'application/json',
                    'User-Agent': 'TrackAll-Production/1.0'
                },
                timeout: 10000
            });
            
            console.log(`✅ DHL API响应成功 (${response.status})`);
            console.log(`📋 响应数据:`, JSON.stringify(response.data, null, 2));
            
        } catch (error) {
            console.log(`❌ DHL API错误:`);
            console.log(`   状态码: ${error.response?.status}`);
            console.log(`   错误消息: ${error.response?.data?.detail || error.message}`);
            console.log(`   完整响应:`, error.response?.data);
        }
    }
}

// 测试17track API
async function test17track() {
    console.log('\n📦 测试17track API连接...');
    
    try {
        // 先注册追踪
        const registerUrl = 'https://api.17track.net/track/v2.2/register';
        const registerData = [{
            number: '882815536685',
            carrier: 6, // DHL的正确carrier代码是6，不是259
            auto_detection: true
        }];
        
        console.log(`📡 注册URL: ${registerUrl}`);
        
        const registerResponse = await axios.post(registerUrl, registerData, {
            headers: {
                '17token': SEVENTEENTRACK_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`✅ 17track注册成功 (${registerResponse.status})`);
        console.log(`📋 注册响应:`, JSON.stringify(registerResponse.data, null, 2));
        
        // 等待几秒后查询
        console.log('⏳ 等待3秒后查询...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查询追踪信息
        const trackUrl = 'https://api.17track.net/track/v2.2/gettrackinfo';
        const trackData = [{
            number: '882815536685',
            carrier: 6 // 使用正确的DHL代码
        }];
        
        console.log(`📡 查询URL: ${trackUrl}`);
        
        const trackResponse = await axios.post(trackUrl, trackData, {
            headers: {
                '17token': SEVENTEENTRACK_API_KEY,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`✅ 17track查询成功 (${trackResponse.status})`);
        console.log(`📋 查询响应:`, JSON.stringify(trackResponse.data, null, 2));
        
    } catch (error) {
        console.log(`❌ 17track API错误:`);
        console.log(`   状态码: ${error.response?.status}`);
        console.log(`   错误消息: ${error.response?.data?.msg || error.message}`);
        console.log(`   完整响应:`, error.response?.data);
    }
}

// 测试你的生产环境追踪接口
async function testProductionAPI() {
    console.log('\n🌐 测试生产环境追踪接口...');
    
    const productionURL = 'https://trackall.huodaiagent.com/api/track';
    
    try {
        const response = await axios.post(productionURL, {
            trackingNumbers: ['882815536685'],
            forcedCarrier: 'DHL'
        }, {
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 15000
        });
        
        console.log(`✅ 生产环境接口响应成功 (${response.status})`);
        console.log(`📋 响应数据:`, JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log(`❌ 生产环境接口错误:`);
        console.log(`   状态码: ${error.response?.status}`);
        console.log(`   错误消息: ${error.response?.data || error.message}`);
        
        if (error.code === 'ENOTFOUND') {
            console.log(`   DNS解析失败，请检查域名是否正确配置`);
        } else if (error.code === 'ECONNRESET') {
            console.log(`   连接被重置，可能是服务器问题`);
        } else if (error.code === 'ETIMEDOUT') {
            console.log(`   请求超时，检查网络连接`);
        }
    }
}

// 主测试函数
async function runTests() {
    console.log('🔧 配置信息:');
    console.log(`   DHL_API_KEY: ${DHL_API_KEY.substring(0, 8)}...`);
    console.log(`   DHL_API_SECRET: ${DHL_API_SECRET.substring(0, 8)}...`);
    console.log(`   SEVENTEENTRACK_API_KEY: ${SEVENTEENTRACK_API_KEY.substring(0, 8)}...`);
    
    await testDHL();
    await test17track();
    await testProductionAPI();
    
    console.log('\n🏁 测试完成！');
}

runTests().catch(console.error); 