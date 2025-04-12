#!/bin/bash

# 进入服务器目录
cd "$(dirname "$0")/server"

# 检查是否安装了所需的依赖
if [ ! -d "node_modules" ]; then
  echo "正在安装API服务器所需的依赖..."
  npm install
fi

# 启动服务器
echo "正在启动API服务器..."
node server.js 