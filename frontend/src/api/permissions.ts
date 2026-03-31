import request from '../utils/request'
import type { ApiResponse, PermissionItem } from '../types'

export const fetchPermissionsApi = () => request.get<ApiResponse<PermissionItem[]>>('/permissions')

export const createPermissionApi = (payload: {
  code: string
  name: string
  module?: string
  description?: string
}) => request.post<ApiResponse<PermissionItem>>('/permissions', payload)

export const updatePermissionApi = (
  permissionId: string,
  payload: {
    name: string
    module?: string
    description?: string
  },
) => request.put<ApiResponse<PermissionItem>>(`/permissions/${permissionId}`, payload)

export const deletePermissionApi = (permissionId: string) =>
  request.delete<ApiResponse<null>>(`/permissions/${permissionId}`)
