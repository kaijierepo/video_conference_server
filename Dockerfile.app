# 构建阶段
FROM node:18-slim AS builder

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

# 全局安装 NestJS CLI
RUN npm install -g @nestjs/cli

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm cache clean --force && \
    npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:18-slim

# 全局安装 PM2
RUN npm install -g pm2

WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --production && \
    npm cache clean --force

# 从构建阶段复制构建后的文件
# 仅复制必要文件
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY ecosystem.config.js .

EXPOSE 3000

# 启动命令
CMD ["npm", "run", "start:prod"]