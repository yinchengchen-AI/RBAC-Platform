import { Button, Form, Input, Typography, Divider, App } from 'antd'
import { LockOutlined, UserOutlined, SafetyCertificateOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '../store/auth'

export function LoginPage() {
  const navigate = useNavigate()
  const { currentUser, login, loading } = useAuthStore()
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const { message } = App.useApp()

  useEffect(() => {
    if (localStorage.getItem('access_token') && currentUser) {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  return (
    <div className="login-shell">
      {/* 左侧品牌区域 */}
      <div className="login-brand">
        <div className="login-brand-content">
          <div className="brand-logo">
            <div className="logo-icon">
              <SafetyCertificateOutlined />
            </div>
            <span className="logo-text">RBAC Platform</span>
          </div>

          <div className="brand-hero">
            <h1>
              用户角色权限
              <br />
              管理平台
            </h1>
          </div>

          <div className="brand-features">
            <div className="feature-item">
              <div className="feature-dot" />
              <span>RBAC 权限模型</span>
            </div>
            <div className="feature-item">
              <div className="feature-dot" />
              <span>企业级安全</span>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧表单区域 */}
      <div className="login-form-section">
        <div className="login-form-container">
          <div className="form-header">
            <Typography.Title level={3} className="form-title">
              欢迎回来
            </Typography.Title>
            <Typography.Text className="form-subtitle">
              请登录您的账户以继续
            </Typography.Text>
          </div>

          <Form
            className="login-form"
            layout="vertical"
            initialValues={{ username: '', password: '' }}
            onFinish={async (values) => {
              try {
                await login(values)
                navigate('/dashboard')
              } catch (error: any) {
                const errorMsg = error.response?.data?.detail || '登录失败，请检查用户名和密码'
                message.error(errorMsg)
              }
            }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
              className={focusedField === 'username' ? 'field-focused' : ''}
            >
              <div className="modern-input">
                <div className="input-icon">
                  <UserOutlined />
                </div>
                <Input
                  placeholder="请输入用户名"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  bordered={false}
                />
              </div>
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
              className={focusedField === 'password' ? 'field-focused' : ''}
            >
              <div className="modern-input">
                <div className="input-icon">
                  <LockOutlined />
                </div>
                <Input.Password
                  placeholder="请输入密码"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  bordered={false}
                />
              </div>
            </Form.Item>

            <Form.Item className="submit-item">
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={loading}
                className="login-submit-btn"
              >
                <span>登录</span>
                <ArrowRightOutlined />
              </Button>
            </Form.Item>
          </Form>

          <Divider className="login-divider">
            <span>默认账号</span>
          </Divider>

          <div className="demo-account">
            <div className="demo-item">
              <span className="demo-label">用户名</span>
              <span className="demo-value">admin</span>
            </div>
            <div className="demo-divider" />
            <div className="demo-item">
              <span className="demo-label">密码</span>
              <span className="demo-value">Admin@123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
