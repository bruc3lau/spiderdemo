package handlers

import (
	"net/http"
	"spider-backend/models"
	"spider-backend/services"
	"strconv"

	"github.com/gin-gonic/gin"
)

// CreateTaskInput 验证创建任务的输入数据
type CreateTaskInput struct {
	Keyword string `json:"keyword" binding:"required"`
}

// CreateTask 在数据库中添加一个新搜索任务
func CreateTask(c *gin.Context) {
	var input CreateTaskInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	task := models.Task{Keyword: input.Keyword, Status: "searching"}
	models.DB.Create(&task)
	
	// 异步检索视频信息
	go services.FetchVideosForTask(task.ID, task.Keyword)

	c.JSON(http.StatusOK, gin.H{"data": task})
}

// GetTasks 返回所有任务及其对应的视频列表
func GetTasks(c *gin.Context) {
	var tasks []models.Task
	models.DB.Preload("Videos").Order("created_at desc").Find(&tasks)

	c.JSON(http.StatusOK, gin.H{"data": tasks})
}

// TriggerTask 开始为任务下辖的所有视频触发下载
func TriggerTask(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的任务 ID"})
		return
	}

	var task models.Task
	if err := models.DB.Preload("Videos").First(&task, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定任务"})
		return
	}

	models.DB.Model(&task).Update("status", "downloading")

	for _, video := range task.Videos {
		if video.Status == "pending" || video.Status == "failed" {
			models.DB.Model(&video).Update("status", "downloading")
			go services.RunVideoDownloadTask(video.ID, video.URL)
		}
	}

	c.JSON(http.StatusOK, gin.H{"data": task, "message": "已成功触发全部关联视频下载"})
}

// TriggerVideo 开始为指定单一视频触发下载
func TriggerVideo(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.Atoi(idParam)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效的视频 ID"})
		return
	}

	var video models.Video
	if err := models.DB.First(&video, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "未找到指定视频"})
		return
	}

	if video.Status == "downloading" || video.Status == "completed" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该视频不能被重新触发下载"})
		return
	}

	models.DB.Model(&video).Update("status", "downloading")
	// 同步更新父任务状态（可选，只做个标记）
	models.DB.Model(&models.Task{}).Where("id = ?", video.TaskID).Update("status", "downloading")

	go services.RunVideoDownloadTask(video.ID, video.URL)

	c.JSON(http.StatusOK, gin.H{"data": video, "message": "已成功触发视频下载"})
}
