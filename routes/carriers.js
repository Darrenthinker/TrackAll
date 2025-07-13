const express = require('express');
const router = express.Router();

// 支持的服务商列表
const carriers = [
    { name: 'DHL Express', website: 'https://www.dhl.com/express', type: '国际快递' },
    { name: 'UPS', website: 'https://www.ups.com', type: '国际快递' },
    { name: 'FedEx', website: 'https://www.fedex.com', type: '国际快递' },
    { name: 'TNT', website: 'https://www.tnt.com', type: '国际快递' },
    { name: 'USPS', website: 'https://www.usps.com', type: '国际快递' },
    { name: 'EMS', website: 'https://www.ems.com.cn', type: '国际快递' },
    { name: '顺丰', website: 'https://www.sf-express.com', type: '国内快递' },
    { name: '中通', website: 'https://www.zto.com', type: '国内快递' },
    { name: '圆通', website: 'https://www.yto.net.cn', type: '国内快递' },
    { name: '申通', website: 'https://www.sto.cn', type: '国内快递' },
    { name: '韵达', website: 'https://www.yunda.com', type: '国内快递' },
    { name: '京东', website: 'https://www.jd.com', type: '国内快递' },
    { name: 'China Post', website: 'https://www.chinapost.com.cn', type: '国际快递' },
    { name: 'Air China', website: 'https://www.airchina.com.cn', type: '航空公司' },
    { name: 'China Eastern', website: 'https://www.ceair.com', type: '航空公司' },
    { name: 'China Southern', website: 'https://www.csair.com', type: '航空公司' },
    { name: 'Hainan Airlines', website: 'https://www.hainanairlines.com', type: '航空公司' },
    { name: 'Shenzhen Airlines', website: 'https://www.shenzhenair.com', type: '航空公司' },
    { name: 'Xiamen Airlines', website: 'https://www.xiamenair.com', type: '航空公司' },
    { name: 'Sichuan Airlines', website: 'https://www.scal.com.cn', type: '航空公司' },
    { name: 'COSCO Shipping', website: 'https://www.cosco-shipping.com', type: '船运公司' },
    { name: 'OOCL', website: 'https://www.oocl.com', type: '船运公司' },
    { name: 'Evergreen', website: 'https://www.evergreen-marine.com', type: '船运公司' },
    { name: 'Maersk', website: 'https://www.maersk.com', type: '船运公司' },
    { name: 'CMA CGM', website: 'https://www.cma-cgm.com', type: '船运公司' },
    { name: 'Hapag-Lloyd', website: 'https://www.hapag-lloyd.com', type: '船运公司' }
];

// 获取所有服务商页面
router.get('/', (req, res) => {
    const groupedCarriers = {
        '国际快递': carriers.filter(c => c.type === '国际快递'),
        '国内快递': carriers.filter(c => c.type === '国内快递'),
        '航空公司': carriers.filter(c => c.type === '航空公司'),
        '船运公司': carriers.filter(c => c.type === '船运公司')
    };

    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>所有支持的服务商</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Microsoft YaHei', sans-serif;
                    background: #f9fafb;
                    color: #333;
                    line-height: 1.6;
                }

                .container {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }

                .header {
                    text-align: center;
                    margin-bottom: 60px;
                }

                .header h1 {
                    font-size: 2.5rem;
                    color: #1a1a1a;
                    margin-bottom: 16px;
                }

                .header p {
                    font-size: 1.1rem;
                    color: #6b7280;
                    margin-bottom: 30px;
                }

                .back-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: #4285f4;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: all 0.15s ease;
                }

                .back-btn:hover {
                    background: #3367d6;
                    transform: translateY(-1px);
                }

                .category {
                    margin-bottom: 50px;
                }

                .category h2 {
                    font-size: 1.5rem;
                    color: #1a1a1a;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 2px solid #e5e7eb;
                }

                .carriers-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 16px;
                }

                .carrier-card {
                    background: white;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 20px;
                    transition: all 0.15s ease;
                }

                .carrier-card:hover {
                    background: #f9fafb;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }

                .carrier-name {
                    font-size: 1.2rem;
                    font-weight: 600;
                    color: #1a1a1a;
                    margin-bottom: 12px;
                }

                .carrier-link {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 16px;
                    background: #f0f9ff;
                    color: #0066cc;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 14px;
                    border: 1px solid #e1f0ff;
                    transition: all 0.15s ease;
                }

                .carrier-link:hover {
                    background: #e1f0ff;
                    border-color: #0066cc;
                }

                .carrier-link i {
                    font-size: 12px;
                }

                @media (max-width: 768px) {
                    .container {
                        padding: 20px 15px;
                    }

                    .header h1 {
                        font-size: 2rem;
                    }

                    .carriers-grid {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>所有支持的服务商</h1>
                    <p>我们支持以下快递公司、航空公司和船运公司的包裹追踪服务</p>
                    <a href="/" class="back-btn">
                        <i class="fas fa-arrow-left"></i>
                        返回首页
                    </a>
                </div>

                ${Object.entries(groupedCarriers).map(([category, carrierList]) => `
                    <div class="category">
                        <h2>${category}</h2>
                        <div class="carriers-grid">
                            ${carrierList.map(carrier => `
                                <div class="carrier-card">
                                    <div class="carrier-name">${carrier.name}</div>
                                    <a href="${carrier.website}" target="_blank" class="carrier-link">
                                        <i class="fas fa-external-link-alt"></i>
                                        访问官网
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </body>
        </html>
    `);
});

module.exports = router; 