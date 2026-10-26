import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  useAdjustStockMutation,
  useCreateProductMutation,
  useCreateSkuMutation,
  useDeleteProductMutation,
  useDeleteSkuMutation,
  useGetProductsQuery,
  useGetSkusQuery,
  useGetStockAdjustmentsQuery,
  usePatchProductMutation,
  usePublishProductMutation,
  useUnpublishProductMutation,
  useGetCategoriesQuery,
  useGetProductQuery,
} from '../api/api'
import type { AdminSku } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { MediaUpload } from '../components/MediaUpload'
import { formatCents, yuanToCents } from '../lib/format'
import { getOrCreateIdempotencyKey } from '../lib/idempotency'
import { labelOf, statusLabel } from '../lib/labels'

export function ProductListPage() {
  const query = useGetProductsQuery({ pageSize: 20 })
  const [remove] = useDeleteProductMutation()
  const [error, setError] = useState<unknown>(null)
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>商品与库存</h2>
        <Link to="/products/new"><Button type="primary">新建商品</Button></Link>
      </Space>
      <ErrorAlert error={query.error || error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={false} columns={[
        { title: '名称', dataIndex: 'name', render: (name: string, row) => <Link to={`/products/${row.id}`}>{name}</Link> },
        { title: '状态', dataIndex: 'status', render: (value: string) => <Tag>{labelOf(statusLabel, value)}</Tag> },
        { title: '最低价', dataIndex: 'minPriceCents', render: (value: number) => formatCents(value || 0) },
        { title: '有货', dataIndex: 'inStock', render: (value: boolean) => (value ? '是' : '否') },
        { title: '操作', render: (_v, row) => <Button size="small" danger onClick={() => void remove(row.id).unwrap().catch(setError)}>删除</Button> },
      ]} />
    </div>
  )
}

