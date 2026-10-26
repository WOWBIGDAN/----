import { Button, Card, Form, Input, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useState } from 'react'
import { useGetAiQuotaQuery, usePatchMeMutation } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { getErrorMessage } from '../../lib/errors'
import { formatTime } from '../../lib/format'
import { benefitLabel, labelOf } from '../../lib/labels'
import { uploadUserImage } from '../../lib/upload'
import { useTitle } from '../../lib/useTitle'
import { useAppDispatch, useAppSelector } from '../../store/hooks'

export function OverviewPage() {
  useTitle('用户中心')
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)
  const quota = useGetAiQuotaQuery()
  const [patchMe, state] = usePatchMeMutation()
  const [error, setError] = useState<unknown>(null)
  const [avatarError, setAvatarError] = useState<string>()

  const upload: UploadProps['customRequest'] = async (options) => {
    try {
      const file = options.file as File
      const mediaId = await uploadUserImage(dispatch, file, 'AVATAR')
      await patchMe({ avatarMediaId: mediaId }).unwrap()
      options.onSuccess?.({})
    } catch (uploadError) {
      const message = getErrorMessage(uploadError)
      setAvatarError(message)
      options.onError?.(new Error(message))
    }
  }

  return (
    <Card title="个人概览">
      <Typography.Paragraph>手机号 {user?.phoneMasked ?? '—'}</Typography.Paragraph>
      <Typography.Paragraph>
        会员：{user?.membership.active ? `有效至 ${formatTime(user.membership.expiresAt)}` : '未开通'}
        {user?.membership.benefitCodes.length
          ? ` · ${user.membership.benefitCodes.map((code) => labelOf(benefitLabel, code)).join('、')}`
          : ''}
      </Typography.Paragraph>
      <Typography.Paragraph>
        今日问答剩余 {quota.data ? `${quota.data.remaining} / ${quota.data.limit}` : quota.isError ? '额度暂不可用' : '加载中'}
      </Typography.Paragraph>
      <Upload accept="image/jpeg,image/png,image/webp" showUploadList={false} customRequest={upload}>
        <Button>更换头像</Button>
      </Upload>
      {avatarError ? <Typography.Paragraph type="danger">{avatarError}</Typography.Paragraph> : null}
      <Form
        style={{ marginTop: 16, maxWidth: 360 }}
        layout="vertical"
        initialValues={{ nickname: user?.nickname }}
        onFinish={async (values: { nickname: string }) => {
          setError(null)
          try {
            await patchMe({ nickname: values.nickname.trim() }).unwrap()
          } catch (patchError) {
            setError(patchError)
          }
        }}
      >
        <Form.Item name="nickname" label="昵称" rules={[{ required: true, max: 32, message: '请填写 1 到 32 字昵称' }]}>
          <Input />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={state.isLoading}>
          保存资料
        </Button>
      </Form>
      {error ? <div style={{ marginTop: 12 }}><ErrorAlert error={error} /></div> : null}
    </Card>
  )
}
