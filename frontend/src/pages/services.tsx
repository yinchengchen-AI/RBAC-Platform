import { Button, Input, Space, Table, Tag, message } from 'antd'
import { ReloadOutlined, SearchOutlined, ToolOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import { fetchServicesApi, type ServiceItem } from '../api/services'
import { PageTitle } from '../components/page-title'

const statusOptions = [
  { label: '计划中', value: 'planned' },
  { label: '已排期', value: 'scheduled' },
  { label: '进行中', value: 'in_progress' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' },
]

const statusColors: Record<string, string> = {
  planned: 'default',
  scheduled: 'processing',
  in_progress: 'warning',
  completed: 'success',
  cancelled: 'error',
}

const typeOptions = [
  { label: '现场服务', value: 'on_site' },
  { label: '远程服务', value: 'remote' },
  { label: '培训服务', value: 'training' },
  { label: '咨询服务', value: 'consulting' },
  { label: '审计服务', value: 'audit' },
]

export function ServicesPage() {
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<ServiceItem[]>([])

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const servicesRes = await fetchServicesApi({ keyword: search })
      setData(servicesRes.data?.data?.items || [])
    } catch (error) {
      message.error('加载数据失败')
      console.error('loadData error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="page-card">
      <PageTitle
        title="服务管理"
        description="管理服务项目的计划、执行和跟踪。"
        extra={
          <Space>
            <Input
              allowClear
              placeholder="搜索服务名称或编号"
              prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
              onChange={(e) => {
                setKeyword(e.target.value)
                if (!e.target.value) {
                  void loadData('')
                }
              }}
              onPressEnter={(e) => {
                void loadData((e.target as HTMLInputElement).value)
              }}
              style={{ width: 260 }}
            />
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Table<ServiceItem>
        rowKey="id"
        loading={loading}
        dataSource={data}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        columns={[
          {
            title: '服务',
            render: (_, record) => (
              <Space>
                <ToolOutlined style={{ fontSize: 20, color: '#595959' }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{record.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.code}</div>
                </div>
              </Space>
            ),
          },
          {
            title: '类型',
            dataIndex: 'type',
            width: 120,
            render: (type: string) => {
              const option = typeOptions.find(o => o.value === type)
              return option?.label || type
            },
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 100,
            render: (status: string) => (
              <Tag color={statusColors[status]}>
                {statusOptions.find(o => o.value === status)?.label || status}
              </Tag>
            ),
          },
          {
            title: '计划开始日期',
            dataIndex: 'planned_start_date',
            width: 120,
            render: (value) => value || '-',
          },
          {
            title: '计划结束日期',
            dataIndex: 'planned_end_date',
            width: 120,
            render: (value) => value || '-',
          },
          {
            title: '实际开始日期',
            dataIndex: 'actual_start_date',
            width: 120,
            render: (value) => value || '-',
          },
          {
            title: '实际结束日期',
            dataIndex: 'actual_end_date',
            width: 120,
            render: (value) => value || '-',
          },
        ]}
      />
    </div>
  )
}
