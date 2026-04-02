import request from '../utils/request'
import type {
  Notification,
  NotificationCount,
  NotificationListParams,
  NotificationListResponse,
} from '../types/notification'

export const fetchNotificationsApi = (params?: NotificationListParams) =>
  request.get<NotificationListResponse>('/notifications', { params })

export const fetchUnreadNotificationsApi = (limit?: number) =>
  request.get<Notification[]>('/notifications/unread', {
    params: { limit },
  })

export const fetchNotificationCountApi = () =>
  request.get<NotificationCount>('/notifications/count')

export const markNotificationAsReadApi = (id: string) =>
  request.post(`/notifications/${id}/read`)

export const markAllNotificationsAsReadApi = () =>
  request.post('/notifications/read-all')

export const deleteNotificationApi = (id: string) =>
  request.delete(`/notifications/${id}`)
