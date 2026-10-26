import { Select, Space, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useGetAfterSalesQuery } from '../../api/api'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { formatTime } from '../../lib/format'
import { afterSaleStatusLabel, afterSaleTypeLabel, labelOf } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function AfterSaleListPage() {
  useTitle('售后')
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const status = params.get('status') || undefined
  const list = useGetAfterSalesQuery({ page, pageSize: 10, status })

  return (
    <div>
      <h2>售后记录</h2>
      <Select
        allowClear
        placeholder="售后状态"
        style={{ width: 180, marginBottom: 16 }}
        value={status}
        options={Object.entries(afterSaleStatusLabel).map(([value, label]) => ({ value, label }))}
        onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('status', value)
          else next.delete('status')
          next.delete('page')
          setParams(next)
        }}
      />
      <PageState isLoading={list.isLoading} error={list.error} isEmpty={!list.data?.items.length} emptyText="暂无售后">
        <Space direction="vertical" style={{ width: '100%' }}>
          {list.data?.items.map((item) => (
            <Link key={item.id} to={`/account/aftersales/${item.id}`}>
              <div style={{ background: '#fff', border: '1px solid #e4eeeb', borderRadius: 12, padding: 16 }}>
                <Space wrap>
                  <span>{item.afterSaleNo}</span>
                  <Tag>{labelOf(afterSaleTypeLabel, item.type)}</Tag>
                  <Tag color="blue">{labelOf(afterSaleStatusLabel, item.status)}</Tag>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Money cents={item.refundAmountCents} /> · {formatTime(item.createdAt)}
                </div>
              </div>
            </Link>
          ))}
        </Space>
        <Pager
          page={page}
          pageSize={10}
          total={list.data?.total ?? 0}
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
