import request from '../utils/request'
import type {
  Todo,
  TodoCount,
  TodoCreatePayload,
  TodoListParams,
  TodoListResponse,
  TodoUpdatePayload,
} from '../types/todo'

export const fetchTodosApi = (params?: TodoListParams) =>
  request.get<TodoListResponse>('/todos', { params })

export const fetchPendingTodosApi = (limit?: number) =>
  request.get<Todo[]>('/todos/pending', { params: { limit } })

export const fetchTodoCountApi = () =>
  request.get<TodoCount>('/todos/count')

export const createTodoApi = (data: TodoCreatePayload) =>
  request.post<Todo>('/todos', data)

export const updateTodoApi = (id: string, data: TodoUpdatePayload) =>
  request.put<Todo>(`/todos/${id}`, data)

export const deleteTodoApi = (id: string) =>
  request.delete(`/todos/${id}`)

export const toggleTodoStatusApi = (id: string) =>
  request.post<{
    id: string
    status: number
    completed_at: string | null
  }>(`/todos/${id}/toggle`)
