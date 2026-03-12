import { useState } from 'react';
import axios from 'axios';
import { Download, Loader2, CheckCircle2, XCircle, Clock, Video as VideoIcon, Trash2, AlertTriangle } from 'lucide-react';
import type { Task } from './TaskManager';

interface TaskItemProps {
  task: Task;
  onRefresh: () => void;
}

const API_BASE_URL = 'http://localhost:8080/api';

function TaskItem({ task, onRefresh }: TaskItemProps) {
  const [triggeringTask, setTriggeringTask] = useState(false);
  const [triggeringVideoId, setTriggeringVideoId] = useState<number | null>(null);

  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteFiles, setDeleteFiles] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTriggerTask = async () => {
    setTriggeringTask(true);
    try {
      await axios.post(`${API_BASE_URL}/tasks/${task.id}/trigger`);
      onRefresh();
    } catch (error) {
      console.error('批量触发下载失败', error);
    } finally {
      setTriggeringTask(false);
    }
  };

  const handleTriggerVideo = async (videoId: number) => {
    setTriggeringVideoId(videoId);
    try {
      await axios.post(`${API_BASE_URL}/videos/${videoId}/trigger`);
      onRefresh();
    } catch (error) {
      console.error('触发单一视频下载失败', error);
    } finally {
      setTriggeringVideoId(null);
    }
  };

  const executeDelete = async () => {
    setDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/tasks/${task.id}?deleteFiles=${deleteFiles}`);
      setShowDeleteModal(false);
      onRefresh();
    } catch (error) {
      console.error('删除任务失败', error);
    } finally {
      setDeleting(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'searching': return '搜索中';
      case 'downloading': return '下载中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      default: return '等待中';
    }
  };

  const StatusIcon = ({ status, size = 14 }: { status: string, size?: number }) => {
    switch (status) {
      case 'searching':
      case 'downloading': return <Loader2 className="spin" size={size} />;
      case 'completed': return <CheckCircle2 size={size} />;
      case 'failed': return <XCircle size={size} />;
      default: return <Clock size={size} />;
    }
  };

  // 计算任务级综合状态
  const totalVideos = task.videos?.length || 0;
  const completedVideos = task.videos?.filter(v => v.status === 'completed').length || 0;
  const downloadingVideos = task.videos?.filter(v => v.status === 'downloading').length || 0;
  const pendingVideos = task.videos?.filter(v => v.status === 'pending' || v.status === 'failed').length || 0;
  
  const isAllCompleted = totalVideos > 0 && completedVideos === totalVideos;
  const canBulkDownload = pendingVideos > 0;

  // 决定批量按钮的展示状态和文案
  let bulkBtnText = '一键下载全部';
  let isBulkBtnDisabled = triggeringTask || !canBulkDownload;
  let showBulkSpinner = triggeringTask;

  if (triggeringTask) {
    bulkBtnText = '批量触发中...';
  } else if (downloadingVideos > 0) {
    if (downloadingVideos === pendingVideos + downloadingVideos) {
      bulkBtnText = '全部下载中...';
      isBulkBtnDisabled = true;
      showBulkSpinner = true;
    } else {
      bulkBtnText = `下载其余 ${pendingVideos} 个`;
      isBulkBtnDisabled = false;
    }
  } else if (!isAllCompleted && completedVideos > 0) {
    bulkBtnText = `一键下载剩余 ${pendingVideos} 个`;
  }

  return (
    <>
      <div className="task-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="task-info">
            <div className="task-keyword">"{task.keyword}"</div>
            <div className="task-meta">
              <span className={`status-badge status-${isAllCompleted ? 'completed' : task.status}`}>
                <StatusIcon status={isAllCompleted ? 'completed' : task.status} />
                {isAllCompleted ? '全部完成' : getStatusText(task.status)}
              </span>
              {task.videos && task.videos.length > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  找到 {totalVideos} 个视频 ({completedVideos}/{totalVideos})
                </span>
              )}
              <span style={{ fontSize: '0.8rem' }}>
                ID: {task.id} • 创建于: {new Date(task.createdAt * 1000).toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
          
          <div className="task-actions" style={{ marginLeft: '1rem', display: 'flex', gap: '0.5rem' }}>
            {task.status === 'searching' && (
              <button className="btn-outline" disabled style={{ borderColor: 'var(--primary-color)', color: 'var(--primary-color)' }}>
                <Loader2 className="spin" size={16} /> 正在检索...
              </button>
            )}
            {task.status !== 'searching' && !isAllCompleted && (
              <button 
                className="btn-outline" 
                onClick={handleTriggerTask}
                disabled={isBulkBtnDisabled}
              >
                {showBulkSpinner ? <Loader2 className="spin" size={16} /> : <Download size={16} />}
                {bulkBtnText}
              </button>
            )}
            <button 
              className="btn-outline" 
              onClick={() => setShowDeleteModal(true)}
              style={{ color: 'var(--warning-color)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.5rem' }}
              title="删除任务"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Video List Preview */}
        {task.videos && task.videos.length > 0 && (
          <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '2px solid var(--surface-border)' }}>
            {task.videos.map(video => (
              <div key={video.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#fff' }}>
                    <VideoIcon size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom', color: 'var(--primary-color)' }} />
                    {video.title}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem' }}>
                    <span>[{video.duration}s]</span>
                    <span className={`status-${video.status}`} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <StatusIcon status={video.status} size={12} />
                      {getStatusText(video.status)} {video.progress && `(${video.progress})`}
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0, marginLeft: '1rem' }}>
                  <button 
                    className="btn-outline" 
                    style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                    onClick={() => handleTriggerVideo(video.id)}
                    disabled={triggeringVideoId === video.id || video.status === 'downloading' || video.status === 'completed'}
                  >
                    {triggeringVideoId === video.id || video.status === 'downloading' ? (
                      <><Loader2 className="spin" size={14} /> 下载中</>
                    ) : video.status === 'completed' ? (
                      '重新下载'
                    ) : (
                      <><Download size={14} /> 下载</>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => !deleting && setShowDeleteModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ color: 'var(--danger-color)' }}>
              <AlertTriangle size={24} />
              删除任务
            </div>
            <div className="modal-body">
              <p>您确定要永久删除任务 <strong>"{task.keyword}"</strong> 及其所有的搜索记录吗？该操作无法被撤销。</p>
              
              <label className="modal-checkbox">
                <input 
                  type="checkbox" 
                  checked={deleteFiles}
                  disabled={deleting}
                  onChange={(e) => setDeleteFiles(e.target.checked)}
                />
                <span style={{ fontSize: '0.85rem' }}>连同删除已经下载到服务器硬盘里的视频实体文件</span>
              </label>
            </div>
            
            <div className="modal-actions">
              <button 
                className="btn-outline" 
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                取消
              </button>
              <button 
                className="btn-danger" 
                onClick={executeDelete}
                disabled={deleting}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                {deleting ? <><Loader2 className="spin" size={16} /> 删除中...</> : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default TaskItem;
