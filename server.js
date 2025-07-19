const express = require('express');
const cors = require('cors');
const path = require('path');

// 加载环境变量
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3007;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 简单的测试路由
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API is working!',
        env: {
            NODE_ENV: process.env.NODE_ENV,
            DHL_API_KEY: process.env.DHL_API_KEY ? 'configured' : 'missing',
            SEVENTEENTRACK_API_KEY: process.env.SEVENTEENTRACK_API_KEY ? 'configured' : 'missing'
        }
    });
});

// 简单的追踪路由
app.post('/api/tracking', async (req, res) => {
    try {
        const { trackingNumbers, forcedCarrier } = req.body;
        
        if (!trackingNumbers || !Array.isArray(trackingNumbers) || trackingNumbers.length === 0) {
            return res.status(400).json({
                success: false,
                message: '请提供有效的追踪单号'
            });
        }
        
        const results = [];
        
        for (const trackingNumber of trackingNumbers) {
            const cleanNumber = trackingNumber.trim();
            
            if (!cleanNumber) {
                results.push({
                    success: false,
                    carrier: 'Unknown',
                    trackingNumber: cleanNumber,
                    message: '单号不能为空'
                });
                continue;
            }
            
            // 承运商自动识别
            const detectedCarrier = detectCarrier(cleanNumber, forcedCarrier);
            console.log(`单号 ${cleanNumber} 识别为: ${detectedCarrier}`);
            
            // 根据识别的承运商选择追踪方法
            let result = null;
            
            if (detectedCarrier === 'DHL') {
                result = await trackDHL(cleanNumber);
            } else if (detectedCarrier === 'UPS') {
                result = await trackUPS(cleanNumber);
            } else if (detectedCarrier === 'FedEx') {
                result = await trackFedEx(cleanNumber);
            } else {
                // 未知承运商，尝试所有可能的API
                result = await trackUnknown(cleanNumber);
            }
            
            results.push(result);
        }
        
        res.json({
            success: true,
            results: results
        });
        
    } catch (error) {
        console.error('追踪API错误:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// 承运商识别函数
function detectCarrier(trackingNumber, forcedCarrier) {
    if (forcedCarrier) {
        return forcedCarrier;
    }
    
    const cleanNumber = trackingNumber.replace(/\s+/g, '').toUpperCase();
    console.log(`识别单号: ${cleanNumber}, 长度: ${cleanNumber.length}`);
    
    // UPS模式识别（1Z开头，18位字符）
    if (/^1Z[A-Z0-9]{16}$/.test(cleanNumber) && cleanNumber.length === 18) {
        console.log('匹配UPS模式（18位）');
        return 'UPS';
    }
    
    // 航空单号模式（格式特殊）
    if (/^\d{3}-\d{8}$/.test(cleanNumber)) {
        console.log('匹配航空单号模式');
        return 'Airline';
    }
    
    // DHL模式识别（优先级提高，覆盖更广）
    if (/^(\d{10,12}|[A-Z]{3}\d{9}|[A-Z]{2}\d{9,11})$/.test(cleanNumber)) {
        console.log('匹配DHL模式');
        return 'DHL';
    }
    
    // FedEx模式识别（非常特定的格式，避免与DHL冲突）
    if (/^(\d{14}|\d{20}|\d{15})$/.test(cleanNumber)) {
        console.log('匹配FedEx模式');
        return 'FedEx';
    }
    
    // 如果都不匹配，默认尝试DHL（最常见）
    console.log('未匹配特定模式，默认DHL');
    return 'DHL';
}

// DHL追踪函数
async function trackDHL(trackingNumber) {
    try {
        console.log(`开始追踪DHL包裹: ${trackingNumber}`);
        
        const dhlApiKey = process.env.DHL_API_KEY;
        const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`;
        
        const axios = require('axios');
        const response = await axios.get(url, {
            headers: {
                'DHL-API-Key': dhlApiKey,
                'Accept': 'application/json',
                'User-Agent': 'TrackAll-Production/1.0'
            },
            timeout: 10000
        });
        
        if (response.data && response.data.shipments && response.data.shipments.length > 0) {
            const shipment = response.data.shipments[0];
            console.log(`DHL包裹 ${trackingNumber} 追踪成功`);
            
            return {
                success: true,
                carrier: 'DHL',
                trackingNumber: trackingNumber,
                status: shipment.status?.description || 'In Transit',
                service: shipment.details?.product?.productName || 'DHL Express',
                origin: shipment.origin?.address?.addressLocality,
                destination: shipment.destination?.address?.addressLocality,
                estimatedDelivery: shipment.estimatedTimeOfDelivery,
                events: shipment.events || []
            };
        } else {
            // DHL没有数据，尝试17track
            console.log(`===== DHL未找到数据，开始尝试17track: ${trackingNumber} =====`);
            return await try17track(trackingNumber, 'DHL');
        }
        
    } catch (dhlError) {
        console.log(`DHL API错误: ${dhlError.response?.status} - ${dhlError.message}`);
        // DHL出错，尝试17track
        return await try17track(trackingNumber, 'DHL');
    }
}

// 17track备选函数
async function try17track(trackingNumber, originalCarrier) {
    try {
        console.log(`===== 开始17track备选追踪: ${trackingNumber} =====`);
        
        const seventeentrackApiKey = process.env.SEVENTEENTRACK_API_KEY || 
                                   '60c5b1e0-0b4a-11ee-8a0b-5f2cc0c56900'; // 备用Key
        
        console.log(`使用17track API Key: ${seventeentrackApiKey ? seventeentrackApiKey.substring(0, 8) + '...' : '未设置'}`);
        
        // 确定carrier代码
        let carrierCode = 6; // 默认DHL
        if (originalCarrier === 'UPS') carrierCode = 2;
        if (originalCarrier === 'FedEx') carrierCode = 3;
        
        // 注册到17track
        console.log(`17track注册单号: ${trackingNumber}, carrier: ${carrierCode}`);
        const registerResponse = await axios.post('https://api.17track.net/track/v2.2/register', [{
            number: trackingNumber,
            carrier: carrierCode,
            auto_detection: true
        }], {
            headers: {
                '17token': seventeentrackApiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`17track注册响应: ${registerResponse.status} - ${JSON.stringify(registerResponse.data)}`);
        
        // 等待处理
        console.log('等待17track处理...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 查询追踪信息
        console.log(`17track查询单号: ${trackingNumber}`);
        const trackResponse = await axios.post('https://api.17track.net/track/v2.2/gettrackinfo', [{
            number: trackingNumber,
            carrier: carrierCode
        }], {
            headers: {
                '17token': seventeentrackApiKey,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });
        
        console.log(`17track查询响应: ${trackResponse.status} - ${JSON.stringify(trackResponse.data)}`);
        
        if (trackResponse.data && trackResponse.data.code === 0 && trackResponse.data.data && trackResponse.data.data.length > 0) {
            const trackInfo = trackResponse.data.data[0];
            
            if (trackInfo && trackInfo.track && trackInfo.track.length > 0) {
                console.log(`17track查询成功: ${trackingNumber}`);
                
                return {
                    success: true,
                    carrier: originalCarrier,
                    trackingNumber: trackingNumber,
                    status: trackInfo.track[0].description || 'In Transit',
                    service: '国际快递追踪',
                    origin: trackInfo.track[trackInfo.track.length - 1]?.location,
                    destination: trackInfo.track[0]?.location,
                    events: trackInfo.track.map(event => ({
                        timestamp: event.time_iso,
                        description: event.description,
                        location: { address: { addressLocality: event.location } }
                    }))
                };
            }
        }
        
        // 17track也没找到
        console.log(`17track未找到数据: ${trackingNumber}`);
        return {
            success: false,
            carrier: originalCarrier,
            trackingNumber: trackingNumber,
            message: `${originalCarrier}系统中未找到此包裹号`
        };
        
    } catch (error) {
        console.error(`===== 17track错误详情 =====`);
        console.error(`单号: ${trackingNumber}`);
        console.error(`错误类型: ${error.constructor.name}`);
        console.error(`错误消息: ${error.message}`);
        if (error.response) {
            console.error(`响应状态: ${error.response.status}`);
            console.error(`响应数据: ${JSON.stringify(error.response.data)}`);
        }
        console.error(`===== 17track错误结束 =====`);
        
        return {
            success: false,
            carrier: originalCarrier,
            trackingNumber: trackingNumber,
            message: `${originalCarrier}系统中未找到此包裹号`
        };
    }
}

// UPS追踪函数
async function trackUPS(trackingNumber) {
    // 目前返回模拟数据，可以后续接入真实UPS API
    return {
        success: false,
        carrier: 'UPS',
        trackingNumber: trackingNumber,
        message: 'UPS追踪服务暂未开放，请稍后再试'
    };
}

// FedEx追踪函数
async function trackFedEx(trackingNumber) {
    // 目前返回模拟数据，可以后续接入真实FedEx API
    return {
        success: false,
        carrier: 'FedEx',
        trackingNumber: trackingNumber,
        message: 'FedEx追踪服务暂未开放，请稍后再试'
    };
}

// 未知承运商追踪函数
async function trackUnknown(trackingNumber) {
    // 依次尝试不同的API
    console.log(`未知承运商，尝试多种API: ${trackingNumber}`);
    
    // 先尝试DHL
    const dhlResult = await trackDHL(trackingNumber);
    if (dhlResult.success) {
        return dhlResult;
    }
    
    // 如果都没找到，返回通用错误
    return {
        success: false,
        carrier: 'Unknown',
        trackingNumber: trackingNumber,
        message: '请确认单号格式是否正确'
    };
}

// 根路径重定向到index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 本地开发时启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`测试服务器运行在 http://localhost:${PORT}`);
    });
}

// 导出app供Vercel使用
module.exports = app; 