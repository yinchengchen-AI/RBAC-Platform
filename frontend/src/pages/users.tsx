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
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import { fetchDepartmentsApi, type DepartmentItem } from '../api/departments'
import { fetchRolesApi } from '../api/roles'
import { createUserApi, deleteUserApi, fetchUsersApi, resetUserPasswordApi, updateUserApi } from '../api/users'
import { PageTitle } from '../components/page-title'
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

export function UsersPage() {
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

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const [usersResponse, rolesResponse, departmentsResponse] = await Promise.all([fetchUsersApi({ keyword: search }), fetchRolesApi(), fetchDepartmentsApi()])
      setData(usersResponse.data.data.items)
      setRoles(rolesResponse.data.data)
      setDepartments(departmentsResponse.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData('')
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
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId: string) => {
    await deleteUserApi(userId)
    message.success('用户删除成功')
    await loadData()
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
            <Input.Search
              allowClear
              placeholder="搜索用户名或昵称"
              onSearch={(value) => {
                setKeyword(value)
                void loadData(value)
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
        columns={[
          { title: '用户名', dataIndex: 'username' },
          { title: '昵称', dataIndex: 'nickname' },
          { title: '所属部门', dataIndex: 'department_name', render: (value) => value || '-' },
          { title: '邮箱', dataIndex: 'email', render: (value) => value || '-' },
          { title: '手机号', dataIndex: 'phone', render: (value) => value || '-' },
          {
            title: '角色',
            dataIndex: 'roles',
            render: (userRoles: UserItem['roles']) => userRoles.map((role) => <Tag key={role.id}>{role.name}</Tag>),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '启用' : '停用'}</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Space size="small" wrap>
                <Permission permission="system:user:update">
                  <Button type="link" onClick={() => handleEdit(record)}>
                    编辑
                  </Button>
                </Permission>
                <Permission permission="system:user:update">
                  <Button
                    type="link"
                    onClick={() => {
                      setPasswordUser(record)
                      passwordForm.resetFields()
                      setPasswordOpen(true)
                    }}
                  >
                    重置密码
                  </Button>
                </Permission>
                <Permission permission="system:user:update">
                  <Popconfirm title="确认删除该用户吗？" onConfirm={() => void handleDelete(record.id)}>
                    <Button type="link" danger>
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
        title={editingUser ? '编辑用户' : '新建用户'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, role_ids: [] }}>
          {!editingUser ? (
            <>
              <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}>
                <Input placeholder="请输入用户名" />
              </Form.Item>
              <Form.Item label="初始密码" name="password" rules={[{ required: true, message: '请输入初始密码' }]}>
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            </>
          ) : null}
          <Form.Item label="昵称" name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
            <Input placeholder="请输入昵称" />
          </Form.Item>
          <Form.Item label="所属部门" name="department_id">
            <Select allowClear placeholder="请选择部门" options={departments.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="请输入邮箱" />
          </Form.Item>
          <Form.Item label="手机号" name="phone">
            <Input placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item label="头像地址" name="avatar_url">
            <Input placeholder="请输入头像 URL" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} />
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
          <Form.Item label="新密码" name="password" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
