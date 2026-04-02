import { Navigate, RouterProvider, createBrowserRouter } from 'react-router-dom'
import { Spin } from 'antd'
import { Suspense, lazy, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'

import { hasRouteAccess } from '../access'
import { DashboardLayout } from '../layouts/dashboard-layout'
import { useAuthStore } from '../store/auth'

const DashboardPage = lazy(() => import('../pages/dashboard').then((module) => ({ default: module.DashboardPage })))
const TodosPage = lazy(() => import('../pages/todos'))
const DepartmentsPage = lazy(() => import('../pages/departments').then((module) => ({ default: module.DepartmentsPage })))
const DictsPage = lazy(() => import('../pages/dicts').then((module) => ({ default: module.DictsPage })))
const ConfigsPage = lazy(() => import('../pages/configs').then((module) => ({ default: module.ConfigsPage })))
const DocumentsPage = lazy(() => import('../pages/documents').then((module) => ({ default: module.DocumentsPage })))
const LoginPage = lazy(() => import('../pages/login').then((module) => ({ default: module.LoginPage })))
const LogsPage = lazy(() => import('../pages/logs').then((module) => ({ default: module.LogsPage })))
const PermissionsPage = lazy(() => import('../pages/permissions').then((module) => ({ default: module.PermissionsPage })))
const ProfilePage = lazy(() => import('../pages/profile').then((module) => ({ default: module.ProfilePage })))
const RolesPage = lazy(() => import('../pages/roles').then((module) => ({ default: module.RolesPage })))
const UsersPage = lazy(() => import('../pages/users').then((module) => ({ default: module.UsersPage })))
const CompaniesPage = lazy(() => import('../pages/companies').then((module) => ({ default: module.CompaniesPage })))
const ContractsPage = lazy(() => import('../pages/contracts').then((module) => ({ default: module.ContractsPage })))
const ServicesPage = lazy(() => import('../pages/services').then((module) => ({ default: module.ServicesPage })))
const FinancePage = lazy(() => import('../pages/finance').then((module) => ({ default: module.FinancePage })))

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

  if (!currentUser && !loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
        <Spin size="large" />
      </div>
    )
  }

  if (currentUser && !hasRouteAccess(currentUser, pathname)) {
    return <Navigate to="/dashboard" replace />
  }

  return <DashboardLayout />
}

export function AppRouter() {
  const router = useMemo(
    () =>
      createBrowserRouter([
        { path: '/login', element: <PageLoader><LoginPage /></PageLoader> },
        {
          path: '/',
          element: <ProtectedRoute />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <PageLoader><DashboardPage /></PageLoader> },
            { path: '/todos', element: <PageLoader><TodosPage /></PageLoader> },
            { path: '/departments', element: <PageLoader><DepartmentsPage /></PageLoader> },
            { path: '/dicts', element: <PageLoader><DictsPage /></PageLoader> },
            { path: '/configs', element: <PageLoader><ConfigsPage /></PageLoader> },
            { path: '/users', element: <PageLoader><UsersPage /></PageLoader> },
            { path: '/roles', element: <PageLoader><RolesPage /></PageLoader> },
            { path: '/permissions', element: <PageLoader><PermissionsPage /></PageLoader> },
            { path: '/documents', element: <PageLoader><DocumentsPage /></PageLoader> },
            { path: '/logs', element: <PageLoader><LogsPage /></PageLoader> },
            { path: '/profile', element: <PageLoader><ProfilePage /></PageLoader> },
            { path: '/companies', element: <PageLoader><CompaniesPage /></PageLoader> },
            { path: '/contracts', element: <PageLoader><ContractsPage /></PageLoader> },
            { path: '/services', element: <PageLoader><ServicesPage /></PageLoader> },
            { path: '/finance', element: <PageLoader><FinancePage /></PageLoader> },
            { path: '*', element: <Navigate to="/dashboard" replace /> },
          ],
        },
      ]),
    [],
  )

  return <RouterProvider router={router} />
}
