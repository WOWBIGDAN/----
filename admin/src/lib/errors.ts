import type { FormInstance } from 'antd'
import type { AppError } from '../api/types'

function asAppError(error: unknown): AppError | undefined {
  if (!error || typeof error !== 'object') return undefined
  const candidate = error as AppError
  if (candidate.data?.message) return candidate
  return undefined
}

export function getErrorMessage(error: unknown) {
  return asAppError(error)?.data.message || (error as { message?: string } | undefined)?.message || '请求失败'
}

export function getErrorCode(error: unknown) {
  return asAppError(error)?.data.code
}

export function applyFieldErrors(form: FormInstance, error: unknown) {
  const details = asAppError(error)?.data.details ?? []
  const fields = details
    .filter((item) => item.field && !item.field.includes('[') && !item.field.includes('.'))
    .map((item) => ({ name: item.field, errors: [item.reason] }))
  if (fields.length) form.setFields(fields)
}
