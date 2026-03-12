package main

import (
	"log"
	"spider-backend/handlers"
	"spider-backend/models"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// 初始化数据库
	models.ConnectDatabase()

	// 初始化 Gin 引擎
	r := gin.Default()

	// 配置跨域资源共享 (CORS) 允许前端访问
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type"}
	r.Use(cors.New(config))

	// API 路由组
	api := r.Group("/api")
	{
		api.GET("/tasks", handlers.GetTasks)
		api.POST("/tasks", handlers.CreateTask)
		api.POST("/tasks/:id/trigger", handlers.TriggerTask)
		api.POST("/videos/:id/trigger", handlers.TriggerVideo)
	}

	// 启动服务器
	log.Println("后台服务正在启动，监听端口 8080...")
	if err := r.Run(":8080"); err != nil {
		log.Fatal("服务器启动失败: ", err)
	}
}
