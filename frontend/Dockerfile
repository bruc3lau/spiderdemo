# 1. 构建 React 静态文件
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 2. 部署 Nginx 与前端代理绑定
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx 自定义配置供代理请求到外部的 backend 实例使用 (如果启用单体部署)
# 对于本 demo，将直接监听 80 端口提供静态文件。跨域请求由前端代码中的绝对路径调用
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
