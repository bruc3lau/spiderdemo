package models

import (
	"log"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

// Video 代表一个被检索出的单个视频
type Video struct {
	ID        uint   `gorm:"primaryKey" json:"id"`
	TaskID    uint   `gorm:"index" json:"taskId"`
	YoutubeID string `json:"youtubeId"`
	Title     string `json:"title"`
	URL       string `json:"url"`
	Duration  int    `json:"duration"`
	Status    string `gorm:"default:'pending'" json:"status"` // 状态：pending, downloading, completed, failed
	Progress  string `gorm:"default:''" json:"progress"`      // 单一视频的下载进度
	CreatedAt int64  `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt int64  `gorm:"autoUpdateTime" json:"updatedAt"`
}

// Task 代表一个爬虫搜索关键字任务
type Task struct {
	ID        uint    `gorm:"primaryKey" json:"id"`
	Keyword   string  `gorm:"not null" json:"keyword"`
	Status    string  `gorm:"default:'searching'" json:"status"` // 状态：searching, pending, downloading, completed, failed
	Progress  string  `gorm:"default:''" json:"progress"`        // 总体下载进度文本（可选展示）
	Videos    []Video `json:"videos" gorm:"foreignKey:TaskID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CreatedAt int64   `gorm:"autoCreateTime" json:"createdAt"`
	UpdatedAt int64   `gorm:"autoUpdateTime" json:"updatedAt"`
}

// ConnectDatabase 初始化 SQLite 数据库
func ConnectDatabase() {
	database, err := gorm.Open(sqlite.Open("spider.db"), &gorm.Config{})
	if err != nil {
		log.Fatal("无法连接到数据库！", err)
	}

	err = database.AutoMigrate(&Task{}, &Video{})
	if err != nil {
		log.Fatal("数据库自动迁移失败！", err)
	}

	DB = database
}
