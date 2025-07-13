const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        // 配置邮件传输器 (使用Gmail为例)
        this.transporter = nodemailer.createTransporter({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
    }

    // 发送追踪更新邮件
    async sendTrackingUpdate(email, trackingData) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            console.log('邮件服务未配置，跳过发送');
            return { success: false, message: '邮件服务未配置' };
        }

        try {
            const latestEvent = trackingData.events[0];
            const statusEmoji = this.getStatusEmoji(trackingData.status);

            const mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: `${statusEmoji} 包裹追踪更新 - ${trackingData.trackingNumber}`,
                html: this.generateTrackingHTML(trackingData)
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('邮件发送成功:', info.messageId);
            
            return { 
                success: true, 
                messageId: info.messageId,
                message: '邮件发送成功'
            };

        } catch (error) {
            console.error('邮件发送失败:', error);
            return { 
                success: false, 
                error: error.message,
                message: '邮件发送失败'
            };
        }
    }

    // 生成追踪邮件HTML内容
    generateTrackingHTML(trackingData) {
        const statusColor = this.getStatusColor(trackingData.status);
        const statusEmoji = this.getStatusEmoji(trackingData.status);

        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .status-badge { 
                    background: ${statusColor}; 
                    color: white; 
                    padding: 8px 16px; 
                    border-radius: 20px; 
                    display: inline-block; 
                    margin: 10px 0; 
                }
                .tracking-info { 
                    background: #f8f9fa; 
                    padding: 15px; 
                    border-radius: 8px; 
                    margin: 15px 0; 
                }
                .event { 
                    border-left: 3px solid #667eea; 
                    padding: 10px 15px; 
                    margin: 10px 0; 
                    background: #f8f9fa; 
                }
                .timestamp { color: #666; font-size: 14px; }
                .location { font-weight: bold; color: #333; }
                .description { margin-top: 5px; }
                .footer { 
                    text-align: center; 
                    color: #666; 
                    font-size: 12px; 
                    margin-top: 20px; 
                    padding: 20px; 
                    border-top: 1px solid #eee; 
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>${statusEmoji} 包裹追踪更新</h1>
                    <p>您的包裹状态已更新</p>
                </div>
                
                <div class="content">
                    <div class="tracking-info">
                        <h3>追踪信息</h3>
                        <p><strong>承运商:</strong> ${trackingData.carrier}</p>
                        <p><strong>追踪单号:</strong> ${trackingData.trackingNumber}</p>
                        <div class="status-badge">${trackingData.status}</div>
                    </div>

                    <h3>最新动态</h3>
                    ${trackingData.events.map(event => `
                        <div class="event">
                            <div class="timestamp">${new Date(event.timestamp).toLocaleString('zh-CN')}</div>
                            <div class="location">${event.location}</div>
                            <div class="description">${event.description}</div>
                        </div>
                    `).join('')}
                </div>

                <div class="footer">
                    <p>此邮件由全球物流追踪系统自动发送</p>
                    <p>如不希望收到此类邮件，请联系客服</p>
                </div>
            </div>
        </body>
        </html>
        `;
    }

    // 获取状态对应的颜色
    getStatusColor(status) {
        const colorMap = {
            'Delivered': '#28a745',
            'In Transit': '#007bff',
            'Picked Up': '#ffc107',
            'At Warehouse': '#6c757d',
            'Arrived': '#17a2b8'
        };
        return colorMap[status] || '#007bff';
    }

    // 获取状态对应的emoji
    getStatusEmoji(status) {
        const emojiMap = {
            'Delivered': '✅',
            'In Transit': '🚚',
            'Picked Up': '📦',
            'At Warehouse': '🏢',
            'Arrived': '✈️'
        };
        return emojiMap[status] || '📦';
    }

    // 发送注册确认邮件
    async sendSubscriptionConfirmation(email, trackingNumber) {
        if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
            return { success: false, message: '邮件服务未配置' };
        }

        try {
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: email,
                subject: '📧 追踪通知订阅确认',
                html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
                        <h1>📧 订阅确认</h1>
                    </div>
                    <div style="padding: 20px;">
                        <p>您好！</p>
                        <p>您已成功订阅追踪单号 <strong>${trackingNumber}</strong> 的状态更新通知。</p>
                        <p>当包裹状态发生变化时，我们会及时向您发送邮件通知。</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                            <p><strong>追踪单号:</strong> ${trackingNumber}</p>
                            <p><strong>通知邮箱:</strong> ${email}</p>
                        </div>
                        <p>感谢您使用我们的追踪服务！</p>
                    </div>
                    <div style="text-align: center; color: #666; font-size: 12px; margin-top: 20px; padding: 20px; border-top: 1px solid #eee;">
                        <p>全球物流追踪系统</p>
                    </div>
                </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            return { success: true, messageId: info.messageId };

        } catch (error) {
            console.error('订阅确认邮件发送失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 测试邮件配置
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('邮件服务器连接成功');
            return { success: true, message: '邮件服务器连接成功' };
        } catch (error) {
            console.error('邮件服务器连接失败:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = new EmailService(); 