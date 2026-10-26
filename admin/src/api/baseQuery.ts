import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import { API_BASE } from './config'
import { resetSessionCache } from './authEvents'
import { clearAuth, setCredentials } from '../store/authSlice'
import type { AdminAuthTokens, AppError } from './types'

type AuthSliceState = { auth: { accessToken: string | null; refreshToken: string | null } }

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, api) => {
    const arg = api.arg as string | FetchArgs
    const url = typeof arg === 'string' ? arg : arg.url
    const skipAuth = url.startsWith('/admin/auth/login') || url.startsWith('/admin/auth/refresh')
    const token = (api.getState() as AuthSliceState).auth.accessToken
    if (token && !skipAuth && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (!headers.has('X-Request-ID')) headers.set('X-Request-ID', crypto.randomUUID())
    return headers
  },
})

let refreshing: Promise<AdminAuthTokens | null> | null = null

async function refreshTokens(refreshToken: string): Promise<AdminAuthTokens> {
  const response = await fetch(`${API_BASE}/admin/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Request-ID': crypto.randomUUID() },
    body: JSON.stringify({ refreshToken }),
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok || !(body as { data?: AdminAuthTokens } | null)?.data?.accessToken) {
    const error = new Error('refresh failed') as Error & { body: unknown }
    error.body = body
    throw error
  }
  return (body as { data: AdminAuthTokens }).data
}

export function refreshAccessToken(dispatch: (action: unknown) => void, refreshToken: string) {
  if (!refreshing) {
    refreshing = refreshTokens(refreshToken)
      .then((tokens) => {
        dispatch(setCredentials(tokens))
        return tokens
      })
      .catch(() => {
        dispatch(clearAuth('管理员登录已失效，请重新登录'))
        resetSessionCache()
        return null
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing.then((tokens) => tokens?.accessToken ?? null)
}

function normalizeError(error: FetchBaseQueryError, meta?: { response?: Response }): AppError {
  const data = error.data
  if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
    const body = data as {
      code: string
      message: string
      requestId?: string
      error?: { details?: AppError['data']['details'] }
    }
    const retry = meta?.response?.headers?.get('Retry-After')
    return {
      status: typeof error.status === 'number' ? error.status : 0,
      data: {
        code: body.code,
        message: body.message,
        details: body.error?.details ?? [],
        requestId: body.requestId,
        retryAfter: retry && Number.isFinite(Number(retry)) ? Number(retry) : undefined,
      },
    }
  }
  if (error.status === 'FETCH_ERROR') {
    return { status: 'FETCH_ERROR', data: { code: 'NETWORK', message: '网络异常，请稍后重试', details: [] } }
  }
  const status = typeof error.status === 'number' ? error.status : 0
  return {
    status,
    data: {
      code: status === 404 ? 'RESOURCE_NOT_FOUND' : 'UNKNOWN',
      message: status === 404 ? '接口尚未提供或资源不存在' : '服务暂时不可用',
      details: [],
    },
  }
}

function unwrapData(payload: unknown) {
  if (payload && typeof payload === 'object' && 'code' in payload && 'data' in payload && (payload as { code?: unknown }).code === 'OK') {
    return (payload as { data: unknown }).data
  }
  return payload
}

const sessionEnding = new Set(['TOKEN_INVALID', 'REFRESH_TOKEN_INVALID', 'REFRESH_TOKEN_REUSED', 'ADMIN_REQUIRED', 'AUTH_REQUIRED'])

async function execute(
  args: string | FetchArgs,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
  retried: boolean,
): Promise<{ data: unknown } | { error: AppError }> {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (!result.error) return { data: unwrapData(result.data) }
  const failure = normalizeError(result.error, result.meta as { response?: Response } | undefined)
  const code = failure.data.code
  if (code === 'TOKEN_EXPIRED' && !retried) {
    const refreshToken = (api.getState() as AuthSliceState).auth.refreshToken
    if (!refreshToken) {
      api.dispatch(clearAuth('管理员登录已过期，请重新登录'))
      resetSessionCache()
      return { error: failure }
    }
    const next = await refreshAccessToken(api.dispatch, refreshToken)
    if (!next) return { error: failure }
    return execute(args, api, extraOptions, true)
  }
  if ((code === 'TOKEN_EXPIRED' && retried) || sessionEnding.has(code)) {
    api.dispatch(clearAuth(code === 'ADMIN_REQUIRED' ? '当前身份不是管理员，已退出管理后台' : '管理员登录已失效，请重新登录'))
    resetSessionCache()
  }
  return { error: failure }
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, AppError> = (args, api, extraOptions) =>
  execute(args, api, extraOptions, false)
