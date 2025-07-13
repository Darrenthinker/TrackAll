-- 追踪网站数据库表结构
-- 数据库: tracking_system

-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    user_type ENUM('regular', 'vip', 'admin') DEFAULT 'regular',
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 查询记录表
CREATE TABLE query_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    query_result ENUM('success', 'failed', 'not_found') NOT NULL,
    response_time INT NOT NULL COMMENT '响应时间(毫秒)',
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_carrier (carrier),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- 通知套餐表
CREATE TABLE notification_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    notification_count INT NOT NULL COMMENT '通知次数',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active)
);

-- 用户套餐购买记录
CREATE TABLE user_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    total_count INT NOT NULL COMMENT '总购买次数',
    used_count INT DEFAULT 0 COMMENT '已使用次数',
    remaining_count INT NOT NULL COMMENT '剩余次数',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES notification_packages(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_package_id (package_id),
    INDEX idx_purchased_at (purchased_at)
);

-- 通知记录表
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notification_type ENUM('pickup', 'transit', 'customs', 'delivery', 'delivered', 'exception') NOT NULL,
    trigger_condition TEXT NOT NULL COMMENT '触发条件',
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 通知发送日志
CREATE TABLE notification_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    notification_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    send_channel ENUM('email', 'sms', 'wechat') NOT NULL,
    send_status ENUM('success', 'failed', 'retry') NOT NULL,
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT NULL,
    
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notification_id (notification_id),
    INDEX idx_user_id (user_id),
    INDEX idx_send_status (send_status),
    INDEX idx_send_time (send_time)
);

-- 套餐购买订单表
CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    order_no VARCHAR(32) UNIQUE NOT NULL,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    package_name VARCHAR(100) NOT NULL,
    notification_count INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method ENUM('wechat', 'alipay', 'bank_card') NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
    paid_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES notification_packages(id) ON DELETE CASCADE,
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- 系统配置表
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key)
);

-- 管理员操作日志
CREATE TABLE admin_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL COMMENT '操作对象类型',
    target_id BIGINT NOT NULL COMMENT '操作对象ID',
    description TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_target_type (target_type),
    INDEX idx_created_at (created_at)
);

-- 插入初始数据
INSERT INTO notification_packages (name, description, notification_count, price) VALUES
('基础套餐', '300次通知，永久有效', 300, 0.00),
('标准套餐', '800次通知，永久有效', 800, 0.00),
('高级套餐', '1800次通知，永久有效', 1800, 0.00),
('企业套餐', '5000次通知，永久有效', 5000, 0.00);

INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('dhl_api_key', '', 'DHL API密钥'),
('ups_client_id', '', 'UPS客户端ID'),
('ups_client_secret', '', 'UPS客户端密钥'),
('fedex_api_key', '', 'FedEx API密钥'),
('email_service', 'sendgrid', '邮件服务商'),
('sms_service', 'aliyun', '短信服务商'),
('free_notification_limit', '10', '每月免费通知次数'),
('max_tracking_per_query', '40', '每次查询最大追踪号数量');

-- 创建管理员用户
INSERT INTO users (email, password_hash, user_type) VALUES
('admin@example.com', '$2b$10$example_hash', 'admin'); 