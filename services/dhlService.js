const axios = require('axios');
const configService = require('./configService');

class DHLService {
    constructor() {
        this.baseURL = 'https://api-eu.dhl.com/track/shipments';
        // 默认配置，会被项目配置覆盖
        this.apiKey = process.env.DHL_API_KEY || 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7';
        this.apiSecret = process.env.DHL_API_SECRET || '9yE31yUNHsE5hfYB';
    }

    // 获取认证头
    getAuthHeaders(projectId = null) {
        const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        return {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
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
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            };
        } catch (error) {
            console.error('获取项目DHL配置失败:', error);
            return this.getAuthHeaders();
        }
    }

    // 追踪单个包裹
    async trackShipment(trackingNumber, projectId = null) {
        try {
            const headers = await this.getProjectAuthHeaders(projectId);
            
            const response = await axios.get(`${this.baseURL}`, {
                headers: headers,
                params: {
                    trackingNumber: trackingNumber
                }
            });

            return this.formatTrackingData(response.data);
        } catch (error) {
            console.error('DHL API调用失败:', error.response?.data || error.message);
            throw new Error('查询DHL包裹信息失败');
        }
    }

    // 批量追踪包裹
    async trackMultipleShipments(trackingNumbers, projectId = null) {
        try {
            const promises = trackingNumbers.map(number => this.trackShipment(number, projectId));
            const results = await Promise.allSettled(promises);
            
            return results.map((result, index) => ({
                trackingNumber: trackingNumbers[index],
                success: result.status === 'fulfilled',
                data: result.status === 'fulfilled' ? result.value : null,
                error: result.status === 'rejected' ? result.reason.message : null
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
            await this.trackShipment('1234567890', projectId);
            return { status: 'ok', message: 'DHL API服务正常' };
        } catch (error) {
            return { status: 'error', message: 'DHL API服务异常' };
        }
    }
}

module.exports = new DHLService(); 