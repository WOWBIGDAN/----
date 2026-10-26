import { Alert, Button, Card, List, Radio, Space, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useCreateOrderMutation, useCreateQuoteMutation, useGetAddressesQuery, useGetArticleQuery, useGetMembershipPlanQuery, useGetProductQuery, useGetVideoQuery } from '../../api/api'
import type { OrderQuote } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { getErrorCode, getErrorMessage, getRetryAfter } from '../../lib/errors'
import { formatAddress, formatPhone, formatTime, skuLabel } from '../../lib/format'
import { getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { useTitle } from '../../lib/useTitle'

export function CheckoutPage() {
  useTitle('确认订单')
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const type = params.get('type')
  const productId = params.get('productId') ?? ''
  const skuId = params.get('skuId') ?? ''
  const quantity = Math.min(99, Math.max(1, Number(params.get('quantity') || '1')))
  const courseId = params.get('courseId') ?? ''
  const planId = params.get('planId') ?? ''
  const product = useGetProductQuery(productId, { skip: type !== 'product' || !productId })
  const video = useGetVideoQuery(courseId, { skip: type !== 'course' || !courseId })
  const article = useGetArticleQuery(courseId, { skip: type !== 'course' || !courseId || Boolean(video.data) || video.isLoading })
  const plan = useGetMembershipPlanQuery(planId, { skip: type !== 'membership' || !planId })
  const addresses = useGetAddressesQuery({ page: 1, pageSize: 50 }, { skip: type !== 'product' })
  const [addressId, setAddressId] = useState<string>()
  const [quote, setQuote] = useState<OrderQuote>()
  const [error, setError] = useState<unknown>(null)
  const [createQuote, quoteState] = useCreateQuoteMutation()
  const [createOrder, orderState] = useCreateOrderMutation()
  const sku = product.data?.skus.find((item) => item.id === skuId)
  const course = video.data ?? article.data
  const selectedAddress = useMemo(() => {
    const items = addresses.data?.items ?? []
    return items.find((item) => item.id === addressId) ?? items.find((item) => item.isDefault) ?? items[0]
  }, [addressId, addresses.data?.items])

  const requestQuote = async () => {
    setError(null)
    try {
      const body =
        type === 'product'
          ? { type: 'PRODUCT' as const, addressId: selectedAddress?.id ?? '', items: [{ skuId, quantity }] }
          : type === 'course'
            ? { type: 'COURSE' as const, courseId }
            : { type: 'MEMBERSHIP' as const, planId }
      if (body.type === 'PRODUCT' && !body.addressId) {
        setError({ data: { code: 'VALIDATION_ERROR', message: '请先添加收货地址', details: [] } })
        return
      }
      const next = await createQuote(body).unwrap()
      setQuote(next)
    } catch (quoteError) {
      setQuote(undefined)
      setError(quoteError)
    }
  }

  const submit = async () => {
    if (!quote) return
    if (new Date(quote.expiresAt).getTime() <= Date.now()) {
      setError({ data: { code: 'QUOTE_EXPIRED', message: '试算已过期，请重新计算金额', details: [] } })
      return
    }
    const scope = `order:${quote.quoteId}`
    const idempotencyKey = getOrCreateIdempotencyKey(scope)
    try {
      const order = await createOrder({ quoteId: quote.quoteId, idempotencyKey }).unwrap()
      navigate(`/account/orders/${order.id}/pay`)
    } catch (orderError) {
      if (getErrorCode(orderError) === 'IDEMPOTENCY_IN_PROGRESS') {
        const wait = (getRetryAfter(orderError) ?? 1) * 1000
        await new Promise((resolve) => setTimeout(resolve, Math.min(wait, 5000)))
        try {
          const order = await createOrder({ quoteId: quote.quoteId, idempotencyKey }).unwrap()
          navigate(`/account/orders/${order.id}/pay`)
          return
        } catch (retryError) {
          setError(retryError)
          return
        }
      }
      if (getErrorCode(orderError) === 'COURSE_ALREADY_PURCHASED') {
        navigate(`/courses/${courseId}`)
        return
      }
      setError(orderError)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <h1>确认订单</h1>
        <p>金额、运费和库存以服务端试算为准，页面不会提交价格。</p>
      </div>
      <Card>
        {type === 'product' ? (
          <PageState isLoading={product.isLoading} error={product.error}>
            <Typography.Paragraph>
              {product.data?.name} · {sku ? skuLabel(sku.attributes) : '规格'} · 数量 {quantity}
            </Typography.Paragraph>
            <Typography.Title level={5}>收货地址</Typography.Title>
            {addresses.error ? <ErrorAlert error={addresses.error} /> : null}
            {addresses.data?.items.length ? (
              <Radio.Group value={selectedAddress?.id} onChange={(event) => { setAddressId(event.target.value); setQuote(undefined) }}>
                <Space direction="vertical">
                  {addresses.data.items.map((item) => (
                    <Radio key={item.id} value={item.id}>
                      {item.recipient} {formatPhone(item.phone)} {formatAddress(item)} {item.isDefault ? '（默认）' : ''}
                    </Radio>
                  ))}
                </Space>
              </Radio.Group>
            ) : (
              <Alert type="info" showIcon message="还没有收货地址" action={<Link to="/account/addresses">去添加</Link>} />
            )}
          </PageState>
        ) : null}
        {type === 'course' ? (
          <PageState isLoading={video.isLoading || article.isLoading} error={video.error && article.error ? article.error : undefined}>
            <Typography.Paragraph>
              课程：{course?.title ?? courseId}
            </Typography.Paragraph>
          </PageState>
        ) : null}
        {type === 'membership' ? (
          <PageState isLoading={plan.isLoading} error={plan.error}>
            <Typography.Paragraph>
              会员方案：{plan.data?.name} · {plan.data ? <Money cents={plan.data.priceCents} /> : null} · {plan.data?.durationDays} 天
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary">{plan.data?.description}</Typography.Paragraph>
          </PageState>
        ) : null}
        <Space style={{ marginTop: 16 }}>
          <Button onClick={() => void requestQuote()} loading={quoteState.isLoading}>
            计算金额
          </Button>
          <Button type="primary" disabled={!quote} loading={orderState.isLoading} onClick={() => void submit()}>
            提交订单
          </Button>
        </Space>
        {error ? <div style={{ marginTop: 16 }}><ErrorAlert error={error} /></div> : null}
        {getErrorCode(error) === 'QUOTE_EXPIRED' ? <Typography.Text type="secondary">{getErrorMessage(error)}</Typography.Text> : null}
        {quote ? (
          <List
            style={{ marginTop: 16 }}
            header="服务端试算"
            dataSource={quote.items}
            renderItem={(item) => (
              <List.Item>
                {item.title} {skuLabel(item.skuAttributes)} × {item.quantity} · <Money cents={item.subtotalCents} />
              </List.Item>
            )}
            footer={
              <div>
                <div>商品金额 <Money cents={quote.itemsAmountCents} /></div>
                <div>运费 <Money cents={quote.shippingFeeCents} /></div>
                <div>应付 <Money cents={quote.payableAmountCents} /></div>
                <div>试算有效至 {formatTime(quote.expiresAt)}</div>
              </div>
            }
          />
        ) : null}
      </Card>
    </div>
  )
}
