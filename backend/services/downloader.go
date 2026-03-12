package services

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
	"regexp"
	"spider-backend/models"
)

type YtDlpJSON struct {
	ID         string  `json:"id"`
	Title      string  `json:"title"`
	WebpageURL string  `json:"webpage_url"`
	Duration   float64 `json:"duration"`
}

// FetchVideosForTask 搜索排行靠前的 5 个视频并保存到数据库
func FetchVideosForTask(taskID uint, keyword string) {
	log.Printf("开始搜索任务 ID: %d，关键词: %s\n", taskID, keyword)

	query := fmt.Sprintf("ytsearch5:%s", keyword)
	cmd := exec.Command("yt-dlp", query, "--dump-json", "--no-playlist", "--flat-playlist")

	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		log.Printf("搜索任务 %d 失败: %v", taskID, err)
		UpdateTaskStatus(taskID, "failed")
		return
	}

	scanner := bufio.NewScanner(&out)
	for scanner.Scan() {
		line := scanner.Text()
		var ytData YtDlpJSON
		if err := json.Unmarshal([]byte(line), &ytData); err == nil && ytData.ID != "" {
			video := models.Video{
				TaskID:    taskID,
				YoutubeID: ytData.ID,
				Title:     ytData.Title,
				URL:       ytData.WebpageURL, // flat-playlist might not return webpage_url directly, but usually it does for ytsearch.
				Duration:  int(ytData.Duration),
				Status:    "pending",
			}
			if video.URL == "" {
				video.URL = "https://www.youtube.com/watch?v=" + video.YoutubeID
			}
			models.DB.Create(&video)
		} else if err != nil {
			log.Printf("解析 yt-dlp JSON 失败: %v", err)
		}
	}

	log.Printf("搜索任务 %d 已成功完成并存入数据库。\n", taskID)
	UpdateTaskStatus(taskID, "pending")
}

// RunVideoDownloadTask 执行 yt-dlp 针对单一视频 URL 进行下载
func RunVideoDownloadTask(videoID uint, url string) {
	log.Printf("开始下载视频 ID: %d，URL: %s\n", videoID, url)

	outputFormat := "downloads/[%(id)s]%(title)s.%(ext)s"
	cmd := exec.Command("yt-dlp", url, "--newline", "-o", outputFormat)

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		log.Printf("获取视频任务 %d 的输出管道失败: %v", videoID, err)
		UpdateVideoStatus(videoID, "failed")
		return
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		log.Printf("视频任务 %d 启动失败: %v", videoID, err)
		UpdateVideoStatus(videoID, "failed")
		return
	}

	progressRegex := regexp.MustCompile(`\[download\]\s+([\d\.]+%)`)
	scanner := bufio.NewScanner(stdout)
	for scanner.Scan() {
		line := scanner.Text()
		matches := progressRegex.FindStringSubmatch(line)
		if len(matches) > 1 {
			UpdateVideoProgress(videoID, matches[1])
		}
	}

	if err := cmd.Wait(); err != nil {
		log.Printf("视频下载任务 %d 结束时出现错误: %v\n", videoID, err)
		UpdateVideoStatus(videoID, "failed")
	} else {
		log.Printf("视频下载任务 %d 已成功完成。\n", videoID)
		UpdateVideoProgress(videoID, "100%")
		UpdateVideoStatus(videoID, "completed")
	}
}

// UpdateTaskStatus 更新指定任务 ID 的最终状态
func UpdateTaskStatus(taskID uint, status string) {
	var task models.Task
	if err := models.DB.First(&task, taskID).Error; err == nil {
		models.DB.Model(&task).Update("status", status)
	}
}

// UpdateVideoStatus 更新指定视频 ID 的最终状态
func UpdateVideoStatus(videoID uint, status string) {
	var video models.Video
	if err := models.DB.First(&video, videoID).Error; err == nil {
		models.DB.Model(&video).Update("status", status)
	}
}

// UpdateVideoProgress 更新指定视频 ID 的当前进度
func UpdateVideoProgress(videoID uint, progress string) {
	var video models.Video
	if err := models.DB.First(&video, videoID).Error; err == nil {
		models.DB.Model(&video).Update("progress", progress)
	}
}
