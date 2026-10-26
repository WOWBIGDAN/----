import { Alert, Button, QRCode, Radio, Space, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCreatePaymentMutation, useGetOrderQuery, useGetPaymentQuery, useSyncPaymentMutation } from '../../api/api'
import type { PayChannel } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { payChannelLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'
import { api } from '../../api/api'
import { useAppDispatch } from '../../store/hooks'

export function PaymentPage() {
  const { id = '' } = useParams()
  const dispatch = useAppDispatch()
  const [poll, setPoll] = useState(3000)
  const order = useGetOrderQuery(id, { pollingInterval: poll })
  const [channel, setChannel] = useState<PayChannel>('WECHAT_NATIVE')
  const [attemptId, setAttemptId] = useState<string>()
  const payment = useGetPaymentQuery(attemptId ?? '', { skip: !attemptId, pollingInterval: poll })
  const [createPayment, createState] = useCreatePaymentMutation()
  const [syncPayment, syncState] = useSyncPaymentMutation()
  const [error, setError] = useState<unknown>(null)
  const refreshed = useRef(false)
  useTitle('支付订单')
  const detail = order.data
  const attempt = payment.data

  useEffect(() => {
    if (!detail) return
    setPoll(detail.status === 'PENDING_PAYMENT' ? 3000 : 0)
  }, [detail])

  useEffect(() => {
    if (!detail || refreshed.current) return
    if (detail.paymentStatus === 'UNPAID' && detail.status === 'PENDING_PAYMENT') return
    if (detail.status === 'CANCELLED') return
    refreshed.current = true
    dispatch(api.util.invalidateTags(['Me', 'Membership', 'Entitlement']))
  }, [detail, dispatch])

  useEffect(() => {
    if (!attempt || attempt.launchType !== 'REDIRECT') return
    const mark = `pay-open:${attempt.id}`
    if (sessionStorage.getItem(mark)) return
    sessionStorage.setItem(mark, '1')
    window.open(attempt.launchUrl, '_blank', 'noopener,noreferrer')
  }, [attempt])

  const pay = async () => {
    setError(null)
    const idempotencyKey = getOrCreateIdempotencyKey(`pay:${id}:${channel}`)
    try {
      const created = await createPayment({ orderId: id, channel, idempotencyKey }).unwrap()
      setAttemptId(created.id)
    } catch (payError) {
      setError(payError)
    }
  }

  const paid = detail && detail.status !== 'PENDING_PAYMENT' && detail.status !== 'CANCELLED' && detail.paymentStatus !== 'UNPAID'

  return (
    <PageState isLoading={order.isLoading} error={order.error}>
      {detail ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 24 }}>
          <Typography.Title level={3}>支付 {detail.orderNo}</Typography.Title>
          <Typography.Paragraph>
            应付 <Money cents={detail.payableAmountCents} />。支付结果以订单状态为准。
          </Typography.Paragraph>
          {paid ? (
            <Alert
              type="success"
              showIcon
              message="支付已确认"
              description={
                <Space direction="vertical">
                  <Link to={`/account/orders/${detail.id}`}>查看订单</Link>
                  {detail.type === 'COURSE' ? <Link to="/account/courses">查看已购课程</Link> : null}
                  {detail.type === 'MEMBERSHIP' ? <Link to="/account/membership">查看会员</Link> : null}
                </Space>
              }
            />
          ) : detail.actions.canPay ? (
            <>
              <Radio.Group value={channel} onChange={(event) => setChannel(event.target.value as PayChannel)}>
                <Radio.Button value="WECHAT_NATIVE">{payChannelLabel.WECHAT_NATIVE}</Radio.Button>
                <Radio.Button value="ALIPAY_PAGE">{payChannelLabel.ALIPAY_PAGE}</Radio.Button>
              </Radio.Group>
              <div style={{ marginTop: 16 }}>
                <Button type="primary" loading={createState.isLoading} onClick={() => void pay()}>
                  发起支付
                </Button>
              </div>
              {attempt?.launchType === 'QR_CODE' ? (
                <div style={{ marginTop: 16 }}>
                  <QRCode value={attempt.launchUrl} size={220} />
                  <Typography.Paragraph>请使用微信扫描二维码完成支付。</Typography.Paragraph>
                </div>
              ) : null}
              {attempt?.launchType === 'REDIRECT' ? (
                <Button style={{ marginTop: 16 }} onClick={() => window.open(attempt.launchUrl, '_blank', 'noopener,noreferrer')}>
                  前往支付宝
                </Button>
              ) : null}
              {attempt ? (
                <Button style={{ marginLeft: 8 }} loading={syncState.isLoading} onClick={() => void syncPayment(attempt.id)}>
                  我已支付
                </Button>
              ) : null}
            </>
          ) : (
            <Alert type="info" showIcon message="当前订单不能继续支付" />
          )}
          {error ? <div style={{ marginTop: 16 }}><ErrorAlert error={error} /></div> : null}
        </div>
      ) : null}
    </PageState>
  )
}
