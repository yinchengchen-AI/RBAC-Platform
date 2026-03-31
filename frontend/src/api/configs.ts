import request from '../utils/request'
import type { ApiResponse } from '../types'

export interface ConfigItem {
  id: string
  name: string
  key: string
  value: string
  value_type: string
  status: number
  description?: string
}

export const fetchConfigsApi = () => request.get<ApiResponse<ConfigItem[]>>('/configs')
export const createConfigApi = (payload: Omit<ConfigItem, 'id'>) => request.post<ApiResponse<ConfigItem>>('/configs', payload)
export const updateConfigApi = (configId: string, payload: Omit<ConfigItem, 'id' | 'key'>) => request.put<ApiResponse<ConfigItem>>(`/configs/${configId}`, payload)
export const deleteConfigApi = (configId: string) => request.delete<ApiResponse<null>>(`/configs/${configId}`)
export const exportConfigsApi = () => request.get('/configs/export', { responseType: 'blob' })
export const importConfigsApi = (formData: FormData) => request.post<ApiResponse<null>>('/configs/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
