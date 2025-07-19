const axios = require('axios');

class FedExService {
    constructor() {
        this.baseURL = process.env.FEDEX_API_BASE_URL || 'https://apis.fedex.com';
        this.sandboxURL = 'https://apis-sandbox.fedex.com';
        this.apiKey = process.env.FEDEX_API_KEY;
        this.secretKey = process.env.FEDEX_SECRET_KEY;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    // 获取OAuth 2.0 Access Token
    async getAccessToken() {
        try {
            // 检查现有token是否有效
            if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
                return this.accessToken;
            }

            const response = await axios.post(`${this.baseURL}/oauth/token`, {
                grant_type: 'client_credentials',
                client_id: this.apiKey,
                client_secret: this.secretKey
            }, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            this.accessToken = response.data.access_token;
            // Token通常有效期1小时，提前5分钟刷新
            this.tokenExpiry = Date.now() + (response.data.expires_in - 300) * 1000;
            
            return this.accessToken;
        } catch (error) {
            console.error('FedEx OAuth认证失败:', error.response?.data || error.message);
            throw new Error('FedEx API认证失败');
        }
    }

    // 追踪包裹
    async trackShipment(trackingNumber) {
        try {
            const accessToken = await this.getAccessToken();
            
            const response = await axios.post(`${this.baseURL}/track/v1/trackingnumbers`, {
                includeDetailedScans: true,
                trackingInfo: [
                    {
                        trackingNumberInfo: {
                            trackingNumber: trackingNumber
                        }
                    }
                ]
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-locale': 'en_US',
                    'Content-Type': 'application/json'
                }
            });

            return this.formatTrackingResponse(response.data);
        } catch (error) {
            console.error('FedEx追踪查询失败:', error.response?.data || error.message);
            
            if (error.response?.status === 401) {
                // Token过期，重新获取
                this.accessToken = null;
                this.tokenExpiry = null;
                return this.trackShipment(trackingNumber);
            }
            
            return this.handleTrackingError(error, trackingNumber);
        }
    }

    // 格式化追踪响应
    formatTrackingResponse(data) {
        try {
            const output = data.output;
            if (!output || !output.completeTrackResults || output.completeTrackResults.length === 0) {
                return {
                    status: 'not_found',
                    message: '未找到追踪信息',
                    carrier: 'FedEx'
                };
            }

            const trackResult = output.completeTrackResults[0];
            const trackResults = trackResult.trackResults;
            
            if (!trackResults || trackResults.length === 0) {
                return {
                    status: 'not_found',
                    message: '未找到追踪信息',
                    carrier: 'FedEx'
                };
            }

            const result = trackResults[0];
            const latestStatus = result.latestStatusDetail;
            const scanEvents = result.scanEvents || [];

            return {
                status: 'success',
                carrier: 'FedEx',
                trackingNumber: result.trackingNumberInfo.trackingNumber,
                currentStatus: {
                    status: latestStatus?.description || '状态未知',
                    statusCode: latestStatus?.code || '',
                    location: latestStatus?.scanLocation?.city || '',
                    dateTime: latestStatus?.dateAndTime || '',
                    description: latestStatus?.description || ''
                },
                shipmentDetails: {
                    service: result.serviceDetail?.description || '',
                    packageCount: result.packageCount || 1,
                    weight: result.packageDetails?.[0]?.weight || '',
                    dimensions: result.packageDetails?.[0]?.dimensions || null,
                    shipper: result.shipperInformation || null,
                    recipient: result.recipientInformation || null
                },
                deliveryDetails: {
                    estimatedDelivery: result.estimatedDeliveryTimeWindow?.window?.begins || '',
                    actualDelivery: result.actualDeliveryTimestamp || '',
                    deliveryLocation: result.deliveryDetails?.locationType || '',
                    signedBy: result.deliveryDetails?.receivedByName || ''
                },
                trackingEvents: scanEvents.map(event => ({
                    dateTime: event.date,
                    status: event.eventDescription,
                    location: `${event.scanLocation?.city || ''}, ${event.scanLocation?.stateOrProvinceCode || ''} ${event.scanLocation?.countryCode || ''}`.trim(),
                    description: event.eventDescription || ''
                })).reverse() // 最新事件在前
            };
        } catch (error) {
            console.error('FedEx响应格式化错误:', error);
            return {
                status: 'error',
                message: '数据解析失败',
                carrier: 'FedEx'
            };
        }
    }

    // 处理追踪错误
    handleTrackingError(error, trackingNumber) {
        const errorCode = error.response?.data?.errors?.[0]?.code;
        const errorMessage = error.response?.data?.errors?.[0]?.message;

        switch (errorCode) {
            case 'TRACKING.TRACKINGNUMBER.NOTFOUND':
                return {
                    status: 'not_found',
                    message: '追踪号不存在',
                    carrier: 'FedEx',
                    trackingNumber
                };
            case 'TRACKING.TRACKINGNUMBER.INVALID':
                return {
                    status: 'invalid',
                    message: '无效的追踪号格式',
                    carrier: 'FedEx',
                    trackingNumber
                };
            default:
                return {
                    status: 'error',
                    message: errorMessage || 'FedEx API服务异常',
                    carrier: 'FedEx',
                    trackingNumber
                };
        }
    }

    // 批量追踪
    async trackMultipleShipments(trackingNumbers) {
        try {
            const accessToken = await this.getAccessToken();
            
            const trackingInfo = trackingNumbers.map(number => ({
                trackingNumberInfo: {
                    trackingNumber: number
                }
            }));

            const response = await axios.post(`${this.baseURL}/track/v1/trackingnumbers`, {
                includeDetailedScans: true,
                trackingInfo: trackingInfo
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'X-locale': 'en_US',
                    'Content-Type': 'application/json'
                }
            });

            // 处理批量响应
            const results = [];
            const output = response.data.output;
            
            if (output && output.completeTrackResults) {
                for (const trackResult of output.completeTrackResults) {
                    if (trackResult.trackResults && trackResult.trackResults.length > 0) {
                        results.push(this.formatTrackingResponse({ output: { completeTrackResults: [trackResult] } }));
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('FedEx批量追踪失败:', error.response?.data || error.message);
            return trackingNumbers.map(number => ({
                status: 'error',
                message: 'FedEx API服务异常',
                carrier: 'FedEx',
                trackingNumber: number
            }));
        }
    }

    // 验证追踪号格式
    validateTrackingNumber(trackingNumber) {
        // FedEx追踪号格式验证
        const patterns = [
            /^\d{12}$/, // 12位数字
            /^\d{14}$/, // 14位数字
            /^\d{15}$/, // 15位数字
            /^\d{20}$/, // 20位数字
            /^[0-9]{4}\s?[0-9]{4}\s?[0-9]{4}$/, // 12位数字（可能有空格）
            /^[0-9]{22}$/, // 22位数字（FedEx Ground）
        ];

        return patterns.some(pattern => pattern.test(trackingNumber.replace(/\s/g, '')));
    }

    // 获取服务状态
    async getServiceStatus() {
        try {
            const accessToken = await this.getAccessToken();
            return {
                status: 'operational',
                message: 'FedEx API服务正常',
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                status: 'error',
                message: 'FedEx API服务异常',
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = new FedExService(); 