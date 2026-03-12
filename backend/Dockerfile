# 构建阶段
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -a -installsuffix cgo -o spider-backend main.go

# 运行阶段
FROM alpine:latest

# 安装 yt-dlp 和 ffmpeg
RUN apk add --no-cache ca-certificates ffmpeg python3 py3-pip \
    && pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app
COPY --from=builder /app/spider-backend .

# 创建必要的目录存量
RUN mkdir -p downloads

EXPOSE 8080

CMD ["./spider-backend"]
