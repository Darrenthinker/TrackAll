-- 追踪网站数据库表结构
-- 数据库: tracking_system

-- 项目表
CREATE TABLE projects (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    slug VARCHAR(50) UNIQUE NOT NULL COMMENT '项目标识符',
    description TEXT COMMENT '项目描述',
    domain VARCHAR(255) COMMENT '项目域名',
    port INT COMMENT '项目端口号',
    status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 项目配置表
CREATE TABLE project_configs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    config_key VARCHAR(100) NOT NULL,
    config_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_config (project_id, config_key),
    INDEX idx_project_id (project_id),
    INDEX idx_config_key (config_key)
);

-- 项目用户关联表
CREATE TABLE project_users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    role ENUM('owner', 'admin', 'user') DEFAULT 'user',
    permissions JSON COMMENT '用户在该项目的权限',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_user (project_id, user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_role (role)
);

-- 用户表
CREATE TABLE users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active',
    user_type ENUM('regular', 'vip', 'admin', 'super_admin') DEFAULT 'regular',
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 查询记录表
CREATE TABLE query_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    carrier VARCHAR(100) NOT NULL,
    query_result ENUM('success', 'failed', 'not_found') NOT NULL,
    response_time INT NOT NULL COMMENT '响应时间(毫秒)',
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_carrier (carrier),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- 通知套餐表
CREATE TABLE notification_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    notification_count INT NOT NULL COMMENT '通知次数',
    price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_is_active (is_active)
);

-- 用户套餐购买记录
CREATE TABLE user_packages (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    package_id BIGINT NOT NULL,
    total_count INT NOT NULL COMMENT '总购买次数',
    used_count INT DEFAULT 0 COMMENT '已使用次数',
    remaining_count INT NOT NULL COMMENT '剩余次数',
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES notification_packages(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_package_id (package_id),
    INDEX idx_purchased_at (purchased_at)
);

-- 通知记录表
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notification_type ENUM('pickup', 'transit', 'customs', 'delivery', 'delivered', 'exception') NOT NULL,
    trigger_condition TEXT NOT NULL COMMENT '触发条件',
    status ENUM('pending', 'sent', 'failed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_user_id (user_id),
    INDEX idx_tracking_number (tracking_number),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- 通知发送日志
CREATE TABLE notification_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
    notification_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    tracking_number VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    send_channel ENUM('email', 'sms', 'wechat') NOT NULL,
    send_status ENUM('success', 'failed', 'retry') NOT NULL,
    send_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT NULL,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_notification_id (notification_id),
    INDEX idx_user_id (user_id),
    INDEX idx_send_status (send_status),
    INDEX idx_send_time (send_time)
);

-- 套餐购买订单表
CREATE TABLE purchase_orders (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NOT NULL,
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
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES notification_packages(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_order_no (order_no),
    INDEX idx_user_id (user_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_created_at (created_at)
);

-- 系统配置表
CREATE TABLE system_settings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NULL COMMENT 'NULL表示全局配置',
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    UNIQUE KEY unique_project_setting (project_id, setting_key),
    INDEX idx_project_id (project_id),
    INDEX idx_setting_key (setting_key)
);

-- 管理员操作日志
CREATE TABLE admin_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    project_id BIGINT NULL COMMENT 'NULL表示全局操作',
    admin_id BIGINT NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL COMMENT '操作对象类型',
    target_id BIGINT NOT NULL COMMENT '操作对象ID',
    description TEXT,
    ip_address VARCHAR(45) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_project_id (project_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_target_type (target_type),
    INDEX idx_created_at (created_at)
);

-- 插入初始数据
INSERT INTO projects (name, slug, description, domain, port, status) VALUES
('TrackAll 追踪系统', 'trackall', '智能货运报价系统', 'localhost', 3000, 'active'),
('示例项目1', 'project1', '示例项目描述', 'localhost', 3001, 'active'),
('示例项目2', 'project2', '示例项目描述', 'localhost', 3002, 'active');

-- 为每个项目插入基础套餐
INSERT INTO notification_packages (project_id, name, description, notification_count, price) VALUES
(1, '基础套餐', '300次通知，永久有效', 300, 0.00),
(1, '标准套餐', '800次通知，永久有效', 800, 0.00),
(1, '高级套餐', '1800次通知，永久有效', 1800, 0.00),
(1, '企业套餐', '5000次通知，永久有效', 5000, 0.00),
(2, '基础套餐', '300次通知，永久有效', 300, 0.00),
(2, '标准套餐', '800次通知，永久有效', 800, 0.00),
(3, '基础套餐', '300次通知，永久有效', 300, 0.00),
(3, '标准套餐', '800次通知，永久有效', 800, 0.00);

-- 插入项目配置
INSERT INTO project_configs (project_id, config_key, config_value, description) VALUES
(1, 'dhl_api_key', '', 'DHL API密钥'),
(1, 'ups_client_id', '', 'UPS客户端ID'),
(1, 'ups_client_secret', '', 'UPS客户端密钥'),
(1, 'fedex_api_key', '', 'FedEx API密钥'),
(1, 'email_service', 'sendgrid', '邮件服务商'),
(1, 'sms_service', 'aliyun', '短信服务商'),
(1, 'free_notification_limit', '10', '每月免费通知次数'),
(1, 'max_tracking_per_query', '40', '每次查询最大追踪号数量'),
(2, 'dhl_api_key', '', 'DHL API密钥'),
(2, 'email_service', 'sendgrid', '邮件服务商'),
(3, 'dhl_api_key', '', 'DHL API密钥'),
(3, 'email_service', 'sendgrid', '邮件服务商');

-- 插入全局系统配置
INSERT INTO system_settings (project_id, setting_key, setting_value, description) VALUES
(NULL, 'default_project', '1', '默认项目ID'),
(NULL, 'max_projects_per_user', '5', '每个用户最大项目数'),
(NULL, 'system_name', '多项目管理系统', '系统名称'),
(NULL, 'admin_email', 'admin@example.com', '管理员邮箱');

-- 创建超级管理员用户
INSERT INTO users (email, password_hash, user_type) VALUES
('admin@example.com', '$2b$10$example_hash', 'super_admin');

-- 为超级管理员分配所有项目权限
INSERT INTO project_users (project_id, user_id, role) VALUES
(1, 1, 'owner'),
(2, 1, 'owner'),
(3, 1, 'owner'); 