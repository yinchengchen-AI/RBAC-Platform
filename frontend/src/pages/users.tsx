import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  message,
  Avatar,
  TreeSelect,
} from 'antd'
import { PlusOutlined, ReloadOutlined, UserOutlined, EditOutlined, LockOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons'
import { useEffect, useState, useMemo } from 'react'

import { Permission } from '../access/permission'
import { fetchDepartmentsApi, type DepartmentItem } from '../api/departments'
import { fetchRolesApi } from '../api/roles'
import { createUserApi, deleteUserApi, fetchUsersApi, resetUserPasswordApi, updateUserApi } from '../api/users'
import { PageTitle } from '../components/page-title'
import { useAuthStore } from '../store/auth'
import type { RoleItem, UserItem } from '../types'

interface UserFormValues {
  username?: string
  nickname: string
  department_id?: string
  email?: string
  phone?: string
  avatar_url?: string
  status: number
  password?: string
  role_ids: string[]
}

function buildDepartmentTree(items: DepartmentItem[]) {
  const map = new Map(items.map((item) => [item.id, { ...item, key: item.id, children: [] as DepartmentItem[] }]))
  const roots: Array<DepartmentItem & { key: string; children: DepartmentItem[] }> = []
  for (const item of items) {
    const current = map.get(item.id)
    if (!current) continue
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id)?.children.push(current)
    } else {
      roots.push(current)
    }
  }
  return roots.sort((a, b) => a.sort - b.sort)
}

