import { createApi } from '@reduxjs/toolkit/query/react'
import { baseQuery } from './baseQuery'
import { setAdmin, setCredentials } from '../store/authSlice'
import type {
  ActionResult,
  AdminAuthTokens,
  AdminBody,
  AdminChapter,
  AdminColumn,
  AdminContent,
  AdminOrder,
  AdminOrderSummary,
  AdminPrincipal,
  AdminProduct,
  AdminSku,
  AdminUser,
  AfterSale,
  AuditLog,
  Category,
  LogisticsResult,
  MediaReadGrant,
  MediaSummary,
  MembershipPlan,
  NotificationTask,
  PageResult,
  StockAdjustment,
  UploadTicket,
} from './types'

function cleanParams(params: object) {
  const result: Record<string, string | number | boolean> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    result[key] = value as string | number | boolean
  }
  return result
}

function idempotent(key: string) {
  return { 'Idempotency-Key': key }
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Category', 'Content', 'Chapter', 'Column', 'Product', 'Sku', 'Order', 'AfterSale', 'User', 'Plan', 'Notice', 'Audit'],
  refetchOnMountOrArgChange: 30,
  endpoints: (builder) => ({
    login: builder.mutation<AdminAuthTokens, { username: string; password: string }>({
      query: (body) => ({ url: '/admin/auth/login', method: 'POST', body }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        const { data } = await queryFulfilled
        dispatch(setCredentials(data))
      },
    }),
    logout: builder.mutation<ActionResult, void>({
      query: () => ({ url: '/admin/auth/logout', method: 'POST' }),
    }),
    getMe: builder.query<AdminPrincipal, void>({
      query: () => '/admin/me',
      providesTags: ['Me'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled
          dispatch(setAdmin(data))
        } catch {
          /* 鉴权失败由 baseQuery 处理 */
        }
      },
    }),
    getCategories: builder.query<PageResult<Category>, { page?: number; pageSize?: number; scope?: string; keyword?: string } | void>({
      query: (params) => ({ url: '/admin/categories', params: cleanParams(params ?? {}) }),
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation<Category, { name: string; scope: 'CONTENT' | 'PRODUCT'; sortOrder?: number; enabled?: boolean }>({
      query: (body) => ({ url: '/admin/categories', method: 'POST', body }),
      invalidatesTags: ['Category'],
    }),
    patchCategory: builder.mutation<Category, { id: string; body: { name?: string; sortOrder?: number; enabled?: boolean; version: number } }>({
      query: ({ id, body }) => ({ url: `/admin/categories/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Category'],
    }),
    deleteCategory: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Category'],
    }),
    getContents: builder.query<PageResult<AdminContent>, { page?: number; pageSize?: number; kind?: string; status?: string; keyword?: string; categoryId?: string } | void>({
      query: (params) => ({ url: '/admin/contents', params: cleanParams(params ?? {}) }),
      providesTags: ['Content'],
    }),
    getContent: builder.query<AdminContent, string>({
      query: (id) => `/admin/contents/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Content', id }],
    }),
    createContent: builder.mutation<AdminContent, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/contents', method: 'POST', body }),
      invalidatesTags: ['Content'],
    }),
    patchContent: builder.mutation<AdminContent, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/contents/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Content'],
    }),
    deleteContent: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/contents/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Content'],
    }),
    publishContent: builder.mutation<AdminContent, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/contents/${id}/publish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Content'],
    }),
    unpublishContent: builder.mutation<AdminContent, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/contents/${id}/unpublish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Content'],
    }),
    getContentBody: builder.query<AdminBody, string>({
      query: (id) => `/admin/contents/${id}/body`,
    }),
    putContentBody: builder.mutation<AdminBody, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/contents/${id}/body`, method: 'PUT', body }),
    }),
    getChapters: builder.query<PageResult<AdminChapter>, { id: string; page?: number; pageSize?: number }>({
      query: ({ id, ...params }) => ({ url: `/admin/courses/${id}/chapters`, params: cleanParams(params) }),
      providesTags: ['Chapter'],
    }),
    createChapter: builder.mutation<AdminChapter, { id: string; title: string; sortOrder: number; isPreview?: boolean }>({
      query: ({ id, ...body }) => ({ url: `/admin/courses/${id}/chapters`, method: 'POST', body }),
      invalidatesTags: ['Chapter', 'Content'],
    }),
    patchChapter: builder.mutation<AdminChapter, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/chapters/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Chapter'],
    }),
    deleteChapter: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/chapters/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Chapter'],
    }),
    getChapterBody: builder.query<AdminBody, string>({
      query: (id) => `/admin/chapters/${id}/body`,
    }),
    putChapterBody: builder.mutation<AdminBody, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/chapters/${id}/body`, method: 'PUT', body }),
    }),
    publishChapter: builder.mutation<AdminChapter, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/chapters/${id}/publish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Chapter'],
    }),
    unpublishChapter: builder.mutation<AdminChapter, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/chapters/${id}/unpublish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Chapter'],
    }),
    getColumns: builder.query<PageResult<AdminColumn>, { page?: number; pageSize?: number; keyword?: string } | void>({
      query: (params) => ({ url: '/admin/columns', params: cleanParams(params ?? {}) }),
      providesTags: ['Column'],
    }),
    getColumn: builder.query<AdminColumn, string>({
      query: (id) => `/admin/columns/${id}`,
    }),
    createColumn: builder.mutation<AdminColumn, { name: string; description?: string; coverMediaId: string; sortOrder?: number }>({
      query: (body) => ({ url: '/admin/columns', method: 'POST', body }),
      invalidatesTags: ['Column'],
    }),
    patchColumn: builder.mutation<AdminColumn, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/columns/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Column'],
    }),
    deleteColumn: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/columns/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Column'],
    }),
    publishColumn: builder.mutation<AdminColumn, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/columns/${id}/publish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Column'],
    }),
    unpublishColumn: builder.mutation<AdminColumn, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/columns/${id}/unpublish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Column'],
    }),
    getColumnContents: builder.query<PageResult<AdminContent>, { id: string; page?: number; pageSize?: number }>({
      query: ({ id, ...params }) => ({ url: `/admin/columns/${id}/contents`, params: cleanParams(params) }),
    }),
    putColumnContent: builder.mutation<ActionResult, { id: string; contentId: string; sortOrder: number }>({
      query: ({ id, contentId, sortOrder }) => ({
        url: `/admin/columns/${id}/contents/${contentId}`,
        method: 'PUT',
        body: { sortOrder },
      }),
      invalidatesTags: ['Column'],
    }),
    deleteColumnContent: builder.mutation<ActionResult, { id: string; contentId: string }>({
      query: ({ id, contentId }) => ({ url: `/admin/columns/${id}/contents/${contentId}`, method: 'DELETE' }),
      invalidatesTags: ['Column'],
    }),
    getProducts: builder.query<PageResult<AdminProduct>, { page?: number; pageSize?: number; keyword?: string; status?: string } | void>({
      query: (params) => ({ url: '/admin/products', params: cleanParams(params ?? {}) }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query<AdminProduct, string>({
      query: (id) => `/admin/products/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation<AdminProduct, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/products', method: 'POST', body }),
      invalidatesTags: ['Product'],
    }),
    patchProduct: builder.mutation<AdminProduct, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/products/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Product'],
    }),
    deleteProduct: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    publishProduct: builder.mutation<AdminProduct, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/products/${id}/publish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Product'],
    }),
    unpublishProduct: builder.mutation<AdminProduct, { id: string; version: number }>({
      query: ({ id, version }) => ({ url: `/admin/products/${id}/unpublish`, method: 'POST', body: { version } }),
      invalidatesTags: ['Product'],
    }),
    getSkus: builder.query<PageResult<AdminSku>, string>({
      query: (id) => `/admin/products/${id}/skus`,
      providesTags: ['Sku'],
    }),
    createSku: builder.mutation<AdminSku, { productId: string; body: Record<string, unknown> }>({
      query: ({ productId, body }) => ({ url: `/admin/products/${productId}/skus`, method: 'POST', body }),
      invalidatesTags: ['Sku', 'Product'],
    }),
    patchSku: builder.mutation<AdminSku, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/skus/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Sku'],
    }),
    deleteSku: builder.mutation<ActionResult, string>({
      query: (id) => ({ url: `/admin/skus/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sku'],
    }),
    adjustStock: builder.mutation<StockAdjustment, { id: string; delta: number; reason: string; version: number; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/admin/skus/${id}/stock-adjustments`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['Sku'],
    }),
    getStockAdjustments: builder.query<PageResult<StockAdjustment>, string>({
      query: (id) => `/admin/skus/${id}/stock-adjustments`,
    }),
    getOrders: builder.query<PageResult<AdminOrderSummary>, { page?: number; pageSize?: number; type?: string; status?: string; orderNo?: string; userId?: string } | void>({
      query: (params) => ({ url: '/admin/orders', params: cleanParams(params ?? {}) }),
      providesTags: ['Order'],
    }),
    getOrder: builder.query<AdminOrder, string>({
      query: (id) => `/admin/orders/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),
    getLogistics: builder.query<LogisticsResult, string>({
      query: (id) => `/admin/orders/${id}/logistics`,
    }),
    shipOrder: builder.mutation<AdminOrder, { id: string; carrierCode: string; trackingNo: string; orderVersion: number; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/admin/orders/${id}/shipment`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['Order'],
    }),
    patchShipment: builder.mutation<ShipmentPatchResult, { id: string; carrierCode: string; trackingNo: string; reason: string; version: number }>({
      query: ({ id, ...body }) => ({ url: `/admin/shipments/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Order'],
    }),
    getAfterSales: builder.query<PageResult<AfterSale>, { page?: number; pageSize?: number; status?: string } | void>({
      query: (params) => ({ url: '/admin/aftersales', params: cleanParams(params ?? {}) }),
      providesTags: ['AfterSale'],
    }),
    getAfterSale: builder.query<AfterSale, string>({
      query: (id) => `/admin/aftersales/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'AfterSale', id }],
    }),
    reviewAfterSale: builder.mutation<AfterSale, { id: string; body: Record<string, unknown>; idempotencyKey: string }>({
      query: ({ id, body, idempotencyKey }) => ({
        url: `/admin/aftersales/${id}/review`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['AfterSale', 'Order'],
    }),
    confirmReturn: builder.mutation<AfterSale, { id: string; note: string; version: number; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/admin/aftersales/${id}/confirm-return`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['AfterSale'],
    }),
    retryRefund: builder.mutation<AfterSale, { id: string; version: number; idempotencyKey: string }>({
      query: ({ id, version, idempotencyKey }) => ({
        url: `/admin/aftersales/${id}/retry-refund`,
        method: 'POST',
        body: { version },
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['AfterSale'],
    }),
    readMedia: builder.mutation<MediaReadGrant, string>({
      query: (id) => ({ url: `/media/${id}/read-grant`, method: 'POST' }),
    }),
    getUsers: builder.query<PageResult<AdminUser>, { page?: number; pageSize?: number; nickname?: string; status?: string; hasMembership?: boolean } | void>({
      query: (params) => ({ url: '/admin/users', params: cleanParams(params ?? {}) }),
      providesTags: ['User'],
    }),
    getUser: builder.query<AdminUser, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    banUser: builder.mutation<AdminUser, { id: string; reason: string; until: string | null; version: number; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['User'],
    }),
    unbanUser: builder.mutation<AdminUser, { id: string; reason: string; version: number; idempotencyKey: string }>({
      query: ({ id, idempotencyKey, ...body }) => ({
        url: `/admin/users/${id}/unban`,
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['User'],
    }),
    getPlans: builder.query<PageResult<MembershipPlan>, { page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: '/admin/membership-plans', params: cleanParams(params ?? {}) }),
      providesTags: ['Plan'],
    }),
    createPlan: builder.mutation<MembershipPlan, Record<string, unknown>>({
      query: (body) => ({ url: '/admin/membership-plans', method: 'POST', body }),
      invalidatesTags: ['Plan'],
    }),
    patchPlan: builder.mutation<MembershipPlan, { id: string; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({ url: `/admin/membership-plans/${id}`, method: 'PATCH', body }),
      invalidatesTags: ['Plan'],
    }),
    getNotificationTasks: builder.query<PageResult<NotificationTask>, { page?: number; pageSize?: number } | void>({
      query: (params) => ({ url: '/admin/notification-tasks', params: cleanParams(params ?? {}) }),
      providesTags: ['Notice'],
    }),
    createNotificationTask: builder.mutation<NotificationTask, { body: Record<string, unknown>; idempotencyKey: string }>({
      query: ({ body, idempotencyKey }) => ({
        url: '/admin/notification-tasks',
        method: 'POST',
        body,
        headers: idempotent(idempotencyKey),
      }),
      invalidatesTags: ['Notice'],
    }),
    getAuditLogs: builder.query<PageResult<AuditLog>, { page?: number; pageSize?: number; action?: string } | void>({
      query: (params) => ({ url: '/admin/audit-logs', params: cleanParams(params ?? {}) }),
      providesTags: ['Audit'],
    }),
    createUpload: builder.mutation<UploadTicket, { purpose: string; fileName: string; mimeType: string; sizeBytes: number }>({
      query: (body) => ({ url: '/uploads', method: 'POST', body }),
    }),
    completeUpload: builder.mutation<MediaSummary, string>({
      query: (id) => ({ url: `/uploads/${id}/complete`, method: 'POST' }),
    }),
    getMedia: builder.query<MediaSummary, string>({
      query: (id) => `/media/${id}`,
    }),
  }),
})

