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
      <Space direction="vertical" size={4}>
        <Typography.Title 
          level={4} 
          style={{ 
            margin: 0, 
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
          }}
        >
          {title}
        </Typography.Title>
        {description ? (
          <Typography.Text 
            type="secondary"
            style={{ 
              fontSize: 13, 
              color: '#8c8c8c',
            }}
          >
            {description}
          </Typography.Text>
        ) : null}
      </Space>
      {extra}
    </div>
  )
}
