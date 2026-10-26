import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'

dayjs.extend(utc)
dayjs.extend(timezone)

export function formatCents(cents: number) {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(Math.trunc(cents))
  const yuan = Math.floor(abs / 100).toLocaleString('zh-CN')
  const fen = String(abs % 100).padStart(2, '0')
  return `${sign}¥${yuan}.${fen}`
}

export function yuanToCents(yuan: number | null | undefined) {
  if (yuan === null || yuan === undefined || Number.isNaN(yuan)) return undefined
  return Math.round(yuan * 100)
}

export function formatTime(value?: string | null) {
  if (!value) return '—'
  return dayjs(value).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm')
}

export function formatDate(value?: string | null) {
  if (!value) return '—'
  return dayjs(value).tz('Asia/Shanghai').format('YYYY-MM-DD')
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.trunc(seconds))
  const minutes = Math.floor(total / 60)
  const rest = total % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export function toE164(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('86') && digits.length === 13) return `+${digits}`
  return `+86${digits}`
}

export function formatPhone(phone: string) {
  if (phone.startsWith('+86')) return phone.slice(3)
  return phone
}

export function formatAddress(address: {
  province: string
  city: string
  district: string
  detail: string
}) {
  return `${address.province}${address.city}${address.district}${address.detail}`
}

export function skuLabel(attributes: { name: string; value: string }[]) {
  if (!attributes.length) return '默认规格'
  return attributes.map((item) => `${item.name}：${item.value}`).join(' / ')
}
