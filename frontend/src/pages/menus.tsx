import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import { createMenuApi, deleteMenuApi, fetchMenusApi, updateMenuApi } from '../api/menus'
import { PageTitle } from '../components/page-title'
import type { BackendMenuItem } from '../types'

interface MenuFormValues {
  parent_id?: string
  name: string
  type: string
  route_path?: string
  component?: string
  icon?: string
  sort: number
  permission_code?: string
  visible: boolean
}

function buildMenuTree(items: BackendMenuItem[]) {
  const nodeMap = new Map(items.map((item) => [item.id, { ...item, key: item.id, children: [] as BackendMenuItem[] }]))
  const roots: Array<BackendMenuItem & { key: string; children: BackendMenuItem[] }> = []

  for (const item of items) {
    const current = nodeMap.get(item.id)
    if (!current) {
      continue
    }
    if (item.parent_id && nodeMap.has(item.parent_id)) {
      nodeMap.get(item.parent_id)?.children.push(current)
    } else {
      roots.push(current)
    }
  }

  const sortTree = (nodes: Array<BackendMenuItem & { key: string; children: BackendMenuItem[] }>) => {
    nodes.sort((a, b) => a.sort - b.sort)
    nodes.forEach((node) => sortTree(node.children as Array<BackendMenuItem & { key: string; children: BackendMenuItem[] }>))
    return nodes
  }

  return sortTree(roots)
}

export function MenusPage() {
  const [data, setData] = useState<BackendMenuItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BackendMenuItem | null>(null)
  const [form] = Form.useForm<MenuFormValues>()

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchMenusApi()
      setData(response.data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingItem) {
        await updateMenuApi(editingItem.id, values)
        message.success('菜单更新成功')
      } else {
        await createMenuApi(values)
        message.success('菜单创建成功')
      }
      setOpen(false)
      form.resetFields()
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  const treeData = buildMenuTree(data)

  return (
    <div className="page-card">
      <PageTitle
        title="菜单管理"
        description="菜单、路由和权限点在这里统一配置。"
        extra={
          <Space>
            <Permission permission="system:menu:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null)
                  form.setFieldsValue({ type: 'menu', visible: true, sort: 0 })
                  setOpen(true)
                }}
              >
                新建菜单
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />
      <Table<BackendMenuItem>
        rowKey="id"
        loading={loading}
        dataSource={treeData}
        pagination={false}
        defaultExpandAllRows
        childrenColumnName="children"
        columns={[
          { title: '菜单名称', dataIndex: 'name' },
          { title: '路由', dataIndex: 'route_path', render: (value) => value || '-' },
          { title: '图标', dataIndex: 'icon', render: (value) => value || '-' },
          {
            title: '类型',
            dataIndex: 'type',
            render: (value) => <Tag color={value === 'button' ? 'purple' : 'blue'}>{value}</Tag>,
          },
          { title: '权限编码', dataIndex: 'permission_code', render: (value) => value || '-' },
          { title: '排序', dataIndex: 'sort' },
          {
            title: '显示',
            dataIndex: 'visible',
            render: (value) => <Tag color={value ? 'success' : 'default'}>{value ? '显示' : '隐藏'}</Tag>,
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Space size="small">
                <Permission permission="system:menu:update">
                  <Button
                    type="link"
                    onClick={() => {
                      setEditingItem(record)
                      form.setFieldsValue(record)
                      setOpen(true)
                    }}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="system:menu:update">
                  <Popconfirm
                    title="确认删除该菜单吗？"
                    onConfirm={async () => {
                      await deleteMenuApi(record.id)
                      message.success('菜单删除成功')
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
        title={editingItem ? '编辑菜单' : '新建菜单'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" initialValues={{ type: 'menu', visible: true, sort: 0 }}>
          <Form.Item label="父级菜单" name="parent_id">
            <Select allowClear placeholder="请选择父级菜单" options={data.map((item) => ({ label: item.name, value: item.id }))} />
          </Form.Item>
          <Form.Item label="菜单名称" name="name" rules={[{ required: true, message: '请输入菜单名称' }]}>
            <Input placeholder="请输入菜单名称" />
          </Form.Item>
          <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
            <Select options={[{ label: '菜单', value: 'menu' }, { label: '按钮', value: 'button' }]} />
          </Form.Item>
          <Form.Item label="路由路径" name="route_path">
            <Input placeholder="例如：/users" />
          </Form.Item>
          <Form.Item label="组件路径" name="component">
            <Input placeholder="例如：pages/users" />
          </Form.Item>
          <Form.Item label="图标" name="icon">
            <Input placeholder="例如：UserOutlined" />
          </Form.Item>
          <Form.Item label="权限编码" name="permission_code">
            <Input placeholder="例如：system:user:view" />
          </Form.Item>
          <Form.Item label="排序" name="sort" rules={[{ required: true, message: '请输入排序值' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="是否显示" name="visible" valuePropName="checked">
            <Switch checkedChildren="显示" unCheckedChildren="隐藏" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
