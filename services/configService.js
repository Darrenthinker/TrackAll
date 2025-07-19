const { sequelize } = require('../config/database');

class ConfigService {
    constructor() {
        this.configCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5分钟缓存
    }

    // 获取项目配置
    async getProjectConfig(projectId, configKey) {
        const cacheKey = `${projectId}_${configKey}`;
        
        // 检查缓存
        if (this.configCache.has(cacheKey)) {
            const cached = this.configCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.value;
            }
        }

        try {
            const [results] = await sequelize.query(
                'SELECT config_value FROM project_configs WHERE project_id = ? AND config_key = ?',
                {
                    replacements: [projectId, configKey],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            const value = results && results.length > 0 ? results[0].config_value : null;
            
            // 更新缓存
            this.configCache.set(cacheKey, {
                value: value,
                timestamp: Date.now()
            });

            return value;
        } catch (error) {
            console.error('获取项目配置失败:', error);
            return null;
        }
    }

    // 获取多个配置
    async getProjectConfigs(projectId, configKeys) {
        const configs = {};
        for (const key of configKeys) {
            configs[key] = await this.getProjectConfig(projectId, key);
        }
        return configs;
    }

    // 获取DHL配置
    async getDHLConfig(projectId) {
        const [apiKey, apiSecret] = await Promise.all([
            this.getProjectConfig(projectId, 'dhl_api_key'),
            this.getProjectConfig(projectId, 'dhl_api_secret')
        ]);

        return {
            apiKey: apiKey || 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7',
            apiSecret: apiSecret || '9yE31yUNHsE5hfYB'
        };
    }

    // 更新项目配置
    async updateProjectConfig(projectId, configKey, configValue, description = '') {
        try {
            await sequelize.query(
                `INSERT INTO project_configs (project_id, config_key, config_value, description) 
                 VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE config_value = VALUES(config_value), description = VALUES(description)`,
                {
                    replacements: [projectId, configKey, configValue, description]
                }
            );

            // 清除缓存
            const cacheKey = `${projectId}_${configKey}`;
            this.configCache.delete(cacheKey);

            return true;
        } catch (error) {
            console.error('更新项目配置失败:', error);
            return false;
        }
    }

    // 获取全局配置
    async getGlobalConfig(configKey) {
        try {
            const [results] = await sequelize.query(
                'SELECT setting_value FROM system_settings WHERE project_id IS NULL AND setting_key = ?',
                {
                    replacements: [configKey],
                    type: sequelize.QueryTypes.SELECT
                }
            );

            return results && results.length > 0 ? results[0].setting_value : null;
        } catch (error) {
            console.error('获取全局配置失败:', error);
            return null;
        }
    }

    // 清除缓存
    clearCache() {
        this.configCache.clear();
    }
}

module.exports = new ConfigService(); 