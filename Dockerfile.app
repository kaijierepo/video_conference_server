# 使用 Node.js 官方镜像作为基础镜像
FROM node:18-slim

# 全局安装 PM2
RUN npm install -g pm2

# 设置工作目录
WORKDIR /app

# 复制项目文件
COPY package*.json ./
RUN npm ci
COPY . .

# 构建项目
RUN npm run build

# 暴露端口
EXPOSE 3000

# 使用 PM2 启动应用
CMD ["pm2-runtime", "dist/main.js"] 