import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, DatePicker } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ToolOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Permission } from '../access/permission'
import { fetchServicesApi, type ServiceItem } from '../api/services'
import { fetchContractsApi, type ContractItem } from '../api/contracts'
import { fetchUsersApi } from '../api/users'
import type { UserItem } from '../types'
import { PageTitle } from '../components/page-title'
import { generateServiceCode } from '../utils/code'

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

interface ServiceFormValues {
  code: string
  name: string
  type: string
  contract_id: string
  manager_id?: string
  planned_start_date?: dayjs.Dayjs
  planned_end_date?: dayjs.Dayjs
  actual_start_date?: dayjs.Dayjs
  actual_end_date?: dayjs.Dayjs
  description?: string
  requirements?: string
  deliverables?: string
  remark?: string
}

export function ServicesPage() {
  const [loading, setLoading] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<ServiceItem[]>([])
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceItem | null>(null)
  const [form] = Form.useForm<ServiceFormValues>()

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const [servicesRes, contractsRes, usersRes] = await Promise.all([
        fetchServicesApi({ keyword: search }),
        fetchContractsApi(),
        fetchUsersApi({ page_size: 100 }),
      ])
      setData(servicesRes.data?.data?.items || [])
      setContracts(contractsRes.data?.data?.items || [])
      setUsers(usersRes.data?.data?.items || [])
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

  const handleCreate = () => {
    setEditingItem(null)
    form.resetFields()
    form.setFieldsValue({
      code: generateServiceCode(),
    })
    setOpen(true)
  }

  const handleEdit = (record: ServiceItem) => {
    setEditingItem(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      contract_id: record.contract_id,
      manager_id: record.manager_id,
      planned_start_date: record.planned_start_date ? dayjs(record.planned_start_date) : undefined,
      planned_end_date: record.planned_end_date ? dayjs(record.planned_end_date) : undefined,
      actual_start_date: record.actual_start_date ? dayjs(record.actual_start_date) : undefined,
      actual_end_date: record.actual_end_date ? dayjs(record.actual_end_date) : undefined,
    })
    setOpen(true)
  }

  const handleDelete = async (_id: string) => {
    // TODO: 实现删除API
    message.info('删除功能待实现')
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    const payload = {
      ...values,
      planned_start_date: values.planned_start_date?.format('YYYY-MM-DD'),
      planned_end_date: values.planned_end_date?.format('YYYY-MM-DD'),
      actual_start_date: values.actual_start_date?.format('YYYY-MM-DD'),
      actual_end_date: values.actual_end_date?.format('YYYY-MM-DD'),
    }
    // TODO: 实现提交API
    console.log('submit', payload)
    setOpen(false)
    form.resetFields()
  }

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
            <Permission permission="business:service:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增服务
              </Button>
            </Permission>
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
          {
            title: '操作',
            width: 150,
            render: (_, record) => (
              <Space size="small">
                <Permission permission="business:service:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="business:service:delete">
                  <Popconfirm
                    title="确认删除该服务吗？"
                    description="此操作不可恢复"
                    onConfirm={() => void handleDelete(record.id)}
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Permission>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editingItem ? '编辑服务' : '新增服务'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="服务编号"
            name="code"
            rules={[{ required: true, message: '请输入服务编号' }]}
          >
            <Input placeholder="系统自动生成" disabled />
          </Form.Item>
          <Form.Item
            label="服务名称"
            name="name"
            rules={[{ required: true, message: '请输入服务名称' }]}
          >
            <Input placeholder="请输入服务名称" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item
              label="服务类型"
              name="type"
              rules={[{ required: true, message: '请选择服务类型' }]}
              style={{ width: 340 }}
            >
              <Select placeholder="请选择服务类型" options={typeOptions} />
            </Form.Item>
            <Form.Item
              label="关联合同"
              name="contract_id"
              rules={[{ required: true, message: '请选择关联合同' }]}
              style={{ width: 340 }}
            >
              <Select
                placeholder="请选择关联合同"
                showSearch
                optionFilterProp="label"
                options={contracts.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))}
              />
            </Form.Item>
          </Space>
          <Form.Item label="负责人" name="manager_id">
            <Select
              allowClear
              placeholder="请选择负责人"
              showSearch
              optionFilterProp="label"
              options={users.map(u => ({ label: `${u.nickname} (${u.username})`, value: u.id }))}
            />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item label="计划开始日期" name="planned_start_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
            <Form.Item label="计划结束日期" name="planned_end_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item label="实际开始日期" name="actual_start_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
            <Form.Item label="实际结束日期" name="actual_end_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
          </Space>
          <Form.Item label="服务描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入服务描述" />
          </Form.Item>
          <Form.Item label="服务要求" name="requirements">
            <Input.TextArea rows={3} placeholder="请输入服务要求" />
          </Form.Item>
          <Form.Item label="交付物" name="deliverables">
            <Input.TextArea rows={3} placeholder="请输入交付物清单" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
