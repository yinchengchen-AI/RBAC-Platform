import { Button, Popconfirm, Space, Table, Tag, Upload, message } from 'antd'
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons'
import { useEffect, useState } from 'react'

import { deleteFileApi, fetchFilesApi } from '../api/files'
import { PageTitle } from '../components/page-title'
import type { FileItem } from '../types'

export function FilesPage() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<FileItem[]>([])

  const loadData = async () => {
    setLoading(true)
    try {
      const response = await fetchFilesApi()
      setData(response.data.data)
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
        title="文件管理"
        description="文件统一存储到 MinIO，便于未来业务模块复用。"
        extra={
          <Space>
            <Upload
              action={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'}/files/upload`}
              headers={{ Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` }}
              showUploadList={false}
              onChange={(info) => {
                if (info.file.status === 'done') {
                  message.success('文件上传成功')
                  void loadData()
                }
                if (info.file.status === 'error') {
                  message.error('文件上传失败')
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
        dataSource={data}
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
