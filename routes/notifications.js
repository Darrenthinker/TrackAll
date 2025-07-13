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

// 注册通知
router.post('/register', async (req, res) => {
    try {
        const { trackingNumber, email, notificationTypes } = req.body;
        
        if (!trackingNumber || !email || !notificationTypes || notificationTypes.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: '请填写完整的通知信息' 
            });
        }

        const connection = await pool.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 检查或创建用户
            let [users] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [email]
            );
            
            let userId;
            if (users.length === 0) {
                // 创建新用户
                const [userResult] = await connection.execute(
                    'INSERT INTO users (email, password_hash, user_type) VALUES (?, ?, ?)',
                    [email, 'notification_only', 'regular']
                );
                userId = userResult.insertId;
            } else {
                userId = users[0].id;
            }
            
            // 删除该单号的旧通知设置
            await connection.execute(
                'DELETE FROM notifications WHERE user_id = ? AND tracking_number = ?',
                [userId, trackingNumber]
            );
            
            // 插入新的通知设置
            for (const notificationType of notificationTypes) {
                await connection.execute(
                    'INSERT INTO notifications (user_id, tracking_number, email, notification_type, trigger_condition, status) VALUES (?, ?, ?, ?, ?, ?)',
                    [userId, trackingNumber, email, notificationType, `当包裹状态变为${notificationType}时通知`, 'pending']
                );
            }
            
            await connection.commit();
            
            res.json({
                success: true,
                message: '通知设置成功！当包裹状态更新时，我们会发送邮件通知您。'
            });
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('注册通知失败:', error.message);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: '注册通知失败，请稍后重试',
            error: error.message
        });
    }
});

// 获取所有通知记录（管理后台用）
router.get('/admin/list', async (req, res) => {
    try {
        const { page = 1, pageSize = 20, status, email, trackingNumber } = req.query;
        const offset = (page - 1) * pageSize;
        
        let whereClause = '1=1';
        let params = [];
        
        if (status) {
            whereClause += ' AND n.status = ?';
            params.push(status);
        }
        
        if (email) {
            whereClause += ' AND n.email LIKE ?';
            params.push(`%${email}%`);
        }
        
        if (trackingNumber) {
            whereClause += ' AND n.tracking_number LIKE ?';
            params.push(`%${trackingNumber}%`);
        }
        
        const connection = await pool.getConnection();
        
        try {
            // 获取总数
            const [countResult] = await connection.execute(
                `SELECT COUNT(*) as total FROM notifications n WHERE ${whereClause}`,
                params
            );
            const total = countResult[0].total;
            
            // 获取分页数据
            const [notifications] = await connection.execute(
                `SELECT 
                    n.id,
                    n.tracking_number,
                    n.email,
                    n.notification_type,
                    n.trigger_condition,
                    n.status,
                    n.created_at,
                    n.updated_at,
                    u.user_type
                FROM notifications n
                LEFT JOIN users u ON n.user_id = u.id
                WHERE ${whereClause}
                ORDER BY n.created_at DESC
                LIMIT ${parseInt(pageSize)} OFFSET ${offset}`,
                params
            );
            
            res.json({
                success: true,
                data: {
                    notifications,
                    total,
                    page: parseInt(page),
                    pageSize: parseInt(pageSize),
                    totalPages: Math.ceil(total / pageSize)
                }
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('获取通知列表失败:', error.message);
        console.error('错误堆栈:', error.stack);
        res.status(500).json({ 
            success: false, 
            message: '获取通知列表失败',
            error: error.message
        });
    }
});

// 获取通知统计信息
router.get('/admin/stats', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        
        try {
            // 通知状态统计
            const [statusStats] = await connection.execute(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM notifications 
                GROUP BY status
            `);
            
            // 通知类型统计
            const [typeStats] = await connection.execute(`
                SELECT 
                    notification_type,
                    COUNT(*) as count
                FROM notifications 
                GROUP BY notification_type
            `);
            
            // 今日新增通知
            const [todayStats] = await connection.execute(`
                SELECT COUNT(*) as count
                FROM notifications 
                WHERE DATE(created_at) = CURDATE()
            `);
            
            // 活跃用户统计
            const [userStats] = await connection.execute(`
                SELECT COUNT(DISTINCT user_id) as count
                FROM notifications
                WHERE status = 'pending'
            `);
            
            res.json({
                success: true,
                data: {
                    statusStats,
                    typeStats,
                    todayCount: todayStats[0].count,
                    activeUsers: userStats[0].count
                }
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('获取通知统计失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '获取统计信息失败' 
        });
    }
});

// 更新通知状态
router.put('/admin/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        if (!['pending', 'sent', 'failed', 'cancelled'].includes(status)) {
            return res.status(400).json({ 
                success: false, 
                message: '无效的状态值' 
            });
        }
        
        const connection = await pool.getConnection();
        
        try {
            await connection.execute(
                'UPDATE notifications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [status, id]
            );
            
            res.json({
                success: true,
                message: '状态更新成功'
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('更新通知状态失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '更新状态失败' 
        });
    }
});

// 删除通知
router.delete('/admin/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const connection = await pool.getConnection();
        
        try {
            await connection.execute(
                'DELETE FROM notifications WHERE id = ?',
                [id]
            );
            
            res.json({
                success: true,
                message: '删除成功'
            });
            
        } finally {
            connection.release();
        }
        
    } catch (error) {
        console.error('删除通知失败:', error);
        res.status(500).json({ 
            success: false, 
            message: '删除失败' 
        });
    }
});

module.exports = router; 