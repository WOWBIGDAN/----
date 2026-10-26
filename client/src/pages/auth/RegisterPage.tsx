import { Alert, Button, Card, Checkbox, Form, Input, Typography } from 'antd'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGetLegalQuery, useRegisterMutation } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { applyFieldErrors, getErrorCode, getErrorMessage } from '../../lib/errors'
import { toE164 } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'

interface RegisterValues {
  phone: string
  password: string
  confirm: string
  nickname?: string
  agreed: boolean
}

export function RegisterPage() {
  useTitle('注册')
  const navigate = useNavigate()
  const [form] = Form.useForm<RegisterValues>()
  const terms = useGetLegalQuery('TERMS')
  const privacy = useGetLegalQuery('PRIVACY')
  const [register, state] = useRegisterMutation()
  const [formError, setFormError] = useState<unknown>(null)
  const legalError = terms.error || privacy.error
  const legalLoading = terms.isLoading || privacy.isLoading

  const onFinish = async (values: RegisterValues) => {
    if (!terms.data || !privacy.data) return
    setFormError(null)
    try {
      await register({
        phone: toE164(values.phone),
        password: values.password,
        nickname: values.nickname?.trim() || undefined,
        termsVersion: terms.data.version,
        privacyVersion: privacy.data.version,
      }).unwrap()
      navigate('/account', { replace: true })
    } catch (error) {
      if (getErrorCode(error) === 'PROTOCOL_VERSION_CHANGED') {
        void terms.refetch()
        void privacy.refetch()
      }
      applyFieldErrors(form, error)
      setFormError(error)
    }
  }

  return (
    <div className="auth-wrap">
      <Card title="注册纯爱健康" style={{ width: 480 }}>
        {legalError ? <ErrorAlert error={legalError} /> : null}
        {formError ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="error"
            showIcon
            message={
              getErrorCode(formError) === 'PHONE_ALREADY_REGISTERED' ? (
                <span>
                  该手机号已注册，请直接 <Link to="/login">登录</Link>
                </span>
              ) : (
                getErrorMessage(formError)
              )
            }
          />
        ) : null}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="phone" label="手机号" rules={[{ required: true, pattern: /^1\d{10}$/, message: '请输入 11 位手机号' }]}>
            <Input maxLength={11} />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ max: 32, message: '昵称不超过 32 字' }]}>
            <Input placeholder="选填" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, min: 10, max: 72, message: '密码长度为 10 到 72 位' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('两次密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item name="agreed" valuePropName="checked" rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('请先阅读并同意协议'))) }]}>
            <Checkbox>
              我已阅读并同意 <Link to="/legal/TERMS" target="_blank">用户协议</Link> 和 <Link to="/legal/PRIVACY" target="_blank">隐私政策</Link>
            </Checkbox>
          </Form.Item>
          <Typography.Paragraph type="secondary">
            用户协议版本 {terms.data?.version ?? '加载中'}，隐私政策版本 {privacy.data?.version ?? '加载中'}
          </Typography.Paragraph>
          <Button type="primary" htmlType="submit" block loading={state.isLoading || legalLoading} disabled={Boolean(legalError)}>
            注册并登录
          </Button>
        </Form>
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          已有账号？ <Link to="/login">登录</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
