import { Col, Row, Select } from 'antd'
import { useParams, useSearchParams } from 'react-router-dom'
import { useGetColumnContentsQuery, useGetColumnQuery } from '../../api/api'
import type { ContentKind } from '../../api/types'
import { ContentCard } from '../../components/ContentCard'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { contentKindLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function ColumnDetailPage() {
  const { id = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const kind = (params.get('kind') || undefined) as ContentKind | undefined
  const column = useGetColumnQuery(id)
  const contents = useGetColumnContentsQuery({ id, page, pageSize: 12, kind })
  useTitle(column.data?.name ?? '专栏')

  return (
    <div className="page">
      <PageState isLoading={column.isLoading} error={column.error}>
        {column.data ? (
          <div className="page-head">
            <h1>{column.data.name}</h1>
            <p>{column.data.description || '专题内容合集。专栏本身不售卖，也不授予付费内容权限。'}</p>
          </div>
        ) : null}
      </PageState>
      <Select
        allowClear
        placeholder="内容类型"
        style={{ width: 180, marginBottom: 16 }}
        value={kind}
        options={Object.entries(contentKindLabel).map(([value, label]) => ({ value, label }))}
        onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('kind', value)
          else next.delete('kind')
          next.delete('page')
          setParams(next)
        }}
      />
      <PageState isLoading={contents.isLoading} error={contents.error} isEmpty={!contents.data?.items.length} emptyText="专栏里还没有内容">
        <Row gutter={[16, 16]}>
          {contents.data?.items.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <ContentCard item={item} />
            </Col>
          ))}
        </Row>
        <Pager
          page={page}
          pageSize={12}
          total={contents.data?.total ?? 0}
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
