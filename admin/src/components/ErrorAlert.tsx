import { Alert } from 'antd'
import { getErrorCode, getErrorMessage } from '../lib/errors'

export function ErrorAlert({ error }: { error: unknown }) {
  if (!error) return null
  const code = getErrorCode(error)
  const showCode = code && code !== 'UNKNOWN' && code !== 'NETWORK'
  return <Alert type="error" showIcon style={{ marginBottom: 16 }} message={getErrorMessage(error)} description={showCode ? code : undefined} />
}
