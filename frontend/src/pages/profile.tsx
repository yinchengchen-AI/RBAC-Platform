import { useState, useEffect } from 'react'
import { Card, Form, Input, Button, message, Avatar, Upload, Space, Tabs, Typography } from 'antd'
import { 
  UserOutlined, 
  SaveOutlined, 
  LockOutlined, 
  SafetyOutlined,
  MailOutlined,
  PhoneOutlined,
  EditOutlined,
  CameraOutlined,
  EyeInvisibleOutlined,
  EyeTwoTone
} from '@ant-design/icons'

import { useAuthStore } from '../store/auth'
import { updateProfileApi, uploadAvatarApi, changePasswordApi } from '../api/auth'
import type { CurrentUser } from '../types'

const { Title, Text } = Typography

interface ProfileFormValues {
  nickname: string
  email?: string
  phone?: string
}

interface PasswordFormValues {
  old_password: string
  new_password: string
  confirm_password: string
}

export function ProfilePage() {
  const { currentUser, setCurrentUser } = useAuthStore()
  const [profileForm] = Form.useForm<ProfileFormValues>()
  const [passwordForm] = Form.useForm<PasswordFormValues>()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(currentUser?.avatar_url)
  const [avatarKey, setAvatarKey] = useState(Date.now())
  const [activeTab, setActiveTab] = useState('profile')

  useEffect(() => {
    if (currentUser) {
      profileForm.setFieldsValue({
        nickname: currentUser.nickname,
        email: currentUser.email,
        phone: currentUser.phone,
      })
      // 添加时间戳避免缓存
      setAvatarUrl(currentUser.avatar_url ? `${currentUser.avatar_url}?t=${Date.now()}` : undefined)
    }
  }, [currentUser, profileForm])

  const handleProfileSubmit = async (values: ProfileFormValues) => {
    if (!currentUser) return
    setLoading(true)
    try {
      await updateProfileApi({
        ...values,
        avatar_url: avatarUrl,
      })
      message.success('个人信息保存成功')
      const updatedUser: CurrentUser = {
        ...currentUser,
        nickname: values.nickname,
        email: values.email,
        phone: values.phone,
        avatar_url: avatarUrl,
      }
      setCurrentUser(updatedUser)
    } catch (error) {
      message.error((error as any).response?.data?.detail || '保存失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (values: PasswordFormValues) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的新密码不一致')
      return
    }
    setPasswordLoading(true)
    try {
      await changePasswordApi({
        old_password: values.old_password,
        new_password: values.new_password,
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error) {
      message.error((error as any).response?.data?.detail || '密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    const hide = message.loading('上传中...', 0)
    try {
      const res = await uploadAvatarApi(file)
      const url = res.data.data.url

      // 添加时间戳参数避免图片缓存，并更新 key 强制重新渲染
      const urlWithTimestamp = `${url}?t=${Date.now()}`
      setAvatarUrl(urlWithTimestamp)
      setAvatarKey(Date.now())

      if (currentUser) {
        await updateProfileApi({
          nickname: currentUser.nickname,
          email: currentUser.email,
          phone: currentUser.phone,
          avatar_url: url,
        })
        const updatedUser = { ...currentUser, avatar_url: url }
        setCurrentUser(updatedUser)
      }

      hide()
      message.success('头像更新成功')
      return true
    } catch (error) {
      hide()
      message.error('头像上传失败')
      return false
    }
  }

  // 个人信息 Tab 内容
  const ProfileTab = () => (
    <div style={{ maxWidth: 480 }}>
      <Form
        form={profileForm}
        layout="vertical"
        onFinish={handleProfileSubmit}
      >
        <Form.Item label="用户名">
          <Input 
            value={currentUser?.username} 
            disabled 
            prefix={<UserOutlined />}
            style={{ background: 'var(--bg-subtle)' }}
          />
        </Form.Item>

        <Form.Item
          label="昵称"
          name="nickname"
          rules={[{ required: true, message: '请输入昵称' }]}
        >
          <Input placeholder="请输入昵称" prefix={<EditOutlined />} />
        </Form.Item>

        <Form.Item
          label="邮箱"
          name="email"
          rules={[{ type: 'email', message: '请输入有效的邮箱地址' }]}
        >
          <Input placeholder="请输入邮箱" prefix={<MailOutlined />} />
        </Form.Item>

        <Form.Item
          label="手机号"
          name="phone"
          rules={[
            { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号' },
          ]}
        >
          <Input placeholder="请输入手机号" prefix={<PhoneOutlined />} />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={loading}
            size="large"
            block
          >
            保存修改
          </Button>
        </Form.Item>
      </Form>
    </div>
  )

  // 修改密码 Tab 内容
  const PasswordTab = () => (
    <div style={{ maxWidth: 480 }}>
      <Form
        form={passwordForm}
        layout="vertical"
        onFinish={handlePasswordSubmit}
      >
        <Form.Item
          label="当前密码"
          name="old_password"
          rules={[{ required: true, message: '请输入当前密码' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="请输入当前密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          label="新密码"
          name="new_password"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码长度不能少于6位' },
          ]}
        >
          <Input.Password
            prefix={<SafetyOutlined />}
            placeholder="请输入新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item
          label="确认新密码"
          name="confirm_password"
          rules={[
            { required: true, message: '请确认新密码' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('new_password') === value) {
                  return Promise.resolve()
                }
                return Promise.reject(new Error('两次输入的密码不一致'))
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<SafetyOutlined />}
            placeholder="请确认新密码"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={passwordLoading}
            size="large"
            block
          >
            修改密码
          </Button>
        </Form.Item>
      </Form>
    </div>
  )

  return (
    <div className="page-card">
      {/* 头部区域 */}
      <div 
        style={{
          position: 'relative',
          marginBottom: 32,
          padding: '40px 32px 32px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #e4e7ec 100%)',
          borderRadius: 24,
          overflow: 'hidden',
        }}
      >
        {/* 装饰元素 */}
        <div 
          style={{
            position: 'absolute',
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,26,26,0.03) 0%, transparent 70%)',
          }}
        />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Space size={24} align="start">
            <div style={{ position: 'relative' }}>
              <Avatar
                key={avatarKey}
                size={100}
                src={avatarUrl}
                icon={<UserOutlined />}
                style={{ 
                  background: 'linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)',
                  border: '4px solid rgba(255,255,255,0.8)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                }}
              />
              <Upload
                name="file"
                showUploadList={false}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/')
                  if (!isImage) {
                    message.error('只能上传图片文件')
                    return false
                  }
                  const isLt2M = file.size / 1024 / 1024 < 2
                  if (!isLt2M) {
                    message.error('图片大小不能超过 2MB')
                    return false
                  }
                  handleUpload(file as File)
                  return false
                }}
              >
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                />
              </Upload>
            </div>
            
            <div>
              <Title level={4} style={{ margin: '0 0 8px', fontWeight: 600 }}>
                {currentUser?.nickname || currentUser?.username}
              </Title>
              <Text type="secondary" style={{ fontSize: 14 }}>
                {currentUser?.username}
              </Text>
              <div style={{ marginTop: 12 }}>
                <Space size={8}>
                  {currentUser?.roles.map((role) => (
                    <span 
                      key={role.id}
                      style={{
                        padding: '4px 12px',
                        background: 'rgba(26,26,26,0.06)',
                        borderRadius: 20,
                        fontSize: 12,
                        color: '#595959',
                      }}
                    >
                      {role.name}
                    </span>
                  ))}
                </Space>
              </div>
            </div>
          </Space>
        </div>
      </div>

      {/* Tab 区域 */}
      <Card 
        bordered={false} 
        style={{ 
          background: 'transparent',
          boxShadow: 'none',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'profile',
              label: (
                <Space>
                  <UserOutlined />
                  个人信息
                </Space>
              ),
              children: <ProfileTab />,
            },
            {
              key: 'password',
              label: (
                <Space>
                  <LockOutlined />
                  修改密码
                </Space>
              ),
              children: <PasswordTab />,
            },
          ]}
        />
      </Card>
    </div>
  )
}
