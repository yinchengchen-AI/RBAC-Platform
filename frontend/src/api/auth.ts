import request from '../utils/request'
import type { ApiResponse, CurrentUser, LoginPayload } from '../types'

export const loginApi = (payload: LoginPayload) =>
  request.post<ApiResponse<{ access_token: string; refresh_token: string; token_type: string; user: CurrentUser }>>('/auth/login', payload)

export const fetchMeApi = () => request.get<ApiResponse<CurrentUser>>('/auth/me')

export const logoutApi = (payload?: { refresh_token?: string | null }) =>
  request.post<ApiResponse<null>>('/auth/logout', payload || {})

// 更新个人资料
export const updateProfileApi = (payload: {
  nickname: string
  email?: string
  phone?: string
  avatar_url?: string
}) => request.put<ApiResponse<CurrentUser>>('/users/me/profile', payload)

// 上传头像
export const uploadAvatarApi = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  // 不设置 Content-Type，让浏览器自动设置（包含 boundary）
  return request.post<ApiResponse<{ url: string }>>('/users/me/avatar', formData)
}

// 修改密码
export const changePasswordApi = (payload: {
  old_password: string
  new_password: string
}) => request.patch<ApiResponse<null>>('/users/me/password', payload)
