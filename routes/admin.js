const express = require('express');
const router = express.Router();
const { QueryLog, User, Notification } = require('../models');
const jwt = require('jsonwebtoken');

// JWT密钥 (生产环境应该使用环境变量)
const JWT_SECRET = process.env.JWT_SECRET || 'trackall-admin-secret-2025';

// 默认管理员账户
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'TrackAll2025!'
};

// 身份验证中间件
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ message: '未授权访问' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: '无效的访问令牌' });
    }
};

// 管理员登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // 验证用户名和密码
        if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
            // 生成JWT token
            const token = jwt.sign(
                { username: username, role: 'admin' },
                JWT_SECRET,
                { expiresIn: '24h' }
            );
            
            res.json({
                success: true,
                token: token,
                message: '登录成功'
            });
        } else {
            res.status(401).json({
                success: false,
                message: '用户名或密码错误'
            });
        }
    } catch (error) {
        console.error('登录错误:', error);
        res.status(500).json({
            success: false,
            message: '服务器错误'
        });
    }
});

// 验证token
router.get('/verify', authenticateAdmin, (req, res) => {
    res.json({
        success: true,
        admin: req.admin
    });
});

// 以下所有路由都需要身份验证
router.use(authenticateAdmin);

// 仪表板数据
router.get('/dashboard', async (req, res) => {
    try {
        const userCount = await User.count();
        const queryCount = await QueryLog.count();
        const successCount = await QueryLog.count({ where: { status: 'success' } });
        
        // 计算平均响应时间
        const avgResponse = await QueryLog.findOne({
            attributes: [
                [require('sequelize').fn('AVG', require('sequelize').col('response_time')), 'avg_time']
            ]
        });
        
        const avgResponseTime = avgResponse?.dataValues?.avg_time || 0;
        
        res.json({
            userCount,
            queryCount,
            successCount,
            avgResponseTime: Math.round(avgResponseTime)
        });
    } catch (error) {
        console.error('获取仪表板数据错误:', error);
        res.status(500).json({ message: '获取数据失败' });
    }
});

// 用户管理
router.get('/users', async (req, res) => {
    try {
        const users = await User.findAll({
            order: [['created_at', 'DESC']],
            limit: 100
        });
        
        res.json(users);
    } catch (error) {
        console.error('获取用户数据错误:', error);
        res.status(500).json({ message: '获取用户数据失败' });
    }
});

// 查询记录
router.get('/queries', async (req, res) => {
    try {
        const queries = await QueryLog.findAll({
            include: [{
                model: User,
                attributes: ['email']
            }],
            order: [['created_at', 'DESC']],
            limit: 100
        });
        
        res.json(queries);
    } catch (error) {
        console.error('获取查询记录错误:', error);
        res.status(500).json({ message: '获取查询记录失败' });
    }
});

// 通知管理
router.get('/notifications', async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            include: [{
                model: User,
                attributes: ['email']
            }],
            order: [['created_at', 'DESC']],
            limit: 100
        });
        
        res.json(notifications);
    } catch (error) {
        console.error('获取通知数据错误:', error);
        res.status(500).json({ message: '获取通知数据失败' });
    }
});

// 通知统计
router.get('/notifications/stats', async (req, res) => {
    try {
        const totalCount = await Notification.count();
        const pendingCount = await Notification.count({ where: { status: 'pending' } });
        const todayCount = await Notification.count({
            where: {
                created_at: {
                    [require('sequelize').Op.gte]: new Date().setHours(0, 0, 0, 0)
                }
            }
        });
        
        const activeUsers = await User.count({
            where: {
                created_at: {
                    [require('sequelize').Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        });
        
        res.json({
            totalCount,
            pendingCount,
            todayCount,
            activeUsers
        });
    } catch (error) {
        console.error('获取通知统计错误:', error);
        res.status(500).json({ message: '获取通知统计失败' });
    }
});

module.exports = router; 