import { Button, Form, Image, Input, Space, Typography } from 'antd'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCancelAfterSaleMutation, useGetAfterSaleQuery, useReadMediaGrantMutation, useSubmitReturnShipmentMutation } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { formatAddress, formatTime } from '../../lib/format'
import { getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { afterSaleStatusLabel, afterSaleTypeLabel, labelOf, reasonCodeLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function AfterSaleDetailPage() {
  const { id = '' } = useParams()
  const detailQuery = useGetAfterSaleQuery(id)
  const [cancelAfterSale, cancelState] = useCancelAfterSaleMutation()
  const [submitReturn, returnState] = useSubmitReturnShipmentMutation()
  const [readGrant] = useReadMediaGrantMutation()
  const [images, setImages] = useState<Record<string, string>>({})
  const [error, setError] = useState<unknown>(null)
  const [carrierCode, setCarrierCode] = useState('SF')
  const [trackingNo, setTrackingNo] = useState('')
  useTitle(detailQuery.data?.afterSaleNo ?? '售后详情')
  const detail = detailQuery.data
  const canCancel = detail?.status === 'PENDING_REVIEW' || detail?.status === 'AWAITING_RETURN'

  const viewEvidence = async (mediaId: string) => {
    const grant = await readGrant(mediaId).unwrap()
    setImages((prev) => ({ ...prev, [mediaId]: grant.url }))
  }

  const cancel = async () => {
    if (!detail) return
    const idempotencyKey = getOrCreateIdempotencyKey(`aftersale-cancel:${detail.id}:${detail.version}`)
    setError(null)
    try {
      await cancelAfterSale({ id: detail.id, version: detail.version, idempotencyKey }).unwrap()
    } catch (cancelError) {
      setError(cancelError)
    }
  }

  const sendReturn = async () => {
    if (!detail) return
    const idempotencyKey = getOrCreateIdempotencyKey(`return:${detail.id}:${detail.version}:${carrierCode.trim()}:${trackingNo.trim()}`)
    setError(null)
    try {
      await submitReturn({
        id: detail.id,
        carrierCode: carrierCode.trim(),
        trackingNo: trackingNo.trim(),
        version: detail.version,
        idempotencyKey,
      }).unwrap()
    } catch (returnError) {
      setError(returnError)
    }
  }

  return (
    <PageState isLoading={detailQuery.isLoading} error={detailQuery.error}>
      {detail ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <Typography.Title level={3}>{detail.afterSaleNo}</Typography.Title>
          <Typography.Paragraph>
            <Link to={`/account/orders/${detail.orderId}`}>查看订单</Link>
          </Typography.Paragraph>
          <div>类型 {labelOf(afterSaleTypeLabel, detail.type)}</div>
          <div>状态 {labelOf(afterSaleStatusLabel, detail.status)}</div>
          <div>原因 {labelOf(reasonCodeLabel, detail.reasonCode)}</div>
          <div>说明 {detail.description}</div>
          <div>商品退款 <Money cents={detail.itemsRefundAmountCents} /></div>
          <div>运费退款 <Money cents={detail.shippingRefundAmountCents} /></div>
          <div>合计 <Money cents={detail.refundAmountCents} /></div>
          {detail.reviewNote ? <div>审核说明 {detail.reviewNote}</div> : null}
          {detail.returnDeadlineAt ? <div>退货截止 {formatTime(detail.returnDeadlineAt)}</div> : null}
          {detail.returnAddress ? <div>退货地址 {formatAddress(detail.returnAddress)} {detail.returnAddress.recipient}</div> : null}
          {detail.returnShipment ? (
            <div>
              退货运单 {detail.returnShipment.carrierCode} {detail.returnShipment.trackingNo} · {formatTime(detail.returnShipment.submittedAt)}
            </div>
          ) : null}
          <Space wrap style={{ margin: '12px 0' }}>
            {detail.evidence.map((item) => (
              <div key={item.id}>
                {images[item.id] ? <Image src={images[item.id]} width={96} /> : <Button onClick={() => void viewEvidence(item.id)}>查看凭证</Button>}
              </div>
            ))}
          </Space>
          {canCancel && !detail.returnShipment ? (
            <Button danger loading={cancelState.isLoading} onClick={() => void cancel()}>
              撤销售后
            </Button>
          ) : null}
          {detail.status === 'AWAITING_RETURN' && !detail.returnShipment ? (
            <Form layout="vertical" style={{ marginTop: 16, maxWidth: 420 }}>
              <Form.Item label="快递公司代码">
                <Input value={carrierCode} maxLength={32} onChange={(event) => setCarrierCode(event.target.value)} />
              </Form.Item>
              <Form.Item label="退货单号">
                <Input value={trackingNo} maxLength={64} onChange={(event) => setTrackingNo(event.target.value)} />
              </Form.Item>
              <Button type="primary" loading={returnState.isLoading} disabled={!carrierCode.trim() || !trackingNo.trim()} onClick={() => void sendReturn()}>
                提交退货物流
              </Button>
            </Form>
          ) : null}
          {error ? <div style={{ marginTop: 12 }}><ErrorAlert error={error} /></div> : null}
        </div>
      ) : null}
    </PageState>
  )
}
