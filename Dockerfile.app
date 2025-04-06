# 使用 Node.js 官方镜像
FROM node:18-slim

# 配置镜像源
RUN echo "deb https://mirrors.aliyun.com/debian/ bullseye main contrib non-free" > /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian-security bullseye-security main contrib non-free" >> /etc/apt/sources.list && \
    echo "deb https://mirrors.aliyun.com/debian/ bullseye-updates main contrib non-free" >> /etc/apt/sources.list

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

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

# 复制 PM2 配置文件
COPY ecosystem.config.js .

# 使用 PM2 启动应用
CMD ["pm2-runtime", "ecosystem.config.js"]