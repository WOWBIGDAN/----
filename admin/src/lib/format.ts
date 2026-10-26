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

export function yuanToCents(yuan: number) {
  return Math.round(yuan * 100)
}

export function formatTime(value?: string | null) {
  if (!value) return '—'
  return dayjs(value).tz('Asia/Shanghai').format('YYYY-MM-DD HH:mm')
}
