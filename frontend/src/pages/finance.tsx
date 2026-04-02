import { Button, Form, Input, Modal, Space, Table, Tabs, message, DatePicker, InputNumber, Select, Tag } from 'antd'
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useEffect, useState, useCallback } from 'react'
import { Permission } from '../access/permission'
import { fetchInvoicesApi, createInvoiceApi, fetchPaymentsApi, createPaymentApi, type InvoiceItem, type PaymentItem } from '../api/finance'
import { fetchContractsApi, type ContractItem } from '../api/contracts'
import { PageTitle } from '../components/page-title'
import { generateInvoiceCode, generatePaymentCode } from '../utils/code'

const invoiceTypeOptions = [
  { label: '增值税专用发票', value: 'special' },
  { label: '增值税普通发票', value: 'normal' },
  { label: '电子发票', value: 'electronic' },
]

const paymentMethodOptions = [
  { label: '银行转账', value: 'bank_transfer' },
  { label: '现金', value: 'cash' },
  { label: '支票', value: 'check' },
  { label: '支付宝', value: 'alipay' },
  { label: '微信支付', value: 'wechat_pay' },
]

const taxRateOptions = [
  { label: '免税', value: 0 },
  { label: '3%', value: 0.03 },
  { label: '6%', value: 0.06 },
  { label: '9%', value: 0.09 },
  { label: '13%', value: 0.13 },
]

