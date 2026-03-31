import request from '../utils/request'
import type { ApiResponse, LoginLogItem, OperationLogItem, PageResult } from '../types'

export const fetchLoginLogsApi = (params?: {
  page?: number
  page_size?: number
  username?: string
  status?: string
}) => request.get<ApiResponse<PageResult<LoginLogItem>>>('/logs/login', { params })

export const fetchOperationLogsApi = (params?: {
  page?: number
  page_size?: number
  username?: string
  result?: string
  action?: string
}) => request.get<ApiResponse<PageResult<OperationLogItem>>>('/logs/operation', { params })
