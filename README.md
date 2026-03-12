# Spider Task Manager (爬虫下载任务管理平台)

一个基于 Golang 和 React 的前后端分离全栈应用，旨在通过提供现代化、充满质感的用户界面，优雅地管理、预览和下载 `yt-dlp` 所支持的网络视频内容。

## 🌟 功能特性

- **现代深色级 UI**: 基于毛玻璃效果的卡片、响应式动画以及平滑的拉取请求。
- **搜前预览 (Top 5)**: 创建爬虫任务后先进行无痛的快速异步检索，获取前五条视频清单（标题、时长等）。
- **精细化粒度下载**: 
  - 支持**一键批量下载**关键词对应的所有视频。
  - 支持**单一节点视频触发下载**，想下哪部下哪部。
  - 拥有极其灵敏的中文化状态展示（搜索中、下载中、已完成、失败）。
- **实时进度监控**: 高频次后台正则捕获 `yt-dlp` 推送进度，让下载进度直接展示在前端界面。

## 🛠 DevOps 工具与快速启动

为了更好地管理和部署该项目，我们在根目录提供了统一的 `Makefile` 和 `docker-compose.yml` 文件。

### 使用 Makefile 进行日常开发

你可以使用以下快捷命令进行开发：
- `make build-backend` / `make build-frontend`: 编译对应的模块
- `make run-backend` / `make run-frontend`: 运行对应的开发服
- `make clean`: 快速清理产物(这包含清空当前的 `spider.db` 以及 `downloads/` 目录)

### 使用 Docker 部署应用

项目内置了针对全栈的 Docker 部署封装。可以直接使用：
```bash
make docker-up
```
该命令会自动依据 `docker-compose.yml` 启动前后端容器：
- `backend` 使用轻量化 `alpine` 并打包了 `yt-dlp` 与 `ffmpeg` 核心依赖。**您下载的视频和数据库将会映射并持久化在当前的 `backend/downloads` 下**。
- `frontend` 基于 `nginx` 使用 `node` 多阶段构建，将以静态代理模式部署于主机的 `5173` 端口上。

如果你需要随时停止容器服务，仅需执行：
```bash
make docker-down
```

---

## ⚙️ 架构说明

- **后端 (`/backend`)**: Gin 提供路由框架支持; GORM 桥接底层 SQLite 实体管理; `os/exec` 以及进程通讯用于非阻塞调用子进程 `yt-dlp`。
- **前端 (`/frontend`)**: 基于 React + TS 编写组件; `lucide-react` 提供优美图标; 采用原生 CSS 调出 HSL 加深空暗黑毛玻璃风格主题界面; `axios` 通信联结状态追踪。
