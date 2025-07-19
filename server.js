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
            
            // 尝试DHL追踪
            try {
                console.log(`开始追踪DHL包裹: ${cleanNumber}`);
                
                const dhlApiKey = process.env.DHL_API_KEY;
                const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${cleanNumber}`;
                
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
                    console.log(`DHL包裹 ${cleanNumber} 追踪成功`);
                    
                    results.push({
                        success: true,
                        carrier: 'DHL',
                        trackingNumber: cleanNumber,
                        status: shipment.status?.description || 'In Transit',
                        service: shipment.details?.product?.productName || 'DHL Express',
                        origin: shipment.origin?.address?.addressLocality,
                        destination: shipment.destination?.address?.addressLocality,
                        estimatedDelivery: shipment.estimatedTimeOfDelivery,
                        events: shipment.events || []
                    });
                } else {
                    results.push({
                        success: false,
                        carrier: 'DHL',
                        trackingNumber: cleanNumber,
                        message: 'DHL系统中未找到此包裹号'
                    });
                }
                
            } catch (dhlError) {
                console.log(`DHL追踪失败: ${dhlError.response?.status} - ${dhlError.message}`);
                
                // DHL失败后，尝试17track作为备选
                console.log(`尝试使用17track查询: ${cleanNumber}`);
                try {
                    const seventeentrackApiKey = process.env.SEVENTEENTRACK_API_KEY;
                    
                    // 先注册到17track
                    const registerResponse = await axios.post('https://api.17track.net/track/v2.2/register', [{
                        number: cleanNumber,
                        carrier: 6, // DHL的carrier代码
                        auto_detection: true
                    }], {
                        headers: {
                            '17token': seventeentrackApiKey,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    console.log(`17track注册响应: ${registerResponse.status}`);
                    
                    // 等待2秒让系统处理
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    
                    // 查询追踪信息
                    const trackResponse = await axios.post('https://api.17track.net/track/v2.2/gettrackinfo', [{
                        number: cleanNumber,
                        carrier: 6
                    }], {
                        headers: {
                            '17token': seventeentrackApiKey,
                            'Content-Type': 'application/json'
                        },
                        timeout: 10000
                    });
                    
                    console.log(`17track查询响应: ${trackResponse.status}`);
                    
                    if (trackResponse.data && trackResponse.data.code === 0 && trackResponse.data.data && trackResponse.data.data.length > 0) {
                        const trackInfo = trackResponse.data.data[0];
                        
                        if (trackInfo && trackInfo.track && trackInfo.track.length > 0) {
                            console.log(`17track查询成功: ${cleanNumber}`);
                            
                            results.push({
                                success: true,
                                carrier: 'DHL',
                                trackingNumber: cleanNumber,
                                status: trackInfo.track[0].description || 'In Transit',
                                service: '17track数据',
                                origin: trackInfo.track[trackInfo.track.length - 1]?.location,
                                destination: trackInfo.track[0]?.location,
                                events: trackInfo.track.map(event => ({
                                    timestamp: event.time_iso,
                                    description: event.description,
                                    location: { address: { addressLocality: event.location } }
                                })),
                                source: '17track (备选服务)'
                            });
                        } else {
                            // 17track也没有找到
                            results.push({
                                success: false,
                                carrier: 'DHL',
                                trackingNumber: cleanNumber,
                                message: 'DHL和17track系统中都未找到此包裹号'
                            });
                        }
                    } else {
                        // 17track查询失败
                        results.push({
                            success: false,
                            carrier: 'DHL',
                            trackingNumber: cleanNumber,
                            message: 'DHL系统中未找到此包裹号，17track备选服务也不可用'
                        });
                    }
                    
                } catch (seventeentrackError) {
                    console.log(`17track备选服务失败: ${seventeentrackError.message}`);
                    
                    // 两个服务都失败，返回原始DHL错误
                    results.push({
                        success: false,
                        carrier: 'DHL',
                        trackingNumber: cleanNumber,
                        message: dhlError.response?.status === 404 ? 
                            'DHL系统中未找到此包裹号' : 
                            'DHL服务暂时不可用，请稍后重试'
                    });
                }
            }
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