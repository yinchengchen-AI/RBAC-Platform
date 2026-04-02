import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import { createDepartmentApi, deleteDepartmentApi, fetchDepartmentsApi, type DepartmentItem, updateDepartmentApi } from '../api/departments'
import { PageTitle } from '../components/page-title'

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

export function DepartmentsPage() {
  const [data, setData] = useState<DepartmentItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<DepartmentItem | null>(null)
  const [form] = Form.useForm<Omit<DepartmentItem, 'id'>>()

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchDepartmentsApi()
      setData(response.data?.data || [])
    } catch (error) {
      message.error('加载数据失败')
      console.error('loadData error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const treeData = buildDepartmentTree(data)

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingItem) {
        await updateDepartmentApi(editingItem.id, values)
        message.success('部门更新成功')
      } else {
        await createDepartmentApi(values)
        message.success('部门创建成功')
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
        title="部门管理"
        description="管理组织部门层级，方便后续接入人员归属和数据权限。"
        extra={
          <Space>
            <Permission permission="system:department:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.setFieldsValue({ status: 1, sort: 0 }); setOpen(true) }}>
                新建部门
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>刷新</Button>
          </Space>
        }
      />
      <Table
        rowKey="id"
        loading={loading}
        dataSource={treeData}
        pagination={false}
        defaultExpandAllRows
        columns={[
          { title: '部门名称', dataIndex: 'name' },
          { title: '部门编码', dataIndex: 'code' },
          { title: '负责人', dataIndex: 'leader', render: (value: string) => value || '-' },
          { title: '联系电话', dataIndex: 'phone', render: (value: string) => value || '-' },
          { title: '排序', dataIndex: 'sort' },
          { title: '状态', dataIndex: 'status', render: (value: number) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            render: (_, record: DepartmentItem) => (
              <Space>
                <Permission permission="system:department:update"><Button type="link" onClick={() => { setEditingItem(record); form.setFieldsValue(record); setOpen(true) }}>编辑</Button></Permission>
                <Permission permission="system:department:update"><Popconfirm title="确认删除该部门吗？" onConfirm={async () => { await deleteDepartmentApi(record.id); message.success('部门删除成功'); await loadData() }}><Button type="link" danger>删除</Button></Popconfirm></Permission>
              </Space>
            ),
          },
        ]}
      />
      <Modal title={editingItem ? '编辑部门' : '新建部门'} open={open} onCancel={() => { setOpen(false); form.resetFields() }} onOk={() => void handleSubmit()} confirmLoading={submitting} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ status: 1, sort: 0 }}>
          <Form.Item label="父级部门" name="parent_id"><Select allowClear options={data.map((item) => ({ label: item.name, value: item.id }))} /></Form.Item>
          <Form.Item label="部门名称" name="name" rules={[{ required: true, message: '请输入部门名称' }]}><Input /></Form.Item>
          {!editingItem ? <Form.Item label="部门编码" name="code" rules={[{ required: true, message: '请输入部门编码' }]}><Input /></Form.Item> : null}
          <Form.Item label="负责人" name="leader"><Input /></Form.Item>
          <Form.Item label="联系电话" name="phone"><Input /></Form.Item>
          <Form.Item label="排序" name="sort"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="状态" name="status"><Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
