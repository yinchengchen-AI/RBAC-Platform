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

export function hasRouteAccess(user: CurrentUser | null, pathname: string): boolean {
  if (!user) {
    return false
  }
  if (user.is_superuser) {
    return true
  }
  if (pathname === '/dashboard' || pathname === '/profile') {
    return true
  }
  return user.menus.some((menu) => menu.route_path === pathname && menu.type === 'menu')
}
