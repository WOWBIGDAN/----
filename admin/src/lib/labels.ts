export const kindLabel: Record<string, string> = {
  SCIENCE_VIDEO: '视频科普',
  SCIENCE_ARTICLE: '图文科普',
  VIDEO_COURSE: '视频课程',
  ARTICLE_COURSE: '图文课程',
}

export const statusLabel: Record<string, string> = {
  DRAFT: '草稿',
  PUBLISHED: '已发布',
  OFFLINE: '已下架',
}

export const accessPolicyLabel: Record<string, string> = {
  FREE: '免费',
  PURCHASE: '单独购买',
  MEMBER_OR_PURCHASE: '会员或购买',
}

export const orderTypeLabel: Record<string, string> = {
  PRODUCT: '实物',
  COURSE: '课程',
  MEMBERSHIP: '会员',
}

export const orderStatusLabel: Record<string, string> = {
  PENDING_PAYMENT: '待支付',
  PENDING_SHIPMENT: '待发货',
  PENDING_RECEIPT: '待收货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  CLOSED: '已关闭',
}

export const paymentStatusLabel: Record<string, string> = {
  UNPAID: '未支付',
  PAID: '已支付',
  PARTIALLY_REFUNDED: '部分退款',
  REFUNDED: '已退款',
}

export const userStatusLabel: Record<string, string> = {
  ACTIVE: '正常',
  BANNED: '已封禁',
  DEACTIVATED: '已停用',
}

export const afterSaleStatusLabel: Record<string, string> = {
  PENDING_REVIEW: '待审核',
  AWAITING_RETURN: '待寄回',
  RETURNING: '退货中',
  REFUNDING: '退款中',
  REFUND_FAILED: '退款失败',
  COMPLETED: '已完成',
  REJECTED: '已驳回',
  CANCELLED: '已撤销',
  CLOSED: '已关闭',
}

export function labelOf(map: Record<string, string>, key?: string | null) {
  if (!key) return '—'
  return map[key] ?? key
}
