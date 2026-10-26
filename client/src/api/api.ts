import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from './baseQuery'
import { setCredentials, setUser } from '../store/authSlice'
import type {
  ActionResult,
  Address,
  AddressInput,
  AddressReplace,
  AfterSale,
  AfterSaleCreate,
  AiConversation,
  AiGeneration,
  AiMessagePage,
  AiQuota,
  ArticleBody,
  AuthTokens,
  Category,
  ChapterSummary,
  Column,
  ContentDetail,
  ContentListQuery,
  ContentSummary,
  CourseEntitlement,
  LegalDocument,
  LogisticsResult,
  MediaReadGrant,
  MediaSummary,
  MembershipDetail,
  MembershipPlan,
  Notification,
  OrderDetail,
  OrderListQuery,
  OrderQuote,
  OrderSummary,
  PageQuery,
  PageResult,
  PasswordChangeInput,
  PasswordLoginInput,
  PaymentAttempt,
  PayChannel,
  PlaybackGrant,
  ProductDetail,
  ProductListQuery,
  ProductSummary,
  QuoteCreate,
  Refund,
  RegisterInput,
  Session,
  UnreadCount,
  UploadTicket,
  UserPatch,
  UserSummary,
} from './types'

function cleanParams(params: object) {
  const result: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    result[key] = value as string | number | boolean
  }
  return result
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: [
    'Me',
    'Session',
    'Address',
    'Category',
    'Content',
    'Column',
    'Product',
    'Order',
    'Payment',
    'AfterSale',
    'Membership',
    'Entitlement',
    'Ai',
    'Notification',
    'Quota',
  ],
  refetchOnMountOrArgChange: 30,
  endpoints: (builder) => ({
    getLegal: builder.query<LegalDocument, 'TERMS' | 'PRIVACY'>({
      query: (type) => `/public/legal-documents/${type}`,
    }),
    register: builder.mutation<AuthTokens, RegisterInput>({
      query: (body) => ({ url: '/auth/register', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials(data))
        dispatch(api.util.invalidateTags(['Content', 'Column']))
      },
    }),
    login: builder.mutation<AuthTokens, PasswordLoginInput>({
      query: (body) => ({ url: '/auth/login/password', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials(data))
        dispatch(api.util.invalidateTags(['Content', 'Column']))
      },
    }),
    logout: builder.mutation<ActionResult, void>({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<UserSummary, void>({
      query: () => '/me',
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setUser(data))
        } catch {
          /* 鉴权失败由 baseQuery 处理 */
        }
      },
    }),
    patchMe: builder.mutation<UserSummary, UserPatch>({
      query: (body) => ({ url: '/me', method: 'PATCH', body }),
      invalidatesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setUser(data))
      },
    }),
    changePassword: builder.mutation<ActionResult, PasswordChangeInput>({
      query: (body) => ({ url: '/me/password', method: 'PUT', body }),
    }),
    getSessions: builder.query<PageResult<Session>, PageQuery | void>({
      query: (params) => ({ url: '/me/sessions', params: cleanParams(params ?? {}) }),
      providesTags: ['Session'],
    }),
    deleteSession: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/me/sessions/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Session'],
    }),
    getAddresses: builder.query<PageResult<Address>, PageQuery | void>({
      query: (params) => ({ url: '/me/addresses', params: cleanParams(params ?? {}) }),
      providesTags: ['Address'],
    }),
    createAddress: builder.mutation<Address, AddressInput>({
      query: (body) => ({ url: '/me/addresses', method: 'POST', body }),
      invalidatesTags: ['Address'],
    }),
    replaceAddress: builder.mutation<Address, { id: string; body: AddressReplace }>({
      query: ({ id, body }) => ({ url: `/me/addresses/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/me/addresses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Address'],
    }),
    getCategories: builder.query<PageResult<Category>, { scope: 'CONTENT' | 'PRODUCT'; page?: number; pageSize?: number }>({
      query: (params) => ({ url: '/categories', params: cleanParams(params) }),
      providesTags: ['Category'],
    }),
    getVideos: builder.query<PageResult<ContentSummary>, ContentListQuery | void>({
      query: (params) => ({ url: '/videos', params: cleanParams(params ?? {}) }),
      providesTags: ['Content'],
    }),
    getVideo: builder.query<ContentDetail, string>({
      query: (id) => `/videos/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Content', id }],
    }),
    getArticles: builder.query<PageResult<ContentSummary>, ContentListQuery | void>({
      query: (params) => ({ url: '/articles', params: cleanParams(params ?? {}) }),
      providesTags: ['Content'],
    }),
    getArticle: builder.query<ContentDetail, string>({
      query: (id) => `/articles/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Content', id }],
    }),
    getVideoPlayback: builder.query<PlaybackGrant, string>({
      query: (id) => `/videos/${id}/playback`,
      keepUnusedDataFor: 0,
    }),
    getArticleBody: builder.query<ArticleBody, string>({
      query: (id) => `/articles/${id}/body`,
    }),
    getChapters: builder.query<PageResult<ChapterSummary>, { id: string; page?: number; pageSize?: number }>({
      query: ({ id, ...params }) => ({ url: `/courses/${id}/chapters`, params: cleanParams(params) }),
      providesTags: (_result, _error, arg) => [{ type: 'Content', id: arg.id }],
    }),
    getChapterBody: builder.query<ArticleBody, string>({
      query: (id) => `/chapters/${id}/body`,
    }),
    getChapterPlayback: builder.query<PlaybackGrant, string>({
      query: (id) => `/chapters/${id}/playback`,
      keepUnusedDataFor: 0,
    }),
    getColumns: builder.query<PageResult<Column>, PageQuery & { keyword?: string } | void>({
      query: (params) => ({ url: '/columns', params: cleanParams(params ?? {}) }),
      providesTags: ['Column'],
    }),
    getColumn: builder.query<Column, string>({
      query: (id) => `/columns/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Column', id }],
    }),
    getColumnContents: builder.query<PageResult<ContentSummary>, { id: string; page?: number; pageSize?: number; kind?: string }>({
      query: ({ id, ...params }) => ({ url: `/columns/${id}/contents`, params: cleanParams(params) }),
    }),
    getProducts: builder.query<PageResult<ProductSummary>, ProductListQuery | void>({
      query: (params) => ({ url: '/products', params: cleanParams(params ?? {}) }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query<ProductDetail, string>({
      query: (id) => `/products/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Product', id }],
    }),
    createQuote: builder.mutation<OrderQuote, QuoteCreate>({
      query: (body) => ({ url: '/order-quotes', method: 'POST', body }),
    }),
    createOrder: builder.mutation<OrderDetail, { quoteId: string; idempotencyKey: string }>({
      query: ({ quoteId, idempotencyKey }) => ({
        url: '/orders',
        method: 'POST',
        body: { quoteId },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Order'],
    }),
    getOrders: builder.query<PageResult<OrderSummary>, OrderListQuery | void>({
      query: (params) => ({ url: '/orders', params: cleanParams(params ?? {}) }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query<OrderDetail, string>({
      query: (id) => `/orders/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Order', id }],
    }),
    cancelOrder: builder.mutation<OrderDetail, { id: string; reason: string; version: number; idempotencyKey: string }>({
      query: ({ id, reason, version, idempotencyKey }) => ({
        url: `/orders/${id}/cancel`,
        method: 'POST',
        body: { reason, version },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Order'],
    }),
    createPayment: builder.mutation<PaymentAttempt, { orderId: string; channel: PayChannel; idempotencyKey: string }>({
      query: ({ orderId, channel, idempotencyKey }) => ({
        url: `/orders/${orderId}/payment-attempts`,
        method: 'POST',
        body: { channel },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    getPayment: builder.query<PaymentAttempt, string>({
      query: (id) => `/payment-attempts/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Payment', id }],
    }),
    syncPayment: builder.mutation<PaymentAttempt, string>({
      query: (id) => ({ url: `/payment-attempts/${id}/sync`, method: 'POST' }),
      invalidatesTags: ['Payment', 'Order'],
    }),
    getLogistics: builder.query<LogisticsResult, string>({
      query: (id) => `/orders/${id}/logistics`,
    }),
    confirmReceipt: builder.mutation<OrderDetail, { id: string; version: number; idempotencyKey: string }>({
      query: ({ id, version, idempotencyKey }) => ({
        url: `/orders/${id}/confirm-receipt`,
        method: 'POST',
        body: { version },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Order'],
    }),
    getRefunds: builder.query<PageResult<Refund>, { id: string; page?: number; pageSize?: number }>({
      query: ({ id, ...params }) => ({ url: `/orders/${id}/refunds`, params: cleanParams(params) }),
    }),
    getMembershipPlans: builder.query<PageResult<MembershipPlan>, PageQuery | void>({
      query: (params) => ({ url: '/membership-plans', params: cleanParams(params ?? {}) }),
      providesTags: ['Membership'],
    }),
    getMembershipPlan: builder.query<MembershipPlan, string>({
      query: (id) => `/membership-plans/${id}`,
    }),
    getMyMembership: builder.query<MembershipDetail, void>({
      query: () => '/me/membership',
      providesTags: ['Membership'],
    }),
    getMyCourses: builder.query<PageResult<CourseEntitlement>, PageQuery & { status?: 'ACTIVE' | 'REVOKED' } | void>({
      query: (params) => ({ url: '/me/courses', params: cleanParams(params ?? {}) }),
      providesTags: ['Entitlement'],
    }),
    createAfterSale: builder.mutation<AfterSale, { body: AfterSaleCreate; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: '/aftersales',
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['AfterSale', 'Order'],
    }),
    getAfterSales: builder.query<PageResult<AfterSale>, PageQuery & { status?: string; orderId?: string } | void>({
      query: (params) => ({ url: '/aftersales', params: cleanParams(params ?? {}) }),
      providesTags: ['AfterSale'],
    }),
    getAfterSale: builder.query<AfterSale, string>({
      query: (id) => `/aftersales/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'AfterSale', id }],
    }),
    cancelAfterSale: builder.mutation<AfterSale, { id: string; version: number; idempotencyKey: string }>({
      query: ({ id, version, idempotencyKey }) => ({
        url: `/aftersales/${id}/cancel`,
        method: 'POST',
        body: { version },
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['AfterSale', 'Order'],
    }),
    submitReturnShipment: builder.mutation<
      AfterSale,
      { id: string; carrierCode: string; trackingNo: string; version: number; idempotencyKey: string }
    >({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/aftersales/${id}/return-shipment`,
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['AfterSale'],
    }),
    getAiQuota: builder.query<AiQuota, void>({
      query: () => '/ai/quota',
      providesTags: ['Quota'],
    }),
    getConversations: builder.query<PageResult<AiConversation>, PageQuery | void>({
      query: (params) => ({ url: '/ai/conversations', params: cleanParams(params ?? {}) }),
      providesTags: ['Ai'],
    }),
    createConversation: builder.mutation<AiConversation, { title?: string } | void>({
      query: (body) => ({ url: '/ai/conversations', method: 'POST', body: body ?? {} }),
      invalidatesTags: ['Ai'],
    }),
    renameConversation: builder.mutation<AiConversation, { id: string; title: string }>({
      query: ({ id, title }) => ({ url: `/ai/conversations/${id}`, method: 'PATCH', body: { title } }),
      invalidatesTags: ['Ai'],
    }),
    deleteConversation: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/ai/conversations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Ai'],
    }),
    getAiMessages: builder.query<AiMessagePage, { id: string; cursor?: string; limit?: number }>({
      query: ({ id, ...params }) => ({ url: `/ai/conversations/${id}/messages`, params: cleanParams(params) }),
    }),
    sendAiMessage: builder.mutation<
      AiGeneration,
      { id: string; clientMessageId: string; content: string; idempotencyKey: string }
    >({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/ai/conversations/${id}/messages`,
        method: 'POST',
        body,
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Quota', 'Ai'],
    }),
    cancelGeneration: builder.mutation<AiGeneration, { id: string; idempotencyKey: string }>({
      query: ({ id, idempotencyKey }) => ({
        url: `/ai/generations/${id}/cancel`,
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
      }),
      invalidatesTags: ['Quota'],
    }),
    getNotifications: builder.query<PageResult<Notification>, PageQuery & { category?: string; unreadOnly?: boolean } | void>({
      query: (params) => ({ url: '/me/notifications', params: cleanParams(params ?? {}) }),
      providesTags: ['Notification'],
    }),
    getUnreadCount: builder.query<UnreadCount, void>({
      query: () => '/me/notifications/unread-count',
      providesTags: ['Notification'],
    }),
    markNotificationRead: builder.mutation<Notification, string>({
      query: (id) => ({ url: `/me/notifications/${id}/read`, method: 'PUT' }),
      invalidatesTags: ['Notification'],
    }),
    markAllNotificationsRead: builder.mutation<ActionResult, string>({
      query: (before) => ({ url: '/me/notifications/read-all', method: 'PUT', body: { before } }),
      invalidatesTags: ['Notification'],
    }),
    deleteNotification: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/me/notifications/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Notification'],
    }),
    createUpload: builder.mutation<
      UploadTicket,
      { purpose: 'AVATAR' | 'AFTERSALE_EVIDENCE'; fileName: string; mimeType: string; sizeBytes: number }
    >({
      query: (body) => ({ url: '/uploads', method: 'POST', body }),
    }),
    completeUpload: builder.mutation<MediaSummary, string>({
      query: (id) => ({ url: `/uploads/${id}/complete`, method: 'POST' }),
    }),
    getMedia: builder.query<MediaSummary, string>({
      query: (id) => `/media/${id}`,
    }),
    readMediaGrant: builder.mutation<MediaReadGrant, string>({
      query: (id) => ({ url: `/media/${id}/read-grant`, method: 'POST' }),
    }),
  }),
})

export const {
  useGetLegalQuery,
  useLazyGetLegalQuery,
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useGetMeQuery,
  useLazyGetMeQuery,
  usePatchMeMutation,
  useChangePasswordMutation,
  useGetSessionsQuery,
  useDeleteSessionMutation,
  useGetAddressesQuery,
  useCreateAddressMutation,
  useReplaceAddressMutation,
  useDeleteAddressMutation,
  useGetCategoriesQuery,
  useGetVideosQuery,
  useGetVideoQuery,
  useLazyGetVideoQuery,
  useGetArticlesQuery,
  useGetArticleQuery,
  useLazyGetArticleQuery,
  useGetVideoPlaybackQuery,
  useGetArticleBodyQuery,
  useGetChaptersQuery,
  useGetChapterBodyQuery,
  useGetChapterPlaybackQuery,
  useGetColumnsQuery,
  useGetColumnQuery,
  useGetColumnContentsQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateQuoteMutation,
  useCreateOrderMutation,
  useGetOrdersQuery,
  useGetOrderQuery,
  useCancelOrderMutation,
  useCreatePaymentMutation,
  useGetPaymentQuery,
  useSyncPaymentMutation,
  useGetLogisticsQuery,
  useConfirmReceiptMutation,
  useGetRefundsQuery,
  useGetMembershipPlansQuery,
  useGetMembershipPlanQuery,
  useGetMyMembershipQuery,
  useGetMyCoursesQuery,
  useCreateAfterSaleMutation,
  useGetAfterSalesQuery,
  useGetAfterSaleQuery,
  useCancelAfterSaleMutation,
  useSubmitReturnShipmentMutation,
  useGetAiQuotaQuery,
  useGetConversationsQuery,
  useCreateConversationMutation,
  useRenameConversationMutation,
  useDeleteConversationMutation,
  useLazyGetAiMessagesQuery,
  useSendAiMessageMutation,
  useCancelGenerationMutation,
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
  useCreateUploadMutation,
  useCompleteUploadMutation,
  useLazyGetMediaQuery,
  useReadMediaGrantMutation,
} = api
