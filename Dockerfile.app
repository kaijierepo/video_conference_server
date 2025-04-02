# 使用 Node.js 基础镜像
FROM node:18

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    gcc \
    g++ \
    make \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# 创建并激活 Python 虚拟环境
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# 设置 npm 和 pip 超时设置
RUN npm config set fetch-timeout 1000000 && \
    npm config set network-timeout 1000000 && \
    python3 -m pip install --no-cache-dir --upgrade pip && \
    python3 -m pip config set global.timeout 1000 && \
    python3 -m pip config set global.retries 10

# 预先安装 mediasoup 所需的 Python 包
RUN python3 -m pip install --no-cache-dir invoke meson ninja

# 复制 package.json 文件
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm install --unsafe-perm --verbose

# 复制项目文件
COPY . .

# 如果需要暴露端口（根据你的应用需求调整）
EXPOSE 3000 