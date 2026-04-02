export interface Todo {
  id: string
  user_id: string
  title: string
  description: string | null
  priority: number // 0-低 1-中 2-高
  status: number // 0-待办 1-已完成
  due_date: string | null
  category: string | null
  completed_at: string | null
  create_time: string
  update_time: string
}

export interface TodoCount {
  total: number
  pending: number
  completed: number
  high_priority: number
  overdue: number
}

export interface TodoListParams {
  page?: number
  page_size?: number
  status?: number | null
  priority?: number | null
  category?: string
}

export interface TodoListResponse {
  items: Todo[]
  total: number
  page: number
  page_size: number
}

export interface TodoCreatePayload {
  title: string
  description?: string
  priority?: number
  due_date?: string
  category?: string
}

export interface TodoUpdatePayload {
  title?: string
  description?: string
  priority?: number
  status?: number
  due_date?: string
  category?: string
}