export function FinancePage() {
  const [activeTab, setActiveTab] = useState('invoices')
  const [loading, setLoading] = useState(false)
    const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [contracts, setContracts] = useState<ContractItem[]>([])
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [invoiceForm] = Form.useForm()
  const [paymentForm] = Form.useForm()

  const calculateTaxAmount = useCallback(() => {
    const amount = invoiceForm.getFieldValue('amount')
    const taxRate = invoiceForm.getFieldValue('tax_rate')
    if (amount && taxRate !== undefined) {
      const taxAmount = Number((amount * taxRate).toFixed(2))
      invoiceForm.setFieldsValue({ tax_amount: taxAmount })
    }
  }, [invoiceForm])

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const res = await fetchInvoicesApi()
      setInvoices(res.data?.data?.items || [])
    } catch (error) {
      message.error('加载发票数据失败')
      console.error('loadInvoices error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPayments = async () => {
    setLoading(true)
    try {
      const res = await fetchPaymentsApi()
      setPayments(res.data?.data?.items || [])
    } catch (error) {
      message.error('加载收款数据失败')
      console.error('loadPayments error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadContracts = async () => {
    try {
      const res = await fetchContractsApi()
      setContracts(res.data?.data?.items || [])
    } catch (error) {
      console.error('loadContracts error:', error)
    }
  }

  useEffect(() => {
    void loadInvoices()
    void loadPayments()
    void loadContracts()
  }, [])

  const handleCreateInvoice = async () => {
    const values = await invoiceForm.validateFields()
    try {
      await createInvoiceApi({
        ...values,
        issue_date: values.issue_date.format('YYYY-MM-DD'),
      })
      message.success('创建成功')
      setInvoiceModalOpen(false)
      invoiceForm.resetFields()
      await loadInvoices()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败')
    }
  }

  const handleCreatePayment = async () => {
    const values = await paymentForm.validateFields()
    try {
      await createPaymentApi({
        ...values,
        payment_date: values.payment_date.format('YYYY-MM-DD'),
      })
      message.success('创建成功')
      setPaymentModalOpen(false)
      paymentForm.resetFields()
      await loadPayments()
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建失败')
    }
  }

  const invoiceColumns = [
    { title: '发票号码', dataIndex: 'invoice_no', width: 150 },
    { title: '发票代码', dataIndex: 'invoice_code', width: 150, render: (v: string) => v || '-' },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (type: string) => {
        const option = invoiceTypeOptions.find(o => o.value === type)
        return <Tag>{option?.label || type}</Tag>
      },
    },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: number) => `¥${v?.toFixed(2) || '0.00'}` },
    { title: '税额', dataIndex: 'tax_amount', width: 120, render: (v: number) => v ? `¥${v.toFixed(2)}` : '-' },
    { title: '开票日期', dataIndex: 'issue_date', width: 120 },
    { title: '购方名称', dataIndex: 'buyer_name', width: 200, ellipsis: true },
    { title: '销方名称', dataIndex: 'seller_name', width: 200, ellipsis: true },
  ]

  const paymentColumns = [
    { title: '收款编号', dataIndex: 'code', width: 150 },
    { title: '金额', dataIndex: 'amount', width: 120, render: (v: number) => `¥${v?.toFixed(2) || '0.00'}` },
    {
      title: '支付方式',
      dataIndex: 'method',
      width: 120,
      render: (method: string) => {
        const option = paymentMethodOptions.find(o => o.value === method)
        return <Tag>{option?.label || method}</Tag>
      },
    },
    { title: '收款日期', dataIndex: 'payment_date', width: 120 },
    { title: '付款方', dataIndex: 'payer_name', width: 200, render: (v: string) => v || '-', ellipsis: true },
    { title: '凭证号', dataIndex: 'voucher_no', width: 150, render: (v: string) => v || '-' },
  ]

  return (
    <div className="page-card">
      <PageTitle
        title="财务管理"
        description="管理发票和收款记录，跟踪合同财务进度。"
      />

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'invoices',
            label: '发票管理',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    allowClear
                    placeholder="搜索发票号码"
                    prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                    style={{ width: 260 }}
                  />
                  <Permission permission="business:invoice:create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      invoiceForm.resetFields()
                      invoiceForm.setFieldsValue({ invoice_no: generateInvoiceCode() })
                      setInvoiceModalOpen(true)
                    }}>
                      新增发票
                    </Button>
                  </Permission>
                  <Button icon={<ReloadOutlined />} onClick={() => loadInvoices()}>
                    刷新
                  </Button>
                </Space>
                <Table
                  columns={invoiceColumns}
                  dataSource={invoices}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </>
            ),
          },
          {
            key: 'payments',
            label: '收款管理',
            children: (
              <>
                <Space style={{ marginBottom: 16 }}>
                  <Input
                    allowClear
                    placeholder="搜索收款编号"
                    prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
                    style={{ width: 260 }}
                  />
                  <Permission permission="business:payment:create">
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                      paymentForm.resetFields()
                      paymentForm.setFieldsValue({ code: generatePaymentCode() })
                      setPaymentModalOpen(true)
                    }}>
                      新增收款
                    </Button>
                  </Permission>
                  <Button icon={<ReloadOutlined />} onClick={() => loadPayments()}>
                    刷新
                  </Button>
                </Space>
                <Table
                  columns={paymentColumns}
                  dataSource={payments}
                  rowKey="id"
                  loading={loading}
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 条`,
                  }}
                />
              </>
            ),
          },
        ]}
      />

      {/* 新增发票弹窗 */}
      <Modal
        title="新增发票"
        open={invoiceModalOpen}
        onOk={handleCreateInvoice}
        onCancel={() => {
          setInvoiceModalOpen(false)
          invoiceForm.resetFields()
        }}
        width={640}
      >
        <Form form={invoiceForm} layout="vertical">
          <Form.Item name="invoice_no" label="发票号码" rules={[{ required: true, message: '请输入发票号码' }]}>
            <Input placeholder="系统自动生成" disabled />
          </Form.Item>
          <Form.Item name="invoice_code" label="发票代码">
            <Input placeholder="请输入发票代码" />
          </Form.Item>
          <Form.Item
            name="contract_id"
            label="关联合同"
            rules={[{ required: true, message: '请选择关联合同' }]}
          >
            <Select
              placeholder="请选择关联合同"
              showSearch
              optionFilterProp="label"
              options={contracts.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))}
            />
          </Form.Item>
          <Form.Item
            name="type"
            label="发票类型"
            rules={[{ required: true, message: '请选择发票类型' }]}
            initialValue="normal"
          >
            <Select options={invoiceTypeOptions} />
          </Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item
              name="amount"
              label="金额"
              rules={[{ required: true, message: '请输入金额' }]}
              style={{ width: 180 }}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0} 
                precision={2} 
                prefix="¥"
                onChange={calculateTaxAmount}
              />
            </Form.Item>
            <Form.Item
              name="tax_rate"
              label="税率"
              rules={[{ required: true, message: '请选择税率' }]}
              initialValue={0.13}
              style={{ width: 120 }}
            >
              <Select 
                options={taxRateOptions}
                onChange={calculateTaxAmount}
              />
            </Form.Item>
            <Form.Item name="tax_amount" label="税额" style={{ width: 180 }}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" disabled />
            </Form.Item>
          </Space>
          <Form.Item
            name="issue_date"
            label="开票日期"
            rules={[{ required: true, message: '请选择开票日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item
            name="buyer_name"
            label="购方名称"
            rules={[{ required: true, message: '请输入购方名称' }]}
          >
            <Input placeholder="请输入购方名称" />
          </Form.Item>
          <Form.Item name="buyer_tax_no" label="购方税号">
            <Input placeholder="请输入购方税号" />
          </Form.Item>
          <Form.Item
            name="seller_name"
            label="销方名称"
            rules={[{ required: true, message: '请输入销方名称' }]}
          >
            <Input placeholder="请输入销方名称" />
          </Form.Item>
          <Form.Item name="seller_tax_no" label="销方税号">
            <Input placeholder="请输入销方税号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 新增收款弹窗 */}
      <Modal
        title="新增收款"
        open={paymentModalOpen}
        onOk={handleCreatePayment}
        onCancel={() => {
          setPaymentModalOpen(false)
          paymentForm.resetFields()
        }}
        width={640}
      >
        <Form form={paymentForm} layout="vertical">
          <Form.Item name="code" label="收款编号" rules={[{ required: true, message: '请输入收款编号' }]}>
            <Input placeholder="系统自动生成" disabled />
          </Form.Item>
          <Form.Item
            name="contract_id"
            label="关联合同"
            rules={[{ required: true, message: '请选择关联合同' }]}
          >
            <Select
              placeholder="请选择关联合同"
              showSearch
              optionFilterProp="label"
              options={contracts.map(c => ({ label: `${c.name} (${c.code})`, value: c.id }))}
            />
          </Form.Item>
          <Form.Item name="invoice_id" label="关联发票">
            <Select
              placeholder="请选择关联发票（可选）"
              allowClear
              options={invoices.map(i => ({ label: `${i.invoice_no} (¥${i.amount})`, value: i.id }))}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="金额"
            rules={[{ required: true, message: '请输入金额' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} precision={2} prefix="¥" />
          </Form.Item>
          <Form.Item
            name="payment_date"
            label="收款日期"
            rules={[{ required: true, message: '请选择收款日期' }]}
          >
            <DatePicker style={{ width: '100%' }} placeholder="选择日期" />
          </Form.Item>
          <Form.Item
            name="method"
            label="支付方式"
            rules={[{ required: true, message: '请选择支付方式' }]}
            initialValue="bank_transfer"
          >
            <Select options={paymentMethodOptions} />
          </Form.Item>
          <Form.Item name="payer_name" label="付款方名称">
            <Input placeholder="请输入付款方名称" />
          </Form.Item>
          <Form.Item name="payer_account" label="付款方账号">
            <Input placeholder="请输入付款方账号" />
          </Form.Item>
          <Form.Item name="receiver_account" label="收款方账号">
            <Input placeholder="请输入收款方账号" />
          </Form.Item>
          <Form.Item name="voucher_no" label="凭证号">
            <Input placeholder="请输入凭证号" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={2} placeholder="请输入备注" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
