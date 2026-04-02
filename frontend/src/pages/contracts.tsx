import { Button, Form, Input, Modal, Popconfirm, Select, Space, Table, Tag, message, DatePicker, InputNumber, Progress, Upload, List } from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined, SearchOutlined, FileTextOutlined, SwapOutlined, PaperClipOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'
import dayjs from 'dayjs'
import { Permission } from '../access/permission'
import { fetchContractsApi, createContractApi, updateContractApi, deleteContractApi, updateContractStatusApi, uploadContractAttachmentApi, fetchContractAttachmentsApi, deleteContractAttachmentApi, type ContractItem, type ContractAttachment } from '../api/contracts'
import { fetchCompaniesApi, type CompanyItem } from '../api/companies'
import { fetchUsersApi } from '../api/users'
import type { UserItem } from '../types'
import type { UploadFile } from 'antd/es/upload/interface'
import { PageTitle } from '../components/page-title'
import { generateContractCode } from '../utils/code'

const statusOptions = [
  { label: '草稿', value: 'draft' },
  { label: '待审批', value: 'pending' },
  { label: '已审批', value: 'approved' },
  { label: '已签订', value: 'signed' },
  { label: '执行中', value: 'executing' },
  { label: '已完成', value: 'completed' },
]

const statusColors: Record<string, string> = {
  draft: 'default',
  pending: 'processing',
  approved: 'blue',
  signed: 'cyan',
  executing: 'warning',
  completed: 'success',
  terminated: 'error',
  expired: 'error',
}

const typeOptions = [
  { label: '安全评价', value: 'safety_evaluation' },
  { label: '安全咨询', value: 'safety_consulting' },
  { label: '安全培训', value: 'safety_training' },
  { label: '风险评估', value: 'hazard_assessment' },
  { label: '应急预案', value: 'emergency_plan' },
  { label: '其他', value: 'other' },
]

interface ContractFormValues {
  code: string
  name: string
  type: string
  amount: number
  company_id: string
  manager_id?: string
  sign_date?: dayjs.Dayjs
  start_date?: dayjs.Dayjs
  end_date?: dayjs.Dayjs
  service_content?: string
  service_cycle?: string
  service_times?: number
  payment_terms?: string
  remark?: string
}

