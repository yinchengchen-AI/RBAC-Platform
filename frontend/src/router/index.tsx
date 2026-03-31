import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Spin } from 'antd'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import type { RouteObject } from 'react-router-dom'
import type { ReactNode } from 'react'

import { hasRouteAccess } from '../access'
import { DashboardLayout } from '../layouts/dashboard-layout'
import { useAuthStore } from '../store/auth'
import type { MenuItem } from '../types'

const DashboardPage = lazy(() => import('../pages/dashboard').then((module) => ({ default: module.DashboardPage })))
const DepartmentsPage = lazy(() => import('../pages/departments').then((module) => ({ default: module.DepartmentsPage })))
const DictsPage = lazy(() => import('../pages/dicts').then((module) => ({ default: module.DictsPage })))
const ConfigsPage = lazy(() => import('../pages/configs').then((module) => ({ default: module.ConfigsPage })))
const FilesPage = lazy(() => import('../pages/files').then((module) => ({ default: module.FilesPage })))
const LoginPage = lazy(() => import('../pages/login').then((module) => ({ default: module.LoginPage })))
const LogsPage = lazy(() => import('../pages/logs').then((module) => ({ default: module.LogsPage })))
const MenusPage = lazy(() => import('../pages/menus').then((module) => ({ default: module.MenusPage })))
const PermissionsPage = lazy(() => import('../pages/permissions').then((module) => ({ default: module.PermissionsPage })))
const ProfilePage = lazy(() => import('../pages/profile').then((module) => ({ default: module.ProfilePage })))
const RolesPage = lazy(() => import('../pages/roles').then((module) => ({ default: module.RolesPage })))
const UsersPage = lazy(() => import('../pages/users').then((module) => ({ default: module.UsersPage })))

function PageLoader({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
          <Spin size="large" />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

const routeComponentMap: Record<string, ReactNode> = {
  '/dashboard': <PageLoader><DashboardPage /></PageLoader>,
  '/departments': <PageLoader><DepartmentsPage /></PageLoader>,
  '/dicts': <PageLoader><DictsPage /></PageLoader>,
  '/configs': <PageLoader><ConfigsPage /></PageLoader>,
  '/users': <PageLoader><UsersPage /></PageLoader>,
  '/roles': <PageLoader><RolesPage /></PageLoader>,
  '/permissions': <PageLoader><PermissionsPage /></PageLoader>,
  '/menus': <PageLoader><MenusPage /></PageLoader>,
  '/files': <PageLoader><FilesPage /></PageLoader>,
  '/logs': <PageLoader><LogsPage /></PageLoader>,
  '/profile': <PageLoader><ProfilePage /></PageLoader>,
}

function buildDynamicRoutes(menus: MenuItem[]): RouteObject[] {
  const routePaths = Array.from(
    new Set(
      menus
        .filter((menu) => menu.type === 'menu' && menu.route_path)
        .map((menu) => menu.route_path as string),
    ),
  )

  return routePaths
    .filter((path) => routeComponentMap[path])
    .map((path) => ({ path, element: routeComponentMap[path] }))
}

function ProtectedRoute() {
  const { currentUser, loadMe, loading } = useAuthStore()
  const pathname = window.location.pathname

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  if (loading && !currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (!localStorage.getItem('access_token')) {
    return <Navigate to="/login" replace />
  }

  if (currentUser && !hasRouteAccess(currentUser, pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return <DashboardLayout />
}

export function AppRouter() {
  const currentUser = useAuthStore((state) => state.currentUser)

  const router = useMemo(
    () =>
      createBrowserRouter([
        { path: '/login', element: <PageLoader><LoginPage /></PageLoader> },
        {
          path: '/',
          element: <ProtectedRoute />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            ...buildDynamicRoutes(currentUser?.menus || []),
            { path: '/dashboard', element: <PageLoader><DashboardPage /></PageLoader> },
            { path: '/profile', element: <PageLoader><ProfilePage /></PageLoader> },
            { path: '*', element: <Navigate to="/dashboard" replace /> },
          ],
        },
      ]),
    [currentUser?.menus],
  )

  return <RouterProvider router={router} />
}
