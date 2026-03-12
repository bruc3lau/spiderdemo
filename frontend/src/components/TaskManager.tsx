import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Loader2 } from 'lucide-react';
import TaskItem from './TaskItem';

export interface Video {
  id: number;
  taskId: number;
  youtubeId: string;
  title: string;
  url: string;
  duration: number;
  status: string;
  progress: string;
}

export interface Task {
  id: number;
  keyword: string;
  status: string;
  progress: string;
  videos: Video[];
  createdAt: number;
}

const API_BASE_URL = 'http://localhost:8080/api';

function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tasks`);
      setTasks(response.data.data);
    } catch (error) {
      console.error('获取任务列表失败', error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    const interval = setInterval(fetchTasks, 2000); // 提升轮询频率以显示更平滑的进度
    return () => clearInterval(interval);
  }, []);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/tasks`, { keyword });
      setKeyword('');
      fetchTasks();
    } catch (error) {
      console.error('创建任务失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-container">
      <h1 className="app-title">爬虫下载任务管理</h1>
      
      <form className="search-form" onSubmit={handleCreateTask}>
        <input
          type="text"
          className="search-input"
          placeholder="输入搜索关键词创建新下载任务..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading || !keyword.trim()}>
          {loading ? <Loader2 className="spin" size={20} /> : <Search size={20} />}
          创建任务
        </button>
      </form>

      {fetching ? (
        <div className="empty-state">
          <Loader2 className="spin" size={32} style={{ margin: '0 auto', marginBottom: '1rem', color: 'var(--primary-color)' }} />
          正在加载任务...
        </div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          尚未找到任何任务。在上方输入关键词以开始。
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task, index) => (
            <div key={task.id} style={{ animationDelay: `${index * 50}ms` }}>
              <TaskItem task={task} onRefresh={fetchTasks} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskManager;
