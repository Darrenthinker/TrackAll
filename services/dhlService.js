const axios = require('axios');
const configService = require('./configService');

class DHLService {
    constructor() {
        // 支持多个DHL API端点
        this.apiEndpoints = [
            'https://api-eu.dhl.com/track/shipments',
            'https://api.dhl.com/track/shipments',
            'https://express.api.dhl.com/mydhlapi/shipments'
        ];
        
        // 默认配置，会被项目配置覆盖
        this.apiKey = process.env.DHL_API_KEY || 'demo-key';
        this.apiSecret = process.env.DHL_API_SECRET || 'demo-secret';
        this.timeout = 10000; // 10秒超时
    }

    // 获取认证头
    getAuthHeaders(projectId = null) {
        const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        return {
            'Authorization': `Basic ${auth}`,
            'DHL-API-Key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'TrackAll/1.0'
        };
    }

    // 动态获取项目配置
    async getProjectAuthHeaders(projectId) {
        if (!projectId) {
            return this.getAuthHeaders();
        }

        try {
            const config = await configService.getDHLConfig(projectId);
            const auth = Buffer.from(`${config.apiKey}:${config.apiSecret}`).toString('base64');
            return {
                'Authorization': `Basic ${auth}`,
                'DHL-API-Key': config.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'TrackAll/1.0'
            };
        } catch (error) {
            console.error('获取项目DHL配置失败:', error);
            return this.getAuthHeaders();
        }
    }

    // 尝试多个API端点
    async tryMultipleEndpoints(trackingNumber, projectId = null) {
        const headers = await this.getProjectAuthHeaders(projectId);
        let lastError = null;

        for (let i = 0; i < this.apiEndpoints.length; i++) {
            const endpoint = this.apiEndpoints[i];
            try {
                console.log(`尝试DHL端点 ${i + 1}/${this.apiEndpoints.length}: ${endpoint}`);
                
                const response = await axios.get(endpoint, {
                    headers: headers,
                    params: {
                        trackingNumber: trackingNumber
                    },
                    timeout: this.timeout,
                    validateStatus: (status) => status < 500 // 只有5xx才认为是错误
                });

                if (response.status === 200 && response.data) {
                    console.log(`DHL端点 ${endpoint} 成功响应`);
                    return response.data;
                } else if (response.status === 404) {
                    throw new Error('包裹号不存在');
                } else if (response.status === 401) {
                    throw new Error('API认证失败，请检查密钥配置');
                } else {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            } catch (error) {
                lastError = error;
                console.warn(`DHL端点 ${endpoint} 失败:`, error.message);
                
                if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                    console.warn('网络连接问题，尝试下一个端点...');
                    continue;
                } else if (error.response?.status === 401) {
                    console.error('API认证失败，停止尝试其他端点');
                    break;
                } else if (error.response?.status === 404) {
                    console.warn('包裹号不存在，尝试下一个端点...');
                    continue;
                }
            }
        }

        throw lastError || new Error('所有DHL端点都无法访问');
    }

    // 获取配置 - 支持从环境变量、数据库或默认配置获取
    async getConfig(projectId = null) {
        try {
            // 1. 尝试从环境变量获取
            if (process.env.DHL_API_KEY && process.env.DHL_API_SECRET) {
                return {
                    apiKey: process.env.DHL_API_KEY,
                    apiSecret: process.env.DHL_API_SECRET
                };
            }
            
            // 2. 生产环境备选配置（确保服务可用）
            if (process.env.NODE_ENV === 'production') {
                return {
                    apiKey: 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7',
                    apiSecret: '9yE31yUNHsE5hfYB'
                };
            }
            
            // 3. 尝试从数据库获取项目配置
            if (projectId) {
                const configService = require('./configService');
                const projectConfig = await configService.getProjectConfig(projectId, ['dhl_api_key', 'dhl_api_secret']);
                
                if (projectConfig.dhl_api_key && projectConfig.dhl_api_secret) {
                    return {
                        apiKey: projectConfig.dhl_api_key,
                        apiSecret: projectConfig.dhl_api_secret
                    };
                }
            }
            
            // 4. 使用默认配置
            return this.defaultConfig;
            
        } catch (error) {
            console.error('获取DHL配置失败:', error);
            // 生产环境下直接返回已知可用的配置
            if (process.env.NODE_ENV === 'production') {
                return {
                    apiKey: 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7',
                    apiSecret: '9yE31yUNHsE5hfYB'
                };
            }
            return this.defaultConfig;
        }
    }

