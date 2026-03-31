import request from '../utils/request'
import type { ApiResponse, PageResult, UserItem } from '../types'

export const fetchUsersApi = (params?: { page?: number; page_size?: number; keyword?: string }) =>
  request.get<ApiResponse<PageResult<UserItem>>>('/users', { params })

export const createUserApi = (payload: {
  username: string
  nickname: string
  department_id?: string
  email?: string
  phone?: string
  avatar_url?: string
  status: number
  password: string
  role_ids: string[]
}) => request.post<ApiResponse<UserItem>>('/users', payload)

export const updateUserApi = (
  userId: string,
  payload: {
    nickname: string
    department_id?: string
    email?: string
    phone?: string
    avatar_url?: string
    status: number
    role_ids: string[]
  },
) => request.put<ApiResponse<UserItem>>(`/users/${userId}`, payload)

export const resetUserPasswordApi = (userId: string, payload: { password: string }) =>
  request.patch<ApiResponse<null>>(`/users/${userId}/reset-password`, payload)

export const deleteUserApi = (userId: string) => request.delete<ApiResponse<null>>(`/users/${userId}`)
