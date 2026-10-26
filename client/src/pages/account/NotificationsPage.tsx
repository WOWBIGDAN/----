import { Button, List, Select, Space, Tag } from 'antd'
import { useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  useDeleteNotificationMutation,
  useGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '../../api/api'
import { PageState } from '../../components/PageState'
import { Pager } from '../../components/Pager'
import { formatTime } from '../../lib/format'
import { labelOf, notificationCategoryLabel } from '../../lib/labels'
import { notificationPath } from '../../lib/contentPath'
import { useTitle } from '../../lib/useTitle'

export function NotificationsPage() {
  useTitle('消息')
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const page = Number(params.get('page') || '1')
  const category = params.get('category') || undefined
  const before = useRef(new Date().toISOString())
  const list = useGetNotificationsQuery({ page, pageSize: 20, category })
  const [markRead] = useMarkNotificationReadMutation()
  const [markAll, markAllState] = useMarkAllNotificationsReadMutation()
  const [remove] = useDeleteNotificationMutation()

  const open = async (id: string, type: string, resourceId: string | null, read: boolean) => {
    if (!read) await markRead(id).unwrap().catch(() => undefined)
    const path = notificationPath(type, resourceId)
    if (path) navigate(path)
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>消息</h2>
        <Button loading={markAllState.isLoading} onClick={() => void markAll(before.current)}>
          全部已读
        </Button>
      </Space>
      <Select
        allowClear
        placeholder="类别"
        style={{ width: 160, marginBottom: 16 }}
        value={category}
        options={Object.entries(notificationCategoryLabel).map(([value, label]) => ({ value, label }))}
        onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('category', value)
          else next.delete('category')
          next.delete('page')
          setParams(next)
        }}
      />
      <PageState isLoading={list.isLoading} error={list.error} isEmpty={!list.data?.items.length} emptyText="暂无消息">
        <List
          dataSource={list.data?.items ?? []}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button key="open" type="link" onClick={() => void open(item.id, item.target.type, item.target.resourceId, Boolean(item.readAt))}>
                  查看
                </Button>,
                <Button key="delete" type="link" danger onClick={() => void remove(item.id)}>
                  删除
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    {!item.readAt ? <Tag color="red">未读</Tag> : null}
                    <Tag>{labelOf(notificationCategoryLabel, item.category)}</Tag>
                    {item.title}
                  </Space>
                }
                description={
                  <>
                    <div>{item.body}</div>
                    <div>{formatTime(item.createdAt)}</div>
                  </>
                }
              />
            </List.Item>
          )}
        />
        <Pager
          page={page}
          pageSize={20}
          total={list.data?.total ?? 0}
          onChange={(next) => {
            const draft = new URLSearchParams(params)
            draft.set('page', String(next))
            setParams(draft)
          }}
        />
      </PageState>
    </div>
  )
}
