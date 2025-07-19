const axios = require('axios');

class SeventeenTrackService {
    constructor() {
        this.baseURL = 'https://api.17track.net/track/v2.2';
        this.apiKey = process.env.SEVENTEENTRACK_API_KEY || 'D5D021BFC8A9F142EFE33A2E3EDD247C';
    }

    // 单号追踪
    async trackPackage(trackingNumber, carrier = '') {
        try {
            const response = await axios.post(
                `${this.baseURL}/register`,
                {
                    number: trackingNumber,
                    carrier: carrier
                },
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return this.formatResponse(response.data);
        } catch (error) {
            console.error('17track API错误:', error.response?.data || error.message);
            return { status: 'error', message: '查询失败', carrier: '17track', trackingNumber };
        }
    }

    // 格式化响应
    formatResponse(data) {
        if (!data || !data.data || !data.data[0]) {
            return { status: 'not_found', message: '未找到追踪信息', carrier: '17track' };
        }
        const info = data.data[0];
        return {
            status: info.status || 'unknown',
            carrier: info.carrier_code || '17track',
            trackingNumber: info.number,
            currentStatus: info.status_info || '',
            events: info.events || []
        };
    }

    // 批量追踪
    async trackMultiplePackages(trackingNumbers) {
        try {
            const response = await axios.post(
                `${this.baseURL}/register`,
                trackingNumbers.map(number => ({ number })),
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return (response.data.data || []).map(this.formatResponse);
        } catch (error) {
            console.error('17track 批量API错误:', error.response?.data || error.message);
            return trackingNumbers.map(number => ({ status: 'error', message: '查询失败', carrier: '17track', trackingNumber: number }));
        }
    }
}

module.exports = new SeventeenTrackService(); 