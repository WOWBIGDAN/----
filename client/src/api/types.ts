export interface FieldError {
  field: string
  reason: string
}

export interface ErrorBody {
  code: string
  message: string
  details: FieldError[]
  requestId?: string
  retryAfter?: number
}

export interface AppError {
  status: number | string
  data: ErrorBody
}

export interface ActionResult {
  success: boolean
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

export interface AuthTokens {
  accessToken: string
  accessExpiresInSeconds: number
  refreshToken: string
  refreshExpiresAt: string
  tokenType: 'Bearer'
  user: UserSummary
}

export interface LegalDocument {
  type: 'TERMS' | 'PRIVACY'
  version: string
  contentHtml: string
  updatedAt: string
}

export interface PasswordLoginInput {
  phone: string
  password: string
}

export interface RegisterInput {
  phone: string
  password: string
  nickname?: string
  termsVersion: string
  privacyVersion: string
}

export interface UserPatch {
  nickname?: string
  avatarMediaId?: string | null
}

export interface PasswordChangeInput {
  currentPassword: string
  newPassword: string
}

export interface Session {
  id: string
  deviceLabel: string
  isCurrent: boolean
  lastActiveAt: string
  createdAt: string
}

export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasNext: boolean
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
export type AccessPolicy = 'FREE' | 'PURCHASE' | 'MEMBER_OR_PURCHASE'
export type AccessReason =
  | 'FREE'
  | 'PURCHASED'
  | 'MEMBER'
  | 'PREVIEW'
  | 'ADMIN'
  | 'LOGIN_REQUIRED'
  | 'PURCHASE_REQUIRED'
  | 'CONTENT_UNAVAILABLE'

export interface AccessDecision {
  canAccess: boolean
  reason: AccessReason
}

export interface ContentSummary {
  id: string
  kind: ContentKind
  title: string
  summary: string
  cover: MediaSummary
  category: Category
  tags: string[]
  accessPolicy: AccessPolicy
  priceCents: number
  currency: 'CNY'
  chapterCount: number
  publishedAt: string
}

export interface ContentDetail extends ContentSummary {
  descriptionHtml: string
  authorName: string
  columnIds: string[]
  access: AccessDecision
}

export interface ArticleBody {
  contentId: string
  bodyHtml: string
  imageUrls: string[]
}

export interface PlaybackGrant {
  contentId: string
  chapterId: string | null
  playbackUrl: string
  expiresAt: string
  durationSeconds: number
  preview: boolean
}

export interface ChapterSummary {
  id: string
  courseId: string
  title: string
  kind: 'VIDEO' | 'ARTICLE'
  sortOrder: number
  isPreview: boolean
  durationSeconds: number
  access: AccessDecision
}

export interface Column {
  id: string
  name: string
  description: string
  cover: MediaSummary
  contentCount: number
  sortOrder: number
}

export interface SkuAttribute {
  name: string
  value: string
}

export interface ProductSummary {
  id: string
  name: string
  summary: string
  cover: MediaSummary
  category: Category
  minPriceCents: number
  maxPriceCents: number
  currency: 'CNY'
  inStock: boolean
}

export interface Sku {
  id: string
  productId: string
  skuCode: string
  attributes: SkuAttribute[]
  priceCents: number
  availableStock: number
  enabled: boolean
}

export interface ProductDetail extends ProductSummary {
  detailHtml: string
  gallery: MediaSummary[]
  skus: Sku[]
  afterSalePolicy: string
}

export interface Address {
  id: string
  recipient: string
  phone: string
  provinceCode: string
  province: string
  cityCode: string
  city: string
  districtCode: string
  district: string
  detail: string
  isDefault: boolean
  version: number
}

export interface AddressInput {
  recipient: string
  phone: string
  provinceCode: string
  province: string
  cityCode: string
  city: string
  districtCode: string
  district: string
  detail: string
  isDefault?: boolean
}

export interface AddressReplace extends AddressInput {
  isDefault: boolean
  version: number
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

export type OrderType = 'PRODUCT' | 'COURSE' | 'MEMBERSHIP'
export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PENDING_SHIPMENT'
  | 'PENDING_RECEIPT'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'CLOSED'
export type PaymentStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'
export type AfterSaleOrderStatus = 'NONE' | 'PROCESSING' | 'PARTIALLY_COMPLETED' | 'COMPLETED'

export interface OrderSummary {
  id: string
  orderNo: string
  type: OrderType
  status: OrderStatus
  paymentStatus: PaymentStatus
  afterSaleStatus: AfterSaleOrderStatus
  items: OrderItem[]
  itemsAmountCents: number
  shippingFeeCents: number
  payableAmountCents: number
  paidAmountCents: number
  refundedAmountCents: number
  currency: 'CNY'
  paymentDeadlineAt: string
  paidAt: string | null
  createdAt: string
}

export interface OrderActions {
  canPay: boolean
  canCancel: boolean
  canConfirmReceipt: boolean
  canApplyAfterSale: boolean
}

export interface OrderDetail extends OrderSummary {
  address?: AddressSnapshot
  actions: OrderActions
  cancelReason: string | null
  cancelledAt: string | null
  completedAt: string | null
  closedReason: string | null
  version: number
}

export interface OrderQuote {
  quoteId: string
  type: OrderType
  items: OrderItem[]
  itemsAmountCents: number
  shippingFeeCents: number
  payableAmountCents: number
  currency: 'CNY'
  address?: AddressSnapshot
  expiresAt: string
}

export type QuoteCreate =
  | { type: 'PRODUCT'; addressId: string; items: { skuId: string; quantity: number }[] }
  | { type: 'COURSE'; courseId: string }
  | { type: 'MEMBERSHIP'; planId: string }

export type PayChannel = 'WECHAT_NATIVE' | 'ALIPAY_PAGE'

export interface PaymentAttempt {
  id: string
  orderId: string
  channel: PayChannel
  status: 'PENDING' | 'SUCCEEDED' | 'CLOSED' | 'FAILED'
  amountCents: number
  launchType: 'QR_CODE' | 'REDIRECT'
  launchUrl: string
  expiresAt: string
  paidAt: string | null
  createdAt: string
}

export interface LogisticsEvent {
  time: string
  description: string
  location: string | null
}

export interface Shipment {
  id: string
  orderId: string
  carrierCode: string
  carrierName: string
  trackingNo: string
  status: 'PENDING_PICKUP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'EXCEPTION'
  shippedAt: string
  deliveredAt: string | null
  lastSyncedAt: string | null
  version: number
}

export interface LogisticsResult {
  shipment: Shipment | null
  events: LogisticsEvent[]
  syncStatus: 'NOT_SHIPPED' | 'UP_TO_DATE' | 'PENDING' | 'FAILED'
}

export interface Refund {
  id: string
  orderId: string
  afterSaleId: string | null
  reasonType: 'AFTERSALE' | 'DIGITAL_ORDER' | 'LATE_PAYMENT' | 'DUPLICATE_PAYMENT'
  amountCents: number
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED'
  failureCode: string | null
  createdAt: string
  completedAt: string | null
}

export type AfterSaleStatus =
  | 'PENDING_REVIEW'
  | 'AWAITING_RETURN'
  | 'RETURNING'
  | 'REFUNDING'
  | 'REFUND_FAILED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED'

export interface AfterSaleLine {
  orderItemId: string
  quantity: number
  refundAmountCents: number
}

export interface ReturnShipment {
  carrierCode: string
  trackingNo: string
  submittedAt: string
}

export interface AfterSale {
  id: string
  afterSaleNo: string
  orderId: string
  type: 'REFUND_ONLY' | 'RETURN_REFUND'
  status: AfterSaleStatus
  items: AfterSaleLine[]
  itemsRefundAmountCents: number
  shippingRefundAmountCents: number
  refundAmountCents: number
  reasonCode: 'NOT_NEEDED' | 'QUALITY_ISSUE' | 'WRONG_ITEM' | 'OTHER'
  description: string
  evidence: MediaSummary[]
  reviewNote: string | null
  returnDeadlineAt: string | null
  returnAddress?: AddressSnapshot
  returnShipment?: ReturnShipment
  refundId: string | null
  createdAt: string
  updatedAt: string
  version: number
}

export interface AfterSaleCreate {
  orderId: string
  type: 'REFUND_ONLY' | 'RETURN_REFUND'
  items: { orderItemId: string; quantity: number }[]
  reasonCode: AfterSale['reasonCode']
  description: string
  evidenceMediaIds?: string[]
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
}

export interface MembershipDetail extends MembershipSummary {
  currentPlanName: string | null
  aiDailyLimit: number
  updatedAt: string
}

export interface CourseSummary {
  id: string
  kind: 'VIDEO_COURSE' | 'ARTICLE_COURSE'
  title: string
  summary: string
  cover: MediaSummary
  category: Category
  tags: string[]
  accessPolicy: 'PURCHASE' | 'MEMBER_OR_PURCHASE'
  priceCents: number
  currency: 'CNY'
  chapterCount: number
  publishedAt: string
}

export interface CourseEntitlement {
  id: string
  course: CourseSummary
  orderId: string
  status: 'ACTIVE' | 'REVOKED'
  grantedAt: string
}

export interface AiQuota {
  date: string
  limit: number
  used: number
  reserved: number
  remaining: number
  resetsAt: string
}

export interface AiConversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface AiMessage {
  id: string
  conversationId: string
  role: 'USER' | 'ASSISTANT'
  content: string
  status: 'QUEUED' | 'GENERATING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'BLOCKED'
  generationId: string | null
  createdAt: string
}

export interface AiMessagePage {
  items: AiMessage[]
  nextCursor: string | null
  hasMore: boolean
}

export interface AiGeneration {
  id: string
  conversationId: string
  userMessageId: string
  assistantMessageId: string
  status: AiMessage['status']
  errorCode: string | null
  createdAt: string
  completedAt: string | null
}

export interface NotificationTarget {
  type: 'ORDER' | 'AFTERSALE' | 'CONTENT' | 'MEMBERSHIP' | 'NONE'
  resourceId: string | null
}

export interface Notification {
  id: string
  category: 'ORDER' | 'LOGISTICS' | 'AFTERSALE' | 'MEMBERSHIP' | 'SYSTEM'
  title: string
  body: string
  target: NotificationTarget
  readAt: string | null
  createdAt: string
}

export interface UnreadCount {
  count: number
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

export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface ContentListQuery extends PageQuery {
  keyword?: string
  categoryId?: string
  kind?: ContentKind
  columnId?: string
  accessPolicy?: AccessPolicy
  sort?: 'publishedAt:desc' | 'publishedAt:asc' | 'priceCents:asc' | 'priceCents:desc'
}

export interface ProductListQuery extends PageQuery {
  keyword?: string
  categoryId?: string
  minPriceCents?: number
  maxPriceCents?: number
  inStock?: boolean
  sort?: 'createdAt:desc' | 'priceCents:asc' | 'priceCents:desc'
}

export interface OrderListQuery extends PageQuery {
  type?: OrderType
  status?: OrderStatus
  paymentStatus?: PaymentStatus
  createdFrom?: string
  createdTo?: string
  sort?: 'createdAt:desc' | 'createdAt:asc'
}
