import { Select, Space, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useGetOrdersQuery } from '../../api/api'
import type { OrderStatus, OrderType } from '../../api/types'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { formatTime, skuLabel } from '../../lib/format'
import { labelOf, orderStatusLabel, orderTypeLabel, paymentStatusLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function OrderListPage() {
  useTitle('我的订单')
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const type = (params.get('type') || undefined) as OrderType | undefined
  const status = (params.get('status') || undefined) as OrderStatus | undefined
  const orders = useGetOrdersQuery({ page, pageSize: 10, type, status, sort: 'createdAt:desc' })

  const update = (key: string, value?: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setParams(next)
  }

  return (
    <div>
      <h2>我的订单</h2>
      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          allowClear
          placeholder="订单类型"
          style={{ width: 140 }}
          value={type}
          options={Object.entries(orderTypeLabel).map(([value, label]) => ({ value, label }))}
          onChange={(value) => update('type', value)}
        />
        <Select
          allowClear
          placeholder="履约状态"
          style={{ width: 140 }}
          value={status}
          options={Object.entries(orderStatusLabel).map(([value, label]) => ({ value, label }))}
          onChange={(value) => update('status', value)}
        />
      </Space>
      <PageState isLoading={orders.isLoading} error={orders.error} isEmpty={!orders.data?.items.length} emptyText="暂无订单">
        <Space direction="vertical" style={{ width: '100%' }}>
          {orders.data?.items.map((order) => (
            <Link key={order.id} to={`/account/orders/${order.id}`}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 16, border: '1px solid #e4eeeb' }}>
                <Space wrap>
                  <span>{order.orderNo}</span>
                  <Tag>{labelOf(orderTypeLabel, order.type)}</Tag>
                  <Tag color="blue">{labelOf(orderStatusLabel, order.status)}</Tag>
                  <Tag>{labelOf(paymentStatusLabel, order.paymentStatus)}</Tag>
                  <span>{formatTime(order.createdAt)}</span>
                </Space>
                {order.items.map((item) => (
                  <div key={item.id} style={{ marginTop: 8 }}>
                    {item.title} {skuLabel(item.skuAttributes)} × {item.quantity}
                  </div>
                ))}
                <div style={{ marginTop: 8 }}>
                  应付 <Money cents={order.payableAmountCents} />
                </div>
              </div>
            </Link>
          ))}
        </Space>
        <Pager
          page={page}
          pageSize={10}
          total={orders.data?.total ?? 0}
          onChange={(next) => {
            const draft = new URLSearchParams(params)
            draft.set('page', String(next))
            setParams(draft)
          }}
        />
      </PageState>
    </div>
  )
}
