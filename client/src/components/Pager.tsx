import { Pagination } from 'antd'

export function Pager({
  page,
  pageSize,
  total,
  onChange,
}: {
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}) {
  if (total <= pageSize) return null
  return (
    <Pagination
      style={{ marginTop: 24, textAlign: 'center' }}
      current={page}
      pageSize={pageSize}
      total={total}
      showSizeChanger={false}
      onChange={onChange}
    />
  )
}
