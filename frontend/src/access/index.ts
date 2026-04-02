import type { CurrentUser } from '../types'

export function hasPermission(user: CurrentUser | null, permission?: string): boolean {
  if (!permission) {
    return true
  }
  if (!user) {
    return false
  }
  if (user.is_superuser) {
    return true
  }
  return user.permissions.includes(permission)
}

export function hasRouteAccess(user: CurrentUser | null, _pathname: string): boolean {
  if (!user) {
    return false
  }
  // 所有登录用户都可以访问所有路由
  // 具体权限控制通过按钮权限或页面内权限检查
  return true
}
