import { Button, Form, Input, Select, Space, Table, Tag } from 'antd'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  useGetLogisticsQuery,
  useGetOrderQuery,
  useGetOrdersQuery,
  usePatchShipmentMutation,
  useShipOrderMutation,
} from '../api/api'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatCents, formatTime } from '../lib/format'
import { getOrCreateIdempotencyKey } from '../lib/idempotency'
import { labelOf, orderStatusLabel, orderTypeLabel, paymentStatusLabel } from '../lib/labels'
import { useAppSelector } from '../store/hooks'

export function OrderListPage() {
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const type = params.get('type') || undefined
  const status = params.get('status') || undefined
  const query = useGetOrdersQuery({ page, pageSize: 20, type, status })
  return (
    <div>
      <h2>订单与物流</h2>
      <Space style={{ marginBottom: 16 }}>
        <Select allowClear placeholder="类型" style={{ width: 120 }} value={type} options={Object.entries(orderTypeLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('type', value)
          else next.delete('type')
          setParams(next)
        }} />
        <Select allowClear placeholder="状态" style={{ width: 140 }} value={status} options={Object.entries(orderStatusLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('status', value)
          else next.delete('status')
          setParams(next)
        }} />
      </Space>
      <ErrorAlert error={query.error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={{ current: page, total: query.data?.total ?? 0, pageSize: 20 }} columns={[
        { title: '订单号', dataIndex: 'orderNo', render: (value: string, row) => <Link to={`/orders/${row.id}`}>{value}</Link> },
        { title: '用户', render: (_v, row) => `${row.user.nickname} ${row.user.phoneMasked}` },
        { title: '类型', dataIndex: 'type', render: (value: string) => labelOf(orderTypeLabel, value) },
        { title: '履约', dataIndex: 'status', render: (value: string) => <Tag>{labelOf(orderStatusLabel, value)}</Tag> },
        { title: '支付', dataIndex: 'paymentStatus', render: (value: string) => labelOf(paymentStatusLabel, value) },
        { title: '应付', dataIndex: 'payableAmountCents', render: (value: number) => formatCents(value) },
        { title: '会员', render: (_v, row) => (row.user.membership.active ? '是' : '否') },
        { title: '下单时间', dataIndex: 'createdAt', render: (value: string) => formatTime(value) },
      ]} />
    </div>
  )
}

export function OrderDetailPage() {
  const { id = '' } = useParams()
  const order = useGetOrderQuery(id)
  const logistics = useGetLogisticsQuery(id)
  const canShip = useAppSelector((state) => state.auth.admin?.permissions.includes('orders:ship') ?? false)
  const [ship] = useShipOrderMutation()
  const [patchShipment] = usePatchShipmentMutation()
  const [carrierCode, setCarrierCode] = useState('SF')
  const [trackingNo, setTrackingNo] = useState('')
  const [reason, setReason] = useState('录入错误')
  const [error, setError] = useState<unknown>(null)
  const detail = order.data
  const shipment = logistics.data?.shipment
  return (
    <div>
      <h2>订单详情</h2>
      <ErrorAlert error={order.error || logistics.error || error} />
      {detail ? (
        <>
          <p>{detail.orderNo} · {labelOf(orderTypeLabel, detail.type)} · {labelOf(orderStatusLabel, detail.status)} · 版本 {detail.version}</p>
          <p>用户 {detail.user.nickname} {detail.user.phoneMasked} · 会员 {detail.user.membership.active ? `至 ${formatTime(detail.user.membership.expiresAt)}` : '否'}</p>
          {detail.items.map((item) => <div key={item.id}>{item.title} × {item.quantity} · {formatCents(item.subtotalCents)}</div>)}
          <p>应付 {formatCents(detail.payableAmountCents)} · 运费 {formatCents(detail.shippingFeeCents)} · 已退 {formatCents(detail.refundedAmountCents)}</p>
          {detail.address ? <p>收货 {detail.address.recipient} {detail.address.phone} {detail.address.province}{detail.address.city}{detail.address.district}{detail.address.detail}</p> : null}
        </>
      ) : null}
      <h3>物流 {logistics.data?.syncStatus}</h3>
      {shipment ? <p>{shipment.carrierName} {shipment.trackingNo} · {shipment.status}</p> : <p>尚未发货</p>}
      {(logistics.data?.events ?? []).map((event) => <div key={event.time}>{formatTime(event.time)} {event.description}</div>)}
      {canShip && detail?.status === 'PENDING_SHIPMENT' ? (
        <Form layout="inline" style={{ marginTop: 16 }} onFinish={() => void ship({
          id,
          carrierCode,
          trackingNo,
          orderVersion: detail.version,
          idempotencyKey: getOrCreateIdempotencyKey(`ship:${id}:${detail.version}:${carrierCode}:${trackingNo}`),
        }).unwrap().catch(setError)}>
          <Form.Item label="快递代码"><Input value={carrierCode} onChange={(event) => setCarrierCode(event.target.value)} /></Form.Item>
          <Form.Item label="运单号"><Input value={trackingNo} onChange={(event) => setTrackingNo(event.target.value)} /></Form.Item>
          <Button type="primary" htmlType="submit">发货</Button>
        </Form>
      ) : null}
      {canShip && shipment?.status === 'PENDING_PICKUP' ? (
        <Form layout="inline" style={{ marginTop: 16 }} onFinish={() => void patchShipment({
          id: shipment.id,
          carrierCode,
          trackingNo,
          reason,
          version: shipment.version,
        }).unwrap().catch(setError)}>
          <Form.Item label="纠正原因"><Input value={reason} onChange={(event) => setReason(event.target.value)} /></Form.Item>
          <Button htmlType="submit">未揽收改单号</Button>
        </Form>
      ) : null}
    </div>
  )
}
