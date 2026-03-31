import request from '../utils/request'
import type { ApiResponse, BackendMenuItem } from '../types'

export const fetchMenusApi = () => request.get<ApiResponse<BackendMenuItem[]>>('/menus')

export const createMenuApi = (payload: {
  parent_id?: string
  name: string
  type: string
  route_path?: string
  component?: string
  icon?: string
  sort: number
  permission_code?: string
  visible: boolean
}) => request.post<ApiResponse<BackendMenuItem>>('/menus', payload)

export const updateMenuApi = (
  menuId: string,
  payload: {
    parent_id?: string
    name: string
    type: string
    route_path?: string
    component?: string
    icon?: string
    sort: number
    permission_code?: string
    visible: boolean
  },
) => request.put<ApiResponse<BackendMenuItem>>(`/menus/${menuId}`, payload)

export const deleteMenuApi = (menuId: string) => request.delete<ApiResponse<null>>(`/menus/${menuId}`)
