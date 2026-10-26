import { api } from '../api/api'
import type { AppDispatch } from '../store'

export async function uploadAdminMedia(dispatch: AppDispatch, file: File, purpose: string) {
  const ticket = await dispatch(
    api.endpoints.createUpload.initiate({
      purpose,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
    }),
  ).unwrap()
  const headers = new Headers()
  Object.entries(ticket.headers).forEach(([key, value]) => headers.set(key, String(value)))
  const uploaded = await fetch(ticket.uploadUrl, { method: ticket.method, headers, body: file })
  if (!uploaded.ok) throw new Error('上传文件失败')
  await dispatch(api.endpoints.completeUpload.initiate(ticket.uploadId)).unwrap()
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const query = dispatch(api.endpoints.getMedia.initiate(ticket.mediaId, { forceRefetch: true }))
    try {
      const media = await query.unwrap()
      if (media.status === 'READY') return media.id
      if (media.status === 'FAILED') throw new Error('素材处理失败')
    } finally {
      query.unsubscribe()
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  throw new Error('素材仍在处理，请稍后重试')
}
