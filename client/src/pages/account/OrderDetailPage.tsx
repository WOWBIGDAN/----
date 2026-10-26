import { Button, Form, Input, Modal, Space, Tag, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCancelOrderMutation, useConfirmReceiptMutation, useGetOrderQuery, useGetRefundsQuery } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { formatAddress, formatTime, skuLabel } from '../../lib/format'
import { getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { labelOf, orderStatusLabel, orderTypeLabel, paymentStatusLabel, refundReasonLabel, refundStatusLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const order = useGetOrderQuery(id)
  const refunds = useGetRefundsQuery({ id, page: 1, pageSize: 20 })
  const [cancelOrder, cancelState] = useCancelOrderMutation()
  const [confirmReceipt, receiptState] = useConfirmReceiptMutation()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm<{ reason: string }>()
  useTitle(order.data ? `订单 ${order.data.orderNo}` : '订单详情')
  const detail = order.data

  const cancel = async () => {
    if (!detail) return
    const values = await form.validateFields()
    const idempotencyKey = getOrCreateIdempotencyKey(`cancel:${detail.id}:${detail.version}`)
    setError(null)
    try {
      await cancelOrder({ id: detail.id, reason: values.reason.trim(), version: detail.version, idempotencyKey }).unwrap()
      setCancelOpen(false)
    } catch (cancelError) {
      setError(cancelError)
    }
  }

  const receive = async () => {
    if (!detail) return
    const idempotencyKey = getOrCreateIdempotencyKey(`receipt:${detail.id}:${detail.version}`)
    setError(null)
    try {
      await confirmReceipt({ id: detail.id, version: detail.version, idempotencyKey }).unwrap()
    } catch (receiptError) {
      setError(receiptError)
    }
  }

  return (
    <PageState isLoading={order.isLoading} error={order.error}>
      {detail ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <Space wrap>
            <Typography.Title level={3} style={{ margin: 0 }}>{detail.orderNo}</Typography.Title>
            <Tag>{labelOf(orderTypeLabel, detail.type)}</Tag>
            <Tag color="blue">{labelOf(orderStatusLabel, detail.status)}</Tag>
            <Tag>{labelOf(paymentStatusLabel, detail.paymentStatus)}</Tag>
          </Space>
          <Typography.Paragraph type="secondary">下单时间 {formatTime(detail.createdAt)}</Typography.Paragraph>
          {detail.items.map((item) => (
            <div key={item.id} style={{ marginBottom: 8 }}>
              {item.title} {skuLabel(item.skuAttributes)} × {item.quantity} · <Money cents={item.subtotalCents} />
            </div>
          ))}
          <div>商品 <Money cents={detail.itemsAmountCents} /></div>
          <div>运费 <Money cents={detail.shippingFeeCents} /></div>
          <div>应付 <Money cents={detail.payableAmountCents} /></div>
          <div>已付 <Money cents={detail.paidAmountCents} /></div>
          <div>已退 <Money cents={detail.refundedAmountCents} /></div>
          {detail.address ? <Typography.Paragraph>收货信息：{detail.address.recipient} {formatAddress(detail.address)}</Typography.Paragraph> : null}
          {detail.cancelReason ? <Typography.Paragraph>取消原因：{detail.cancelReason}</Typography.Paragraph> : null}
          <Space wrap style={{ marginTop: 12 }}>
            {detail.actions.canPay ? <Button type="primary" onClick={() => navigate(`/account/orders/${detail.id}/pay`)}>去支付</Button> : null}
            {detail.actions.canCancel ? <Button onClick={() => setCancelOpen(true)}>取消订单</Button> : null}
            {detail.actions.canConfirmReceipt ? <Button type="primary" loading={receiptState.isLoading} onClick={() => void receive()}>确认收货</Button> : null}
            {detail.actions.canApplyAfterSale ? <Button onClick={() => navigate(`/account/aftersales/new?orderId=${detail.id}`)}>申请售后</Button> : null}
            {detail.type === 'PRODUCT' ? <Link to={`/account/orders/${detail.id}/logistics`}>查看物流</Link> : null}
          </Space>
          {error ? <div style={{ marginTop: 12 }}><ErrorAlert error={error} /></div> : null}
          {refunds.data?.items.length ? (
            <>
              <Typography.Title level={5}>退款进度</Typography.Title>
              {refunds.data.items.map((refund) => (
                <div key={refund.id}>
                  {labelOf(refundReasonLabel, refund.reasonType)} · {labelOf(refundStatusLabel, refund.status)} · <Money cents={refund.amountCents} />
                </div>
              ))}
            </>
          ) : null}
          <Modal title="取消待支付订单" open={cancelOpen} onCancel={() => setCancelOpen(false)} onOk={() => void cancel()} confirmLoading={cancelState.isLoading}>
            <Form form={form} layout="vertical">
              <Form.Item name="reason" label="取消原因" rules={[{ required: true, max: 200, message: '请填写取消原因' }]}>
                <Input.TextArea rows={3} />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ) : null}
    </PageState>
  )
}
