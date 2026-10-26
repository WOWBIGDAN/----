import { Button, Input, InputNumber, Select, Space, Typography, Upload } from 'antd'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateAfterSaleMutation, useGetOrderQuery } from '../../api/api'
import type { AfterSaleCreate } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageState } from '../../components/PageState'
import { getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { reasonCodeLabel } from '../../lib/labels'
import { uploadUserImage } from '../../lib/upload'
import { useTitle } from '../../lib/useTitle'
import { useAppDispatch } from '../../store/hooks'

export function AfterSaleCreatePage() {
  useTitle('申请售后')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const orderId = params.get('orderId') ?? ''
  const order = useGetOrderQuery(orderId, { skip: !orderId })
  const [createAfterSale, state] = useCreateAfterSaleMutation()
  const [reasonCode, setReasonCode] = useState<AfterSaleCreate['reasonCode']>('NOT_NEEDED')
  const [description, setDescription] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [evidence, setEvidence] = useState<string[]>([])
  const [error, setError] = useState<unknown>(null)
  const detail = order.data
  const type = detail?.status === 'PENDING_SHIPMENT' ? 'REFUND_ONLY' : 'RETURN_REFUND'

  const submit = async () => {
    if (!detail) return
    const items = detail.items
      .map((item) => ({ orderItemId: item.id, quantity: quantities[item.id] ?? 0 }))
      .filter((item) => item.quantity > 0)
    setError(null)
    const idempotencyKey = getOrCreateIdempotencyKey(
      `aftersale:${detail.id}:${JSON.stringify({ type, items, reasonCode, description: description.trim(), evidence })}`,
    )
    try {
      const created = await createAfterSale({
        idempotencyKey,
        body: { orderId: detail.id, type, items, reasonCode, description: description.trim(), evidenceMediaIds: evidence },
      }).unwrap()
      navigate(`/account/aftersales/${created.id}`)
    } catch (submitError) {
      setError(submitError)
    }
  }

  return (
    <PageState isLoading={order.isLoading} error={!orderId ? { data: { code: 'VALIDATION_ERROR', message: '缺少订单', details: [] } } : order.error}>
      {detail ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <Typography.Title level={3}>申请售后</Typography.Title>
          <Typography.Paragraph>
            {detail.status === 'PENDING_SHIPMENT' ? '订单未发货，本次为仅退款。' : '订单已发货，本次为退货退款。'}
            退款金额由服务端计算。
          </Typography.Paragraph>
          {!detail.actions.canApplyAfterSale ? <Typography.Paragraph type="warning">当前订单状态可能不能申请售后，仍可提交并由服务端判断。</Typography.Paragraph> : null}
          {detail.items.map((item) => {
            const max = Math.max(0, item.quantity - item.refundedQuantity)
            return (
              <div key={item.id} style={{ marginBottom: 12 }}>
                {item.title}，最多 {max} 件
                <InputNumber
                  min={0}
                  max={max}
                  value={quantities[item.id] ?? 0}
                  onChange={(value) => setQuantities((prev) => ({ ...prev, [item.id]: value ?? 0 }))}
                  style={{ marginLeft: 8 }}
                />
              </div>
            )
          })}
          <div style={{ marginBottom: 12 }}>
            <div>原因</div>
            <Select
              style={{ width: 240 }}
              value={reasonCode}
              options={Object.entries(reasonCodeLabel).map(([value, label]) => ({ value, label }))}
              onChange={(value) => setReasonCode(value as AfterSaleCreate['reasonCode'])}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div>说明</div>
            <Input.TextArea rows={4} value={description} maxLength={2000} onChange={(event) => setDescription(event.target.value)} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div>凭证图片，最多 9 张</div>
            <Upload
              accept="image/jpeg,image/png,image/webp"
              showUploadList={false}
              customRequest={async (options) => {
                if (evidence.length >= 9) return
                try {
                  const mediaId = await uploadUserImage(dispatch, options.file as File, 'AFTERSALE_EVIDENCE')
                  setEvidence((prev) => [...prev, mediaId])
                  options.onSuccess?.({})
                } catch (uploadError) {
                  setError(uploadError)
                  options.onError?.(uploadError as Error)
                }
              }}
            >
              <Button>上传凭证</Button>
            </Upload>
            <div>已就绪 {evidence.length} 张</div>
          </div>
          <Space>
            <Button type="primary" loading={state.isLoading} disabled={!description.trim()} onClick={() => void submit()}>
              提交申请
            </Button>
          </Space>
          {error ? <div style={{ marginTop: 12 }}><ErrorAlert error={error} /></div> : null}
        </div>
      ) : null}
    </PageState>
  )
}
