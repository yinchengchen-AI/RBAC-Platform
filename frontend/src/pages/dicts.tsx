import { Button, Form, Input, InputNumber, Modal, Popconfirm, Select, Space, Table, Tabs, Tag, Upload, message } from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { Permission } from '../access/permission'
import { createDictItemApi, createDictTypeApi, deleteDictItemApi, exportDictItemsApi, fetchDictItemsApi, fetchDictTypesApi, importDictItemsApi, type DictItem, type DictTypeItem, updateDictItemApi, updateDictTypeApi } from '../api/dicts'
import { PageTitle } from '../components/page-title'

export function DictsPage() {
  const [types, setTypes] = useState<DictTypeItem[]>([])
  const [items, setItems] = useState<DictItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeCode, setActiveCode] = useState<string>()
  const [typeOpen, setTypeOpen] = useState(false)
  const [itemOpen, setItemOpen] = useState(false)
  const [editingType, setEditingType] = useState<DictTypeItem | null>(null)
  const [editingItem, setEditingItem] = useState<DictItem | null>(null)
  const [typeForm] = Form.useForm<Omit<DictTypeItem, 'id'>>()
  const [itemForm] = Form.useForm<Omit<DictItem, 'id'>>()

  const loadTypes = async () => {
    setLoading(true)
    try {
      const response = await fetchDictTypesApi()
      const nextTypes = response.data.data
      setTypes(nextTypes)
      const nextCode = activeCode || nextTypes[0]?.code
      setActiveCode(nextCode)
      if (nextCode) {
        const itemsResponse = await fetchDictItemsApi(nextCode)
        setItems(itemsResponse.data.data)
      } else {
        setItems([])
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadTypes()
  }, [])

  const loadItems = async (dictCode: string) => {
    const response = await fetchDictItemsApi(dictCode)
    setItems(response.data.data)
  }

  return (
    <div className="page-card">
      <PageTitle
        title="字典管理"
        description="维护平台通用枚举与选项，为后续业务模块提供统一数据字典。"
        extra={<Button icon={<ReloadOutlined />} onClick={() => void loadTypes()}>刷新</Button>}
      />
      <Tabs activeKey={activeCode} onChange={(code) => { setActiveCode(code); void loadItems(code) }} items={types.map((type) => ({ key: type.code, label: type.name }))} />
      <Space style={{ marginBottom: 16 }}>
        <Permission permission="system:dict:create"><Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingType(null); typeForm.setFieldsValue({ status: 1 }); setTypeOpen(true) }}>新建字典类型</Button></Permission>
        <Permission permission="system:dict:create"><Button onClick={() => { setEditingItem(null); itemForm.setFieldsValue({ dict_code: activeCode, status: 1, sort: 0 }); setItemOpen(true) }} disabled={!activeCode}>新建字典项</Button></Permission>
        <Button disabled={!activeCode} onClick={async () => { if (!activeCode) return; const response = await exportDictItemsApi(activeCode); const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }); const url = window.URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `dict-${activeCode}.xlsx`; a.click(); window.URL.revokeObjectURL(url) }}>导出字典项</Button>
        <Upload showUploadList={false} accept=".xlsx" customRequest={async ({ file, onSuccess, onError }) => { try { if (!activeCode) return; const formData = new FormData(); formData.append('file', file as Blob); await importDictItemsApi(activeCode, formData); message.success('导入成功'); await loadItems(activeCode); onSuccess?.({}, new XMLHttpRequest()) } catch (error) { onError?.(error as Error) } }}>
          <Button disabled={!activeCode}>导入字典项</Button>
        </Upload>
      </Space>
      <Table<DictItem>
        rowKey="id"
        loading={loading}
        dataSource={items}
        columns={[
          { title: '标签', dataIndex: 'label' },
          { title: '值', dataIndex: 'value' },
          { title: '排序', dataIndex: 'sort' },
          { title: '状态', dataIndex: 'status', render: (value) => <Tag color={value === 1 ? 'success' : 'error'}>{value === 1 ? '启用' : '停用'}</Tag> },
          {
            title: '操作',
            render: (_, record) => <Space><Permission permission="system:dict:update"><Button type="link" onClick={() => { setEditingItem(record); itemForm.setFieldsValue(record); setItemOpen(true) }}>编辑</Button></Permission><Permission permission="system:dict:update"><Popconfirm title="确认删除该字典项吗？" onConfirm={async () => { await deleteDictItemApi(record.id); message.success('字典项删除成功'); if (activeCode) await loadItems(activeCode) }}><Button type="link" danger>删除</Button></Popconfirm></Permission></Space>,
          },
        ]}
      />
      <Modal title={editingType ? '编辑字典类型' : '新建字典类型'} open={typeOpen} onCancel={() => { setTypeOpen(false); typeForm.resetFields() }} onOk={async () => { const values = await typeForm.validateFields(); if (editingType) { await updateDictTypeApi(editingType.id, values); message.success('字典类型更新成功') } else { await createDictTypeApi(values); message.success('字典类型创建成功') } setTypeOpen(false); typeForm.resetFields(); await loadTypes() }} destroyOnClose>
        <Form form={typeForm} layout="vertical" initialValues={{ status: 1 }}>
          <Form.Item label="类型名称" name="name" rules={[{ required: true, message: '请输入类型名称' }]}><Input /></Form.Item>
          {!editingType ? <Form.Item label="类型编码" name="code" rules={[{ required: true, message: '请输入类型编码' }]}><Input /></Form.Item> : null}
          <Form.Item label="描述" name="description"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="状态" name="status"><Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} /></Form.Item>
        </Form>
      </Modal>
      <Modal title={editingItem ? '编辑字典项' : '新建字典项'} open={itemOpen} onCancel={() => { setItemOpen(false); itemForm.resetFields() }} onOk={async () => { const values = await itemForm.validateFields(); if (editingItem) { await updateDictItemApi(editingItem.id, { label: values.label, value: values.value, sort: values.sort, status: values.status }); message.success('字典项更新成功') } else { await createDictItemApi(values); message.success('字典项创建成功') } setItemOpen(false); itemForm.resetFields(); if (activeCode) await loadItems(activeCode) }} destroyOnClose>
        <Form form={itemForm} layout="vertical" initialValues={{ status: 1, sort: 0, dict_code: activeCode }}>
          <Form.Item label="字典编码" name="dict_code" rules={[{ required: true, message: '请选择字典编码' }]}><Input disabled={!!activeCode} /></Form.Item>
          <Form.Item label="标签" name="label" rules={[{ required: true, message: '请输入标签' }]}><Input /></Form.Item>
          <Form.Item label="值" name="value" rules={[{ required: true, message: '请输入值' }]}><Input /></Form.Item>
          <Form.Item label="排序" name="sort"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item label="状态" name="status"><Select options={[{ label: '启用', value: 1 }, { label: '停用', value: 0 }]} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
