import { useEffect, useState } from 'react'
import {
  Card,
  Button,
  Tag,
  Space,
  Typography,
  Empty,
  Modal,
  Form,
  Input,
  DatePicker,
  Radio,
  Row,
  Col,
  Statistic,
  Table,
  Tooltip,
  Badge,
} from 'antd'
import {
  PlusOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CalendarOutlined,
  FlagOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTodoStore } from '../store/todos'
import { PageTitle } from '../components/page-title'
import type { Todo, TodoCreatePayload } from '../types/todo'

const { Text } = Typography
const { TextArea } = Input

// 优先级配置
const priorityConfig = {
  0: { label: '低', color: '#8c8c8c', bg: '#f5f5f5' },
  1: { label: '中', color: '#faad14', bg: '#fff7e6' },
  2: { label: '高', color: '#ff4d4f', bg: '#fff2f0' },
}

export default function TodosPage() {
  const {
    todos,
    count,
    loading,
    page,
    pageSize,
    fetchTodos,
    fetchCount,
    createTodo,
    updateTodo,
    deleteTodo,
    toggleTodo,
  } = useTodoStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null)
  const [filter, setFilter] = useState<number | null>(null)
  const [form] = Form.useForm()

  useEffect(() => {
    fetchTodos({ page, pageSize, status: filter })
    fetchCount()
  }, [fetchTodos, fetchCount, page, pageSize, filter])

  const handleCreate = async (values: {
    title: string
    description?: string
    priority: number
    due_date?: dayjs.Dayjs
    category?: string
  }) => {
    console.log('表单提交，values:', values)
    try {
      const payload: TodoCreatePayload = {
        title: values.title,
        description: values.description,
        priority: values.priority,
        due_date: values.due_date?.toISOString(),
        category: values.category,
      }
      console.log('发送 payload:', payload)

      if (editingTodo) {
        await updateTodo(editingTodo.id, payload)
      } else {
        await createTodo(payload)
      }

      setIsModalOpen(false)
      setEditingTodo(null)
      form.resetFields()
    } catch (error) {
      console.error('创建待办失败:', error)
    }
  }

  const handleEdit = (todo: Todo) => {
    setEditingTodo(todo)
    form.setFieldsValue({
      title: todo.title || '',
      description: todo.description || '',
      priority: todo.priority,
      due_date: todo.due_date ? dayjs(todo.due_date) : undefined,
      category: todo.category || '',
    })
    setIsModalOpen(true)
  }

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个待办事项吗？',
      onOk: () => deleteTodo(id),
    })
  }

  const handleToggle = (id: string) => {
    toggleTodo(id)
  }

  const openCreateModal = () => {
    setEditingTodo(null)
    form.resetFields()
    form.setFieldsValue({
      title: '',
      description: '',
      priority: 0,
      due_date: undefined,
      category: '',
    })
    setIsModalOpen(true)
  }

  // 表格列定义
  const columns = [
    {
      title: '状态',
      key: 'status',
      width: 60,
      render: (_: unknown, record: Todo) => (
        <Badge
          status={record.status === 1 ? 'success' : 'processing'}
          onClick={() => handleToggle(record.id)}
          style={{ cursor: 'pointer' }}
        />
      ),
    },
    {
      title: '待办事项',
      key: 'title',
      render: (_: unknown, record: Todo) => (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text
              strong
              style={{
                fontSize: 14,
                textDecoration: record.status === 1 ? 'line-through' : 'none',
                color: record.status === 1 ? '#8c8c8c' : '#1a1a1a',
              }}
            >
              {record.title}
            </Text>
            <Tag
              style={{
                marginLeft: 8,
                background: priorityConfig[record.priority as 0 | 1 | 2].bg,
                color: priorityConfig[record.priority as 0 | 1 | 2].color,
                border: 'none',
                fontSize: 11,
                padding: '0 8px',
              }}
            >
              {priorityConfig[record.priority as 0 | 1 | 2].label}
            </Tag>
            {record.due_date && dayjs(record.due_date).isBefore(dayjs()) && record.status === 0 && (
              <Tag color="error" style={{ fontSize: 11, padding: '0 8px', marginLeft: 8 }}>
                已逾期
              </Tag>
            )}
          </div>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          )}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category: string | null) =>
        category ? (
          <Tag style={{ background: '#f5f5f5', color: '#595959', border: 'none' }}>
            {category}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            -
          </Text>
        ),
    },
    {
      title: '截止日期',
      dataIndex: 'due_date',
      key: 'due_date',
      width: 120,
      render: (due_date: string | null, record: Todo) =>
        due_date ? (
          <Text
            style={{
              fontSize: 13,
              color:
                dayjs(due_date).isBefore(dayjs()) && record.status === 0 ? '#ff4d4f' : '#595959',
            }}
          >
            <CalendarOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
            {dayjs(due_date).format('YYYY-MM-DD')}
          </Text>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            无截止日期
          </Text>
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'create_time',
      key: 'create_time',
      width: 150,
      render: (create_time: string) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(create_time).format('YYYY-MM-DD HH:mm')}
        </Text>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_: unknown, record: Todo) => (
        <Space>
          <Tooltip title="编辑">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          </Tooltip>
          <Tooltip title="删除">
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)} />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <div className="page-card">
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card className="glass" style={{ borderRadius: 16 }}>
            <Statistic
              title="待办总数"
              value={count?.total || 0}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="glass" style={{ borderRadius: 16 }}>
            <Statistic
              title="待办中"
              value={count?.pending || 0}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="glass" style={{ borderRadius: 16 }}>
            <Statistic
              title="高优先级"
              value={count?.high_priority || 0}
              valueStyle={{ color: '#ff4d4f' }}
              prefix={<FlagOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="glass" style={{ borderRadius: 16 }}>
            <Statistic
              title="已逾期"
              value={count?.overdue || 0}
              valueStyle={{ color: '#8c8c8c' }}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* 页面标题和工具栏 */}
      <PageTitle
        title="待办事项"
        description="管理个人待办任务，设置优先级和截止日期，高效完成工作。"
        extra={
          <Space>
            <Radio.Group
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value={null}>全部</Radio.Button>
              <Radio.Button value={0}>待办</Radio.Button>
              <Radio.Button value={1}>已完成</Radio.Button>
            </Radio.Group>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              新建待办
            </Button>
          </Space>
        }
      />

      {/* 待办列表 */}
      <Table<Todo>
        rowKey="id"
        loading={loading}
        dataSource={todos || []}
        columns={columns}
        pagination={{
          current: page,
          pageSize: pageSize,
          total: (todos || []).length,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条`,
        }}
        locale={{
          emptyText: <Empty description="暂无待办事项" />,
        }}
      />

      {/* 新建/编辑弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {editingTodo ? (
              <>
                <EditOutlined style={{ color: '#1890ff' }} />
                <span>编辑待办</span>
              </>
            ) : (
              <>
                <PlusOutlined style={{ color: '#52c41a' }} />
                <span>新建待办</span>
              </>
            )}
          </div>
        }
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false)
          setEditingTodo(null)
          form.resetFields()
        }}
        onOk={() => {
          console.log('点击确定按钮')
          form.submit()
        }}
        destroyOnClose
        width={480}
        bodyStyle={{ padding: '24px' }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{
            title: '',
            description: '',
            priority: 0,
            due_date: undefined,
            category: '',
          }}
        >
          {/* 标题 */}
          <Form.Item
            name="title"
            label={<Text strong style={{ fontSize: 14 }}>待办标题</Text>}
            rules={[{ required: true, message: '请输入待办标题' }]}
          >
            <Input
              placeholder="请输入待办标题"
              size="large"
              style={{ borderRadius: 8 }}
            />
          </Form.Item>

          {/* 优先级 - 卡片式选择 */}
          <Form.Item
            name="priority"
            label={<Text strong style={{ fontSize: 14 }}>优先级</Text>}
          >
            <Radio.Group style={{ display: 'flex', gap: 8, width: '100%' }}>
              <Radio.Button
                value={0}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRadius: 8,
                  height: 40,
                  lineHeight: '38px',
                }}
              >
                <FlagOutlined style={{ color: '#8c8c8c', marginRight: 4 }} />
                低
              </Radio.Button>
              <Radio.Button
                value={1}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRadius: 8,
                  height: 40,
                  lineHeight: '38px',
                }}
              >
                <FlagOutlined style={{ color: '#faad14', marginRight: 4 }} />
                中
              </Radio.Button>
              <Radio.Button
                value={2}
                style={{
                  flex: 1,
                  textAlign: 'center',
                  borderRadius: 8,
                  height: 40,
                  lineHeight: '38px',
                }}
              >
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />
                高
              </Radio.Button>
            </Radio.Group>
          </Form.Item>

          {/* 截止日期和分类 - 双列布局 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
              name="due_date"
              label={<Text strong style={{ fontSize: 14 }}>截止日期</Text>}
              style={{ marginBottom: 0 }}
            >
              <DatePicker
                style={{ width: '100%', borderRadius: 8 }}
                placeholder="选择日期"
                format="YYYY-MM-DD"
                suffixIcon={<CalendarOutlined style={{ color: '#8c8c8c' }} />}
              />
            </Form.Item>

            <Form.Item
              name="category"
              label={<Text strong style={{ fontSize: 14 }}>分类标签</Text>}
              style={{ marginBottom: 0 }}
            >
              <Input
                placeholder="如：工作、个人"
                style={{ borderRadius: 8 }}
              />
            </Form.Item>
          </div>

          {/* 描述 */}
          <Form.Item
            name="description"
            label={<Text strong style={{ fontSize: 14 }}>详细描述</Text>}
            style={{ marginTop: 16 }}
          >
            <TextArea
              rows={3}
              placeholder="添加待办事项的详细描述（可选）"
              style={{ borderRadius: 8, resize: 'none' }}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
