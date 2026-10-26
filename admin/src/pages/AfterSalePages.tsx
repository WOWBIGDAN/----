import { Button, Form, Image, Input, Select, Space, Table } from 'antd'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  useConfirmReturnMutation,
  useGetAfterSaleQuery,
  useGetAfterSalesQuery,
  useReadMediaMutation,
  useRetryRefundMutation,
  useReviewAfterSaleMutation,
} from '../api/api'
import type { AddressSnapshot } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatCents, formatTime } from '../lib/format'
import { getOrCreateIdempotencyKey } from '../lib/idempotency'
import { afterSaleStatusLabel, labelOf } from '../lib/labels'

export function AfterSaleListPage() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') || undefined
  const query = useGetAfterSalesQuery({ page: 1, pageSize: 20, status })
  return (
    <div>
      <h2>售后处理</h2>
      <Select allowClear placeholder="状态" style={{ width: 160, marginBottom: 16 }} value={status} options={Object.entries(afterSaleStatusLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
        const next = new URLSearchParams(params)
        if (value) next.set('status', value)
        else next.delete('status')
        setParams(next)
      }} />
      <ErrorAlert error={query.error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={false} columns={[
        { title: '单号', dataIndex: 'afterSaleNo', render: (value: string, row) => <Link to={`/aftersales/${row.id}`}>{value}</Link> },
        { title: '类型', dataIndex: 'type' },
        { title: '状态', dataIndex: 'status', render: (value: string) => labelOf(afterSaleStatusLabel, value) },
        { title: '金额', dataIndex: 'refundAmountCents', render: (value: number) => formatCents(value) },
        { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatTime(value) },
      ]} />
    </div>
  )
}

export function AfterSaleDetailPage() {
  const { id = '' } = useParams()
  const detail = useGetAfterSaleQuery(id)
  const [review] = useReviewAfterSaleMutation()
  const [confirmReturn] = useConfirmReturnMutation()
  const [retryRefund] = useRetryRefundMutation()
  const [readMedia] = useReadMediaMutation()
  const [note, setNote] = useState('同意申请')
  const [images, setImages] = useState<Record<string, string>>({})
  const [error, setError] = useState<unknown>(null)
  const [address, setAddress] = useState<AddressSnapshot>({
    recipient: '',
    phone: '',
    provinceCode: '310000',
    province: '上海市',
    cityCode: '310100',
    city: '上海市',
    districtCode: '310101',
    district: '黄浦区',
    detail: '',
  })
  const item = detail.data
  return (
    <div>
      <h2>售后详情</h2>
      <ErrorAlert error={detail.error || error} />
      {item ? (
        <>
          <p>{item.afterSaleNo} · {item.type} · {labelOf(afterSaleStatusLabel, item.status)} · 版本 {item.version}</p>
          <p>订单 <Link to={`/orders/${item.orderId}`}>{item.orderId}</Link></p>
          <p>{item.reasonCode} {item.description}</p>
          <p>退款金额 {formatCents(item.refundAmountCents)}（由服务端计算）</p>
          {item.reviewNote ? <p>审核说明 {item.reviewNote}</p> : null}
          {item.returnShipment ? <p>退货 {item.returnShipment.carrierCode} {item.returnShipment.trackingNo}</p> : null}
          <Space wrap>
            {item.evidence.map((media) => (
              <div key={media.id}>
                {images[media.id] ? <Image src={images[media.id]} width={96} /> : (
                  <Button onClick={() => void readMedia(media.id).unwrap().then((grant) => setImages((prev) => ({ ...prev, [media.id]: grant.url }))).catch(setError)}>查看凭证</Button>
                )}
              </div>
            ))}
          </Space>
          {item.status === 'PENDING_REVIEW' ? (
            <Form layout="vertical" style={{ maxWidth: 520, marginTop: 16 }}>
              <Form.Item label="审核说明"><Input.TextArea value={note} onChange={(event) => setNote(event.target.value)} /></Form.Item>
              {item.type === 'RETURN_REFUND' ? (
                <>
                  <Input placeholder="收件人" value={address.recipient} onChange={(event) => setAddress({ ...address, recipient: event.target.value })} />
                  <Input placeholder="电话" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
                  <Input placeholder="详细地址" value={address.detail} onChange={(event) => setAddress({ ...address, detail: event.target.value })} />
                </>
              ) : null}
              <Space>
                <Button type="primary" onClick={() => void review({
                  id,
                  idempotencyKey: getOrCreateIdempotencyKey(`review:${id}:${item.version}:APPROVE`),
                  body: { decision: 'APPROVE', note, version: item.version, ...(item.type === 'RETURN_REFUND' ? { returnAddress: address } : {}) },
                }).unwrap().catch(setError)}>批准</Button>
                <Button danger onClick={() => void review({
                  id,
                  idempotencyKey: getOrCreateIdempotencyKey(`review:${id}:${item.version}:REJECT`),
                  body: { decision: 'REJECT', note, version: item.version },
                }).unwrap().catch(setError)}>驳回</Button>
              </Space>
            </Form>
          ) : null}
          {item.status === 'RETURNING' ? (
            <Button style={{ marginTop: 16 }} onClick={() => void confirmReturn({
              id,
              note: note || '退件验收通过',
              version: item.version,
              idempotencyKey: getOrCreateIdempotencyKey(`return-ok:${id}:${item.version}`),
            }).unwrap().catch(setError)}>验收退货并退款</Button>
          ) : null}
          {item.status === 'REFUND_FAILED' ? (
            <Button style={{ marginTop: 16 }} onClick={() => void retryRefund({
              id,
              version: item.version,
              idempotencyKey: getOrCreateIdempotencyKey(`retry-refund:${id}:${item.version}`),
            }).unwrap().catch(setError)}>重试退款</Button>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
