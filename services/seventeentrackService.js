const axios = require('axios');

class SeventeenTrackService {
    constructor() {
        this.baseURL = 'https://api.17track.net/track/v2.2';
        this.apiKey = process.env.SEVENTEENTRACK_API_KEY || 'demo-17track-key';
        this.timeout = 15000; // 15秒超时
    }

    // 追踪包裹 - 支持指定承运商
    async trackShipment(trackingNumber, carrier = '') {
        try {
            console.log(`开始使用17track追踪包裹: ${trackingNumber}, 承运商: ${carrier}`);
            
            // 先注册包裹号
            const registerResult = await this.registerPackage(trackingNumber, carrier);
            if (!registerResult.success) {
                return {
                    success: false,
                    carrier: '17track',
                    trackingNumber,
                    message: registerResult.message
                };
            }

            // 等待一下让系统处理
            await this.sleep(2000);

            // 获取追踪信息
            const trackResult = await this.getTrackingInfo(trackingNumber);
            
            if (trackResult.success) {
                console.log(`17track追踪 ${trackingNumber} 成功`);
                return {
                    success: true,
                    carrier: trackResult.data.carrier || '17track',
                    trackingNumber,
                    status: trackResult.data.status,
                    events: trackResult.data.events,
                    source: '17track'
                };
            } else {
                console.log(`17track追踪 ${trackingNumber} 未找到信息`);
                return {
                    success: false,
                    carrier: '17track',
                    trackingNumber,
                    message: trackResult.message
                };
            }
        } catch (error) {
            console.error('17track追踪失败:', error.message);
            return {
                success: false,
                carrier: '17track',
                trackingNumber,
                message: `17track追踪失败: ${error.message}`
            };
        }
    }

    // 注册包裹号到17track系统
    async registerPackage(trackingNumber, carrier = '') {
        try {
            const payload = {
                number: trackingNumber
            };

            // 如果指定了承运商，添加到请求中
            if (carrier) {
                payload.carrier = this.mapCarrierCode(carrier);
            }

            const response = await axios.post(
                `${this.baseURL}/register`,
                [payload], // 17track API需要数组格式
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TrackAll/1.0'
                    },
                    timeout: this.timeout
                }
            );

