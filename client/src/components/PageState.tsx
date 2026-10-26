import { Empty, Spin } from 'antd'
import type { ReactNode } from 'react'
import { ErrorAlert } from './ErrorAlert'

export function PageState({
  isLoading,
  error,
  isEmpty,
  emptyText,
  children,
}: {
  isLoading?: boolean
  error?: unknown
  isEmpty?: boolean
  emptyText?: string
  children: ReactNode
}) {
  if (isLoading) {
    return (
      <div className="page-center">
        <Spin size="large" />
      </div>
    )
  }
  if (error) return <ErrorAlert error={error} />
  if (isEmpty) return <Empty description={emptyText ?? '暂无数据'} />
  return children
}
