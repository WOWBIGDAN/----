import { Card, Col, Row, Tag, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { permissionLabel } from '../lib/access'
import { useAppSelector } from '../store/hooks'

const links = [
  { permission: 'content:write', to: '/content', title: '管理科普与课程' },
  { permission: 'products:write', to: '/products', title: '管理商品与库存' },
  { permission: 'orders:read', to: '/orders', title: '查看订单与物流' },
  { permission: 'aftersales:review', to: '/aftersales', title: '处理售后' },
  { permission: 'users:read', to: '/users', title: '查看用户' },
  { permission: 'membership:write', to: '/membership-plans', title: '管理会员方案' },
  { permission: 'notifications:write', to: '/notifications', title: '发送站内通知' },
  { permission: 'audit:read', to: '/audit', title: '查看审计日志' },
]

export function DashboardPage() {
  const admin = useAppSelector((state) => state.auth.admin)
  const permissions = admin?.permissions ?? []
  return (
    <div>
      <Typography.Title level={3}>工作台</Typography.Title>
      <Typography.Paragraph>
        {admin?.displayName}（{admin?.username}）
      </Typography.Paragraph>
      <div style={{ marginBottom: 16 }}>
        {permissions.length ? permissions.map((item) => <Tag key={item}>{permissionLabel[item] ?? item}</Tag>) : <Tag>暂无业务权限</Tag>}
      </div>
      <Row gutter={[16, 16]}>
        {links.filter((item) => permissions.includes(item.permission)).map((item) => (
          <Col key={item.to} xs={24} md={8}>
            <Link to={item.to}>
              <Card hoverable>{item.title}</Card>
            </Link>
          </Col>
        ))}
      </Row>
    </div>
  )
}
