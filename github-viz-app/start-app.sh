#!/bin/bash
# 启动前端应用

# 切换到应用目录
cd "$(dirname "$0")"

# 检查是否安装依赖
if [ ! -d "node_modules" ]; then
  echo "正在安装依赖..."
  npm install
fi

# 启动应用
echo "正在启动前端应用..."
npm start 