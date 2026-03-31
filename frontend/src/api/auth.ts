import request from '../utils/request'
import type { ApiResponse, CurrentUser, LoginPayload } from '../types'

export const loginApi = (payload: LoginPayload) =>
  request.post<ApiResponse<{ access_token: string; refresh_token: string; token_type: string; user: CurrentUser }>>('/auth/login', payload)

export const fetchMeApi = () => request.get<ApiResponse<CurrentUser>>('/auth/me')

export const logoutApi = (payload?: { refresh_token?: string | null }) =>
  request.post<ApiResponse<null>>('/auth/logout', payload || {})
