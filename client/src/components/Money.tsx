import { formatCents } from '../lib/format'

export function Money({ cents, freeAsText = false }: { cents: number; freeAsText?: boolean }) {
  if (freeAsText && cents === 0) return <span className="money">免费</span>
  return <span className="money">{formatCents(cents)}</span>
}
