import { Button, Form, Input, Segmented, Select, Space, Table, Tag, message } from 'antd'
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { fetchLoginLogsApi, fetchOperationLogsApi } from '../api/logs'
import { PageTitle } from '../components/page-title'
import type { LoginLogItem, OperationLogItem } from '../types'

// 格式化时间，将 UTC 转换为本地时间
function formatDateTime(dateTimeStr: string): string {
  if (!dateTimeStr) return '-'
  const date = new Date(dateTimeStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

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

  const loadLoginLogs = async (page = 1, formValues?: { username?: string; status?: string }) => {
    setLoading(true)
    try {
      // 优先使用传入的表单值，否则从 form 获取
      const filters = formValues || loginForm.getFieldsValue() as { username?: string; status?: string }
      console.log('登录日志查询表单值:', filters)
      
      // 过滤掉空字符串和 undefined 值
      const cleanFilters: Record<string, string | number> = {}
      if (filters.username?.trim()) cleanFilters.username = filters.username.trim()
      if (filters.status?.trim()) cleanFilters.status = filters.status.trim()
      
      console.log('登录日志查询参数:', cleanFilters)
      
      const response = await fetchLoginLogsApi({ page, page_size: 10, ...cleanFilters })
      console.log('登录日志查询结果:', response.data)
      
      setLoginLogs(response.data?.data?.items || [])
      setLoginTotal(response.data?.data?.total || 0)
      setLoginPage(page)
    } catch (error) {
      message.error('加载登录日志失败')
      console.error('loadLoginLogs error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadOperationLogs = async (page = 1, formValues?: { username?: string; action?: string; result?: string }) => {
    setLoading(true)
    try {
      // 优先使用传入的表单值，否则从 form 获取
      const filters = formValues || operationForm.getFieldsValue() as { username?: string; action?: string; result?: string }
      console.log('操作日志查询表单值:', filters)
      
      // 过滤掉空字符串和 undefined 值
      const cleanFilters: Record<string, string | number> = {}
      if (filters.username?.trim()) cleanFilters.username = filters.username.trim()
      if (filters.action?.trim()) cleanFilters.action = filters.action.trim()
      if (filters.result?.trim()) cleanFilters.result = filters.result.trim()
      
      console.log('操作日志查询参数:', cleanFilters)
      
      const response = await fetchOperationLogsApi({ page, page_size: 10, ...cleanFilters })
      console.log('操作日志查询结果:', response.data)
      
      setOperationLogs(response.data?.data?.items || [])
      setOperationTotal(response.data?.data?.total || 0)
      setOperationPage(page)
    } catch (error) {
      message.error('加载操作日志失败')
      console.error('loadOperationLogs error:', error)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
          <Form 
            form={loginForm} 
            layout="inline" 
            onFinish={(values) => {
              console.log('Login Form onFinish values:', values)
              loadLoginLogs(1, values)
            }}
          >
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
                    // 使用 setTimeout 确保表单重置完成后再加载
                    setTimeout(() => loadLoginLogs(1), 0)
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
            pagination={{ 
              current: loginPage, 
              total: loginTotal, 
              pageSize: 10, 
              onChange: (page) => {
                console.log('登录日志分页:', page)
                loadLoginLogs(page)
              }
            }}
            columns={[
              { title: '用户名', dataIndex: 'username' },
              { title: 'IP', dataIndex: 'ip', render: (value) => value || '-' },
              {
                title: '状态',
                dataIndex: 'status',
                render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value}</Tag>,
              },
              { title: '消息', dataIndex: 'message', render: (value) => value || '-' },
              { title: '时间', dataIndex: 'create_time', render: (value) => formatDateTime(value) },
            ]}
          />
        </Space>
      ) : (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form 
            form={operationForm} 
            layout="inline" 
            onFinish={(values) => {
              console.log('Form onFinish values:', values)
              loadOperationLogs(1, values)
            }}
          >
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
                    // 使用 setTimeout 确保表单重置完成后再加载
                    setTimeout(() => loadOperationLogs(1), 0)
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
            pagination={{ 
              current: operationPage, 
              total: operationTotal, 
              pageSize: 10, 
              onChange: (page) => {
                console.log('操作日志分页:', page)
                loadOperationLogs(page)
              }
            }}
            columns={[
              { title: '用户', dataIndex: 'username', width: 120, render: (value) => value || '-' },
              { title: '动作', dataIndex: 'action', width: 150 },
              { title: '目标', dataIndex: 'target', width: 200, ellipsis: true, render: (value) => value || '-' },
              {
                title: '结果',
                dataIndex: 'result',
                width: 80,
                render: (value) => <Tag color={value === 'success' ? 'success' : 'error'}>{value}</Tag>,
              },
              { title: '时间', dataIndex: 'create_time', width: 180, render: (value) => formatDateTime(value) },
            ]}
          />
        </Space>
      )}
    </div>
  )
}
