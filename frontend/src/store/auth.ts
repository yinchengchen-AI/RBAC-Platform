import { create } from 'zustand'

import { fetchMeApi, loginApi, logoutApi } from '../api/auth'
import type { CurrentUser, LoginPayload } from '../types'

interface AuthState {
  currentUser: CurrentUser | null
  loading: boolean
  setCurrentUser: (user: CurrentUser | null) => void
  login: (payload: LoginPayload) => Promise<void>
  loadMe: () => Promise<void>
  logout: () => Promise<void>
}

const userCache = localStorage.getItem('current_user')

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: userCache ? (JSON.parse(userCache) as CurrentUser) : null,
  loading: false,
  setCurrentUser: (user) => {
    if (user) {
      localStorage.setItem('current_user', JSON.stringify(user))
    } else {
      localStorage.removeItem('current_user')
    }
    set({ currentUser: user })
  },
  login: async (payload) => {
    set({ loading: true })
    try {
      const response = await loginApi(payload)
      localStorage.setItem('access_token', response.data.data.access_token)
      localStorage.setItem('refresh_token', response.data.data.refresh_token)
      localStorage.setItem('current_user', JSON.stringify(response.data.data.user))
      set({ currentUser: response.data.data.user })
    } finally {
      set({ loading: false })
    }
  },
  loadMe: async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      set({ currentUser: null })
      return
    }
    set({ loading: true })
    try {
      const response = await fetchMeApi()
      localStorage.setItem('current_user', JSON.stringify(response.data.data))
      set({ currentUser: response.data.data })
    } finally {
      set({ loading: false })
    }
  },
  logout: async () => {
    try {
      await logoutApi({ refresh_token: localStorage.getItem('refresh_token') })
    } catch {
      // 后端不可达时也允许本地退出
    }
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('current_user')
    set({ currentUser: null })
  },
}))
