import { Col, Input, Row, Select, Tabs } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useGetArticlesQuery, useGetCategoriesQuery, useGetColumnsQuery, useGetVideosQuery } from '../../api/api'
import { ContentCard } from '../../components/ContentCard'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import type { ContentListQuery } from '../../api/types'
import { useTitle } from '../../lib/useTitle'

const sorts = [
  { value: 'publishedAt:desc', label: '最新发布' },
  { value: 'publishedAt:asc', label: '最早发布' },
]

export function SciencePage() {
  useTitle('科普内容')
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'article' ? 'article' : 'video'
  const page = Number(params.get('page') || '1')
  const keyword = params.get('keyword') || undefined
  const categoryId = params.get('categoryId') || undefined
  const sort = (params.get('sort') || 'publishedAt:desc') as ContentListQuery['sort']
  const categories = useGetCategoriesQuery({ scope: 'CONTENT', page: 1, pageSize: 100 })
  const columns = useGetColumnsQuery({ page: 1, pageSize: 8 })
  const queryArgs = {
    page,
    pageSize: 12,
    keyword,
    categoryId,
    sort,
    kind: tab === 'video' ? ('SCIENCE_VIDEO' as const) : ('SCIENCE_ARTICLE' as const),
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
        <h1>科普内容</h1>
        <p>免费浏览视频与图文，了解可靠的两性健康知识。</p>
      </div>
      {columns.error && !list.error ? <ErrorAlert error={columns.error} /> : null}
      {columns.data?.items.length ? (
        <>
          <h2 style={{ fontSize: 18 }}>专栏</h2>
          <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
            {columns.data.items.map((column) => (
              <Col key={column.id} xs={12} sm={8} md={6}>
                <Link to={`/columns/${column.id}`}>
                  <div className="cover" style={{ height: 96, borderRadius: 10 }}>
                    {column.cover.publicUrl ? <img src={column.cover.publicUrl} alt={column.name} /> : <div className="cover-fallback">{column.name}</div>}
                  </div>
                  <div style={{ marginTop: 8 }}>{column.name}</div>
                  <div style={{ color: '#52606d', fontSize: 13 }}>{column.contentCount} 篇内容</div>
                </Link>
              </Col>
            ))}
          </Row>
        </>
      ) : null}
      <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Input.Search
          allowClear
          placeholder="搜索标题或简介"
          defaultValue={keyword}
          style={{ width: 260 }}
          onSearch={(value) => update({ keyword: value.trim() || undefined })}
        />
        <Select
          allowClear
          placeholder="分类"
          style={{ width: 180 }}
          value={categoryId}
          options={(categories.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => update({ categoryId: value })}
        />
        <Select style={{ width: 140 }} value={sort} options={sorts} onChange={(value) => update({ sort: value })} />
      </div>
      <Tabs
        activeKey={tab}
        onChange={(key) => update({ tab: key === 'article' ? 'article' : undefined })}
        items={[
          { key: 'video', label: '视频科普' },
          { key: 'article', label: '图文科普' },
        ]}
      />
      <PageState isLoading={list.isLoading} error={list.error} isEmpty={!list.data?.items.length} emptyText="暂无科普内容">
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
