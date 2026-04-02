import {
  ApartmentOutlined,
  BookOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  FolderOpenOutlined,
  IdcardOutlined,
  LockOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
  AppstoreOutlined,
  ToolOutlined,
  CheckSquareOutlined,
  DownOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, Layout, Menu, Space, Typography } from 'antd'
import { useTodoStore } from '../store/todos'
import type { MenuProps } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import { useAuthStore } from '../store/auth'
import { NotificationDropdown } from '../components/notification-dropdown'

const { Header, Sider, Content } = Layout

type AntdMenuItem = NonNullable<MenuProps['items']>[number]

// 静态菜单配置
const STATIC_MENU_ITEMS: AntdMenuItem[] = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: '工作台',
  },
  {
    key: 'divider-1',
    type: 'divider',
    style: { margin: '8px 16px' },
  },
  {
    key: 'group-business',
    icon: <AppstoreOutlined />,
    label: '业务中心',
    children: [
      { key: '/companies', icon: <TeamOutlined />, label: '客户管理' },
      { key: '/contracts', icon: <BookOutlined />, label: '合同管理' },
      { key: '/services', icon: <ToolOutlined />, label: '服务管理' },
      { key: '/finance', icon: <FolderOpenOutlined />, label: '财务管理' },
      { key: '/documents', icon: <FolderOpenOutlined />, label: '文档管理' },
    ],
  },
  {
    key: 'group-system',
    icon: <SettingOutlined />,
    label: '系统管理',
    children: [
      { key: '/users', icon: <UserOutlined />, label: '用户管理' },
      { key: '/roles', icon: <SafetyCertificateOutlined />, label: '角色管理' },
      { key: '/permissions', icon: <LockOutlined />, label: '权限管理' },
      { key: '/departments', icon: <ApartmentOutlined />, label: '部门管理' },
      { key: '/dicts', icon: <BookOutlined />, label: '数据字典' },
      { key: '/configs', icon: <FileSearchOutlined />, label: '系统参数' },
    ],
  },
  {
    key: 'group-ops',
    icon: <ToolOutlined />,
    label: '运维中心',
    children: [
      { key: '/logs', icon: <FileSearchOutlined />, label: '日志审计' },
    ],
  },
]

export function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, logout } = useAuthStore()
  const { count, fetchCount } = useTodoStore()

  // 获取待办数量
  useEffect(() => {
    fetchCount()
  }, [])

  const menuItems = STATIC_MENU_ITEMS

  return (
    <Layout className="app-shell" style={{ minHeight: '100vh' }}>
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0" 
        width={280} 
        className="app-sider"
        style={{
          position: 'fixed',
          left: 16,
          top: 16,
          bottom: 16,
          zIndex: 100,
          borderRadius: 32,
          overflow: 'hidden',
        }}
      >
        <div className="menu-logo">
          <Space>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <SafetyCertificateOutlined style={{ color: '#fff', fontSize: 16 }} />
            </div>
            <span>RBAC Platform</span>
          </Space>
        </div>
        
        <div className="menu-container">
          <Menu
            theme="light"
            mode="inline"
            inlineCollapsed={false}
            inlineIndent={16}
            openKeys={undefined}
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => navigate(key)}
            className="app-menu accordion-menu"
          />
        </div>
      </Sider>
      
      <Layout 
        className="app-main" 
        style={{ 
          marginLeft: 312,
          marginRight: 16,
          minHeight: 'calc(100vh - 32px)',
          background: 'transparent',
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <Header className="app-header">
          {/* 左侧：页面标题 */}
          <div className="header-left">
            <Typography.Title level={5} style={{ margin: 0, fontWeight: 600 }}>
              {(menuItems?.find(item => item?.key === location.pathname) as { label?: string })?.label || 
               (menuItems?.flatMap(item => (item as { children?: Array<{ key: string; label: string }> })?.children || [])
                 .find(child => child?.key === location.pathname))?.label || 
               '工作台'}
            </Typography.Title>
          </div>

          {/* 右侧：功能按钮区 */}
          <div className="header-actions">
            {/* 待办事项 */}
            <Badge
              count={count?.pending || 0}
              size="small"
              offset={[0, 2]}
              style={{ backgroundColor: '#ff4d4f' }}
            >
              <Button
                type="text"
                icon={<CheckSquareOutlined />}
                onClick={() => navigate('/todos')}
                style={{ color: '#595959' }}
              >
                待办
              </Button>
            </Badge>

            {/* 通知 */}
            <NotificationDropdown />

            {/* 用户菜单 */}
            <Dropdown
              menu={{
                items: [
                  { key: '/profile', label: '个人中心', icon: <IdcardOutlined /> },
                  { key: '/todos', label: '待办事项', icon: <CheckSquareOutlined /> },
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
              placement="bottomRight"
            >
              <Button 
                type="text" 
                className="header-account-btn" 
                style={{ height: 'auto', padding: '4px 8px', border: 'none', boxShadow: 'none' }}
              >
                <Space align="center" size={8}>
                  <Avatar 
                    size="small" 
                    src={currentUser?.avatar_url}
                    icon={!currentUser?.avatar_url ? <UserOutlined /> : undefined}
                    style={{ background: '#f0f0f0', color: '#595959' }}
                  />
                  <Typography.Text style={{ fontSize: 14, color: '#1a1a1a' }}>
                    {currentUser?.nickname || currentUser?.username}
                  </Typography.Text>
                  <DownOutlined style={{ fontSize: 12, color: '#8c8c8c' }} />
                </Space>
              </Button>
            </Dropdown>
          </div>
        </Header>
        <Content className="app-content" style={{ padding: '0 24px 24px' }}>
          <div className="content-wrapper">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
