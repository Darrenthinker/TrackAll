# UPS API申请指南

## 申请流程

### 1. 注册UPS开发者账户
- **访问**: https://developer.ups.com/
- **选择**: "I want to integrate UPS technology into my business"
- **账户类型**: "Create a new account"

### 2. 填写申请信息
- **Application Name**: TrackAll追踪系统
- **Business Purpose**: 为客户提供UPS包裹追踪查询服务
- **Expected Volume**: 每日1000次查询
- **OAuth Grant Type**: Single Client Credential Grant Type ✅

### 3. OAuth 2.0认证说明
UPS使用OAuth 2.0认证，推荐使用**Single Client Credential Grant Type**：
- 适合单一业务实体
- 服务器到服务器认证
- 不需要用户登录授权

### 4. 获取API凭证
申请成功后获得：
- **Client ID**: [待获取]
- **Client Secret**: [待获取]
- **Access Token URL**: https://onlinetools.ups.com/security/v1/oauth/token

### 5. API端点
- **测试环境**: https://wwwcie.ups.com/
- **生产环境**: https://onlinetools.ups.com/
- **追踪API**: /api/track/v1/details/{trackingNumber}

## 技术集成准备

### OAuth 2.0认证流程
1. **获取Access Token**:
   ```javascript
   const getAccessToken = async () => {
     const response = await axios.post('https://onlinetools.ups.com/security/v1/oauth/token', {
       grant_type: 'client_credentials'
     }, {
       headers: {
         'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
         'Content-Type': 'application/x-www-form-urlencoded'
       }
     });
     return response.data.access_token;
   };
   ```

2. **使用Access Token调用API**:
   ```javascript
   const trackPackage = async (trackingNumber, accessToken) => {
     const response = await axios.get(`https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`, {
       headers: {
         'Authorization': `Bearer ${accessToken}`,
         'Content-Type': 'application/json'
       }
     });
     return response.data;
   };
   ```

### 主要功能
1. **包裹追踪 (Tracking)**
   - 实时查询包裹状态
   - 获取物流轨迹
   - 支持批量查询

2. **地址验证 (Address Validation)**
   - 验证收件地址
   - 地址标准化

3. **运费计算 (Rating)**
   - 计算运费
   - 服务选项查询

## 申请注意事项

### ✅ 建议选择：
- **OAuth Grant Type**: Single Client Credential Grant Type
- **API**: Tracking API
- **Environment**: 先申请测试环境，后申请生产环境

### 📋 所需资料：
- 公司/个人信息
- 业务用途详细描述
- 预期API调用量
- 技术联系人信息

### ⏰ 审核时间：
- 通常1-3个工作日
- 测试环境通常更快批准
- 生产环境可能需要额外审核

## 集成到TrackAll系统

### 环境变量配置
```env
UPS_CLIENT_ID=your_client_id
UPS_CLIENT_SECRET=your_client_secret
UPS_API_BASE_URL=https://onlinetools.ups.com
```

### 服务集成
我已经为你准备了UPS API集成代码，申请成功后即可使用。

## 下一步操作

1. **继续申请流程** - 按照页面指引完成申请
2. **选择OAuth认证** - 确保选择Single Client Credential Grant Type
3. **等待审核结果** - 通常1-3个工作日
4. **获取API凭证** - 审核通过后获取Client ID和Secret
5. **集成测试** - 使用测试环境验证API功能

## 常见问题

### Q: 为什么选择Single Client Credential Grant Type？
A: 因为TrackAll是单一业务实体，不需要代表多个用户，这种认证方式最简单有效。

### Q: OAuth 2.0与传统API Key有什么区别？
A: OAuth 2.0更安全，Access Token有过期时间，需要定期刷新，安全性更高。

### Q: 测试环境和生产环境有什么区别？
A: 测试环境用于开发调试，生产环境用于正式服务，数据和限制不同。 