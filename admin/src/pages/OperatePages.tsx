import { Button, Form, Input, InputNumber, Switch, Table } from 'antd'
import { useState } from 'react'
import {
  useCreateNotificationTaskMutation,
  useCreatePlanMutation,
  useGetAuditLogsQuery,
  useGetNotificationTasksQuery,
  useGetPlansQuery,
  usePatchPlanMutation,
} from '../api/api'
import type { MembershipPlan } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { formatCents, formatTime, yuanToCents } from '../lib/format'
import { getOrCreateIdempotencyKey } from '../lib/idempotency'

export function MembershipPlanPage() {
  const plans = useGetPlansQuery({ pageSize: 50 })
  const [createPlan] = useCreatePlanMutation()
  const [patchPlan] = usePatchPlanMutation()
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm<{ name: string; priceYuan: number; durationDays: number; aiDailyLimit: number; description: string }>()
  return (
    <div>
      <h2>会员方案</h2>
      <p>这里只维护可购买方案。不能直接修改某个用户的会员期限。</p>
      <ErrorAlert error={plans.error || error} />
      <Form form={form} layout="inline" onFinish={async (values) => {
        try {
          await createPlan({
            name: values.name,
            priceCents: yuanToCents(values.priceYuan),
            durationDays: values.durationDays,
            aiDailyLimit: values.aiDailyLimit,
            benefitCodes: ['MEMBER_COURSES'],
            description: values.description,
          }).unwrap()
          form.resetFields()
        } catch (submitError) {
          setError(submitError)
        }
      }}>
        <Form.Item name="name" rules={[{ required: true }]}><Input placeholder="方案名" /></Form.Item>
        <Form.Item name="priceYuan" rules={[{ required: true }]}><InputNumber min={0.01} placeholder="价格元" /></Form.Item>
        <Form.Item name="durationDays" rules={[{ required: true }]}><InputNumber min={1} placeholder="天数" /></Form.Item>
        <Form.Item name="aiDailyLimit" rules={[{ required: true }]}><InputNumber min={0} placeholder="每日问答" /></Form.Item>
        <Form.Item name="description" rules={[{ required: true }]}><Input placeholder="说明" /></Form.Item>
        <Button type="primary" htmlType="submit">新建</Button>
      </Form>
      <Table style={{ marginTop: 16 }} rowKey="id" dataSource={plans.data?.items ?? []} pagination={false} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '价格', dataIndex: 'priceCents', render: (value: number) => formatCents(value) },
        { title: '天数', dataIndex: 'durationDays' },
        { title: '问答', dataIndex: 'aiDailyLimit' },
        { title: '启用', dataIndex: 'enabled', render: (value: boolean, row: MembershipPlan) => (
          <Switch checked={value} onChange={(checked) => void patchPlan({ id: row.id, body: { enabled: checked, version: row.version } }).unwrap().catch(setError)} />
        ) },
      ]} />
    </div>
  )
}

export function NotificationPage() {
  const tasks = useGetNotificationTasksQuery({ pageSize: 20 })
  const [createTask] = useCreateNotificationTaskMutation()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [userIds, setUserIds] = useState('')
  const [error, setError] = useState<unknown>(null)
  return (
    <div>
      <h2>站内通知</h2>
      <ErrorAlert error={tasks.error || error} />
      <Form layout="vertical" style={{ maxWidth: 560 }}>
        <Form.Item label="标题"><Input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} /></Form.Item>
        <Form.Item label="正文"><Input.TextArea value={body} maxLength={2000} onChange={(event) => setBody(event.target.value)} /></Form.Item>
        <Form.Item label="用户 ID，逗号分隔；留空则发给全部活跃用户"><Input value={userIds} onChange={(event) => setUserIds(event.target.value)} /></Form.Item>
        <Button type="primary" onClick={() => {
          const ids = userIds.split(',').map((item) => item.trim()).filter(Boolean)
          const payload = ids.length
            ? { audience: 'USERS', userIds: ids, title, body, target: { type: 'NONE', resourceId: null } }
            : { audience: 'ALL_ACTIVE', title, body, target: { type: 'NONE', resourceId: null } }
          void createTask({
            body: payload,
            idempotencyKey: getOrCreateIdempotencyKey(`notice:${title}:${body}:${userIds}`),
          }).unwrap().catch(setError)
        }}>创建任务</Button>
      </Form>
      <Table style={{ marginTop: 16 }} rowKey="id" dataSource={tasks.data?.items ?? []} pagination={false} columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '状态', dataIndex: 'status' },
        { title: '接收', dataIndex: 'recipientCount' },
        { title: '成功', dataIndex: 'sentCount' },
        { title: '失败', dataIndex: 'failedCount' },
        { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatTime(value) },
      ]} />
    </div>
  )
}

export function AuditPage() {
  const logs = useGetAuditLogsQuery({ pageSize: 50 })
  return (
    <div>
      <h2>审计日志</h2>
      <ErrorAlert error={logs.error} />
      <Table rowKey="id" loading={logs.isLoading} dataSource={logs.data?.items ?? []} pagination={false} columns={[
        { title: '时间', dataIndex: 'createdAt', render: (value: string) => formatTime(value) },
        { title: '操作', dataIndex: 'action' },
        { title: '资源', render: (_v, row) => `${row.resourceType} ${row.resourceId}` },
        { title: '操作者', dataIndex: 'actorId' },
        { title: '请求编号', dataIndex: 'requestId' },
      ]} />
    </div>
  )
}
