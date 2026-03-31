import { Button, Form, Input, Segmented, Select, Space, Table, Tag } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { fetchLoginLogsApi, fetchOperationLogsApi } from '../api/logs'
import { PageTitle } from '../components/page-title'
import type { LoginLogItem, OperationLogItem } from '../types'

type LogMode = 'login' | 'operation'

export function LogsPage() {
  const [mode, setMode] = useState<LogMode>('login')
  const [loading, setLoading] = useState(false)
  const [loginLogs, setLoginLogs] = useState<LoginLogItem[]>([])
  const [operationLogs, setOperationLogs] = useState<OperationLogItem[]>([])
  const [loginTotal, setLoginTotal] = useState(0)
  const [operationTotal, setOperationTotal] = useState(0)
  const [loginPage, setLoginPage] = useState(1)
  const [operationPage, setOperationPage] = useState(1)
  const [loginForm] = Form.useForm<{ username?: string; status?: string }>()
  const [operationForm] = Form.useForm<{ username?: string; action?: string; result?: string }>()

  const loadLoginLogs = async (page = loginPage) => {
    setLoading(true)
    try {
      const filters = loginForm.getFieldsValue()
      const response = await fetchLoginLogsApi({ page, page_size: 10, ...filters })
      setLoginLogs(response.data.data.items)
      setLoginTotal(response.data.data.total)
      setLoginPage(page)
    } finally {
      setLoading(false)
    }
  }

  const loadOperationLogs = async (page = operationPage) => {
    setLoading(true)
    try {
      const filters = operationForm.getFieldsValue()
      const response = await fetchOperationLogsApi({ page, page_size: 10, ...filters })
      setOperationLogs(response.data.data.items)
      setOperationTotal(response.data.data.total)
      setOperationPage(page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (mode === 'login') {
      void loadLoginLogs(1)
    } else {
      void loadOperationLogs(1)
    }
  }, [mode])

  return (
    <div className="page-card">
      <PageTitle
        title="日志中心"
        description="统一查看登录日志与关键操作日志。"
        extra={
          <Segmented
            value={mode}
            onChange={(value) => setMode(value as LogMode)}
            options={[
              { label: '登录日志', value: 'login' },
              { label: '操作日志', value: 'operation' },
            ]}
          />
        }
      />

      {mode === 'login' ? (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form form={loginForm} layout="inline" onFinish={() => void loadLoginLogs(1)}>
            <Form.Item name="username">
              <Input placeholder="用户名" allowClear />
            </Form.Item>
            <Form.Item name="status">
              <Select
                allowClear
                style={{ width: 140 }}
                placeholder="状态"
                options={[
                  { label: '成功', value: 'success' },
                  { label: '失败', value: 'failed' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    loginForm.resetFields()
                    void loadLoginLogs(1)
                  }}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <Table<LoginLogItem>
            rowKey="id"
            loading={loading}
            dataSource={loginLogs}
            pagination={{ current: loginPage, total: loginTotal, pageSize: 10, onChange: (page) => void loadLoginLogs(page) }}
            columns={[
              { title: '用户名', dataIndex: 'username' },
              { title: 'IP', dataIndex: 'ip', render: (value) => value || '-' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value}</Tag>,
              },
              { title: '消息', dataIndex: 'message', render: (value) => value || '-' },
              { title: '时间', dataIndex: 'create_time' },
            ]}
          />
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form form={operationForm} layout="inline" onFinish={() => void loadOperationLogs(1)}>
            <Form.Item name="username">
              <Input placeholder="用户名" allowClear />
            </Form.Item>
            <Form.Item name="action">
              <Input placeholder="动作" allowClear />
            </Form.Item>
            <Form.Item name="result">
              <Select
                allowClear
                style={{ width: 140 }}
                placeholder="结果"
                options={[
                  { label: '成功', value: 'success' },
                  { label: '失败', value: 'failed' },
                ]}
              />
            </Form.Item>
            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                  查询
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    operationForm.resetFields()
                    void loadOperationLogs(1)
                  }}
                >
                  重置
                </Button>
              </Space>
            </Form.Item>
          </Form>
          <Table<OperationLogItem>
            rowKey="id"
            loading={loading}
            dataSource={operationLogs}
            pagination={{ current: operationPage, total: operationTotal, pageSize: 10, onChange: (page) => void loadOperationLogs(page) }}
            columns={[
              { title: '用户', dataIndex: 'username', render: (value) => value || '-' },
              { title: '动作', dataIndex: 'action' },
              { title: '目标', dataIndex: 'target', render: (value) => value || '-' },
              {
                title: '结果',
                dataIndex: 'result',
                render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value}</Tag>,
              },
              { title: '时间', dataIndex: 'create_time' },
            ]}
          />
        </Space>
      )}
    </div>
  )
}