export function UsersPage() {
  const refreshCurrentUser = useAuthStore((state) => state.refreshCurrentUser)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<UserItem[]>([])
  const [roles, setRoles] = useState<RoleItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [open, setOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  const [passwordUser, setPasswordUser] = useState<UserItem | null>(null)
  const [form] = Form.useForm<UserFormValues>()
  const [passwordForm] = Form.useForm<{ password: string }>()

  const departmentTreeData = useMemo(() => buildDepartmentTree(departments), [departments])

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const [usersResponse, rolesResponse, departmentsResponse] = await Promise.all([
        fetchUsersApi({ keyword: search }),
        fetchRolesApi(),
        fetchDepartmentsApi(),
      ])
      setData(usersResponse.data?.data?.items || [])
      setRoles(rolesResponse.data?.data || [])
      setDepartments(departmentsResponse.data?.data || [])
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
    setEditingUser(null)
    form.setFieldsValue({ status: 1, role_ids: [] })
    setOpen(true)
  }

  const handleEdit = (record: UserItem) => {
    setEditingUser(record)
    form.setFieldsValue({
      username: record.username,
      nickname: record.nickname,
      department_id: record.department_id,
      email: record.email,
      phone: record.phone,
      avatar_url: record.avatar_url,
      status: record.status,
      role_ids: record.roles.map((role) => role.id),
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingUser) {
        await updateUserApi(editingUser.id, {
          nickname: values.nickname,
          department_id: values.department_id,
          email: values.email,
          phone: values.phone,
          avatar_url: values.avatar_url,
          status: values.status,
          role_ids: values.role_ids,
        })
        message.success('用户更新成功')
      } else {
        await createUserApi({
          username: values.username || '',
          nickname: values.nickname,
          department_id: values.department_id,
          email: values.email,
          phone: values.phone,
          avatar_url: values.avatar_url,
          status: values.status,
          password: values.password || '',
          role_ids: values.role_ids,
        })
        message.success('用户创建成功')
      }
      setOpen(false)
      form.resetFields()
      await loadData()
      await refreshCurrentUser()
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail)
      } else {
        message.error('操作失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    try {
      await deleteUserApi(userId)
      message.success('用户删除成功')
      await loadData()
      await refreshCurrentUser()
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail)
      } else {
        message.error('删除失败')
      }
    }
  }

  const handleResetPassword = async () => {
    const values = await passwordForm.validateFields()
    if (!passwordUser) {
      return
    }
    setSubmitting(true)
    try {
      await resetUserPasswordApi(passwordUser.id, values)
      message.success('密码重置成功')
      setPasswordOpen(false)
      passwordForm.resetFields()
    } catch (error: any) {
      if (error.response?.data?.detail) {
        message.error(error.response.data.detail)
      } else {
        message.error('操作失败')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-card">
      <PageTitle
        title="用户管理"
        description="支持用户新增、编辑、重置密码、角色绑定与删除。"
        extra={
          <Space>
            <Input
              allowClear
              placeholder="搜索用户名或昵称"
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
            <Permission permission="system:user:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新建用户
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Table<UserItem>
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
            title: '用户',
            dataIndex: 'username',
            render: (_, record) => (
              <Space>
                <Avatar icon={<UserOutlined />} style={{ background: '#f0f0f0', color: '#595959' }} />
                <div>
                  <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{record.username}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.nickname}</div>
                </div>
              </Space>
            ),
          },
          {
            title: '所属部门',
            dataIndex: 'department_name',
            render: (value) => value || '-',
          },
          {
            title: '联系方式',
            render: (_, record) => (
              <Space direction="vertical" size={0}>
                {record.email && <span style={{ fontSize: 13 }}>{record.email}</span>}
                {record.phone && <span style={{ fontSize: 13, color: '#8c8c8c' }}>{record.phone}</span>}
                {!record.email && !record.phone && '-'}
              </Space>
            ),
          },
          {
            title: '角色',
            dataIndex: 'roles',
            render: (userRoles: UserItem['roles']) => (
              <Space size={4} wrap>
                {userRoles.map((role) => (
                  <Tag key={role.id} style={{ margin: 0 }}>
                    {role.name}
                  </Tag>
                ))}
              </Space>
            ),
          },
          {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            render: (value) => (
              <Tag
                color={value === 1 ? 'success' : 'error'}
                style={{ margin: 0 }}
              >
                {value === 1 ? '启用' : '停用'}
              </Tag>
            ),
          },
          {
            title: '操作',
            key: 'action',
            width: 200,
            render: (_, record) => (
              <Space size="small">
                <Permission permission="system:user:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="system:user:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<LockOutlined />}
                    onClick={() => {
                      setPasswordUser(record)
                      passwordForm.resetFields()
                      setPasswordOpen(true)
                    }}
                  >
                    重置密码
                  </Button>
                </Permission>
                <Permission permission="system:user:delete">
                  <Popconfirm
                    title="确认删除该用户吗？"
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

      {/* 新建/编辑用户弹窗 */}
      <Modal
        title={editingUser ? '编辑用户' : '新建用户'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
        width={560}
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, role_ids: [] }}>
          {!editingUser ? (
            <>
              <Form.Item
                label="用户名"
                name="username"
                rules={[{ required: true, message: '请输入用户名' }]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item
                label="初始密码"
                name="password"
                rules={[{ required: true, message: '请输入初始密码' }]}
              >
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item
            label="昵称"
            name="nickname"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item label="所属部门" name="department_id">
            <TreeSelect
              allowClear
              placeholder="请选择部门"
              treeData={departmentTreeData}
              fieldNames={{ label: 'name', value: 'id', children: 'children' }}
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select
              options={[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]}
            />
          </Form.Item>
          <Form.Item label="角色" name="role_ids">
            <Select mode="multiple" allowClear placeholder="请选择角色">
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      {/* 重置密码弹窗 */}
      <Modal
        title={`重置密码${passwordUser ? ` - ${passwordUser.username}` : ''}`}
        open={passwordOpen}
        onCancel={() => {
          setPasswordOpen(false)
          passwordForm.resetFields()
        }}
        onOk={() => void handleResetPassword()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={passwordForm} layout="vertical">
          <Form.Item
            label="新密码"
            name="password"
            rules={[{ required: true, message: '请输入新密码' }]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
