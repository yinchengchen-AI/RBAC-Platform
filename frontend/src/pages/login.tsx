import { Button, Card, Form, Input, Space, Typography } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { currentUser, login, loading } = useAuthStore()

  useEffect(() => {
    if (localStorage.getItem('access_token') && currentUser) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  return (
    <div className="login-shell">
      <div className="login-brand">
        <div>
          <Typography.Text style={{ color: '#c7d2fe' }}>安全、清晰、可扩展</Typography.Text>
          <h1>用户角色权限管理平台</h1>
          <p>
            面向未来业务模块扩展设计，统一承载用户、角色、菜单、按钮权限、文件上传和操作审计能力。
          </p>
        </div>
        <Space direction="vertical" size={4}>
          <Typography.Text style={{ color: '#c7d2fe' }}>默认管理员</Typography.Text>
          <Typography.Text style={{ color: '#eef2ff' }}>admin / Admin@123456</Typography.Text>
        </Space>
      </div>
      <div className="login-card-wrap">
        <Card className="login-card" bordered={false}>
          <Space direction="vertical" size={24} style={{ width: '100%' }}>
            <Space direction="vertical" size={4}>
              <Typography.Title level={2} style={{ margin: 0 }}>
                登录系统
              </Typography.Title>
              <Typography.Text type="secondary">输入账号密码进入权限管理后台</Typography.Text>
            </Space>

            <Form
              layout="vertical"
              initialValues={{ username: 'admin', password: 'Admin@123456' }}
              onFinish={async (values) => {
                await login(values)
                navigate('/dashboard')
              }}
            >
              <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input prefix={<UserOutlined />} size="large" placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password prefix={<LockOutlined />} size="large" placeholder="请输入密码" />
              </Form.Item>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                登录
              </Button>
            </Form>
          </Space>
        </Card>
      </div>
    </div>
  )
}
