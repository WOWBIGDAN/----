import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAppSelector } from '../store/hooks'

export function RequireAuth({ children }: { children: ReactNode }) {
  const token = useAppSelector((state) => state.auth.accessToken)
  const hydrated = useAppSelector((state) => state.auth.hydrated)
  const location = useLocation()
  if (!hydrated) return null
  if (!token) {
    const from = `${location.pathname}${location.search}`
    return <Navigate to="/login" replace state={{ from }} />
  }
  return children
}
