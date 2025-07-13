const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'rm-bp19c413117y10tq0vo.mysql.rds.aliyuncs.com',
    port: 3306,
    user: 'root',
    password: 'TrackAll2025!',
    database: 'tracking_system'
});

// 仪表板数据
router.get('/dashboard', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 获取用户总数
            const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
            
            // 获取查询总数
            const [queryCount] = await connection.execute('SELECT COUNT(*) as count FROM query_logs');
            
            // 获取成功查询数
            const [successCount] = await connection.execute(
                'SELECT COUNT(*) as count FROM query_logs WHERE query_result = "success"'
            );
            
            // 获取平均响应时间
            const [avgTime] = await connection.execute(
                'SELECT AVG(response_time) as avg_time FROM query_logs'
            );
            
            // 获取最近查询记录
            const [recentQueries] = await connection.execute(`
                SELECT tracking_number, carrier, query_result, response_time, created_at 
                FROM query_logs 
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            res.json({
                success: true,
                totalUsers: userCount[0].count,
                totalQueries: queryCount[0].count,
                successfulQueries: successCount[0].count,
                avgResponseTime: Math.round(avgTime[0].avg_time || 0),
                recentQueries: recentQueries
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('获取仪表板数据失败:', error.message);
        res.status(500).json({ 
            success: false, 
            message: '获取仪表板数据失败' 
        });
    }
});

// 用户管理数据
router.get('/users', async (req, res) => {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const offset = (page - 1) * pageSize;
        
        const connection = await pool.getConnection();
        
        try {
            // 获取用户总数
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM users');
            const total = countResult[0].total;
            
            // 获取用户列表
            const [users] = await connection.execute(`
                SELECT id, email, user_type, status, created_at, last_login
                FROM users 
                ORDER BY created_at DESC 
                LIMIT ${parseInt(pageSize)} OFFSET ${offset}
            `);

            res.json({
                success: true,
                users: users,
                total: total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(total / pageSize)
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('获取用户数据失败:', error.message);
        res.status(500).json({ 
            success: false, 
            message: '获取用户数据失败' 
        });
    }
});

// 查询记录数据
router.get('/queries', async (req, res) => {
    try {
        const { page = 1, pageSize = 20 } = req.query;
        const offset = (page - 1) * pageSize;
        
        const connection = await pool.getConnection();
        
        try {
            // 获取查询总数
            const [countResult] = await connection.execute('SELECT COUNT(*) as total FROM query_logs');
            const total = countResult[0].total;
            
            // 获取查询列表
            const [queries] = await connection.execute(`
                SELECT q.*, u.email as user_email
                FROM query_logs q
                LEFT JOIN users u ON q.user_id = u.id
                ORDER BY q.created_at DESC 
                LIMIT ${parseInt(pageSize)} OFFSET ${offset}
            `);

            res.json({
                success: true,
                queries: queries,
                total: total,
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                totalPages: Math.ceil(total / pageSize)
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('获取查询数据失败:', error.message);
        res.status(500).json({ 
            success: false, 
            message: '获取查询数据失败' 
        });
    }
});

module.exports = router; 