export function ProductEditPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const product = useGetProductQuery(id ?? '', { skip: isNew })
  const categories = useGetCategoriesQuery({ scope: 'PRODUCT', pageSize: 100 })
  const [createProduct] = useCreateProductMutation()
  const [patchProduct] = usePatchProductMutation()
  const [publish] = usePublishProductMutation()
  const [unpublish] = useUnpublishProductMutation()
  const [coverMediaId, setCoverMediaId] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm()
  const current = product.data
  return (
    <div>
      <h2>{isNew ? '新建商品' : '编辑商品'}</h2>
      <ErrorAlert error={product.error || error} />
      <Form form={form} layout="vertical" key={current?.id ?? 'new'} initialValues={current ? { ...current, categoryId: current.category.id } : undefined} onFinish={async (values: { name: string; summary: string; categoryId: string; detailHtml: string; afterSalePolicy: string }) => {
        const payload = { ...values, coverMediaId: coverMediaId || current?.cover.id }
        try {
          if (isNew) {
            const created = await createProduct(payload).unwrap()
            navigate(`/products/${created.id}`)
          } else if (current) await patchProduct({ id: current.id, body: { ...payload, version: current.version } }).unwrap()
        } catch (submitError) {
          setError(submitError)
        }
      }}>
        <Form.Item name="name" label="名称" rules={[{ required: true, max: 120 }]}><Input /></Form.Item>
        <Form.Item name="summary" label="简介" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
          <Select options={(categories.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
        <Form.Item name="detailHtml" label="详情 HTML" rules={[{ required: true }]}><Input.TextArea rows={4} /></Form.Item>
        <Form.Item name="afterSalePolicy" label="售后政策" rules={[{ required: true }]}><Input.TextArea rows={2} /></Form.Item>
        <MediaUpload purpose="PRODUCT_IMAGE" onUploaded={setCoverMediaId} />
        <Button type="primary" htmlType="submit">保存</Button>
        {current ? (
          <Space style={{ marginLeft: 8 }}>
            <Button onClick={() => void publish({ id: current.id, version: current.version }).unwrap().catch(setError)}>上架</Button>
            <Button onClick={() => void unpublish({ id: current.id, version: current.version }).unwrap().catch(setError)}>下架</Button>
          </Space>
        ) : null}
      </Form>
      {current ? <SkuPanel productId={current.id} /> : null}
    </div>
  )
}

function SkuPanel({ productId }: { productId: string }) {
  const skus = useGetSkusQuery(productId)
  const [createSku] = useCreateSkuMutation()
  const [remove] = useDeleteSkuMutation()
  const [adjust] = useAdjustStockMutation()
  const [skuCode, setSkuCode] = useState('')
  const [priceYuan, setPriceYuan] = useState(1)
  const [error, setError] = useState<unknown>(null)
  const [stockSku, setStockSku] = useState<AdminSku>()
  return (
    <div style={{ marginTop: 24 }}>
      <h3>SKU 与库存</h3>
      <ErrorAlert error={skus.error || error} />
      <Space>
        <Input placeholder="SKU 编号" value={skuCode} onChange={(event) => setSkuCode(event.target.value)} />
        <InputNumber min={0.01} value={priceYuan} onChange={(value) => setPriceYuan(value ?? 1)} />
        <Button onClick={() => void createSku({ productId, body: { skuCode, priceCents: yuanToCents(priceYuan), attributes: [{ name: '规格', value: '默认' }] } }).unwrap().catch(setError)}>添加 SKU</Button>
      </Space>
      <Table style={{ marginTop: 12 }} rowKey="id" dataSource={skus.data?.items ?? []} pagination={false} columns={[
        { title: '编号', dataIndex: 'skuCode' },
        { title: '价格', dataIndex: 'priceCents', render: (value: number) => formatCents(value) },
        { title: '实物', dataIndex: 'onHandStock' },
        { title: '预占', dataIndex: 'reservedStock' },
        { title: '可售', dataIndex: 'availableStock' },
        { title: '启用', dataIndex: 'enabled', render: (value: boolean) => (value ? '是' : '否') },
        {
          title: '操作',
          render: (_v, row: AdminSku) => (
            <Space>
              <Button size="small" onClick={() => setStockSku(row)}>调整库存</Button>
              <Button size="small" danger onClick={() => void remove(row.id).unwrap().catch(setError)}>删除</Button>
            </Space>
          ),
        },
      ]} />
      <Modal title="调整库存" open={Boolean(stockSku)} onCancel={() => setStockSku(undefined)} footer={null}>
        {stockSku ? <StockForm sku={stockSku} onDone={() => setStockSku(undefined)} adjust={adjust} /> : null}
      </Modal>
    </div>
  )
}

function StockForm({
  sku,
  onDone,
  adjust,
}: {
  sku: AdminSku
  onDone: () => void
  adjust: ReturnType<typeof useAdjustStockMutation>[0]
}) {
  const history = useGetStockAdjustmentsQuery(sku.id)
  const [delta, setDelta] = useState(1)
  const [reason, setReason] = useState('采购入库')
  const [error, setError] = useState<unknown>(null)
  return (
    <div>
      <ErrorAlert error={error} />
      <Space direction="vertical">
        <InputNumber value={delta} onChange={(value) => setDelta(value ?? 1)} />
        <Input value={reason} onChange={(event) => setReason(event.target.value)} />
        <Button type="primary" onClick={() => void adjust({
          id: sku.id,
          delta,
          reason,
          version: sku.version,
          idempotencyKey: getOrCreateIdempotencyKey(`stock:${sku.id}:${sku.version}:${delta}:${reason}`),
        }).unwrap().then(onDone).catch(setError)}>提交</Button>
      </Space>
      <Table style={{ marginTop: 12 }} size="small" rowKey="id" dataSource={history.data?.items ?? []} pagination={false} columns={[
        { title: '变化', dataIndex: 'delta' },
        { title: '原因', dataIndex: 'reason' },
        { title: '调整后', dataIndex: 'onHandStockAfter' },
      ]} />
    </div>
  )
}
