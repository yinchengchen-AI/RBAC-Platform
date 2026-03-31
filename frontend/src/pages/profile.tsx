import { Card, Descriptions, Space, Tag } from 'antd'

import { PageTitle } from '../components/page-title'
import { useAuthStore } from '../store/auth'

export function ProfilePage() {
  const { currentUser } = useAuthStore()

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-card">
        <PageTitle title="个人中心" description="查看当前登录账户的基本信息和权限范围。" />
        <Card bordered={false}>
          <Descriptions column={1} bordered>
            <Descriptions.Item label="用户名">{currentUser?.username}</Descriptions.Item>
            <Descriptions.Item label="昵称">{currentUser?.nickname}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{currentUser?.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="手机号">{currentUser?.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="角色">
              {(currentUser?.roles || []).map((role) => (
                <Tag key={role.id}>{role.name}</Tag>
              ))}
            </Descriptions.Item>
            <Descriptions.Item label="超级管理员">{currentUser?.is_superuser ? '是' : '否'}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    </Space>
  )
}
