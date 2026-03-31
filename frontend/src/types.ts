export interface LoginPayload {
  username: string
  password: string
}

export interface MenuItem {
  id: string
  parent_id?: string
  name: string
  route_path?: string
  component?: string
  icon?: string
  type: string
  permission_code?: string
  sort: number
  visible?: boolean
}

export interface RoleSummary {
  id: string
  name: string
  code: string
}

export interface CurrentUser {
  id: string
  username: string
  nickname: string
  email?: string
  phone?: string
  avatar_url?: string
  is_superuser: boolean
  permissions: string[]
  menus: MenuItem[]
  roles: RoleSummary[]
}

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  page_size: number
}

export interface UserItem {
  id: string
  username: string
  nickname: string
  department_id?: string
  department_name?: string
  email?: string
  phone?: string
  avatar_url?: string
  status: number
  is_superuser: boolean
  roles: RoleSummary[]
}

export interface PermissionItem {
  id: string
  code: string
  name: string
  module?: string
  description?: string
}

export interface BackendMenuItem {
  id: string
  parent_id?: string
  name: string
  type: string
  route_path?: string
  component?: string
  icon?: string
  sort: number
  permission_code?: string
  visible: boolean
}

export interface RoleItem {
  id: string
  code: string
  name: string
  description?: string
  status: number
  data_scope_type: string
  data_scope_department_ids: string[]
  permissions: Array<Pick<PermissionItem, 'id' | 'code' | 'name'>>
  menus: Array<Pick<BackendMenuItem, 'id' | 'name' | 'route_path'>>
}

export interface FileItem {
  id: string
  filename: string
  object_name: string
  bucket_name: string
  url: string
  content_type?: string
  size: number
}

export interface LoginLogItem {
  id: string
  username: string
  ip?: string
  status: string
  message?: string
  create_time: string
}

export interface OperationLogItem {
  id: string
  user_id?: string
  username?: string
  action: string
  target?: string
  detail?: Record<string, unknown>
  result: string
  error_message?: string
  create_time: string
}
