import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntdApp } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import { AppRouter } from './router'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#3f4754',
          colorBgLayout: '#f3f4f6',
          colorBgContainer: '#ffffff',
          colorBorder: '#e5e7eb',
          colorText: '#111827',
          colorTextSecondary: '#6b7280',
          borderRadius: 14,
          controlHeight: 38,
        },
      }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
