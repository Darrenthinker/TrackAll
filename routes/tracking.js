const express = require('express');
const axios = require('axios');
const router = express.Router();

// 追踪服务类
class TrackingService {
    constructor() {
        this.carriers = {
            // 快递公司
            'dhl': {
                name: 'DHL',
                pattern: /^(\d{10,11}|[A-Z]{3}\d{9})$/,
                track: this.trackDHL.bind(this)
            },
            'ups': {
                name: 'UPS',
                pattern: /^1Z[A-Z0-9]{16}$/,
                track: this.trackUPS.bind(this)
            },
            'fedex': {
                name: 'FedEx',
                pattern: /^(\d{12}|\d{14})$/,
                track: this.trackFedEx.bind(this)
            },
            // IATA航司 (示例)
            'ca': {
                name: '中国国际航空 (Air China)',
                pattern: /^999-\d{8}$/,
                track: this.trackAirChina.bind(this)
            },
            'mh': {
                name: '马来西亚航空 (Malaysia Airlines)',
                pattern: /^232-\d{8}$/,
                track: this.trackMalaysiaAirlines.bind(this)
            }
        };
    }

    // 自动识别承运商
    detectCarrier(trackingNumber) {
        const cleanNumber = trackingNumber.replace(/\s+/g, '').toUpperCase();
        
        for (const [code, carrier] of Object.entries(this.carriers)) {
            if (carrier.pattern.test(cleanNumber)) {
                return { code, carrier, cleanNumber };
            }
        }
        
        return null;
    }

    // DHL追踪 (演示版本，实际需要API密钥)
    async trackDHL(trackingNumber) {
        try {
            // 这里应该调用DHL官方API
            // const response = await axios.get(`https://api-eu.dhl.com/track/shipments?trackingNumber=${trackingNumber}`, {
            //     headers: { 'DHL-API-Key': process.env.DHL_API_KEY }
            // });
            
            // 模拟数据
            return {
                success: true,
                carrier: 'DHL',
                trackingNumber,
                status: 'In Transit',
                events: [
                    {
                        timestamp: '2024-01-15T10:30:00Z',
                        location: '北京分拣中心',
                        description: '包裹已从分拣中心发出',
                        status: 'In Transit'
                    },
                    {
                        timestamp: '2024-01-14T18:45:00Z',
                        location: '北京',
                        description: '包裹已到达当地分拣中心',
                        status: 'In Transit'
                    },
                    {
                        timestamp: '2024-01-14T09:15:00Z',
                        location: '上海',
                        description: '包裹已揽收',
                        status: 'Picked Up'
                    }
                ]
            };
        } catch (error) {
            throw new Error('DHL追踪服务暂时不可用');
        }
    }

    // UPS追踪
    async trackUPS(trackingNumber) {
        try {
            // 模拟UPS追踪数据
            return {
                success: true,
                carrier: 'UPS',
                trackingNumber,
                status: 'Delivered',
                events: [
                    {
                        timestamp: '2024-01-16T14:20:00Z',
                        location: '纽约, NY',
                        description: '包裹已送达',
                        status: 'Delivered'
                    },
                    {
                        timestamp: '2024-01-16T08:30:00Z',
                        location: '纽约分拣中心',
                        description: '包裹准备配送',
                        status: 'Out for Delivery'
                    }
                ]
            };
        } catch (error) {
            throw new Error('UPS追踪服务暂时不可用');
        }
    }

    // FedEx追踪
    async trackFedEx(trackingNumber) {
        try {
            return {
                success: true,
                carrier: 'FedEx',
                trackingNumber,
                status: 'In Transit',
                events: [
                    {
                        timestamp: '2024-01-15T16:45:00Z',
                        location: '洛杉矶, CA',
                        description: '包裹已到达中转站',
                        status: 'In Transit'
                    }
                ]
            };
        } catch (error) {
            throw new Error('FedEx追踪服务暂时不可用');
        }
    }

    // 中国国际航空追踪
    async trackAirChina(trackingNumber) {
        try {
            return {
                success: true,
                carrier: 'Air China Cargo',
                trackingNumber,
                status: 'In Transit',
                events: [
                    {
                        timestamp: '2024-01-15T22:15:00Z',
                        location: '北京首都国际机场',
                        description: '货物已装机，航班CA123',
                        status: 'In Transit'
                    },
                    {
                        timestamp: '2024-01-15T18:30:00Z',
                        location: '北京货运站',
                        description: '货物已到达航空货运站',
                        status: 'At Warehouse'
                    }
                ]
            };
        } catch (error) {
            throw new Error('航空货运追踪服务暂时不可用');
        }
    }

    // 马来西亚航空追踪
    async trackMalaysiaAirlines(trackingNumber) {
        try {
            return {
                success: true,
                carrier: 'Malaysia Airlines Cargo',
                trackingNumber,
                status: 'In Transit',
                events: [
                    {
                        timestamp: '2024-01-15T12:00:00Z',
                        location: '吉隆坡国际机场',
                        description: '货物已到达目的地机场',
                        status: 'Arrived'
                    }
                ]
            };
        } catch (error) {
            throw new Error('航空货运追踪服务暂时不可用');
        }
    }
}

