import {
  BellOutlined,
  CrownOutlined,
  EnvironmentOutlined,
  ProfileOutlined,
  ReadOutlined,
  SafetyOutlined,
  ShoppingOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Card, Menu } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const items = [
  { key: '/account', icon: <UserOutlined />, label: '概览' },
  { key: '/account/orders', icon: <ProfileOutlined />, label: '我的订单' },
  { key: '/account/addresses', icon: <EnvironmentOutlined />, label: '收货地址' },
  { key: '/account/aftersales', icon: <ShoppingOutlined />, label: '售后' },
  { key: '/account/courses', icon: <ReadOutlined />, label: '已购课程' },
  { key: '/account/membership', icon: <CrownOutlined />, label: '会员' },
  { key: '/account/notifications', icon: <BellOutlined />, label: '消息' },
  { key: '/account/security', icon: <SafetyOutlined />, label: '账号安全' },
]

function selectedKey(pathname: string) {
  const keys = items.map((item) => item.key).filter((key) => key !== '/account').sort((a, b) => b.length - a.length)
  return keys.find((key) => pathname === key || pathname.startsWith(`${key}/`)) ?? '/account'
}

export function AccountLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <div className="page">
      <div className="account-layout">
        <Card styles={{ body: { padding: 8 } }}>
          <Menu mode="inline" selectedKeys={[selectedKey(location.pathname)]} items={items} onClick={({ key }) => navigate(key)} />
        </Card>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
