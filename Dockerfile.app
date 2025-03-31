# 使用 Node.js 基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    build-essential \
    gcc \
    g++ \
    make \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 设置 npm 和 pip 镜像源及超时设置
RUN npm config set registry https://registry.npmmirror.com && \
    npm config set fetch-timeout 1000000 && \
    npm config set network-timeout 1000000 && \
    python3 -m pip install -i https://mirrors.aliyun.com/pypi/simple/ --upgrade pip && \
    python3 -m pip config set global.index-url https://mirrors.aliyun.com/pypi/simple/ && \
    python3 -m pip config set global.timeout 1000

# 复制 package.json 文件
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm install --unsafe-perm

# 复制项目文件
COPY . .

# 如果需要暴露端口（根据你的应用需求调整）
EXPOSE 3000 