import { Card, List, Space, Statistic, Tag, Typography } from 'antd'

import { PageTitle } from '../components/page-title'
import { useAuthStore } from '../store/auth'

const stats = [
  { title: '平台能力', value: 'RBAC' },
  { title: '支持对象存储', value: 'MinIO' },
  { title: '缓存支撑', value: 'Redis' },
  { title: '数据库', value: 'PostgreSQL' },
]

export function DashboardPage() {
  const { currentUser } = useAuthStore()

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <div className="page-card">
        <PageTitle title="工作台" description="一期聚焦用户、角色、权限、菜单、文件和审计日志闭环。" />
          <div className="dashboard-grid">
            {stats.map((item) => (
            <div className="dashboard-stat" key={item.title}>
              <p>{item.title}</p>
              <strong>{item.value}</strong>
              <span>当前工程已具备继续植入业务模块的基础能力。</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-panels">
        <Card className="page-card" bordered={false}>
          <Typography.Title level={4}>当前账户</Typography.Title>
          <Space size={[8, 8]} wrap>
            <Tag color="blue">{currentUser?.username}</Tag>
            <Tag color="purple">{currentUser?.nickname}</Tag>
            {(currentUser?.roles || []).map((role) => (
              <Tag color="processing" key={role.id}>
                {role.name}
              </Tag>
            ))}
          </Space>
          <div style={{ marginTop: 20 }}>
            <Statistic title="可用权限点" value={currentUser?.permissions.length || 0} />
          </div>
        </Card>

        <Card className="page-card" bordered={false}>
          <Typography.Title level={4}>平台模块</Typography.Title>
          <List
            dataSource={['用户管理', '角色管理', '权限管理', '菜单管理', '文件管理', '日志中心']}
            renderItem={(item) => <List.Item>{item}</List.Item>}
          />
        </Card>
      </div>
    </Space>
  )
}
