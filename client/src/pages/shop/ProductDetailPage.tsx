import { Button, Card, Image, InputNumber, Radio, Space, Typography } from 'antd'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGetProductQuery } from '../../api/api'
import { HtmlContent } from '../../components/HtmlContent'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { skuLabel } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'
import { useAppSelector } from '../../store/hooks'

export function ProductDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const token = useAppSelector((state) => state.auth.accessToken)
  const product = useGetProductQuery(id)
  const skus = (product.data?.skus ?? []).filter((sku) => sku.enabled)
  const [skuId, setSkuId] = useState<string>()
  const [quantity, setQuantity] = useState(1)
  const selected = skus.find((sku) => sku.id === (skuId ?? skus[0]?.id)) ?? skus[0]
  useTitle(product.data?.name ?? '产品')

  const buy = () => {
    if (!selected) return
    const target = `/checkout?type=product&productId=${id}&skuId=${selected.id}&quantity=${quantity}`
    if (!token) {
      navigate('/login', { state: { from: target } })
      return
    }
    navigate(target)
  }

  return (
    <div className="page">
      <PageState isLoading={product.isLoading} error={product.error}>
        {product.data ? (
          <Card>
            <div className="product-layout">
              <Image.PreviewGroup>
                <Space direction="vertical">
                  {(product.data.gallery.length ? product.data.gallery : [product.data.cover]).map((image) =>
                    image.publicUrl ? <Image key={image.id} src={image.publicUrl} alt={product.data?.name} /> : null,
                  )}
                </Space>
              </Image.PreviewGroup>
              <div>
                <Typography.Title level={2}>{product.data.name}</Typography.Title>
                <Typography.Paragraph>{product.data.summary}</Typography.Paragraph>
                <Typography.Paragraph>
                  <Money cents={selected?.priceCents ?? product.data.minPriceCents} />
                </Typography.Paragraph>
                <Radio.Group value={selected?.id} onChange={(event) => setSkuId(event.target.value)}>
                  <Space direction="vertical">
                    {skus.map((sku) => (
                      <Radio key={sku.id} value={sku.id} disabled={sku.availableStock < 1}>
                        {skuLabel(sku.attributes)} · <Money cents={sku.priceCents} /> · 库存 {sku.availableStock}
                      </Radio>
                    ))}
                  </Space>
                </Radio.Group>
                <div style={{ margin: '16px 0' }}>
                  <span>数量 </span>
                  <InputNumber min={1} max={Math.min(99, selected?.availableStock ?? 1)} value={quantity} onChange={(value) => setQuantity(value ?? 1)} />
                </div>
                <Button type="primary" disabled={!selected || selected.availableStock < 1} onClick={buy}>
                  立即购买
                </Button>
                {product.data.afterSalePolicy ? (
                  <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
                    {product.data.afterSalePolicy}
                  </Typography.Paragraph>
                ) : null}
              </div>
            </div>
            <Typography.Title level={4}>产品详情</Typography.Title>
            <HtmlContent html={product.data.detailHtml} />
          </Card>
        ) : null}
      </PageState>
    </div>
  )
}