            if (response.data && response.data.code === 0) {
                return { success: true, message: '注册成功' };
            } else {
                return { 
                    success: false, 
                    message: response.data?.data?.error || '注册失败'
                };
            }
        } catch (error) {
            console.error('17track注册包裹失败:', error.response?.data || error.message);
            return { 
                success: false, 
                message: `注册失败: ${error.message}`
            };
        }
    }

    // 获取追踪信息
    async getTrackingInfo(trackingNumber) {
        try {
            const response = await axios.post(
                `${this.baseURL}/gettrackinfo`,
                [{ number: trackingNumber }],
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TrackAll/1.0'
                    },
                    timeout: this.timeout
                }
            );

            if (response.data && response.data.code === 0 && response.data.data && response.data.data.length > 0) {
                const trackInfo = response.data.data[0];
                return {
                    success: true,
                    data: this.formatTrackingData(trackInfo)
                };
            } else {
                return {
                    success: false,
                    message: '未找到追踪信息'
                };
            }
        } catch (error) {
            console.error('17track获取追踪信息失败:', error.response?.data || error.message);
            return {
                success: false,
                message: `获取追踪信息失败: ${error.message}`
            };
        }
    }

    // 格式化追踪数据
    formatTrackingData(trackInfo) {
        const events = [];
        
        if (trackInfo.track && trackInfo.track.z0) {
            trackInfo.track.z0.forEach(event => {
                events.push({
                    timestamp: this.formatDate(event.a),
                    location: event.c || '',
                    description: event.z || '状态更新',
                    statusCode: event.b || ''
                });
            });
        }

        return {
            carrier: this.getCarrierName(trackInfo.carrier),
            status: this.getStatusInChinese(trackInfo.track?.e || 'unknown'),
            events: events.reverse() // 最新事件在前
        };
    }

    // 映射承运商代码
    mapCarrierCode(carrier) {
        const carrierMap = {
            'dhl': 'dhl',
            'ups': 'ups',
            'fedex': 'fedex',
            'tnt': 'tnt',
            'usps': 'usps',
            'ems': 'ems',
            'china-post': 'china-post'
        };
        return carrierMap[carrier.toLowerCase()] || carrier;
    }

    // 获取承运商名称
    getCarrierName(carrierCode) {
        const carrierNames = {
            'dhl': 'DHL',
            'ups': 'UPS',
            'fedex': 'FedEx',
            'tnt': 'TNT',
            'usps': 'USPS',
            'ems': 'EMS',
            'china-post': 'China Post'
        };
        return carrierNames[carrierCode] || carrierCode;
    }

    // 将状态转换为中文
    getStatusInChinese(status) {
        const statusMap = {
            'NotFound': '查询不到',
            'InTransit': '运输中',
            'InfoReceived': '信息已接收',
            'PickUp': '已揽收',
            'Delivered': '已投递',
            'Exception': '异常',
            'Expired': '过期',
            'Undelivered': '投递失败'
        };
        return statusMap[status] || '未知状态';
    }

    // 格式化日期
    formatDate(timestamp) {
        if (!timestamp) return '';
        try {
            return new Date(timestamp * 1000).toISOString();
        } catch (error) {
            return '';
        }
    }

    // 睡眠函数
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 批量追踪
    async trackMultipleShipments(trackingNumbers, carrier = '') {
        try {
            console.log(`17track批量追踪 ${trackingNumbers.length} 个包裹`);
            
            // 先批量注册
            const registerPayload = trackingNumbers.map(number => ({
                number: number,
                carrier: carrier ? this.mapCarrierCode(carrier) : ''
            }));

            await axios.post(
                `${this.baseURL}/register`,
                registerPayload,
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TrackAll/1.0'
                    },
                    timeout: this.timeout
                }
            );

            // 等待处理
            await this.sleep(3000);

            // 批量获取追踪信息
            const trackPayload = trackingNumbers.map(number => ({ number }));
            const response = await axios.post(
                `${this.baseURL}/gettrackinfo`,
                trackPayload,
                {
                    headers: {
                        '17token': this.apiKey,
                        'Content-Type': 'application/json',
                        'User-Agent': 'TrackAll/1.0'
                    },
                    timeout: this.timeout
                }
            );

            const results = [];
            if (response.data && response.data.code === 0 && response.data.data) {
                response.data.data.forEach((trackInfo, index) => {
                    const trackingNumber = trackingNumbers[index];
                    
                    if (trackInfo && trackInfo.track) {
                        results.push({
                            success: true,
                            carrier: this.getCarrierName(trackInfo.carrier),
                            trackingNumber,
                            data: this.formatTrackingData(trackInfo)
                        });
                    } else {
                        results.push({
                            success: false,
                            carrier: '17track',
                            trackingNumber,
                            message: '未找到追踪信息'
                        });
                    }
                });
            } else {
                // 如果批量请求失败，返回所有失败结果
                trackingNumbers.forEach(number => {
                    results.push({
                        success: false,
                        carrier: '17track',
                        trackingNumber: number,
                        message: '批量查询失败'
                    });
                });
            }

            return results;
        } catch (error) {
            console.error('17track批量追踪失败:', error.response?.data || error.message);
            return trackingNumbers.map(number => ({
                success: false,
                carrier: '17track',
                trackingNumber: number,
                message: `批量查询失败: ${error.message}`
            }));
        }
    }

    // 检查API状态
    async checkServiceStatus() {
        try {
            const testResult = await this.trackShipment('test123456789');
            if (testResult.success || testResult.message.includes('未找到')) {
                return { status: 'ok', message: '17track API服务正常' };
            } else {
                return { status: 'warning', message: testResult.message };
            }
        } catch (error) {
            return { status: 'error', message: `17track API服务异常: ${error.message}` };
        }
    }
}

module.exports = new SeventeenTrackService(); 