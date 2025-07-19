-- 更新DHL API配置
-- 为所有项目设置DHL API密钥

UPDATE project_configs 
SET config_value = 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7' 
WHERE config_key = 'dhl_api_key';

-- 添加DHL API Secret配置
INSERT INTO project_configs (project_id, config_key, config_value, description) VALUES
(1, 'dhl_api_secret', '9yE31yUNHsE5hfYB', 'DHL API密钥'),
(2, 'dhl_api_secret', '9yE31yUNHsE5hfYB', 'DHL API密钥'),
(3, 'dhl_api_secret', '9yE31yUNHsE5hfYB', 'DHL API密钥')
ON DUPLICATE KEY UPDATE config_value = VALUES(config_value);

-- 验证更新结果
SELECT project_id, config_key, config_value, description 
FROM project_configs 
WHERE config_key LIKE 'dhl_api%'; 