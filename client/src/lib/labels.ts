export const contentKindLabel: Record<string, string> = {
  SCIENCE_VIDEO: '视频科普',
  SCIENCE_ARTICLE: '图文科普',
  VIDEO_COURSE: '视频课程',
  ARTICLE_COURSE: '图文课程',
}

export const accessPolicyLabel: Record<string, string> = {
  FREE: '免费',
  PURCHASE: '单独购买',
  MEMBER_OR_PURCHASE: '会员或购买',
}

export const accessReasonLabel: Record<string, string> = {
  FREE: '免费内容',
  PURCHASED: '已购买',
  MEMBER: '会员可看',
  PREVIEW: '预览章节',
  LOGIN_REQUIRED: '登录后继续',
  PURCHASE_REQUIRED: '购买或开通会员后可看',
  CONTENT_UNAVAILABLE: '内容暂不可用',
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

export const afterSaleOrderStatusLabel: Record<string, string> = {
  NONE: '无售后',
  PROCESSING: '售后处理中',
  PARTIALLY_COMPLETED: '部分售后完成',
  COMPLETED: '售后完成',
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

export const afterSaleTypeLabel: Record<string, string> = {
  REFUND_ONLY: '仅退款',
  RETURN_REFUND: '退货退款',
}

export const reasonCodeLabel: Record<string, string> = {
  NOT_NEEDED: '暂时不需要',
  QUALITY_ISSUE: '质量问题',
  WRONG_ITEM: '商品错发',
  OTHER: '其他',
}

export const shipmentStatusLabel: Record<string, string> = {
  PENDING_PICKUP: '待揽收',
  IN_TRANSIT: '运输中',
  OUT_FOR_DELIVERY: '派送中',
  DELIVERED: '已送达',
  EXCEPTION: '物流异常',
}

export const syncStatusLabel: Record<string, string> = {
  NOT_SHIPPED: '尚未发货',
  UP_TO_DATE: '物流已更新',
  PENDING: '正在同步物流',
  FAILED: '暂时无法更新，以下为最近一次记录',
}

export const refundStatusLabel: Record<string, string> = {
  PENDING: '待处理',
  PROCESSING: '退款中',
  SUCCEEDED: '退款成功',
  FAILED: '退款失败',
}

export const refundReasonLabel: Record<string, string> = {
  AFTERSALE: '售后退款',
  DIGITAL_ORDER: '数字订单退款',
  LATE_PAYMENT: '延迟到账补偿',
  DUPLICATE_PAYMENT: '重复支付补偿',
}

export const benefitLabel: Record<string, string> = {
  MEMBER_COURSES: '会员课程',
}

export const notificationCategoryLabel: Record<string, string> = {
  ORDER: '订单',
  LOGISTICS: '物流',
  AFTERSALE: '售后',
  MEMBERSHIP: '会员',
  SYSTEM: '系统',
}

export const payChannelLabel: Record<string, string> = {
  WECHAT_NATIVE: '微信支付',
  ALIPAY_PAGE: '支付宝',
}

export function labelOf(map: Record<string, string>, key?: string | null) {
  if (!key) return '—'
  return map[key] ?? key
}
