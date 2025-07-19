# DHL API 配置说明

## 概述
本系统已集成DHL API，支持多项目级别的API配置管理。

## API密钥信息
- **API Key**: `O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7`
- **API Secret**: `9yE31yUNHsE5hfYB`

## 配置方式

### 1. 环境变量配置（推荐）
在 `.env` 文件中添加：
```env
DHL_API_KEY=O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7
DHL_API_SECRET=9yE31yUNHsE5hfYB
```

### 2. 数据库配置（多项目支持）
每个项目可以有自己的DHL API配置：

```sql
-- 为项目1配置DHL API
INSERT INTO project_configs (project_id, config_key, config_value, description) VALUES
(1, 'dhl_api_key', 'O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7', 'DHL API密钥'),
(1, 'dhl_api_secret', '9yE31yUNHsE5hfYB', 'DHL API密钥');

-- 为项目2配置不同的API密钥（如果需要）
INSERT INTO project_configs (project_id, config_key, config_value, description) VALUES
(2, 'dhl_api_key', 'your_project2_api_key', 'DHL API密钥'),
(2, 'dhl_api_secret', 'your_project2_api_secret', 'DHL API密钥');
```

## 使用方法

### 1. 在代码中使用
```javascript
const dhlService = require('./services/dhlService');

// 使用默认配置
const result = await dhlService.trackShipment('1234567890');

// 使用项目特定配置
const result = await dhlService.trackShipment('1234567890', 1);
```

### 2. 测试API配置
运行测试脚本：
```bash
node test_dhl_api.js
```

## 功能特性

### ✅ 已实现功能
- [x] 单包裹追踪
- [x] 批量包裹追踪
- [x] 多项目配置支持
- [x] 动态配置加载
- [x] 错误处理和重试
- [x] 中文状态显示
- [x] 事件时间线

### 🔧 配置优先级
1. 项目配置（最高优先级）
2. 环境变量配置
3. 默认配置（最低优先级）

## 注意事项

1. **API限制**: DHL API有调用频率限制，请合理使用
2. **错误处理**: 系统会自动处理API错误并返回友好提示
3. **缓存机制**: 配置信息有5分钟缓存，修改后需要等待或清除缓存
4. **安全性**: API密钥存储在数据库中，请确保数据库安全

## 故障排除

### 常见问题

1. **API调用失败**
   - 检查API密钥是否正确
   - 确认网络连接正常
   - 查看错误日志

2. **配置不生效**
   - 清除配置缓存：`configService.clearCache()`
   - 检查数据库配置是否正确
   - 确认项目ID存在

3. **权限问题**
   - 确认API密钥有足够权限
   - 检查DHL账户状态

## 技术支持

如有问题，请检查：
1. 控制台错误日志
2. 数据库连接状态
3. API密钥有效性
4. 网络连接状态 