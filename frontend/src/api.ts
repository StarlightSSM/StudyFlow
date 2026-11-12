import axios from 'axios'

/** Same-origin API; Vite proxies /api to the backend (vite.config.ts). */
export const api = axios.create({ baseURL: '/api', timeout: 10_000 })

export type TaskStatus = 'todo' | 'done'
export type StatusFilter = 'all' | TaskStatus

export interface Task {
  id: number
  title: string
  description: string
  dueDate: string
  status: TaskStatus
  subjectId: number
  subjectName: string
  createdAt: string
  updatedAt: string
}

export interface Summary {
  total: number
  done: number
  todo: number
}

export async function fetchTasks(filter: StatusFilter): Promise<Task[]> {
  const params = filter === 'all' ? {} : { status: filter }
  return (await api.get<Task[]>('/tasks', { params })).data
}

export async function fetchSummary(): Promise<Summary> {
  return (await api.get<Summary>('/tasks/summary')).data
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  return (await api.patch<Task>(`/tasks/${id}/status`, { status })).data
}

export const STATUS_LABEL: Record<TaskStatus, string> = { todo: '미완료', done: '완료' }