interface ShipmentPatchResult {
  id: string
  version: number
}

export const {
  useLoginMutation,
  useLogoutMutation,
  useLazyGetMeQuery,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  usePatchCategoryMutation,
  useDeleteCategoryMutation,
  useGetContentsQuery,
  useGetContentQuery,
  useCreateContentMutation,
  usePatchContentMutation,
  useDeleteContentMutation,
  usePublishContentMutation,
  useUnpublishContentMutation,
  useGetContentBodyQuery,
  usePutContentBodyMutation,
  useGetChaptersQuery,
  useCreateChapterMutation,
  usePatchChapterMutation,
  useDeleteChapterMutation,
  useGetChapterBodyQuery,
  usePutChapterBodyMutation,
  usePublishChapterMutation,
  useUnpublishChapterMutation,
  useGetColumnsQuery,
  useCreateColumnMutation,
  usePatchColumnMutation,
  useDeleteColumnMutation,
  usePublishColumnMutation,
  useUnpublishColumnMutation,
  useGetColumnContentsQuery,
  usePutColumnContentMutation,
  useDeleteColumnContentMutation,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  usePatchProductMutation,
  useDeleteProductMutation,
  usePublishProductMutation,
  useUnpublishProductMutation,
  useGetSkusQuery,
  useCreateSkuMutation,
  usePatchSkuMutation,
  useDeleteSkuMutation,
  useAdjustStockMutation,
  useGetStockAdjustmentsQuery,
  useGetOrdersQuery,
  useGetOrderQuery,
  useGetLogisticsQuery,
  useShipOrderMutation,
  usePatchShipmentMutation,
  useGetAfterSalesQuery,
  useGetAfterSaleQuery,
  useReviewAfterSaleMutation,
  useConfirmReturnMutation,
  useRetryRefundMutation,
  useReadMediaMutation,
  useGetUsersQuery,
  useGetUserQuery,
  useBanUserMutation,
  useUnbanUserMutation,
  useGetPlansQuery,
  useCreatePlanMutation,
  usePatchPlanMutation,
  useGetNotificationTasksQuery,
  useCreateNotificationTaskMutation,
  useGetAuditLogsQuery,
} = api
