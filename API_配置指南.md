# API配置指南

## 🚨 生产环境问题诊断结果

根据测试结果，我们发现了以下问题：

### ✅ DHL API - 状态良好
- **连接状态**: 正常
- **API端点**: 可访问
- **测试结果**: 成功

### ❌ 17track API - 需要配置
- **连接状态**: 401未授权错误
- **原因**: API密钥未配置或无效

### ❌ 环境变量 - 需要配置
- **DHL_API_KEY**: 未配置
- **DHL_API_SECRET**: 未配置  
- **SEVENTEENTRACK_API_KEY**: 未配置

## 🔧 解决方案

### 1. 创建环境变量文件

在项目根目录创建 `.env` 文件：

```bash
# 数据库配置
DB_HOST=rm-bp19c413117y10tq0vo.mysql.rds.aliyuncs.com
DB_USER=tracking_admin
DB_PASSWORD=Liukai@220724
DB_NAME=tracking_system
DB_PORT=3306

# DHL API配置 - 替换为您的实际密钥
DHL_API_KEY=your_actual_dhl_api_key_here
DHL_API_SECRET=your_actual_dhl_api_secret_here

# 17track API配置 - 替换为您的实际密钥
SEVENTEENTRACK_API_KEY=your_actual_17track_api_key_here

# 服务器配置
PORT=3007
NODE_ENV=production
```

### 2. 获取API密钥

#### DHL API密钥获取：
1. 访问 [DHL Developer Portal](https://developer.dhl.com)
2. 注册开发者账户
3. 创建应用获取API Key和Secret
4. 参考：`DHL_API_申请指南.md`

#### 17track API密钥获取：
1. 访问 [17track API](https://www.17track.net/en/apicenter)
2. 注册账户并申请API权限
3. 获取API token

### 3. 部署配置

#### Vercel部署（推荐）：
在Vercel项目设置中添加环境变量：
- `DHL_API_KEY` = 您的DHL API密钥
- `DHL_API_SECRET` = 您的DHL API秘钥
- `SEVENTEENTRACK_API_KEY` = 您的17track API密钥

#### 服务器部署：
1. 将 `.env` 文件上传到服务器
2. 确保 `.env` 文件权限正确 (600)
3. 重启Node.js应用

### 4. 测试配置

运行测试脚本验证配置：
```bash
node test_api_connection.js
```

## 🎯 当前可用功能

### ✅ 即使没有配置API，系统仍可运行
- DHL追踪：使用演示数据
- 其他承运商：使用模拟数据
- 基本追踪功能：完全可用

### ⚡ 配置API后的增强功能
- **DHL追踪**：实时真实数据
- **17track备选**：更高可靠性
- **多端点支持**：更强稳定性
- **错误恢复**：自动备选方案

## 🔍 故障排除

### 网络错误
如果遇到网络错误：
1. 检查防火墙设置
2. 确认API端点可访问
3. 验证API密钥格式
4. 检查API配额限制

### API认证失败
如果API返回401错误：
1. 确认API密钥正确
2. 检查API权限范围
3. 验证账户状态
4. 联系API提供商

### 超时问题
如果请求超时：
1. 增加超时时间设置
2. 检查网络连接稳定性
3. 使用备选API端点
4. 启用17track备选方案

## 📞 技术支持

如需进一步帮助，请：
1. 运行 `node test_api_connection.js` 获取详细诊断
2. 检查服务器日志
3. 确认API配额和限制
4. 联系相应API服务商支持 