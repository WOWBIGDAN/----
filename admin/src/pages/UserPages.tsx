import { Button, Form, Input, Select, Space, Switch, Table, Tag } from 'antd'
import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { useBanUserMutation, useGetUserQuery, useGetUsersQuery, useUnbanUserMutation } from '../api/api'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatTime } from '../lib/format'
import { getOrCreateIdempotencyKey } from '../lib/idempotency'
import { labelOf, userStatusLabel } from '../lib/labels'
import { useAppSelector } from '../store/hooks'

export function UserListPage() {
  const [params, setParams] = useSearchParams()
  const nickname = params.get('nickname') || undefined
  const status = params.get('status') || undefined
  const membership = params.get('member')
  const query = useGetUsersQuery({
    page: 1,
    pageSize: 20,
    nickname,
    status,
    hasMembership: membership === 'true' ? true : membership === 'false' ? false : undefined,
  })
  return (
    <div>
      <h2>用户</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="昵称" defaultValue={nickname} onSearch={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('nickname', value)
          else next.delete('nickname')
          setParams(next)
        }} />
        <Select allowClear placeholder="状态" style={{ width: 120 }} value={status} options={Object.entries(userStatusLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('status', value)
          else next.delete('status')
          setParams(next)
        }} />
        <Select allowClear placeholder="会员" style={{ width: 120 }} value={membership || undefined} options={[{ value: 'true', label: '有效会员' }, { value: 'false', label: '非会员' }]} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('member', value)
          else next.delete('member')
          setParams(next)
        }} />
      </Space>
      <ErrorAlert error={query.error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={false} columns={[
        { title: '昵称', dataIndex: 'nickname', render: (value: string, row) => <Link to={`/users/${row.id}`}>{value}</Link> },
        { title: '手机', dataIndex: 'phoneMasked' },
        { title: '状态', dataIndex: 'status', render: (value: string) => <Tag>{labelOf(userStatusLabel, value)}</Tag> },
        { title: '会员', render: (_v, row) => (row.membership.active ? `至 ${formatTime(row.membership.expiresAt)}` : '否') },
        { title: '注册', dataIndex: 'createdAt', render: (value: string) => formatTime(value) },
      ]} />
    </div>
  )
}

export function UserDetailPage() {
  const { id = '' } = useParams()
  const user = useGetUserQuery(id)
  const canBan = useAppSelector((state) => state.auth.admin?.permissions.includes('users:ban') ?? false)
  const [ban] = useBanUserMutation()
  const [unban] = useUnbanUserMutation()
  const [reason, setReason] = useState('')
  const [permanent, setPermanent] = useState(true)
  const [error, setError] = useState<unknown>(null)
  const detail = user.data
  return (
    <div>
      <h2>用户详情</h2>
      <ErrorAlert error={user.error || error} />
      {detail ? (
        <>
          <p>{detail.nickname} · {detail.phoneMasked} · {labelOf(userStatusLabel, detail.status)}</p>
          <p>会员 {detail.membership.active ? `有效至 ${formatTime(detail.membership.expiresAt)}，权益 ${detail.membership.benefitCodes.join('、') || '无'}` : '未开通'}</p>
          <p>最近登录 {formatTime(detail.lastLoginAt)} · 注册 {formatTime(detail.createdAt)}</p>
          {detail.banReason ? <p>封禁原因 {detail.banReason} · 至 {detail.bannedUntil ? formatTime(detail.bannedUntil) : '永久'}</p> : null}
          {canBan ? (
            <Form layout="vertical" style={{ maxWidth: 420 }}>
              <Form.Item label="原因"><Input.TextArea value={reason} onChange={(event) => setReason(event.target.value)} /></Form.Item>
              <Form.Item label="永久封禁"><Switch checked={permanent} onChange={setPermanent} /></Form.Item>
              <Space>
                <Button danger disabled={!reason.trim()} onClick={() => void ban({
                  id,
                  reason,
                  until: permanent ? null : new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
                  version: detail.version,
                  idempotencyKey: getOrCreateIdempotencyKey(`ban:${id}:${detail.version}:${reason}`),
                }).unwrap().catch(setError)}>封禁</Button>
                <Button disabled={!reason.trim()} onClick={() => void unban({
                  id,
                  reason,
                  version: detail.version,
                  idempotencyKey: getOrCreateIdempotencyKey(`unban:${id}:${detail.version}:${reason}`),
                }).unwrap().catch(setError)}>解封</Button>
              </Space>
            </Form>
          ) : <p>当前账号不能封禁或解封用户。</p>}
        </>
      ) : null}
    </div>
  )
}
