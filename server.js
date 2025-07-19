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
                
                // DHL失败后，返回通用错误
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