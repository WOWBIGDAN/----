import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query'
import { API_BASE } from './config'
import { resetSessionCache } from './authEvents'
import { clearAuth, setCredentials } from '../store/authSlice'
import type { AppError, AuthTokens, ErrorBody } from './types'

type AuthSliceState = {
  auth: {
    accessToken: string | null
    refreshToken: string | null
  }
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers, api) => {
    const arg = api.arg as string | FetchArgs
    const url = typeof arg === 'string' ? arg : arg.url
    const skipAuth =
      url.startsWith('/auth/login') ||
      url.startsWith('/auth/register') ||
      url.startsWith('/auth/refresh') ||
      url.startsWith('/public/')
    const token = (api.getState() as AuthSliceState).auth.accessToken
    if (token && !skipAuth && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    if (!headers.has('X-Request-ID')) {
      headers.set('X-Request-ID', crypto.randomUUID())
    }
    return headers
  },
})

let refreshing: Promise<AuthTokens | null> | null = null

function requestId() {
  return crypto.randomUUID()
}

async function refreshTokens(refreshToken: string): Promise<AuthTokens> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId(),
    },
    body: JSON.stringify({ refreshToken }),
  })
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = new Error('refresh failed')
    ;(error as Error & { body: unknown }).body = body
    throw error
  }
  const envelope = body as { data?: AuthTokens }
  if (!envelope.data?.accessToken) {
    throw new Error('refresh failed')
  }
  return envelope.data
}

export function refreshAccessToken(
  dispatch: (action: unknown) => void,
  refreshToken: string,
): Promise<string | null> {
  if (!refreshing) {
    refreshing = refreshTokens(refreshToken)
      .then((tokens) => {
        dispatch(setCredentials(tokens))
        return tokens
      })
      .catch((error: unknown) => {
        const body = (error as { body?: { code?: string; message?: string } } | undefined)?.body
        const code = body?.code
        const banned = code === 'ACCOUNT_BANNED'
        dispatch(
          clearAuth(
            banned
              ? '账号已被封禁，已退出登录。你仍可以游客身份浏览公开科普。'
              : '登录已失效，请重新登录',
          ),
        )
        resetSessionCache()
        return null
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing.then((tokens) => tokens?.accessToken ?? null)
}

function readRetryAfter(meta: { response?: Response } | undefined) {
  const header = meta?.response?.headers?.get('Retry-After')
  if (!header) return undefined
  const seconds = Number(header)
  return Number.isFinite(seconds) ? seconds : undefined
}

function normalizeError(error: FetchBaseQueryError, meta: { response?: Response } | undefined): AppError {
  const data = error.data
  if (data && typeof data === 'object' && 'code' in data && 'message' in data) {
    const body = data as {
      code: string
      message: string
      requestId?: string
      error?: { details?: ErrorBody['details'] }
    }
    return {
      status: typeof error.status === 'number' ? error.status : 0,
      data: {
        code: body.code,
        message: body.message,
        details: body.error?.details ?? [],
        requestId: body.requestId,
        retryAfter: readRetryAfter(meta),
      },
    }
  }
  if (error.status === 'FETCH_ERROR') {
    return {
      status: 'FETCH_ERROR',
      data: { code: 'NETWORK', message: '网络异常，请稍后重试', details: [] },
    }
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
  if (
    payload &&
    typeof payload === 'object' &&
    'code' in payload &&
    'data' in payload &&
    (payload as { code: unknown }).code === 'OK'
  ) {
    return (payload as { data: unknown }).data
  }
  return payload
}

async function execute(
  args: string | FetchArgs,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
  retried: boolean,
): Promise<{ data: unknown } | { error: AppError }> {
  const result = await rawBaseQuery(args, api, extraOptions)
  if (result.error) {
    const failure = normalizeError(result.error, result.meta as { response?: Response } | undefined)
    const code = failure.data.code
    if (code === 'TOKEN_EXPIRED' && !retried) {
      const refreshToken = (api.getState() as AuthSliceState).auth.refreshToken
      if (!refreshToken) {
        api.dispatch(clearAuth('登录已过期，请重新登录'))
        resetSessionCache()
        return { error: failure }
      }
      const next = await refreshAccessToken(api.dispatch, refreshToken)
      if (!next) return { error: failure }
      return execute(args, api, extraOptions, true)
    }
    if (code === 'TOKEN_EXPIRED' && retried) {
      api.dispatch(clearAuth('登录已过期，请重新登录'))
      resetSessionCache()
    }
    if (code === 'TOKEN_INVALID' || code === 'REFRESH_TOKEN_INVALID' || code === 'REFRESH_TOKEN_REUSED') {
      api.dispatch(clearAuth('登录已失效，请重新登录'))
      resetSessionCache()
    }
    if (code === 'ACCOUNT_BANNED') {
      api.dispatch(clearAuth('账号已被封禁，已退出登录。你仍可以游客身份浏览公开科普。'))
      resetSessionCache()
    }
    return { error: failure }
  }
  return { data: unwrapData(result.data) }
}

export const baseQuery: BaseQueryFn<string | FetchArgs, unknown, AppError> = (args, api, extraOptions) =>
  execute(args, api, extraOptions, false)
