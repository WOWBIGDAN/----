import { BellOutlined, CrownOutlined, LogoutOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Badge, Button, Dropdown, Menu, Spin, Tag } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useGetUnreadCountQuery, useLogoutMutation } from '../api/api'
import { resetSessionCache } from '../api/authEvents'
import { formatTime } from '../lib/format'
import { clearAuth } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { NoticeWatcher } from './NoticeWatcher'
import { SessionHydrator } from './SessionHydrator'

const tabs = [
  { key: '/science', label: '科普内容' },
  { key: '/courses', label: '付费课程' },
  { key: '/products', label: '精选产品' },
  { key: '/ai', label: 'AI问答' },
  { key: '/account', label: '用户中心' },
]

function navKey(pathname: string) {
  if (pathname.startsWith('/science') || pathname.startsWith('/columns') || pathname.startsWith('/content')) return '/science'
  if (pathname.startsWith('/courses')) return '/courses'
  if (pathname.startsWith('/products') || pathname.startsWith('/checkout')) return '/products'
  if (pathname.startsWith('/ai')) return '/ai'
  if (pathname.startsWith('/account')) return '/account'
  return ''
}

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const token = useAppSelector((state) => state.auth.accessToken)
  const hydrated = useAppSelector((state) => state.auth.hydrated)
  const { data: unread } = useGetUnreadCountQuery(undefined, { skip: !token, pollingInterval: 60_000 })
  const [logout, logoutState] = useLogoutMutation()

  const onLogout = async () => {
    try {
      await logout().unwrap()
    } catch {
      /* 本地会话仍然退出 */
    }
    dispatch(clearAuth())
    resetSessionCache()
    navigate('/science')
  }

  return (
    <div>
      <SessionHydrator />
      <NoticeWatcher />
      <header className="app-header">
        <button className="brand" onClick={() => navigate('/science')} style={{ border: 0, background: 'transparent', cursor: 'pointer' }}>
          <span className="brand-mark">爱</span>
          纯爱健康
        </button>
        <Menu
          className="header-menu"
          mode="horizontal"
          disabledOverflow
          selectedKeys={[navKey(location.pathname)]}
          items={tabs}
          onClick={({ key }) => navigate(key)}
        />
        <div className="header-actions">
          {user?.membership.active ? (
            <Tag color="gold" className="clickable" onClick={() => navigate('/account/membership')}>
              会员至 {formatTime(user.membership.expiresAt)}
            </Tag>
          ) : token ? (
            <Button icon={<CrownOutlined />} onClick={() => navigate('/account/membership')}>
              开通会员
            </Button>
          ) : (
            <Button type="primary" onClick={() => navigate('/login')}>
              登录
            </Button>
          )}
          {token ? (
            <>
              <Badge count={unread?.count ?? 0} size="small">
                <Button aria-label="消息" icon={<BellOutlined />} onClick={() => navigate('/account/notifications')} />
              </Badge>
              <Dropdown
                menu={{
                  items: [
                    { key: 'account', icon: <UserOutlined />, label: '用户中心' },
                    { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', disabled: logoutState.isLoading },
                  ],
                  onClick: ({ key }) => {
                    if (key === 'account') navigate('/account')
                    if (key === 'logout') void onLogout()
                  },
                }}
              >
                <Avatar src={user?.avatarUrl || undefined} icon={<UserOutlined />} style={{ cursor: 'pointer', background: '#0f766e' }} />
              </Dropdown>
            </>
          ) : null}
        </div>
      </header>
      <div className="disclaimer">健康知识辅助服务，不提供诊断、处方或在线问诊。</div>
      {hydrated ? <Outlet /> : <div className="page-center"><Spin size="large" /></div>}
    </div>
  )
}
