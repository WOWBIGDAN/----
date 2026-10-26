import { Col, Input, Row, Select, Tabs } from 'antd'
import { useSearchParams } from 'react-router-dom'
import { useGetArticlesQuery, useGetCategoriesQuery, useGetVideosQuery } from '../../api/api'
import type { AccessPolicy, ContentListQuery } from '../../api/types'
import { ContentCard } from '../../components/ContentCard'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { useTitle } from '../../lib/useTitle'

const sorts = [
  { value: 'publishedAt:desc', label: '最新发布' },
  { value: 'publishedAt:asc', label: '最早发布' },
  { value: 'priceCents:asc', label: '价格从低到高' },
  { value: 'priceCents:desc', label: '价格从高到低' },
]

const policies = [
  { value: 'PURCHASE', label: '单独购买' },
  { value: 'MEMBER_OR_PURCHASE', label: '会员或购买' },
  { value: 'FREE', label: '免费' },
]

export function CourseListPage() {
  useTitle('付费课程')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'article' ? 'article' : 'video'
  const page = Number(params.get('page') || '1')
  const keyword = params.get('keyword') || undefined
  const categoryId = params.get('categoryId') || undefined
  const accessPolicy = (params.get('accessPolicy') || undefined) as AccessPolicy | undefined
  const sort = (params.get('sort') || 'publishedAt:desc') as ContentListQuery['sort']
  const categories = useGetCategoriesQuery({ scope: 'CONTENT', page: 1, pageSize: 100 })
  const queryArgs = {
    page,
    pageSize: 12,
    keyword,
    categoryId,
    accessPolicy,
    sort,
    kind: tab === 'video' ? ('VIDEO_COURSE' as const) : ('ARTICLE_COURSE' as const),
  }
  const videos = useGetVideosQuery(queryArgs, { skip: tab !== 'video' })
  const articles = useGetArticlesQuery(queryArgs, { skip: tab !== 'article' })
  const list = tab === 'video' ? videos : articles

  const update = (next: Record<string, string | undefined>, resetPage = true) => {
    const draft = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (!value) draft.delete(key)
      else draft.set(key, value)
    })
    if (resetPage) draft.delete('page')
    setParams(draft)
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>付费课程</h1>
        <p>系统课程支持单次购买，部分课程也可通过会员观看。</p>
      </div>
      <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input.Search allowClear placeholder="搜索课程" defaultValue={keyword} style={{ width: 260 }} onSearch={(value) => update({ keyword: value.trim() || undefined })} />
        <Select
          allowClear
          placeholder="分类"
          style={{ width: 180 }}
          value={categoryId}
          options={(categories.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => update({ categoryId: value })}
        />
        <Select
          allowClear
          placeholder="获取方式"
          style={{ width: 160 }}
          value={accessPolicy}
          options={policies}
          onChange={(value) => update({ accessPolicy: value })}
        />
        <Select style={{ width: 160 }} value={sort} options={sorts} onChange={(value) => update({ sort: value })} />
      </div>
      <Tabs
        activeKey={tab}
        onChange={(key) => update({ tab: key === 'article' ? 'article' : undefined })}
        items={[
          { key: 'video', label: '视频课程' },
          { key: 'article', label: '图文课程' },
        ]}
      />
      <PageState isLoading={list.isLoading} error={list.error} isEmpty={!list.data?.items.length} emptyText="暂无课程">
        <Row gutter={[16, 16]}>
          {list.data?.items.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <ContentCard item={item} />
            </Col>
          ))}
        </Row>
        <Pager page={page} pageSize={12} total={list.data?.total ?? 0} onChange={(next) => update({ page: String(next) }, false)} />
      </PageState>
    </div>
  )
}
