import { Select, Space, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useGetMyCoursesQuery } from '../../api/api'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { formatTime } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'

export function PurchasedCoursesPage() {
  useTitle('已购课程')
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const status = params.get('status') === 'REVOKED' ? 'REVOKED' : 'ACTIVE'
  const courses = useGetMyCoursesQuery({ page, pageSize: 12, status })

  return (
    <div>
      <h2>已购课程</h2>
      <Select
        style={{ width: 160, marginBottom: 16 }}
        value={status}
        options={[
          { value: 'ACTIVE', label: '有效权益' },
          { value: 'REVOKED', label: '已撤销' },
        ]}
        onChange={(value) => setParams({ status: value === 'ACTIVE' ? '' : value })}
      />
      <PageState isLoading={courses.isLoading} error={courses.error} isEmpty={!courses.data?.items.length} emptyText="还没有购买课程">
        <Space direction="vertical" style={{ width: '100%' }}>
          {courses.data?.items.map((item) => (
            <Link key={item.id} to={`/courses/${item.course.id}`}>
              <div style={{ background: '#fff', border: '1px solid #e4eeeb', borderRadius: 12, padding: 16 }}>
                <Space wrap>
                  <strong>{item.course.title}</strong>
                  <Tag>{item.status === 'ACTIVE' ? '可学习' : '已撤销'}</Tag>
                </Space>
                <div style={{ color: '#52606d', marginTop: 8 }}>{item.course.summary}</div>
                <div style={{ marginTop: 8 }}>
                  <Money cents={item.course.priceCents} /> · 购买于 {formatTime(item.grantedAt)}
                </div>
              </div>
            </Link>
          ))}
        </Space>
        <Pager
          page={page}
          pageSize={12}
          total={courses.data?.total ?? 0}
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
