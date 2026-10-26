import { useState } from 'react'
import { Button, Typography } from 'antd'
import { uploadAdminMedia } from '../lib/upload'
import { getErrorMessage } from '../lib/errors'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function MediaUpload({
  purpose,
  onUploaded,
}: {
  purpose: string
  onUploaded: (id: string) => void
}) {
  const dispatch = useAppDispatch()
  const canUpload = useAppSelector((state) => state.auth.admin?.permissions.includes('media:write') ?? false)
  const [loading, setLoading] = useState(false)
  const [hint, setHint] = useState('')
  return (
    <div>
      <Button
        disabled={!canUpload}
        loading={loading}
        onClick={() => {
          const input = document.createElement('input')
          input.type = 'file'
          input.accept = purpose.includes('VIDEO') ? 'video/mp4' : 'image/jpeg,image/png,image/webp'
          input.onchange = () => {
            const file = input.files?.[0]
            if (!file) return
            setLoading(true)
            setHint('')
            void uploadAdminMedia(dispatch, file, purpose)
              .then((id) => {
                onUploaded(id)
                setHint(`已就绪 ${id}`)
              })
              .catch((error: unknown) => setHint(getErrorMessage(error)))
              .finally(() => setLoading(false))
          }
          input.click()
        }}
      >
        {canUpload ? '上传素材' : '缺少素材上传权限'}
      </Button>
      {hint ? <Typography.Paragraph type="secondary">{hint}</Typography.Paragraph> : null}
    </div>
  )
}
