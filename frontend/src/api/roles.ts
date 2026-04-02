import request from '../utils/request'
import type { ApiResponse, RoleItem } from '../types'

export const fetchRolesApi = () => request.get<ApiResponse<RoleItem[]>>('/roles')

export const createRoleApi = (payload: {
  code: string
  name: string
  description?: string
  status: number
  permission_ids: string[]
  data_scope_type: string
  data_scope_department_ids: string[]
}) => request.post<ApiResponse<RoleItem>>('/roles', payload)

export const updateRoleApi = (
  roleId: string,
  payload: {
    name: string
    description?: string
    status: number
    permission_ids: string[]
    data_scope_type: string
    data_scope_department_ids: string[]
  },
) => request.put<ApiResponse<RoleItem>>(`/roles/${roleId}`, payload)

export const deleteRoleApi = (roleId: string) => request.delete<ApiResponse<null>>(`/roles/${roleId}`)
