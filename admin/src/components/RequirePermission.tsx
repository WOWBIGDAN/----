import type { ReactNode } from 'react'
import { hasAllPermissions } from '../lib/access'
import { useAppSelector } from '../store/hooks'
import { ForbiddenPage } from './ForbiddenPage'

export function RequirePermission({ permission, children }: { permission: string | string[]; children: ReactNode }) {
  const admin = useAppSelector((state) => state.auth.admin)
  const required = Array.isArray(permission) ? permission : [permission]
  if (!hasAllPermissions(admin?.permissions ?? [], required)) return <ForbiddenPage />
  return children
}
