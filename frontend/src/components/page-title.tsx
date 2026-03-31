import { Space, Typography } from 'antd'
import type { ReactNode } from 'react'

interface PageTitleProps {
  title: string
  description?: string
  extra?: ReactNode
}

export function PageTitle({ title, description, extra }: PageTitleProps) {
  return (
    <div className="page-header">
      <Space direction="vertical" size={2}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
      </Space>
      {extra}
    </div>
  )
}
