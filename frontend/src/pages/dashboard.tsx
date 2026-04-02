import { useEffect, useState } from 'react'
import {
  Card,
  Col,
  Row,
  Tag,
  Progress,
  List,
  Avatar,
  Statistic,
  Space,
  Skeleton,
  Checkbox,
  Button,
  Badge,
} from 'antd'
import {
  TeamOutlined,
  FileTextOutlined,
  ToolOutlined,
  DollarOutlined,
  BankOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CheckSquareOutlined,
  PlusOutlined,
  FlagOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import dayjs from 'dayjs'
import { fetchDashboardStatsApi, type DashboardStats } from '../api/dashboard'
import { useTodoStore } from '../store/todos'

const statusColors: Record<string, string> = {
  potential: 'blue',
  active: 'success',
  inactive: 'warning',
  lost: 'default',
  draft: 'default',
  pending: 'processing',
  approved: 'blue',
  signed: 'cyan',
  executing: 'warning',
  completed: 'success',
  planned: 'default',
  scheduled: 'processing',
  in_progress: 'warning',
  cancelled: 'error',
}

const statusLabels: Record<string, string> = {
  potential: '潜在客户',
  active: '合作中',
  inactive: '暂停合作',
  lost: '流失',
  draft: '草稿',
  pending: '待审批',
  approved: '已审批',
  signed: '已签订',
  executing: '执行中',
  completed: '已完成',
  planned: '计划中',
  scheduled: '已排期',
  in_progress: '进行中',
  cancelled: '已取消',
}

export function DashboardPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  
  // 待办相关
  const { pendingTodos: rawPendingTodos, count, fetchPendingTodos, fetchCount, toggleTodo } = useTodoStore()
  const pendingTodos = Array.isArray(rawPendingTodos) ? rawPendingTodos : []

  useEffect(() => {
    loadStats()
    fetchPendingTodos(5)
    fetchCount()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const res = await fetchDashboardStatsApi()
      setStats(res.data.data)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: '客户总数',
      value: stats?.overview.company_total || 0,
      icon: <TeamOutlined />,
      color: '#1890ff',
      bgColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/companies',
    },
    {
      title: '合同总数',
      value: stats?.overview.contract_total || 0,
      icon: <FileTextOutlined />,
      color: '#52c41a',
      bgColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      path: '/contracts',
    },
    {
      title: '合同金额',
      value: `¥${((stats?.overview.contract_amount || 0) / 10000).toFixed(1)}万`,
      icon: <BankOutlined />,
      color: '#fa8c16',
      bgColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      path: '/contracts',
    },
    {
      title: '已收款',
      value: `¥${((stats?.overview.contract_paid || 0) / 10000).toFixed(1)}万`,
      icon: <DollarOutlined />,
      color: '#eb2f96',
      bgColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      path: '/finance',
    },
  ]

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 24 }}>
          <Skeleton active paragraph={{ rows: 0 }} title={{ width: '100%' }} style={{ height: 88 }} />
        </div>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  return (
    <div>
      {/* 顶部统计卡片 - 渐变设计 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              hoverable
              onClick={() => navigate(card.path)}
              style={{
                cursor: 'pointer',
                background: card.bgColor,
                border: 'none',
                borderRadius: 16,
                overflow: 'hidden',
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', marginBottom: 8 }}>{card.title}</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: '#fff' }}>{card.value}</div>
                </div>
                <div style={{ fontSize: 40, color: 'rgba(255,255,255,0.3)' }}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* 中间区域：数据分析 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={16}>
          <Card
            title="业务概览"
            extra={<a onClick={() => navigate('/contracts')}>查看详情</a>}
            style={{ height: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="服务项目"
                  value={stats?.overview.service_total || 0}
                  prefix={<ToolOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="回款率"
                  value={stats?.overview.contract_amount ?
                    ((stats.overview.contract_paid / stats.overview.contract_amount) * 100).toFixed(1) : 0}
                  suffix="%"
                  prefix={stats?.overview.contract_amount && stats.overview.contract_paid / stats.overview.contract_amount > 0.5 ?
                    <ArrowUpOutlined /> : <ArrowDownOutlined />}
                  valueStyle={{
                    color: stats?.overview.contract_amount && stats.overview.contract_paid / stats.overview.contract_amount > 0.5 ?
                      '#52c41a' : '#fa8c16'
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="开票金额"
                  value={(stats?.overview.invoice_amount || 0) / 10000}
                  precision={1}
                  suffix="万"
                  prefix="¥"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="实收金额"
                  value={(stats?.overview.payment_amount || 0) / 10000}
                  precision={1}
                  suffix="万"
                  prefix="¥"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <CheckSquareOutlined style={{ color: '#52c41a' }} />
                <span>待办事项</span>
              </Space>
            } 
            extra={
              <Space>
                {(count?.pending ?? 0) > 0 && (
                  <Badge 
                    count={count?.pending ?? 0} 
                    style={{ 
                      backgroundColor: '#ff4d4f',
                      fontSize: 11,
                      minWidth: 18,
                      height: 18,
                      lineHeight: '18px',
                    }} 
                  />
                )}
                <a onClick={() => navigate('/todos')}>查看全部</a>
              </Space>
            } 
            style={{ height: '100%' }}
            bodyStyle={{ padding: '16px 0' }}
          >
            {(!pendingTodos || pendingTodos.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#8c8c8c' }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: '#f6ffed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 12px',
                  }}
                >
                  <CheckSquareOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                </div>
                <div style={{ fontSize: 13, marginBottom: 12 }}>暂无待办事项</div>
                <Button 
                  type="primary"
                  ghost
                  size="small" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/todos')}
                >
                  新建待办
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {pendingTodos.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 20px',
                      gap: 12,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f6ffed'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    <Checkbox 
                      checked={false} 
                      onChange={() => toggleTodo(item.id)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <span 
                          style={{ 
                            fontSize: 13, 
                            color: '#1a1a1a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.title}
                        </span>
                        {item.priority === 2 && (
                          <FlagOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>
                        {item.due_date 
                          ? dayjs(item.due_date).format('MM-DD')
                          : '无截止日期'
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 第四行：合同状态 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={8}>
          <Card title="合同状态" extra={<a onClick={() => navigate('/contracts')}>查看全部</a>} style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {stats?.contract_by_status.slice(0, 4).map((item) => (
                <div key={item.status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, color: '#595959' }}>{statusLabels[item.status]}</span>
                    <span style={{ fontWeight: 600 }}>{item.count}</span>
                  </div>
                  <Progress
                    percent={stats.overview.contract_total ?
                      Math.round((item.count / stats.overview.contract_total) * 100) : 0}
                    strokeColor={statusColors[item.status]}
                    size="small"
                  />
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* 底部区域：最近动态 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title={<Space><ClockCircleOutlined />最近客户</Space>}
            extra={<a onClick={() => navigate('/companies')}>更多</a>}
          >
            <List
              dataSource={stats?.recent_companies || []}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar size={48} icon={<TeamOutlined />} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} />}
                    title={<a onClick={() => navigate('/companies')} style={{ fontWeight: 500 }}>{item.name}</a>}
                    description={<span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.code}</span>}
                  />
                  <Tag color={statusColors[item.status]}>{statusLabels[item.status]}</Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={<Space><FileTextOutlined />最近合同</Space>}
            extra={<a onClick={() => navigate('/contracts')}>更多</a>}
          >
            <List
              dataSource={stats?.recent_contracts || []}
              renderItem={(item) => (
                <List.Item style={{ padding: '12px 0' }}>
                  <List.Item.Meta
                    avatar={<Avatar size={48} icon={<FileTextOutlined />} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }} />}
                    title={<a onClick={() => navigate('/contracts')} style={{ fontWeight: 500 }}>{item.name}</a>}
                    description={
                      <Space size="small">
                        <span style={{ fontSize: 12, color: '#8c8c8c' }}>{item.code}</span>
                        <Tag color={statusColors[item.status]} style={{ fontSize: 11 }}>{statusLabels[item.status]}</Tag>
                      </Space>
                    }
                  />
                  <div style={{ fontWeight: 600, color: '#fa8c16', fontSize: 16 }}>
                    ¥{(item.amount / 10000).toFixed(1)}万
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

    </div>
  )
}