const trackingService = new TrackingService();

// 追踪API端点
router.post('/track', async (req, res) => {
    try {
        const { trackingNumber } = req.body;
        
        if (!trackingNumber) {
            return res.status(400).json({
                success: false,
                message: '请输入追踪单号'
            });
        }

        // 自动识别承运商
        const detected = trackingService.detectCarrier(trackingNumber);
        
        if (!detected) {
            return res.status(400).json({
                success: false,
                message: '无法识别该追踪单号格式，请检查单号是否正确'
            });
        }

        // 执行追踪
        const result = await detected.carrier.track(detected.cleanNumber);
        
        res.json(result);
        
    } catch (error) {
        console.error('追踪错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '追踪服务暂时不可用，请稍后重试'
        });
    }
});

// 批量追踪API端点，支持强制指定承运商
router.post('/', async (req, res) => {
    try {
        const { trackingNumbers, forcedCarrier } = req.body;
        
        if (!trackingNumbers || !Array.isArray(trackingNumbers)) {
            return res.status(400).json({
                success: false,
                message: '请输入追踪单号数组'
            });
        }

        const results = [];
        
        for (const trackingNumber of trackingNumbers) {
            try {
                let result;
                
                if (forcedCarrier) {
                    // 强制使用指定的承运商
                    result = await trackWithForcedCarrier(trackingNumber, forcedCarrier);
                } else {
                    // 自动识别承运商
                    const detected = trackingService.detectCarrier(trackingNumber);
                    
                    if (!detected) {
                        result = {
                            success: false,
                            trackingNumber,
                            message: '无法识别该追踪单号格式，请检查单号是否正确'
                        };
                    } else {
                        result = await detected.carrier.track(detected.cleanNumber);
                    }
                }
                
                results.push(result);
                
            } catch (error) {
                console.error(`追踪 ${trackingNumber} 错误:`, error);
                results.push({
                    success: false,
                    trackingNumber,
                    message: error.message || '追踪服务暂时不可用'
                });
            }
        }
        
        res.json({
            success: true,
            results
        });
        
    } catch (error) {
        console.error('批量追踪错误:', error);
        res.status(500).json({
            success: false,
            message: error.message || '追踪服务暂时不可用，请稍后重试'
        });
    }
});

// 使用强制指定的承运商进行追踪
async function trackWithForcedCarrier(trackingNumber, forcedCarrier) {
    // 根据承运商名称映射到内部服务商代码
    const carrierMap = {
        'DHL Express': 'dhl',
        'UPS': 'ups',
        'FedEx': 'fedex',
        'TNT': 'fedex', // TNT现在是FedEx的一部分
        'USPS': 'ups', // 使用UPS作为备选
        'EMS': 'dhl', // 使用DHL作为备选
        'China Post': 'dhl', // 使用DHL作为备选
        '顺丰': 'dhl', // 使用DHL作为备选
        '中通': 'dhl', // 使用DHL作为备选
        '圆通': 'dhl', // 使用DHL作为备选
        '申通': 'dhl', // 使用DHL作为备选
        '韵达': 'dhl', // 使用DHL作为备选
        '京东': 'dhl', // 使用DHL作为备选
        'Air China': 'ca',
        'China Eastern': 'ca', // 使用国航作为备选
        'China Southern': 'ca', // 使用国航作为备选
        'Hainan Airlines': 'ca', // 使用国航作为备选
        'Shenzhen Airlines': 'ca', // 使用国航作为备选
        'Xiamen Airlines': 'ca', // 使用国航作为备选
        'COSCO Shipping': 'dhl', // 使用DHL作为备选
        'OOCL': 'dhl', // 使用DHL作为备选
        'Evergreen': 'dhl', // 使用DHL作为备选
        'Maersk': 'dhl', // 使用DHL作为备选
        'CMA CGM': 'dhl', // 使用DHL作为备选
        'Hapag-Lloyd': 'dhl' // 使用DHL作为备选
    };
    
    const carrierCode = carrierMap[forcedCarrier] || 'dhl'; // 默认使用DHL
    const carrier = trackingService.carriers[carrierCode];
    
    if (!carrier) {
        throw new Error(`不支持的承运商: ${forcedCarrier}`);
    }
    
    // 模拟使用指定承运商的追踪结果
    const result = await carrier.track(trackingNumber);
    
    // 覆盖承运商名称为用户选择的名称
    result.carrier = forcedCarrier;
    
    return result;
}

// 获取支持的承运商列表
router.get('/carriers', (req, res) => {
    const carriers = Object.entries(trackingService.carriers).map(([code, carrier]) => ({
        code,
        name: carrier.name,
        pattern: carrier.pattern.toString()
    }));
    
    res.json({
        success: true,
        carriers
    });
});

module.exports = router; 