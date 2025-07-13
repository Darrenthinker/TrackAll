const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const trackingRoutes = require('./routes/tracking');
const carriersRoutes = require('./routes/carriers');
const notificationsRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3007; // 使用3007端口

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 路由
app.use('/api/tracking', trackingRoutes);
app.use('/carriers', carriersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', adminRoutes);

// 主页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 本地开发时启动服务器
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`追踪网站运行在 http://localhost:${PORT}`);
        console.log(`生产环境访问: https://trackall.huodaiagent.com`);
        console.log('支持的快递公司：DHL, UPS, FedEx, 以及主要IATA航司');
    });
}

// 导出app供Vercel使用
module.exports = app; 