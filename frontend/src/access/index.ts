import type { CurrentUser } from '../types'

type RouteRequirement = string | string[]

const ROUTE_PERMISSIONS: Record<string, RouteRequirement | undefined> = {
  '/dashboard': undefined,
  '/todos': undefined,
  '/profile': undefined,
  '/users': 'system:user:view',
  '/roles': 'system:role:view',
  '/permissions': 'system:permission:view',
  '/departments': 'system:department:view',
  '/dicts': 'system:dict:view',
  '/configs': 'system:config:view',
  '/logs': 'system:log:view',
  '/documents': 'system:file:view',
  '/companies': 'business:company:view',
  '/contracts': 'business:contract:view',
  '/services': 'business:service:view',
  '/finance': ['business:invoice:view', 'business:payment:view'],
}

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

export function hasAnyPermission(
  user: CurrentUser | null,
  permissions?: string[],
): boolean {
  if (!permissions || permissions.length === 0) {
    return true
  }
  return permissions.some((permission) => hasPermission(user, permission))
}

export function getRouteRequirement(pathname: string): RouteRequirement | undefined {
  return ROUTE_PERMISSIONS[pathname]
}

export function hasRouteAccess(user: CurrentUser | null, pathname: string): boolean {
  if (!user) {
    return false
  }

  const requirement = getRouteRequirement(pathname)
  if (!requirement) {
    return true
  }
  if (Array.isArray(requirement)) {
    return hasAnyPermission(user, requirement)
  }
  return hasPermission(user, requirement)
}
