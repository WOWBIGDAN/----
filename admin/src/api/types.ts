export interface FieldError {
  field: string
  reason: string
}

export interface AppError {
  status: number | string
  data: {
    code: string
    message: string
    details: FieldError[]
    requestId?: string
    retryAfter?: number
  }
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
}

export interface ActionResult {
  success: boolean
}

export interface AdminPrincipal {
  id: string
  username: string
  displayName: string
  permissions: string[]
}

export interface AdminAuthTokens {
  accessToken: string
  accessExpiresInSeconds: number
  refreshToken: string
  refreshExpiresAt: string
  tokenType: 'Bearer'
  admin: AdminPrincipal
}

export interface MediaSummary {
  id: string
  kind: 'IMAGE' | 'VIDEO'
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED'
  mimeType: string
  sizeBytes: number
  publicUrl: string | null
  durationSeconds?: number
}

export interface Category {
  id: string
  name: string
  scope: 'CONTENT' | 'PRODUCT'
  parentId: string | null
  sortOrder: number
  enabled: boolean
  version: number
}

export type ContentKind = 'SCIENCE_VIDEO' | 'SCIENCE_ARTICLE' | 'VIDEO_COURSE' | 'ARTICLE_COURSE'
export type PublishStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

export interface AdminContent {
  id: string
  kind: ContentKind
  title: string
  summary: string
  cover: MediaSummary
  category: Category
  tags: string[]
  accessPolicy: 'FREE' | 'PURCHASE' | 'MEMBER_OR_PURCHASE'
  priceCents: number
  currency: 'CNY'
  chapterCount: number
  publishedAt: string | null
  descriptionHtml: string
  authorName: string
  columnIds: string[]
  status: PublishStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface AdminBody {
  bodyHtml: string | null
  imageMediaIds: string[]
  videoMediaId: string | null
  version: number
}

export interface AdminChapter {
  id: string
  courseId: string
  title: string
  kind: 'VIDEO' | 'ARTICLE'
  sortOrder: number
  isPreview: boolean
  durationSeconds: number
  status: PublishStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface AdminColumn {
  id: string
  name: string
  description: string
  cover: MediaSummary
  contentCount: number
  sortOrder: number
  status: PublishStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface SkuAttribute {
  name: string
  value: string
}

export interface AdminProduct {
  id: string
  name: string
  summary: string
  cover: MediaSummary
  category: Category
  minPriceCents: number
  maxPriceCents: number
  currency: 'CNY'
  inStock: boolean
  detailHtml: string
  gallery: MediaSummary[]
  afterSalePolicy: string
  status: PublishStatus
  version: number
  createdAt: string
  updatedAt: string
}

export interface AdminSku {
  id: string
  productId: string
  skuCode: string
  attributes: SkuAttribute[]
  priceCents: number
  availableStock: number
  enabled: boolean
  onHandStock: number
  reservedStock: number
  version: number
}

export interface StockAdjustment {
  id: string
  skuId: string
  delta: number
  onHandStockAfter: number
  reservedStockAfter: number
  reason: string
  operatorId: string
  createdAt: string
}

export interface MembershipSummary {
  active: boolean
  expiresAt: string | null
  benefitCodes: string[]
}

export interface UserSummary {
  id: string
  nickname: string
  avatarUrl: string | null
  phoneMasked: string
  status: 'ACTIVE' | 'BANNED' | 'DEACTIVATED'
  membership: MembershipSummary
  createdAt: string
}

export interface AdminUser extends UserSummary {
  banReason: string | null
  bannedUntil: string | null
  lastLoginAt: string | null
  version: number
}

export interface OrderItem {
  id: string
  resourceId: string
  resourceType: 'SKU' | 'COURSE' | 'MEMBERSHIP_PLAN'
  productId: string | null
  title: string
  skuAttributes: SkuAttribute[]
  coverUrl: string | null
  quantity: number
  unitPriceCents: number
  subtotalCents: number
  refundedQuantity: number
  refundedAmountCents: number
}

export interface AddressSnapshot {
  recipient: string
  phone: string
  provinceCode: string
  province: string
  cityCode: string
  city: string
  districtCode: string
  district: string
  detail: string
}

export interface AdminOrderSummary {
  id: string
  orderNo: string
  type: 'PRODUCT' | 'COURSE' | 'MEMBERSHIP'
  status: string
  paymentStatus: string
  afterSaleStatus: string
  items: OrderItem[]
  payableAmountCents: number
  currency: 'CNY'
  createdAt: string
  user: UserSummary
}

export interface AdminOrder extends AdminOrderSummary {
  itemsAmountCents: number
  shippingFeeCents: number
  paidAmountCents: number
  refundedAmountCents: number
  address?: AddressSnapshot
  version: number
  cancelReason: string | null
  closedReason: string | null
}

export interface Shipment {
  id: string
  orderId: string
  carrierCode: string
  carrierName: string
  trackingNo: string
  status: string
  shippedAt: string
  version: number
}

export interface LogisticsResult {
  shipment: Shipment | null
  events: { time: string; description: string; location: string | null }[]
  syncStatus: string
}

export interface AfterSale {
  id: string
  afterSaleNo: string
  orderId: string
  type: 'REFUND_ONLY' | 'RETURN_REFUND'
  status: string
  items: { orderItemId: string; quantity: number; refundAmountCents: number }[]
  refundAmountCents: number
  reasonCode: string
  description: string
  evidence: MediaSummary[]
  reviewNote: string | null
  returnAddress?: AddressSnapshot
  returnShipment?: { carrierCode: string; trackingNo: string; submittedAt: string }
  version: number
  createdAt: string
}

export interface MembershipPlan {
  id: string
  name: string
  priceCents: number
  currency: 'CNY'
  durationDays: number
  aiDailyLimit: number
  benefitCodes: string[]
  description: string
  enabled: boolean
  sortOrder: number
  version: number
}

export interface NotificationTask {
  id: string
  status: string
  title: string
  recipientCount: number
  sentCount: number
  failedCount: number
  createdAt: string
}

export interface AuditLog {
  id: string
  actorId: string
  action: string
  resourceType: string
  resourceId: string
  requestId: string
  createdAt: string
}

export interface UploadTicket {
  uploadId: string
  mediaId: string
  method: 'PUT'
  uploadUrl: string
  headers: Record<string, string>
  expiresAt: string
}

export interface MediaReadGrant {
  mediaId: string
  url: string
  expiresAt: string
}
