# TrackAll - Vercel部署指南

## 🚀 部署步骤

### 1. 安装Vercel CLI
```bash
npm install -g vercel
```

### 2. 登录Vercel
```bash
vercel login
```

### 3. 部署项目
```bash
vercel --prod
```

## ⚙️ 环境变量配置

在Vercel项目设置中添加以下环境变量：

### 数据库配置
- `DB_HOST`: rm-bp19c413117y10tq0vo.mysql.rds.aliyuncs.com
- `DB_USER`: tracking_admin
- `DB_PASSWORD`: [您的数据库密码]
- `DB_NAME`: tracking_system
- `DB_PORT`: 3306

### 邮件服务配置
- `EMAIL_HOST`: smtp.qq.com
- `EMAIL_PORT`: 587
- `EMAIL_USER`: [您的QQ邮箱]
- `EMAIL_PASSWORD`: [您的QQ邮箱授权码]

### 其他配置
- `NODE_ENV`: production

## 🔧 项目结构

```
TrackAll/
├── server.js          # 主服务器文件
├── vercel.json        # Vercel配置
├── public/            # 静态文件
│   ├── index.html     # 主页
│   └── admin.html     # 管理后台
├── routes/            # API路由
├── models/            # 数据模型
├── services/          # 服务层
└── config/            # 配置文件
```

## 🌐 访问地址

部署成功后，您将获得：
- 主页：https://your-project.vercel.app/
- 管理后台：https://your-project.vercel.app/admin.html

## 📝 注意事项

1. 确保阿里云MySQL数据库允许外网访问
2. 在Vercel中正确设置所有环境变量
3. 首次部署可能需要几分钟时间
4. 如有问题，可查看Vercel的构建日志

## 🔍 故障排除

- 如果数据库连接失败，检查环境变量是否正确设置
- 如果邮件功能不工作，确认QQ邮箱已开启SMTP服务
- 查看Vercel的Functions日志获取详细错误信息 