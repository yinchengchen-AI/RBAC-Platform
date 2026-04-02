import { Button, Popconfirm, Space, Table, Tag, Upload, message } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { deleteFileApi, fetchFilesApi } from '../api/files'
import { PageTitle } from '../components/page-title'
import type { FileItem } from '../types'

export function DocumentsPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FileItem[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchFilesApi()
      console.log('文档管理 API 响应:', response.data)
      // 确保数据是数组
      const items = Array.isArray(response.data?.data) ? response.data.data : []
      setData(items)
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

  return (
    <div className="page-card">
      <PageTitle
        title="文档管理"
        description="文档统一存储到 MinIO，便于业务模块复用和管理。"
        extra={
          <Space>
            <Upload
              action="/api/v1/documents/upload"
              headers={{ Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` }}
              showUploadList={false}
              onChange={(info) => {
                console.log('Upload status:', info.file.status, info.file.response)
                if (info.file.status === 'done') {
                  message.success('文件上传成功')
                  void loadData()
                }
                if (info.file.status === 'error') {
                  const errorMsg = info.file.response?.message || info.file.error?.message || '文件上传失败'
                  message.error(errorMsg)
                  console.error('Upload error:', info.file.response, info.file.error)
                }
              }}
            >
              <Button type="primary" icon={<UploadOutlined />}>
                上传文件
              </Button>
            </Upload>
          </Space>
        }
      />
      <Table<FileItem>
        rowKey="id"
        loading={loading}
        dataSource={data || []}
        columns={[
          { title: '文件名', dataIndex: 'filename' },
          { title: '存储桶', dataIndex: 'bucket_name' },
          { title: '类型', dataIndex: 'content_type', render: (value) => <Tag>{value || 'unknown'}</Tag> },
          { title: '大小(bytes)', dataIndex: 'size' },
          {
            title: '访问地址',
            dataIndex: 'url',
            render: (value: string) => (
              <a href={value} target="_blank" rel="noreferrer">
                预览文件
              </a>
            ),
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Popconfirm
                title="确认删除该文件吗？"
                onConfirm={async () => {
                  await deleteFileApi(record.id)
                  message.success('文件删除成功')
                  await loadData()
                }}
              >
                <Button type="link" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            ),
          },
        ]}
      />
    </div>
  )
}
