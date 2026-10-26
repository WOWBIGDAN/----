import {
  AuditOutlined,
  BellOutlined,
  CrownOutlined,
  LogoutOutlined,
  ReadOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons'
import { Button, Layout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useLogoutMutation } from '../api/api'
import { resetSessionCache } from '../api/authEvents'
import { clearAuth } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { NoticeWatcher } from './NoticeWatcher'

const { Sider, Header, Content } = Layout

const entries = [
  { key: '/dashboard', label: '工作台', permission: '' },
  { key: '/content', label: '科普与课程', permission: 'content:write', icon: <ReadOutlined /> },
  { key: '/content/categories', label: '分类', permission: 'content:write' },
  { key: '/content/columns', label: '专栏', permission: 'content:write' },
  { key: '/products', label: '商品与库存', permission: 'products:write', icon: <ShoppingOutlined /> },
  { key: '/orders', label: '订单与物流', permission: 'orders:read', icon: <ToolOutlined /> },
  { key: '/aftersales', label: '售后处理', permission: 'aftersales:review' },
  { key: '/users', label: '用户', permission: 'users:read', icon: <TeamOutlined /> },
  { key: '/membership-plans', label: '会员方案', permission: 'membership:write', icon: <CrownOutlined /> },
  { key: '/notifications', label: '站内通知', permission: 'notifications:write', icon: <BellOutlined /> },
  { key: '/audit', label: '审计日志', permission: 'audit:read', icon: <AuditOutlined /> },
]

export function AdminShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const admin = useAppSelector((state) => state.auth.admin)
  const [logout, logoutState] = useLogoutMutation()
  const permissions = admin?.permissions ?? []
  const items = entries
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) => ({ key: item.key, icon: item.icon, label: item.label }))
  const selected = [...items].reverse().find((item) => location.pathname === item.key || location.pathname.startsWith(`${item.key}/`))?.key

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <NoticeWatcher />
      <Sider width={220} theme="dark">
        <div className="admin-logo">
          <span className="admin-mark">管</span>
          <span>纯爱健康 · 管理后台</span>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={selected ? [selected] : []} items={items} onClick={({ key }) => navigate(key)} />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px' }}>
          <Typography.Text type="secondary">管理人员入口，与用户登录分开</Typography.Text>
          <div>
            <Typography.Text style={{ marginRight: 12 }}>{admin?.displayName || admin?.username}</Typography.Text>
            <Button
              icon={<LogoutOutlined />}
              loading={logoutState.isLoading}
              onClick={() => {
                void logout()
                  .unwrap()
                  .catch(() => undefined)
                  .finally(() => {
                    dispatch(clearAuth())
                    resetSessionCache()
                    navigate('/login')
                  })
              }}
            >
              退出
            </Button>
          </div>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
