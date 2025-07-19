# FedEx API申请指南

## 申请流程

### 1. 注册FedEx开发者账户
- **访问**: https://developer.fedex.com/
- **注册类型**: Business Account
- **所需信息**: 公司信息和联系方式

### 2. 申请API访问权限
- **API类型**: Track API
- **业务用途**: 为TrackAll追踪系统提供FedEx包裹追踪服务
- **预期使用量**: 每日1000次查询

### 3. 获取API凭证
申请成功后获得：
- **API Key**: [待获取]
- **Secret Key**: [待获取]
- **Account Number**: [待获取]

### 4. API端点信息
- **测试环境**: https://apis-sandbox.fedex.com/
- **生产环境**: https://apis.fedex.com/
- **追踪API**: /track/v1/trackingnumbers

## 技术集成准备

### OAuth 2.0认证流程
1. **获取Access Token**:
   ```javascript
   const getAccessToken = async () => {
     const response = await axios.post('https://apis.fedex.com/oauth/token', {
       grant_type: 'client_credentials',
       client_id: process.env.FEDEX_API_KEY,
       client_secret: process.env.FEDEX_SECRET_KEY
     }, {
       headers: {
         'Content-Type': 'application/x-www-form-urlencoded'
       }
     });
     return response.data.access_token;
   };
   ```

2. **追踪包裹**:
   ```javascript
   const trackPackage = async (trackingNumber, accessToken) => {
     const response = await axios.post('https://apis.fedex.com/track/v1/trackingnumbers', {
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
     return response.data;
   };
   ```

### 主要功能
1. **包裹追踪 (Track)**
   - 实时查询包裹状态
   - 获取详细物流轨迹
   - 支持批量查询

2. **地址验证 (Address Validation)**
   - 验证收件地址
   - 地址标准化

3. **运费计算 (Rate)**
   - 计算运费
   - 服务选项查询

## 申请注意事项

### ✅ **申请要求**：
- 有效的企业信息
- 详细的业务用途描述
- 预期API调用量估算
- 技术联系人信息

### 📋 **所需资料**：
- 公司名称：TrackAll Logistics Technology
- 业务描述：物流追踪服务平台
- 网站：trackall.huodaiagent.com
- 联系邮箱：darrenthinker@gmail.com

### ⏰ **审核时间**：
- 通常2-5个工作日
- 测试环境通常更快批准
- 生产环境可能需要额外审核

## 与UPS的区别

### 🔄 **认证方式**：
- FedEx：OAuth 2.0 Client Credentials
- 更标准的REST API
- JSON格式数据交换

### 📊 **API限制**：
- 测试环境：通常免费
- 生产环境：按调用次数收费
- 支持批量查询

## 集成到TrackAll系统

### 环境变量配置
```env
FEDEX_API_KEY=your_api_key
FEDEX_SECRET_KEY=your_secret_key
FEDEX_API_BASE_URL=https://apis.fedex.com
```

### 服务集成
我将为你准备FedEx API集成代码，申请成功后即可使用。

## 申请策略

### 🎯 **优势**：
- FedEx对国际开发者相对友好
- API文档完善
- 技术支持较好

### 📝 **申请技巧**：
- 强调国际业务需求
- 详细说明技术实现方案
- 提供真实的网站和联系方式

## 下一步操作

1. **访问注册页面** - https://developer.fedex.com/
2. **创建开发者账户** - 填写公司信息
3. **申请Track API** - 选择所需的API服务
4. **等待审核结果** - 通常2-5个工作日
5. **获取API凭证** - 配置到TrackAll系统

## 备选方案

如果FedEx申请也遇到问题，我们还有：
- 第三方聚合API（17track、AfterShip）
- 其他区域快递公司API
- 逐步扩展的策略

## 常见问题

### Q: FedEx API费用如何？
A: 测试环境通常免费，生产环境按调用次数收费，具体费用需要咨询FedEx。

### Q: 支持哪些国家和地区？
A: FedEx API支持全球大部分国家和地区，包括中国。

### Q: API调用限制是什么？
A: 具体限制取决于你的账户类型和协议，通常测试环境有较低的限制。 