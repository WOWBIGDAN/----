import { Button, Card, Col, Row, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useGetMembershipPlansQuery, useGetMyMembershipQuery } from '../../api/api'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { formatTime } from '../../lib/format'
import { benefitLabel, labelOf } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'
import { useAppSelector } from '../../store/hooks'

export function MembershipPage() {
  useTitle('会员')
  const navigate = useNavigate()
  const token = useAppSelector((state) => state.auth.accessToken)
  const plans = useGetMembershipPlansQuery({ page: 1, pageSize: 20 })
  const mine = useGetMyMembershipQuery(undefined, { skip: !token })

  return (
    <div>
      <div className="page-head">
        <h1>会员</h1>
        <p>会员为固定时长，不自动续费。会员不包含实物商品。</p>
      </div>
      {mine.data ? (
        <Typography.Paragraph>
          {mine.data.active
            ? `当前方案 ${mine.data.currentPlanName ?? '会员'}，有效至 ${formatTime(mine.data.expiresAt)}，每日问答 ${mine.data.aiDailyLimit} 次。`
            : '当前没有生效中的会员。'}
          {mine.data.benefitCodes.length ? ` 权益：${mine.data.benefitCodes.map((code) => labelOf(benefitLabel, code)).join('、')}` : ''}
        </Typography.Paragraph>
      ) : null}
      <PageState isLoading={plans.isLoading} error={plans.error} isEmpty={!plans.data?.items.length} emptyText="暂无可购买方案">
        <Row gutter={[16, 16]}>
          {plans.data?.items.map((plan) => (
            <Col key={plan.id} xs={24} md={12} lg={8}>
              <Card title={plan.name}>
                <Typography.Title level={3} style={{ marginTop: 0 }}>
                  <Money cents={plan.priceCents} />
                </Typography.Title>
                <Typography.Paragraph>{plan.durationDays} 天 · 每日问答 {plan.aiDailyLimit} 次</Typography.Paragraph>
                <Typography.Paragraph>{plan.description}</Typography.Paragraph>
                <Typography.Paragraph type="secondary">
                  {plan.benefitCodes.map((code) => labelOf(benefitLabel, code)).join('、') || '基础会员权益'}
                </Typography.Paragraph>
                <Button type="primary" onClick={() => navigate(`/checkout?type=membership&planId=${plan.id}`)}>
                  购买
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </PageState>
    </div>
  )
}
