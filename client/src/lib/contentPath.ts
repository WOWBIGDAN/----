import type { ContentKind } from '../api/types'

export function contentPath(kind: ContentKind, id: string) {
  if (kind === 'SCIENCE_VIDEO') return `/science/videos/${id}`
  if (kind === 'SCIENCE_ARTICLE') return `/science/articles/${id}`
  return `/courses/${id}`
}

export function notificationPath(type: string, resourceId?: string | null) {
  if (!resourceId || type === 'NONE') return null
  if (type === 'ORDER') return `/account/orders/${resourceId}`
  if (type === 'AFTERSALE') return `/account/aftersales/${resourceId}`
  if (type === 'CONTENT') return `/content/${resourceId}`
  if (type === 'MEMBERSHIP') return '/account/membership'
  return null
}
