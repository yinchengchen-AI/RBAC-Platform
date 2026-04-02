import React from 'react'
import ReactDOM from 'react-dom/client'
import { ConfigProvider, App as AntdApp, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

import { AppRouter } from './router'
import './styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          // 主色调 - 深灰黑
          colorPrimary: '#1a1a1a',
          colorPrimaryHover: '#3d3d3d',
          colorPrimaryActive: '#000000',
          
          // 背景色 - 灰白系
          colorBgLayout: '#fafafa',
          colorBgContainer: '#ffffff',
          colorBgElevated: '#f5f5f5',
          
          // 边框色
          colorBorder: '#e5e5e5',
          colorBorderSecondary: '#f0f0f0',
          
          // 文字色
          colorText: '#1a1a1a',
          colorTextSecondary: '#595959',
          colorTextTertiary: '#8c8c8c',
          colorTextDisabled: '#bfbfbf',
          
          // 圆角 - 大圆角风格
          borderRadius: 16,
          borderRadiusLG: 24,
          borderRadiusSM: 8,
          
          // 控件高度
          controlHeight: 40,
          controlHeightLG: 48,
          controlHeightSM: 32,
          
          // 阴影
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
          boxShadowSecondary: '0 8px 24px rgba(0, 0, 0, 0.06)',
          
          // 字体
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
          
          // 动画
          motionDurationFast: '0.15s',
          motionDurationMid: '0.25s',
          motionDurationSlow: '0.35s',
        },
        components: {
          Button: {
            borderRadius: 16,
            controlHeight: 40,
            controlHeightLG: 48,
            primaryShadow: '0 4px 12px rgba(26, 26, 26, 0.15)',
          },
          Input: {
            borderRadius: 16,
            controlHeight: 40,
            controlHeightLG: 48,
            activeShadow: '0 0 0 3px rgba(26, 26, 26, 0.06)',
          },
          Select: {
            borderRadius: 16,
            controlHeight: 40,
          },
          Modal: {
            borderRadius: 32,
          },
          Card: {
            borderRadius: 32,
          },
          Table: {
            borderRadius: 24,
          },
          Menu: {
            borderRadius: 16,
            itemBorderRadius: 16,
          },
          Tag: {
            borderRadius: 10,
          },
          Pagination: {
            borderRadius: 16,
          },
          Dropdown: {
            borderRadius: 24,
            controlPaddingHorizontal: 12,
          },
        },
      }}
    >
      <AntdApp>
        <AppRouter />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>,
)
