import { Button, Form, Input, List, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useChangePasswordMutation, useDeleteSessionMutation, useGetSessionsQuery } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { PageState } from '../../components/PageState'
import { resetSessionCache } from '../../api/authEvents'
import { applyFieldErrors, getErrorMessage } from '../../lib/errors'
import { formatTime } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'
import { clearAuth } from '../../store/authSlice'
import { useAppDispatch } from '../../store/hooks'
import { useState } from 'react'

export function SecurityPage() {
  useTitle('账号安全')
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const sessions = useGetSessionsQuery({ page: 1, pageSize: 20 })
  const [changePassword, passwordState] = useChangePasswordMutation()
  const [deleteSession] = useDeleteSessionMutation()
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm<{ currentPassword: string; newPassword: string }>()

  return (
    <div>
      <h2>账号安全</h2>
      <Typography.Paragraph>修改密码后，所有设备都需要重新登录。</Typography.Paragraph>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 420 }}
        onFinish={async (values) => {
          setError(null)
          try {
            await changePassword(values).unwrap()
            dispatch(clearAuth('密码已更新，请重新登录'))
            resetSessionCache()
            navigate('/login', { replace: true })
          } catch (passwordError) {
            applyFieldErrors(form, passwordError)
            setError(passwordError)
          }
        }}
      >
        <Form.Item name="currentPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
          <Input.Password />
        </Form.Item>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 10, max: 72, message: '新密码长度为 10 到 72 位' }]}>
          <Input.Password />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={passwordState.isLoading}>
          修改密码
        </Button>
      </Form>
      {error ? <div style={{ marginTop: 12 }}><ErrorAlert error={error} /></div> : null}
      <Typography.Title level={4}>登录设备</Typography.Title>
      <PageState isLoading={sessions.isLoading} error={sessions.error} isEmpty={!sessions.data?.items.length} emptyText="暂无会话">
        <List
          dataSource={sessions.data?.items ?? []}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button
                  key="revoke"
                  danger
                  disabled={false}
                  onClick={() => {
                    void deleteSession(item.id)
                      .unwrap()
                      .then(() => {
                        if (item.isCurrent) {
                          dispatch(clearAuth('当前设备已退出'))
                          resetSessionCache()
                          navigate('/login', { replace: true })
                        }
                      })
                      .catch((sessionError: unknown) => setError(sessionError))
                  }}
                >
                  {item.isCurrent ? '退出此设备' : '撤销'}
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={`${item.deviceLabel}${item.isCurrent ? '（当前设备）' : ''}`}
                description={`最近活跃 ${formatTime(item.lastActiveAt)} · 创建于 ${formatTime(item.createdAt)}`}
              />
            </List.Item>
          )}
        />
      </PageState>
      {error ? <Typography.Text type="danger">{getErrorMessage(error)}</Typography.Text> : null}
    </div>
  )
}
