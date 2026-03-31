import request from '../utils/request'
import type { ApiResponse } from '../types'

export interface DictTypeItem {
  id: string
  name: string
  code: string
  status: number
  description?: string
}

export interface DictItem {
  id: string
  dict_code: string
  label: string
  value: string
  sort: number
  status: number
}

export const fetchDictTypesApi = () => request.get<ApiResponse<DictTypeItem[]>>('/dicts/types')
export const createDictTypeApi = (payload: Omit<DictTypeItem, 'id'>) => request.post<ApiResponse<DictTypeItem>>('/dicts/types', payload)
export const updateDictTypeApi = (dictTypeId: string, payload: Omit<DictTypeItem, 'id' | 'code'>) => request.put<ApiResponse<DictTypeItem>>(`/dicts/types/${dictTypeId}`, payload)
export const deleteDictTypeApi = (dictTypeId: string) => request.delete<ApiResponse<null>>(`/dicts/types/${dictTypeId}`)
export const fetchDictItemsApi = (dictCode: string) => request.get<ApiResponse<DictItem[]>>('/dicts/items', { params: { dict_code: dictCode } })
export const createDictItemApi = (payload: Omit<DictItem, 'id'>) => request.post<ApiResponse<DictItem>>('/dicts/items', payload)
export const updateDictItemApi = (dictItemId: string, payload: Omit<DictItem, 'id' | 'dict_code'>) => request.put<ApiResponse<DictItem>>(`/dicts/items/${dictItemId}`, payload)
export const deleteDictItemApi = (dictItemId: string) => request.delete<ApiResponse<null>>(`/dicts/items/${dictItemId}`)
export const exportDictItemsApi = (dictCode: string) => request.get(`/dicts/items/export?dict_code=${encodeURIComponent(dictCode)}`, { responseType: 'blob' })
export const importDictItemsApi = (dictCode: string, formData: FormData) => request.post<ApiResponse<null>>(`/dicts/items/import?dict_code=${encodeURIComponent(dictCode)}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
