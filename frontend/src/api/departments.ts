import request from '../utils/request'
import type { ApiResponse } from '../types'

export interface DepartmentItem {
  id: string
  parent_id?: string
  name: string
  code: string
  leader?: string
  phone?: string
  sort: number
  status: number
}

export const fetchDepartmentsApi = () => request.get<ApiResponse<DepartmentItem[]>>('/departments')
export const createDepartmentApi = (payload: Omit<DepartmentItem, 'id'>) => request.post<ApiResponse<DepartmentItem>>('/departments', payload)
export const updateDepartmentApi = (departmentId: string, payload: Omit<DepartmentItem, 'id' | 'code'> & { parent_id?: string }) => request.put<ApiResponse<DepartmentItem>>(`/departments/${departmentId}`, payload)
export const deleteDepartmentApi = (departmentId: string) => request.delete<ApiResponse<null>>(`/departments/${departmentId}`)
