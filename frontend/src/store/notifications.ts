import { create } from 'zustand'
import type { Notification, NotificationCount } from '../types/notification'
import {
  deleteNotificationApi,
  fetchNotificationCountApi,
  fetchNotificationsApi,
  fetchUnreadNotificationsApi,
  markAllNotificationsAsReadApi,
  markNotificationAsReadApi,
} from '../api/notifications'

interface NotificationState {
  notifications: Notification[]
  unreadNotifications: Notification[]
  count: NotificationCount | null
  loading: boolean
  total: number
  page: number
  pageSize: number
  fetchNotifications: (params?: { page?: number; pageSize?: number; isRead?: boolean | null }) => Promise<void>
  fetchUnreadNotifications: (limit?: number) => Promise<void>
  fetchCount: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  deleteNotification: (id: string) => Promise<void>
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadNotifications: [],
  count: null,
  loading: false,
  total: 0,
  page: 1,
  pageSize: 10,

  fetchNotifications: async (params = {}) => {
    set({ loading: true })
    try {
      const response = await fetchNotificationsApi({
        page: params.page || 1,
        page_size: params.pageSize || 10,
        is_read: params.isRead,
      })
      set({
        notifications: response.data.items || [],
        total: response.data.total || 0,
        page: response.data.page || 1,
        pageSize: response.data.page_size || 10,
      })
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
      set({ notifications: [], total: 0 })
    } finally {
      set({ loading: false })
    }
  },

  fetchUnreadNotifications: async (limit = 10) => {
    try {
      const response = await fetchUnreadNotificationsApi(limit)
      set({ unreadNotifications: response.data || [] })
    } catch (error) {
      console.error('Failed to fetch unread notifications:', error)
      set({ unreadNotifications: [] })
    }
  },

  fetchCount: async () => {
    try {
      const response = await fetchNotificationCountApi()
      set({ count: response.data })
    } catch (error) {
      console.error('Failed to fetch notification count:', error)
    }
  },

  markAsRead: async (id: string) => {
    try {
      await markNotificationAsReadApi(id)
      // 更新本地状态
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadNotifications: state.unreadNotifications.filter((n) => n.id !== id),
        count: state.count
          ? { ...state.count, total: Math.max(0, state.count.total - 1) }
          : null,
      }))
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllNotificationsAsReadApi()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
        unreadNotifications: [],
        count: state.count ? { ...state.count, total: 0, by_type: {} } : null,
      }))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await deleteNotificationApi(id)
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadNotifications: state.unreadNotifications.filter((n) => n.id !== id),
      }))
    } catch (error) {
      console.error('Failed to delete notification:', error)
    }
  },
}))
