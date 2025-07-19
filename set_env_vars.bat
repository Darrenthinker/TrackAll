@echo off
echo 设置环境变量用于生产环境...

rem 设置DHL API配置
set DHL_API_KEY=O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7
set DHL_API_SECRET=9yE31yUNHsE5hfYB

rem 设置17track API配置  
set SEVENTEENTRACK_API_KEY=D5D021BFC8A9F142EFE33A2E3EDD247C

rem 设置数据库配置
set DB_HOST=rm-bp19c413117y10tq0vo.mysql.rds.aliyuncs.com
set DB_USER=tracking_admin
set DB_PASSWORD=Liukai@220724
set DB_NAME=tracking_system
set DB_PORT=3306

rem 设置服务器配置
set PORT=3007
set NODE_ENV=production

echo 环境变量已设置，启动服务器...
node server.js 