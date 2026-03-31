import {
  ApartmentOutlined,
  BookOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Avatar, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import type { ReactNode } from 'react'

import { useAuthStore } from '../store/auth'
import type { MenuItem } from '../types'

const { Header, Sider, Content } = Layout

const iconMap: Record<string, ReactNode> = {
  DashboardOutlined: <DashboardOutlined />,
  ApartmentOutlined: <ApartmentOutlined />,
  BookOutlined: <BookOutlined />,
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  SafetyCertificateOutlined: <SafetyCertificateOutlined />,
  SettingOutlined: <SettingOutlined />,
  MenuOutlined: <MenuOutlined />,
  FolderOpenOutlined: <FolderOpenOutlined />,
  FileSearchOutlined: <FileSearchOutlined />,
  IdcardOutlined: <IdcardOutlined />,
}

type AntdMenuItem = NonNullable<MenuProps['items']>[number]

type MenuNode = {
  key: string
  icon: ReactNode
  label: string
  sort: number
  parentId?: string
  children: MenuNode[]
}

function normalizeMenus(menus: MenuItem[]): AntdMenuItem[] {
  const routeMenus = menus.filter((item) => item.type === 'menu' && item.route_path && item.visible !== false)
  const menuMap = new Map<string, MenuNode>(
    routeMenus.map((item) => [
      item.id,
      {
        key: item.route_path as string,
        icon: iconMap[item.icon || ''] || <LockOutlined />,
        label: item.name,
        sort: item.sort,
        parentId: item.parent_id,
        children: [],
      },
    ]),
  )

  const roots: MenuNode[] = []
  for (const item of routeMenus) {
    const current = menuMap.get(item.id)
    if (!current) {
      continue
    }
    if (item.parent_id && menuMap.has(item.parent_id)) {
      const parent = menuMap.get(item.parent_id)
      parent?.children.push(current)
    } else {
      roots.push(current)
    }
  }

  const sortNodes = (nodes: MenuNode[]): AntdMenuItem[] => {
    nodes.sort((a, b) => a.sort - b.sort)
    return nodes.map(({ sort, parentId, children, ...rest }) => {
      const normalizedChildren = sortNodes(children)
      return normalizedChildren.length ? { ...rest, children: normalizedChildren } : rest
    })
  }

  return sortNodes(roots)
}

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuthStore()

  const menuItems = useMemo(() => normalizeMenus(currentUser?.menus || []), [currentUser?.menus])

  return (
    <Layout className="app-shell">
      <Sider breakpoint="lg" collapsedWidth="0" width={268} className="app-sider">
        <div className="menu-logo">RBAC Platform</div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="app-menu"
        />
      </Sider>
      <Layout className="app-main">
        <Header className="app-header">
          <Space direction="vertical" size={0}>
            <Typography.Text type="secondary">权限中台</Typography.Text>
            <Typography.Title level={5} style={{ margin: 0 }}>
              统一用户、角色与权限管理
            </Typography.Title>
          </Space>
          <div className="header-actions">
            <Space>
              <Avatar icon={<UserOutlined />} />
              <span className="mobile-hidden">{currentUser?.nickname || currentUser?.username}</span>
            </Space>
            <Dropdown
              menu={{
                items: [
                  { key: '/profile', label: '个人中心', icon: <IdcardOutlined /> },
                  { type: 'divider' },
                  { key: 'logout', label: '退出登录', icon: <LogoutOutlined /> },
                ],
                onClick: async ({ key }) => {
                  if (key === 'logout') {
                    await logout()
                    navigate('/login')
                    return
                  }
                  navigate(String(key))
                },
              }}
            >
              <Button className="header-account-btn">账户</Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
