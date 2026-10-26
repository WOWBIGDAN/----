import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import type { ReactNode } from 'react'
import { useAppSelector } from '../store/hooks'
import { SessionHydrator } from './SessionHydrator'

export function RequireAdmin({ children }: { children: ReactNode }) {
  const hydrated = useAppSelector((state) => state.auth.hydrated)
  const token = useAppSelector((state) => state.auth.accessToken)
  const location = useLocation()
  return (
    <>
      <SessionHydrator />
      {!hydrated ? (
        <div className="page-spin"><Spin size="large" /></div>
      ) : !token ? (
        <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
      ) : (
        children
      )}
    </>
  )
}
