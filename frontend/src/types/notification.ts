export interface Notification {
  id: string
  user_id: string
  title: string
  content: string
  type: 'info' | 'warning' | 'success' | 'system'
  category: string
  is_read: boolean
  read_time: string | null
  source_id: string | null
  source_type: string | null
  create_time: string
}

export interface NotificationCount {
  total: number
  by_type: Record<string, number>
}

export interface NotificationListParams {
  page?: number
  page_size?: number
  is_read?: boolean | null
  category?: string
}

export interface NotificationListResponse {
  items: Notification[]
  total: number
  page: number
  page_size: number
}
