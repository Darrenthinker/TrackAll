# DHL API申请指南

## 申请流程

### 1. 注册开发者账户
- 访问: https://developer.dhl.com/user/register
- 填写个人/公司信息
- 验证邮箱

### 2. 申请API访问
- 登录后选择"DHL Express - MyDHL API"
- 点击"Get Access"
- 填写业务用途

### 3. 获取凭证
申请成功后获得：
- Account Number: [待填写]
- API Key: [待填写]
- API Secret: [待填写]

### 4. 测试环境配置
- 测试服务器: https://express.api.dhl.com
- 文档: https://developer.dhl.com/api-reference/dhl-express-mydhl-api

### 5. 生产环境申请
- 在开发者后台申请生产环境权限
- 等待DHL账户经理审核

## API集成准备

### 主要功能
1. **追踪查询 (Tracking)**
   - 实时查询包裹状态
   - 获取物流轨迹
   - 支持批量查询

2. **运单创建 (Shipping)**
   - 创建运单
   - 生成标签
   - 计算费用

### 技术要求
- 支持HTTPS
- JSON格式数据
- OAuth 2.0认证
- REST API调用

## 下一步计划
1. 完成DHL开发者账户注册
2. 获取测试环境API凭证
3. 集成到TrackAll系统
4. 测试追踪功能
5. 申请生产环境权限

## 注意事项
- 需要真实业务用途
- 生产环境需要额外审核
- 可能产生API调用费用
- 需要遵守DHL使用条款 