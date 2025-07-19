@echo off
echo 设置API密钥并测试连接...

rem 设置API密钥
set DHL_API_KEY=O0ARX1D6fx6cjlzQ9z2P1RvLgrZhuNY7
set DHL_API_SECRET=9yE31yUNHsE5hfYB
set SEVENTEENTRACK_API_KEY=D5D021BFC8A9F142EFE33A2E3EDD247C

echo 运行API连接测试...
node test_api_connection.js

pause 