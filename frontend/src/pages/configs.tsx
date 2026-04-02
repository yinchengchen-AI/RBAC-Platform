import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, Upload, message, Card, Typography } from 'antd'
import { PlusOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import { createConfigApi, deleteConfigApi, exportConfigsApi, fetchConfigsApi, importConfigsApi, type ConfigItem, updateConfigApi } from '../api/configs'
import { PageTitle } from '../components/page-title'

export function ConfigsPage() {
  const [data, setData] = useState<ConfigItem[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ConfigItem | null>(null)
  const [form] = Form.useForm<Omit<ConfigItem, 'id'>>()

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchConfigsApi()
      setData(response.data?.data || [])
    } catch (error) {
      message.error('加载数据失败')
      console.error('loadData error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadData() }, [])

  return (
    <div className="page-card">
      <PageTitle title="系统参数" description="维护平台级配置项，便于后续模块统一读取。" extra={<Space><Permission permission="system:config:create"><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingItem(null); form.setFieldsValue({ status: 1, value_type: 'string' }); setOpen(true) }}>新建参数</Button></Permission><Button onClick={async () => { const response = await exportConfigsApi(); const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'configs.xlsx'; a.click(); window.URL.revokeObjectURL(url) }}>导出参数</Button><Upload showUploadList={false} accept=".xlsx" customRequest={async ({ file, onSuccess, onError }) => { try { const formData = new FormData(); formData.append('file', file as Blob); await importConfigsApi(formData); message.success('导入成功'); await loadData(); onSuccess?.({}, new XMLHttpRequest()) } catch (error) { onError?.(error as Error) } }}><Button>导入参数</Button></Upload><Button icon={<ReloadOutlined />} onClick={() => void loadData()}>刷新</Button></Space>} />
      <Table<ConfigItem>
        rowKey="id"
        loading={loading}
        dataSource={data}
        columns={[
          { title: '参数名称', dataIndex: 'name' },
          { title: '参数键', dataIndex: 'key' },
          { title: '参数值', dataIndex: 'value' },
          { title: '类型', dataIndex: 'value_type' },
          { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            render: (_, record) => <Space><Permission permission="system:config:update"><Button type="link" onClick={() => { setEditingItem(record); form.setFieldsValue(record); setOpen(true) }}>编辑</Button></Permission><Permission permission="system:config:update"><Popconfirm title="确认删除该参数吗？" onConfirm={async () => { await deleteConfigApi(record.id); message.success('参数删除成功'); await loadData() }}><Button type="link" danger>删除</Button></Popconfirm></Permission></Space>,
          },
        ]}
      />
      <Modal title={editingItem ? '编辑参数' : '新建参数'} open={open} onCancel={() => { setOpen(false); form.resetFields() }} onOk={async () => { const values = await form.validateFields(); if (editingItem) { await updateConfigApi(editingItem.id, { name: values.name, value: values.value, value_type: values.value_type, status: values.status, description: values.description }); message.success('参数更新成功') } else { await createConfigApi(values); message.success('参数创建成功') } setOpen(false); form.resetFields(); await loadData() }} destroyOnClose>
        <Form form={form} layout="vertical" initialValues={{ status: 1, value_type: 'string' }}>
          <Form.Item label="参数名称" name="name" rules={[{ required: true, message: '请输入参数名称' }]}><Input /></Form.Item>
          {!editingItem ? <Form.Item label="参数键" name="key" rules={[{ required: true, message: '请输入参数键' }]}><Input /></Form.Item> : null}
          <Form.Item label="参数值" name="value" rules={[{ required: true, message: '请输入参数值' }]}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="值类型" name="value_type"><Select options={[{ label: '字符串', value: 'string' }, { label: '数字', value: 'number' }, { label: '布尔', value: 'boolean' }, { label: 'JSON', value: 'json' }]} /></Form.Item>
          <Form.Item label="状态" name="status"><Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} /></Form.Item>
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>
      <Card title={<><InfoCircleOutlined /> 使用说明</>} size="small" style={{ marginTop: 16, background: '#fafafa' }}>
        <Typography.Paragraph style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
          <strong>系统参数：</strong>用于存储平台级别的配置项，如网站名称、LOGO地址、文件上传大小限制、短信接口配置等。
        </Typography.Paragraph>
        <Typography.Paragraph style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
          <strong>参数键：</strong>作为唯一标识符，建议采用小写字母和下划线组合（如：site_name、max_upload_size）。
        </Typography.Paragraph>
        <Typography.Paragraph style={{ fontSize: 13, color: '#595959', marginBottom: 8 }}>
          <strong>值类型：</strong>根据参数值的实际类型选择，布尔值使用 true/false，JSON 类型需保证格式正确。
        </Typography.Paragraph>
        <Typography.Paragraph style={{ fontSize: 13, color: '#595959', marginBottom: 0 }}>
          <strong>典型应用场景：</strong>前端页面标题、系统开关控制、第三方服务密钥、业务规则阈值等全局配置。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
