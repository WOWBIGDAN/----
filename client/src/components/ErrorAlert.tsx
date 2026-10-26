import { Alert } from 'antd'
import { getErrorCode, getErrorMessage, getRequestId } from '../lib/errors'

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null
  const requestId = getRequestId(error)
  const code = getErrorCode(error)
  const extra = [code && code !== 'UNKNOWN' && code !== 'NETWORK' ? code : '', requestId ? `请求编号 ${requestId}` : '']
    .filter(Boolean)
    .join(' · ')
  return <Alert type="error" showIcon message={getErrorMessage(error)} description={extra || undefined} />
}
