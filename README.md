# 追踪网站系统 (Track All)

一个完整的物流追踪网站系统，支持多种快递公司的包裹追踪和邮件通知功能。

## 功能特点

- 🔍 **多单号批量查询** - 支持同时查询多个追踪单号
- 📧 **邮件通知系统** - 包裹状态变更自动通知
- 👥 **用户管理** - 完整的用户注册和管理系统
- 📊 **管理后台** - 数据统计、用户管理、查询记录
- 🌐 **多承运商支持** - DHL、UPS、FedEx等国际快递

## 技术栈

- **前端**: HTML5, CSS3, JavaScript, Bootstrap
- **后端**: Node.js, Express.js
- **数据库**: MySQL (阿里云RDS)
- **部署**: Vercel/Netlify

## 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动服务器：
```bash
npm start
```

3. 访问应用：
- 前端：http://localhost:3007
- 管理后台：http://localhost:3007/admin.html

## 项目结构

```
追踪网站/
├── public/           # 前端静态文件
│   ├── index.html   # 主页面
│   └── admin.html   # 管理后台
├── routes/          # API路由
│   ├── tracking.js  # 追踪API
│   ├── notifications.js # 通知API
│   └── admin.js     # 管理API
├── config/          # 配置文件
├── models/          # 数据模型
├── services/        # 服务层
└── server.js        # 服务器入口

```

## 部署

### 环境变量
```
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_NAME=tracking_system
PORT=3007
```

### 数据库
项目使用MySQL数据库，需要先创建数据库表结构，参考 `database_schema.sql`。

## 支持的快递公司

- DHL Express
- UPS
- FedEx
- 更多承运商持续添加中...

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License 