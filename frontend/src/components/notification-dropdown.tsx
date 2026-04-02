import { useEffect, useState } from 'react'
import { Badge, Button, Dropdown, Typography, Empty, Tabs, Divider } from 'antd'
import { BellOutlined, CheckCircleOutlined, InfoCircleOutlined, WarningOutlined, CheckOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useNotificationStore } from '../store/notifications'
import type { Notification } from '../types/notification'

const { Text } = Typography

type TabKey = 'unread' | 'all'

const getTypeIcon = (type: string) => {
  const iconStyle = { fontSize: 14 }
  if (type === 'info') return <InfoCircleOutlined style={{ ...iconStyle, color: '#1890ff' }} />
  if (type === 'warning') return <WarningOutlined style={{ ...iconStyle, color: '#faad14' }} />
  if (type === 'success') return <CheckCircleOutlined style={{ ...iconStyle, color: '#52c41a' }} />
  return <InfoCircleOutlined style={{ ...iconStyle, color: '#8c8c8c' }} />
}

const getTypeTag = (type: string) => {
  const config: Record<string, { text: string; color: string; bg: string }> = {
    info: { text: '信息', color: '#1890ff', bg: '#e6f7ff' },
    warning: { text: '提醒', color: '#faad14', bg: '#fffbe6' },
    success: { text: '完成', color: '#52c41a', bg: '#f6ffed' },
    system: { text: '系统', color: '#595959', bg: '#f5f5f5' },
  }
  const cfg = config[type] || config.system
  return (
    <span style={{
      fontSize: 11,
      padding: '1px 6px',
      borderRadius: 4,
      color: cfg.color,
      background: cfg.bg,
      fontWeight: 500,
    }}>
      {cfg.text}
    </span>
  )
}

const formatTime = (timeStr: string) => {
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

interface NotificationItemProps {
  item: Notification
  onClick: () => void
  onRead: () => void
}

function NotificationItem({ item, onClick, onRead }: NotificationItemProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        cursor: 'pointer',
        borderBottom: '1px solid rgba(0, 0, 0, 0.03)',
        transition: 'all 0.2s ease',
        background: item.is_read ? 'transparent' : 'rgba(24, 144, 255, 0.02)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = item.is_read ? 'transparent' : 'rgba(24, 144, 255, 0.02)'
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        {/* 图标 */}
        <div style={{ marginTop: 2, flexShrink: 0 }}>
          {getTypeIcon(item.type)}
        </div>

        {/* 内容区 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Text
              strong
              style={{
                fontSize: 14,
                color: '#1a1a1a',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {item.title}
            </Text>
            {getTypeTag(item.type)}
            {!item.is_read && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#ff4d4f',
                  flexShrink: 0,
                }}
              />
            )}
          </div>

          <Text
            style={{
              fontSize: 13,
              color: '#595959',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.content}
          </Text>

          <div style={{ marginTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {formatTime(item.create_time)}
            </Text>
            {!item.is_read && (
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined style={{ fontSize: 12 }} />}
                onClick={(e) => {
                  e.stopPropagation()
                  onRead()
                }}
                style={{
                  padding: '0 6px',
                  height: 22,
                  fontSize: 12,
                  color: '#8c8c8c',
                }}
              >
                标为已读
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationDropdown() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabKey>('unread')

  const {
    notifications,
    unreadNotifications,
    count,
    fetchNotifications,
    fetchUnreadNotifications,
    fetchCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  useEffect(() => {
    fetchCount()
    fetchUnreadNotifications(10)
    fetchNotifications({ page: 1, pageSize: 10 })
  }, [])

  const unreadCount = count?.total || 0
  const rawList = activeTab === 'unread' ? unreadNotifications : notifications
  const displayList = Array.isArray(rawList) ? rawList : []

  const handleNotificationClick = (item: Notification) => {
    if (!item.is_read) {
      markAsRead(item.id)
    }
    // 如果有源链接，可以跳转
    if (item.source_id && item.source_type) {
      // navigate(`/${item.source_type}/${item.source_id}`)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleViewAll = () => {
    setOpen(false)
    navigate('/notifications')
  }

  const notificationContent = (
    <div
      style={{
        width: 380,
        maxHeight: 480,
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
        overflow: 'hidden',
      }}
    >
      {/* 头部 */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fafafa',
        }}
      >
        <Text strong style={{ fontSize: 15, color: '#1a1a1a' }}>
          消息通知
        </Text>
        {unreadCount > 0 && (
          <Button
            type="text"
            size="small"
            onClick={handleMarkAllAsRead}
            style={{ fontSize: 13, color: '#595959' }}
          >
            全部已读
          </Button>
        )}
      </div>

      {/* Tab 切换 */}
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as TabKey)}
        style={{ margin: 0 }}
        tabBarStyle={{
          margin: 0,
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
        }}
        items={[
          {
            key: 'unread',
            label: (
              <span>
                未读
                {unreadCount > 0 && (
                  <Badge
                    count={unreadCount}
                    style={{
                      marginLeft: 6,
                      fontSize: 11,
                      background: '#ff4d4f',
                    }}
                  />
                )}
              </span>
            ),
          },
          { key: 'all', label: '全部' },
        ]}
      />

      {/* 列表区 */}
      <div style={{ maxHeight: 320, overflow: 'auto' }}>
        {(!displayList || displayList.length === 0) ? (
          <Empty
            description={activeTab === 'unread' ? '暂无未读通知' : '暂无通知'}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ padding: '40px 0' }}
          />
        ) : (
          displayList.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onClick={() => handleNotificationClick(item)}
              onRead={() => markAsRead(item.id)}
            />
          ))
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 底部 */}
      <div
        style={{
          padding: '10px 16px',
          textAlign: 'center',
          background: '#fafafa',
        }}
      >
        <Button
          type="text"
          onClick={handleViewAll}
          style={{ fontSize: 13, color: '#595959' }}
        >
          查看全部通知
        </Button>
      </div>
    </div>
  )

  return (
    <Dropdown
      dropdownRender={() => notificationContent}
      placement="bottomRight"
      trigger={['click']}
      open={open}
      onOpenChange={setOpen}
    >
      <Button
        type="text"
        style={{
          border: 'none',
          boxShadow: 'none',
          padding: '4px 12px',
          color: '#595959',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          height: 40,
        }}
      >
        <Badge
          count={unreadCount}
          size="small"
          offset={[2, 0]}
          style={{ background: unreadCount > 0 ? '#ff4d4f' : '#8c8c8c' }}
        >
          <BellOutlined style={{ fontSize: 18 }} />
        </Badge>
        <span style={{ fontSize: 14 }}>通知</span>
      </Button>
    </Dropdown>
  )
}
