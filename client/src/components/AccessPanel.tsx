import { Button, Space, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { AccessDecision, AccessPolicy } from '../api/types'
import { accessReasonLabel } from '../lib/labels'
import { Money } from './Money'

export function AccessPanel({
  access,
  policy,
  priceCents,
  courseId,
}: {
  access: AccessDecision
  policy: AccessPolicy
  priceCents: number
  courseId?: string
}) {
  const navigate = useNavigate()
  if (access.canAccess) return null
  const login = () => navigate('/login', { state: { from: window.location.pathname } })
  return (
    <div style={{ marginTop: 16 }}>
      <Typography.Paragraph>{accessReasonLabel[access.reason] ?? '暂时无法查看完整内容'}</Typography.Paragraph>
      <Space wrap>
        {access.reason === 'LOGIN_REQUIRED' ? (
          <Button type="primary" onClick={login}>
            登录后继续
          </Button>
        ) : null}
        {access.reason === 'PURCHASE_REQUIRED' && policy !== 'FREE' && courseId ? (
          <Button type="primary" onClick={() => navigate(`/checkout?type=course&courseId=${courseId}`)}>
            购买课程 <Money cents={priceCents} />
          </Button>
        ) : null}
        {access.reason === 'PURCHASE_REQUIRED' && policy === 'MEMBER_OR_PURCHASE' ? (
          <Button onClick={() => navigate('/account/membership')}>开通会员</Button>
        ) : null}
      </Space>
    </div>
  )
}
