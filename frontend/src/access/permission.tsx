import type { ReactNode } from 'react'

import { hasPermission } from './index'
import { useAuthStore } from '../store/auth'

interface PermissionProps {
  permission?: string
  children: ReactNode
  fallback?: ReactNode
}

export function Permission({ permission, children, fallback = null }: PermissionProps) {
  const currentUser = useAuthStore((state) => state.currentUser)
  return hasPermission(currentUser, permission) ? <>{children}</> : <>{fallback}</>
}
