import { Button, Form, Input, Modal, Popconfirm, Space, Table, message, Avatar } from 'antd'
import {
  PlusOutlined,
  ReloadOutlined,
  SafetyOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import {
  createPermissionApi,
  deletePermissionApi,
  fetchPermissionsApi,
  updatePermissionApi,
} from '../api/permissions'
import { PageTitle } from '../components/page-title'
import type { PermissionItem } from '../types'

interface PermissionFormValues {
  code?: string
  name: string
  module?: string
  description?: string
}

export function PermissionsPage() {
  const [data, setData] = useState<PermissionItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<PermissionItem | null>(null)
  const [form] = Form.useForm<PermissionFormValues>()

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchPermissionsApi()
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

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      if (editingItem) {
        await updatePermissionApi(editingItem.id, {
          name: values.name,
          module: values.module,
          description: values.description,
        })
        message.success('权限更新成功')
      } else {
        await createPermissionApi({
          code: values.code || '',
          name: values.name,
          module: values.module,
          description: values.description,
        })
        message.success('权限创建成功')
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
        title="权限管理"
        description="统一维护接口和按钮级权限点。"
        extra={
          <Space>
            <Permission permission="system:permission:create">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingItem(null)
                  form.resetFields()
                  setOpen(true)
                }}
              >
                新建权限
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Table<PermissionItem>
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
            title: '权限',
            render: (_, record) => (
              <Space>
                <Avatar
                  icon={<SafetyOutlined />}
                  size="small"
                  style={{ background: '#f0f0f0', color: '#595959' }}
                />
                <div>
                  <div style={{ fontWeight: 500, color: '#1a1a1a' }}>{record.name}</div>
                  <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.code}</div>
                </div>
              </Space>
            ),
          },
          { title: '所属模块', dataIndex: 'module', render: (value) => value || '-' },
          { title: '说明', dataIndex: 'description', render: (value) => value || '-' },
          {
            title: '操作',
            key: 'action',
            width: 150,
            render: (_, record) => (
              <Space size="small">
                <Permission permission="system:permission:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => {
                      setEditingItem(record)
                      form.setFieldsValue(record)
                      setOpen(true)
                    }}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="system:permission:delete">
                  <Popconfirm
                    title="确认删除该权限吗？"
                    description="此操作不可恢复"
                    onConfirm={async () => {
                      await deletePermissionApi(record.id)
                      message.success('权限删除成功')
                      await loadData()
                    }}
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
        title={editingItem ? '编辑权限' : '新建权限'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          {!editingItem ? (
            <Form.Item
              label="权限编码"
              name="code"
              rules={[{ required: true, message: '请输入权限编码' }]}
            >
              <Input placeholder="例如：system:user:create" />
            </Form.Item>
          ) : null}
          <Form.Item
            label="权限名称"
            name="name"
            rules={[{ required: true, message: '请输入权限名称' }]}
          >
            <Input placeholder="请输入权限名称" />
          </Form.Item>
          <Form.Item label="所属模块" name="module">
            <Input placeholder="例如：users" />
          </Form.Item>
          <Form.Item label="说明" name="description">
            <Input.TextArea rows={3} placeholder="请输入说明" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