    // 单个包裹追踪 - 支持重试机制
    async trackShipment(trackingNumber, projectId = null) {
        console.log(`开始追踪DHL包裹: ${trackingNumber}`);
        
        // 获取配置
        const config = await this.getConfig(projectId);
        if (!config.apiKey) {
            console.log('DHL API密钥未配置，返回模拟数据');
            return this.getMockTrackingData(trackingNumber);
        }

        // 尝试多个端点，每个端点都有重试机制
        for (let i = 0; i < this.apiEndpoints.length; i++) {
            const endpoint = this.apiEndpoints[i];
            console.log(`尝试DHL端点 ${i + 1}/${this.apiEndpoints.length}: ${endpoint}`);
            
            // 每个端点重试3次
            for (let retry = 0; retry < 3; retry++) {
                try {
                    const url = `${endpoint}?trackingNumber=${trackingNumber}`;
                    
                    const response = await axios.get(url, {
                        headers: {
                            'DHL-API-Key': config.apiKey,
                            'Accept': 'application/json',
                            'User-Agent': 'TrackAll-Production/1.0'
                        },
                        timeout: 10000
                    });

                    console.log(`DHL端点 ${endpoint} 成功响应`);
                    
                    if (response.data && response.data.shipments && response.data.shipments.length > 0) {
                        console.log(`DHL包裹 ${trackingNumber} 追踪成功`);
                        return {
                            success: true,
                            carrier: 'DHL',
                            trackingNumber,
                            data: this.formatTrackingData(response.data.shipments[0])
                        };
                    }
                    
                } catch (error) {
                    const status = error.response?.status;
                    const errorMsg = error.response?.data?.detail || error.message;
                    
                    console.log(`DHL端点 ${endpoint} 尝试 ${retry + 1}/3 失败: ${status} - ${errorMsg}`);
                    
                    // 429限流错误，等待后重试
                    if (status === 429) {
                        const waitTime = Math.pow(2, retry) * 1000; // 指数退避：1s, 2s, 4s
                        console.log(`遇到限流，等待 ${waitTime}ms 后重试...`);
                        await this.sleep(waitTime);
                        continue;
                    }
                    
                    // 404表示未找到，不需要重试其他端点
                    if (status === 404) {
                        console.log(`DHL包裹 ${trackingNumber} 未找到`);
                        break;
                    }
                    
                    // 500错误重试
                    if (status >= 500 && retry < 2) {
                        await this.sleep(1000 * (retry + 1));
                        continue;
                    }
                    
                    // 其他错误，尝试下一个端点
                    break;
                }
            }
        }
        
        // 所有端点都失败，返回17track作为备选
        console.log(`DHL API追踪失败，返回备选方案`);
        return {
            success: false,
            carrier: 'DHL',
            trackingNumber,
            message: 'DHL服务暂时不可用，建议使用17track',
            fallbackSuggestion: '17track'
        };
    }

    // 辅助方法 - 等待指定时间
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 验证DHL追踪号格式
    validateTrackingNumber(trackingNumber) {
        const patterns = [
            /^\d{10,12}$/,           // 数字格式
            /^[A-Z]{3}\d{9}$/,       // 3字母+9数字
            /^JD\d{11}$/,            // JD开头
            /^[0-9]{10,14}$/         // 10-14位数字
        ];
        
        return patterns.some(pattern => pattern.test(trackingNumber));
    }

    // 批量追踪包裹
    async trackMultipleShipments(trackingNumbers, projectId = null) {
        try {
            const promises = trackingNumbers.map(number => this.trackShipment(number, projectId));
            const results = await Promise.allSettled(promises);
            
            return results.map((result, index) => ({
                trackingNumber: trackingNumbers[index],
                success: result.status === 'fulfilled' && result.value.success,
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : 
                       (result.value && !result.value.success ? result.value.message : null)
            }));
        } catch (error) {
            console.error('批量追踪失败:', error);
            throw new Error('批量查询失败');
        }
    }

    // 格式化追踪数据
    formatTrackingData(rawData) {
        if (!rawData || !rawData.shipments || rawData.shipments.length === 0) {
            return {
                found: false,
                message: '未找到包裹信息'
            };
        }

        const shipment = rawData.shipments[0];
        const events = shipment.events || [];

        return {
            found: true,
            trackingNumber: shipment.id,
            status: this.getStatusInChinese(shipment.status),
            statusCode: shipment.status,
            service: shipment.service,
            origin: shipment.origin,
            destination: shipment.destination,
            estimatedDelivery: shipment.estimatedTimeOfDelivery,
            events: events.map(event => ({
                timestamp: event.timestamp,
                location: event.location,
                description: this.getEventDescription(event),
                statusCode: event.statusCode
            })).reverse() // 最新事件在前
        };
    }

    // 将DHL状态转换为中文
    getStatusInChinese(status) {
        const statusMap = {
            'pre-transit': '预处理中',
            'transit': '运输中',
            'delivered': '已投递',
            'exception': '异常',
            'unknown': '未知状态'
        };
        return statusMap[status] || status;
    }

    // 获取事件描述
    getEventDescription(event) {
        const descriptions = {
            'PU': '已揽收',
            'PL': '处理中',
            'DF': '离开处理中心',
            'AF': '到达处理中心',
            'WC': '清关中',
            'CC': '清关完成',
            'AR': '到达目的地',
            'OD': '派送中',
            'OK': '已投递',
            'UD': '投递失败',
            'RT': '退回'
        };
        return descriptions[event.statusCode] || event.description || '包裹状态更新';
    }

    // 检查API服务状态
    async checkServiceStatus(projectId = null) {
        try {
            // 使用一个测试单号检查API是否正常
            const testResult = await this.trackShipment('1234567890', projectId);
            if (testResult.success || testResult.message.includes('未找到')) {
                return { status: 'ok', message: 'DHL API服务正常' };
            } else {
                return { status: 'warning', message: testResult.message };
            }
        } catch (error) {
            return { status: 'error', message: `DHL API服务异常: ${error.message}` };
        }
    }
}

module.exports = new DHLService(); 