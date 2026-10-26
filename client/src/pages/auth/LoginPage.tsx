import { Button, Card, Form, Input, Typography } from 'antd'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useLoginMutation } from '../../api/api'
import { applyFieldErrors, getErrorMessage } from '../../lib/errors'
import { toE164 } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'
import { useAppSelector } from '../../store/hooks'

interface LoginValues {
  phone: string
  password: string
}

export function LoginPage() {
  useTitle('登录')
  const navigate = useNavigate()
  const location = useLocation()
  const token = useAppSelector((state) => state.auth.accessToken)
  const [form] = Form.useForm<LoginValues>()
  const [login, state] = useLoginMutation()
  const from = (location.state as { from?: string } | null)?.from || '/account'

  if (token) return <Navigate to={from} replace />

  const onFinish = async (values: LoginValues) => {
    try {
      await login({ phone: toE164(values.phone), password: values.password }).unwrap()
      navigate(from, { replace: true })
    } catch (error) {
      applyFieldErrors(form, error)
      form.setFields([{ name: 'password', errors: [getErrorMessage(error)] }])
    }
  }

  return (
    <div className="auth-wrap">
      <Card title="登录纯爱健康" style={{ width: 420 }}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}>
            <Input maxLength={11} placeholder="请输入手机号" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, max: 72, message: '请输入密码' }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={state.isLoading}>
            登录
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          还没有账号？ <Link to="/register">注册</Link>
        </Typography.Paragraph>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          短信登录和忘记密码暂未开放。登录后可在账号安全中修改密码。
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