export function ContractsPage() {
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [data, setData] = useState<ContractItem[]>([])
  const [companies, setCompanies] = useState<CompanyItem[]>([])
  const [users, setUsers] = useState<UserItem[]>([])
  const [open, setOpen] = useState(false)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [attachmentModalOpen, setAttachmentModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ContractItem | null>(null)
  const [statusItem, setStatusItem] = useState<ContractItem | null>(null)
  const [currentContract, setCurrentContract] = useState<ContractItem | null>(null)
  const [attachments, setAttachments] = useState<ContractAttachment[]>([])
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [form] = Form.useForm<ContractFormValues>()
  const [statusForm] = Form.useForm<{ status: string; remark?: string }>()

  const loadData = async (search = keyword) => {
    setLoading(true)
    try {
      const [contractsRes, companiesRes, usersRes] = await Promise.all([
        fetchContractsApi({ keyword: search }),
        fetchCompaniesApi(),
        fetchUsersApi({ page_size: 100 }),
      ])
      setData(contractsRes.data?.data?.items || [])
      setCompanies(companiesRes.data?.data?.items || [])
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
    setFileList([])
    form.setFieldsValue({
      code: generateContractCode(),
    })
    setOpen(true)
  }

  const handleEdit = (record: ContractItem) => {
    setEditingItem(record)
    setFileList([])
    form.setFieldsValue({
      code: record.code,
      name: record.name,
      type: record.type,
      amount: record.amount,
      company_id: record.company_id,
      manager_id: record.manager_id,
      sign_date: record.sign_date ? dayjs(record.sign_date) : undefined,
      start_date: record.start_date ? dayjs(record.start_date) : undefined,
      end_date: record.end_date ? dayjs(record.end_date) : undefined,
    })
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    await deleteContractApi(id)
    message.success('删除成功')
    await loadData()
  }

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      const payload = {
        ...values,
        sign_date: values.sign_date?.format('YYYY-MM-DD'),
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      }
      
      let contractId = editingItem?.id
      if (editingItem) {
        await updateContractApi(editingItem.id, payload)
      } else {
        const res = await createContractApi(payload)
        contractId = res.data.data.id
      }
      
      // Upload files
      if (contractId && fileList.length > 0) {
        for (const file of fileList) {
          const fileToUpload = file.originFileObj || file
          await uploadContractAttachmentApi(contractId, fileToUpload as File)
        }
      }
      
      message.success(editingItem ? '更新成功' : '创建成功')
      setOpen(false)
      form.resetFields()
      setFileList([])
      await loadData()
    } catch (error: any) {
      const msg = error.response?.data?.detail || (editingItem ? '更新失败' : '创建失败')
      message.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangeStatus = (record: ContractItem) => {
    setStatusItem(record)
    statusForm.resetFields()
    setStatusModalOpen(true)
  }

  const handleStatusSubmit = async () => {
    const values = await statusForm.validateFields()
    if (!statusItem) return
    setSubmitting(true)
    try {
      await updateContractStatusApi(statusItem.id, values)
      message.success('状态更新成功')
      setStatusModalOpen(false)
      await loadData()
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewAttachments = async (record: ContractItem) => {
    setCurrentContract(record)
    setAttachmentModalOpen(true)
    try {
      const res = await fetchContractAttachmentsApi(record.id)
      setAttachments(res.data.data || [])
    } catch (error) {
      message.error('加载附件失败')
    }
  }

  const handleUploadAttachment = async (file: File) => {
    if (!currentContract) return false
    const hide = message.loading('上传中...', 0)
    try {
      await uploadContractAttachmentApi(currentContract.id, file)
      message.success('上传成功')
      const res = await fetchContractAttachmentsApi(currentContract.id)
      setAttachments(res.data.data || [])
      hide()
      return true
    } catch (error) {
      hide()
      message.error('上传失败')
      return false
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!currentContract) return
    try {
      await deleteContractAttachmentApi(currentContract.id, attachmentId)
      message.success('删除成功')
      const res = await fetchContractAttachmentsApi(currentContract.id)
      setAttachments(res.data.data || [])
    } catch (error) {
      message.error('删除失败')
    }
  }

  return (
    <div className="page-card">
      <PageTitle
        title="合同管理"
        description="管理合同信息，支持状态流转和财务进度跟踪。"
        extra={
          <Space>
            <Input
              allowClear
              placeholder="搜索合同名称或编号"
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
            <Permission permission="business:contract:create">
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                新增合同
              </Button>
            </Permission>
            <Button icon={<ReloadOutlined />} onClick={() => void loadData()}>
              刷新
            </Button>
          </Space>
        }
      />

      <Table<ContractItem>
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
            title: '合同',
            render: (_, record) => (
              <Space>
                <FileTextOutlined style={{ fontSize: 20, color: '#595959' }} />
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
            title: '金额',
            dataIndex: 'amount',
            width: 120,
            render: (v: number) => `¥${v?.toFixed(2) || '0.00'}`,
          },
          {
            title: '财务进度',
            width: 180,
            render: (_, record: ContractItem) => {
              const percent = record.amount > 0 ? (record.paid_amount / record.amount) * 100 : 0
              return (
                <Progress
                  percent={Number(percent.toFixed(1))}
                  size="small"
                  format={() => `¥${(record.paid_amount / 10000).toFixed(1)}万/¥${(record.amount / 10000).toFixed(1)}万`}
                />
              )
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
            title: '签订日期',
            dataIndex: 'sign_date',
            width: 120,
            render: (value) => value || '-',
          },
          {
            title: '操作',
            width: 240,
            render: (_, record) => (
              <Space size="small">
                <Permission permission="business:contract:view">
                  <Button
                    type="text"
                    size="small"
                    icon={<PaperClipOutlined />}
                    onClick={() => handleViewAttachments(record)}
                  >
                    附件
                  </Button>
                </Permission>
                <Permission permission="business:contract:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => handleEdit(record)}
                  >
                    编辑
                  </Button>
                </Permission>
                <Permission permission="business:contract:update">
                  <Button
                    type="text"
                    size="small"
                    icon={<SwapOutlined />}
                    onClick={() => handleChangeStatus(record)}
                  >
                    变更状态
                  </Button>
                </Permission>
                <Permission permission="business:contract:delete">
                  <Popconfirm
                    title="确认删除该合同吗？"
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

      {/* 新建/编辑合同弹窗 */}
      <Modal
        title={editingItem ? '编辑合同' : '新增合同'}
        open={open}
        onCancel={() => {
          setOpen(false)
          form.resetFields()
        }}
        onOk={() => void handleSubmit()}
        confirmLoading={submitting}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="合同编号"
            name="code"
            rules={[{ required: true, message: '请输入合同编号' }]}
          >
            <Input placeholder="系统自动生成" disabled />
          </Form.Item>
          <Form.Item
            label="合同名称"
            name="name"
            rules={[{ required: true, message: '请输入合同名称' }]}
          >
            <Input placeholder="请输入合同名称" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item
              label="合同类型"
              name="type"
              rules={[{ required: true, message: '请选择合同类型' }]}
              style={{ width: 340 }}
            >
              <Select placeholder="请选择合同类型" options={typeOptions} />
            </Form.Item>
            <Form.Item
              label="合同金额"
              name="amount"
              rules={[{ required: true, message: '请输入合同金额' }]}
              style={{ width: 340 }}
            >
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="请输入合同金额"
                prefix="¥"
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item
              label="客户"
              name="company_id"
              rules={[{ required: true, message: '请选择客户' }]}
              style={{ width: 340 }}
            >
              <Select
                placeholder="请选择客户"
                showSearch
                optionFilterProp="label"
                options={companies.map(c => ({ label: c.name, value: c.id }))}
              />
            </Form.Item>
            <Form.Item label="负责人" name="manager_id" style={{ width: 340 }}>
              <Select
                allowClear
                placeholder="请选择负责人"
                showSearch
                optionFilterProp="label"
                options={users.map(u => ({ label: `${u.nickname} (${u.username})`, value: u.id }))}
              />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item label="签订日期" name="sign_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
            <Form.Item label="开始日期" name="start_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
            <Form.Item label="结束日期" name="end_date" style={{ width: 220 }}>
              <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
            </Form.Item>
          </Space>
          <Form.Item label="服务内容" name="service_content">
            <Input.TextArea rows={3} placeholder="请输入服务内容" />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item label="服务周期" name="service_cycle" style={{ width: 340 }}>
              <Input placeholder="请输入服务周期" />
            </Form.Item>
            <Form.Item label="服务次数" name="service_times" initialValue={1} style={{ width: 340 }}>
              <InputNumber style={{ width: '100%' }} min={1} placeholder="请输入服务次数" />
            </Form.Item>
          </Space>
          <Form.Item label="付款条款" name="payment_terms">
            <Input.TextArea rows={2} placeholder="请输入付款条款" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
          
          <Form.Item label="上传附件">
            <Upload
              multiple
              fileList={fileList}
              beforeUpload={(file) => {
                setFileList((prev) => [...prev, file])
                return false
              }}
              onRemove={(file) => {
                setFileList((prev) => prev.filter((f) => f.uid !== file.uid))
              }}
            >
              <Button icon={<PaperClipOutlined />}>选择文件</Button>
            </Upload>
            <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
              {editingItem 
                ? '注：新增的附件将在保存后上传。要管理已有附件，请在表格操作栏点击【附件】。'
                : '注：选择的附件将在合同保存后自动上传。'}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* 变更状态弹窗 */}
      <Modal
        title="变更合同状态"
        open={statusModalOpen}
        onCancel={() => {
          setStatusModalOpen(false)
          statusForm.resetFields()
        }}
        onOk={() => void handleStatusSubmit()}
        confirmLoading={submitting}
        destroyOnClose
      >
        <Form form={statusForm} layout="vertical">
          <Form.Item
            label="新状态"
            name="status"
            rules={[{ required: true, message: '请选择新状态' }]}
          >
            <Select options={statusOptions} placeholder="请选择状态" />
          </Form.Item>
          <Form.Item label="备注" name="remark">
            <Input.TextArea rows={3} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 附件管理弹窗 */}
      <Modal
        title={`合同附件 - ${currentContract?.name || ''}`}
        open={attachmentModalOpen}
        onCancel={() => setAttachmentModalOpen(false)}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Upload
          beforeUpload={(file) => {
            handleUploadAttachment(file)
            return false
          }}
          showUploadList={false}
        >
          <Button icon={<PlusOutlined />} type="primary" style={{ marginBottom: 16 }}>
            上传附件
          </Button>
        </Upload>
        <List
          dataSource={attachments}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  onClick={() => window.open(item.file_path, '_blank')}
                  key="view"
                >
                  预览
                </Button>,
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={() => window.open(item.file_path, '_blank')}
                  key="download"
                >
                  下载
                </Button>,
                <Popconfirm
                  title="确认删除该附件吗？"
                  onConfirm={() => handleDeleteAttachment(item.id)}
                  key="delete"
                >
                  <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>,
              ]}
            >
              <List.Item.Meta
                avatar={<FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                title={item.file_name}
                description={`${(item.file_size / 1024).toFixed(2)} KB · ${dayjs(item.create_time).format('YYYY-MM-DD HH:mm')}`}
              />
            </List.Item>
          )}
        />
      </Modal>
    </div>
  )
}
