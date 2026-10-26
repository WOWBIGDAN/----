import { Col, Input, InputNumber, Row, Select, Switch } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { useGetCategoriesQuery, useGetProductsQuery } from '../../api/api'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { yuanToCents } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'

export function ProductListPage() {
  useTitle('精选产品')
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const keyword = params.get('keyword') || undefined
  const categoryId = params.get('categoryId') || undefined
  const minYuan = params.get('min') ? Number(params.get('min')) : undefined
  const maxYuan = params.get('max') ? Number(params.get('max')) : undefined
  const inStock = params.get('inStock') === 'true' ? true : params.get('inStock') === 'false' ? false : undefined
  const sort = (params.get('sort') || 'createdAt:desc') as 'createdAt:desc' | 'priceCents:asc' | 'priceCents:desc'
  const categories = useGetCategoriesQuery({ scope: 'PRODUCT', page: 1, pageSize: 100 })
  const products = useGetProductsQuery({
    page,
    pageSize: 12,
    keyword,
    categoryId,
    minPriceCents: yuanToCents(minYuan),
    maxPriceCents: yuanToCents(maxYuan),
    inStock,
    sort,
  })

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
        <h1>精选产品</h1>
        <p>按规格购买护理用品，价格和运费由服务端计算。</p>
      </div>
      <div className="filter-bar" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input.Search allowClear placeholder="搜索产品" defaultValue={keyword} style={{ width: 240 }} onSearch={(value) => update({ keyword: value.trim() || undefined })} />
        <Select
          allowClear
          placeholder="分类"
          style={{ width: 160 }}
          value={categoryId}
          options={(categories.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))}
          onChange={(value) => update({ categoryId: value })}
        />
        <InputNumber placeholder="最低价" min={0} value={minYuan} onChange={(value) => update({ min: value === null ? undefined : String(value) })} />
        <InputNumber placeholder="最高价" min={0} value={maxYuan} onChange={(value) => update({ max: value === null ? undefined : String(value) })} />
        <span>
          仅看有货 <Switch checked={inStock === true} onChange={(checked) => update({ inStock: checked ? 'true' : undefined })} />
        </span>
        <Select
          style={{ width: 150 }}
          value={sort}
          onChange={(value) => update({ sort: value })}
          options={[
            { value: 'createdAt:desc', label: '最新上架' },
            { value: 'priceCents:asc', label: '价格从低到高' },
            { value: 'priceCents:desc', label: '价格从高到低' },
          ]}
        />
      </div>
      <PageState isLoading={products.isLoading} error={products.error} isEmpty={!products.data?.items.length} emptyText="暂无产品">
        <Row gutter={[16, 16]}>
          {products.data?.items.map((item) => (
            <Col key={item.id} xs={24} sm={12} md={8} lg={6}>
              <Link to={`/products/${item.id}`}>
                <div className="cover" style={{ borderRadius: 12 }}>
                  {item.cover.publicUrl ? <img src={item.cover.publicUrl} alt={item.name} /> : <div className="cover-fallback">纯爱健康</div>}
                </div>
                <h3 style={{ margin: '10px 0 4px' }}>{item.name}</h3>
                <div style={{ color: '#52606d', minHeight: 40 }}>{item.summary}</div>
                <div>
                  <Money cents={item.minPriceCents} />
                  {item.maxPriceCents !== item.minPriceCents ? <span> 起</span> : null}
                  {!item.inStock ? <span style={{ marginLeft: 8 }}>缺货</span> : null}
                </div>
              </Link>
            </Col>
          ))}
        </Row>
        <Pager page={page} pageSize={12} total={products.data?.total ?? 0} onChange={(next) => update({ page: String(next) }, false)} />
      </PageState>
    </div>
  )
}
