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
app.post('/api/tracking', (req, res) => {
    try {
        const { trackingNumbers } = req.body;
        
        res.json({
            success: true,
            message: 'Tracking API is working',
            received: trackingNumbers,
            results: trackingNumbers.map(num => ({
                success: true,
                carrier: 'TEST',
                trackingNumber: num,
                status: 'Test Status',
                message: 'This is a test response'
            }))
        });
    } catch (error) {
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