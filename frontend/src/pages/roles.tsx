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
import { fetchMenusApi } from '../api/menus'
import { fetchPermissionsApi } from '../api/permissions'
import { createRoleApi, deleteRoleApi, fetchRolesApi, updateRoleApi } from '../api/roles'
import { PageTitle } from '../components/page-title'
import type { BackendMenuItem, PermissionItem, RoleItem } from '../types'

interface RoleFormValues {
  code?: string
  name: string
  description?: string
  status: number
  permission_ids: string[]
  menu_ids: string[]
  data_scope_type: string
  data_scope_department_ids: string[]
}

export function RolesPage() {
  const [data, setData] = useState<RoleItem[]>([])
  const [permissions, setPermissions] = useState<PermissionItem[]>([])
  const [menus, setMenus] = useState<BackendMenuItem[]>([])
  const [departments, setDepartments] = useState<DepartmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<RoleItem | null>(null)
  const [form] = Form.useForm<RoleFormValues>()

  const loadData = async () => {
    setLoading(true)
    try {
      const [rolesResponse, permissionsResponse, menusResponse] = await Promise.all([
        fetchRolesApi(),
        fetchPermissionsApi(),
        fetchMenusApi(),
      ])
      const departmentsResponse = await fetchDepartmentsApi()
      setData(rolesResponse.data.data)
      setPermissions(permissionsResponse.data.data)
      setMenus(menusResponse.data.data)
      setDepartments(departmentsResponse.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleCreate = () => {
    setEditingRole(null)
    form.setFieldsValue({ status: 1, permission_ids: [], menu_ids: [], data_scope_type: 'all', data_scope_department_ids: [] })
    setOpen(true)
  }

  const handleEdit = (record: RoleItem) => {
    setEditingRole(record)
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      description: record.description,
      status: record.status,
      permission_ids: record.permissions.map((item) => item.id),
      menu_ids: record.menus.map((item) => item.id),
      data_scope_type: record.data_scope_type,
      data_scope_department_ids: record.data_scope_department_ids,
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingRole) {
        await updateRoleApi(editingRole.id, {
          name: values.name,
          description: values.description,
          status: values.status,
          permission_ids: values.permission_ids,
          menu_ids: values.menu_ids,
          data_scope_type: values.data_scope_type,
          data_scope_department_ids: values.data_scope_department_ids,
        })
        message.success('角色更新成功')
      } else {
        await createRoleApi({
          code: values.code || '',
          name: values.name,
          description: values.description,
          status: values.status,
          permission_ids: values.permission_ids,
          menu_ids: values.menu_ids,
          data_scope_type: values.data_scope_type,
          data_scope_department_ids: values.data_scope_department_ids,
        })
        message.success('角色创建成功')
      }
      setOpen(false)
      form.resetFields()
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-card">
      <PageTitle
        title="角色管理"
        description="角色与权限、菜单绑定关系统一在此维护。"
        extra={
          <Space>
            <Permission permission="system:role:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新建角色
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />
      <Table<RoleItem>
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '角色编码', dataIndex: 'code' },
          { title: '角色名称', dataIndex: 'name' },
          { title: '描述', dataIndex: 'description', render: (value) => value || '-' },
          {
            title: '权限数',
            dataIndex: 'permissions',
            render: (rolePermissions: RoleItem['permissions']) => rolePermissions.length,
          },
          {
            title: '绑定菜单',
            dataIndex: 'menus',
            render: (roleMenus: RoleItem['menus']) => roleMenus.map((menu) => <Tag key={menu.id}>{menu.name}</Tag>),
          },
          {
            title: '状态',
            dataIndex: 'status',
            render: (value) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '启用' : '停用'}</Tag>,
          },
          { title: '数据权限', dataIndex: 'data_scope_type' },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Space size="small">
                <Permission permission="system:role:update">
                  <Button type="link" onClick={() => handleEdit(record)}>
                    编辑
                  </Button>
                </Permission>
                <Permission permission="system:role:update">
                  <Popconfirm
                    title="确认删除该角色吗？"
                    onConfirm={async () => {
                      await deleteRoleApi(record.id)
                      message.success('角色删除成功')
                      await loadData()
                    }}
                  >
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
        title={editingRole ? '编辑角色' : '新建角色'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ status: 1, permission_ids: [], menu_ids: [], data_scope_type: 'all', data_scope_department_ids: [] }}>
          {!editingRole ? (
            <Form.Item label="角色编码" name="code" rules={[{ required: true, message: '请输入角色编码' }]}>
              <Input placeholder="例如：system_admin" />
            </Form.Item>
          ) : null}
          <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item label="描述" name="description">
            <Input.TextArea rows={3} placeholder="请输入描述" />
          </Form.Item>
          <Form.Item label="状态" name="status" rules={[{ required: true, message: '请选择状态' }]}>
            <Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} />
          </Form.Item>
          <Form.Item label="权限点" name="permission_ids">
            <Select mode="multiple" allowClear placeholder="请选择权限点" optionFilterProp="label" options={permissions.map((item) => ({ label: `${item.name} (${item.code})`, value: item.id }))} />
          </Form.Item>
          <Form.Item label="菜单" name="menu_ids">
            <Select mode="multiple" allowClear placeholder="请选择菜单" optionFilterProp="label" options={menus.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="数据权限范围" name="data_scope_type">
            <Select options={[{ label: '全部数据', value: 'all' }, { label: '仅本人部门', value: 'department_only' }, { label: '本人及下级部门', value: 'department_and_children' }, { label: '自定义部门', value: 'custom_departments' }]} />
          </Form.Item>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => getFieldValue('data_scope_type') === 'custom_departments' ? (
              <Form.Item label="自定义部门" name="data_scope_department_ids">
                <Select mode="multiple" allowClear placeholder="请选择部门" options={departments.map((item) => ({ label: item.name, value: item.id }))} />
              </Form.Item>
            ) : null}
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
