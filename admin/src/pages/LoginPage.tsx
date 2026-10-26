import { Button, Card, Form, Input, Typography } from 'antd'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../api/api'
import { applyFieldErrors, getErrorMessage } from '../lib/errors'
import { useAppSelector } from '../store/hooks'

export function LoginPage() {
  const token = useAppSelector((state) => state.auth.accessToken)
  const location = useLocation()
  const navigate = useNavigate()
  const [form] = Form.useForm<{ username: string; password: string }>()
  const [login, state] = useLoginMutation()
  const from = (location.state as { from?: string } | null)?.from || '/dashboard'
  if (token) return <Navigate to={from} replace />

  return (
    <div className="login-wrap">
      <Card style={{ width: 420 }}>
        <Typography.Title level={3} style={{ marginTop: 0 }}>管理员登录</Typography.Title>
        <Typography.Paragraph type="secondary">
          此入口仅供管理人员使用用户名和密码登录。这里不是用户注册，也不接受手机号登录。
        </Typography.Paragraph>
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              await login(values).unwrap()
              navigate(from, { replace: true })
            } catch (error) {
              applyFieldErrors(form, error)
              form.setFields([{ name: 'password', errors: [getErrorMessage(error)] }])
            }
          }}
        >
          <Form.Item name="username" label="管理员账号" rules={[{ required: true, max: 64, message: '请输入管理员账号' }]}>
            <Input autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, max: 72, message: '请输入密码' }]}>
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={state.isLoading}>
            进入管理后台
          </Button>
        </Form>
      </Card>
    </div>
  )
}
