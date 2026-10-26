import { useEffect } from 'react'
import { useLazyGetMeQuery } from '../api/api'
import { refreshAccessToken } from '../api/baseQuery'
import { markHydrated } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function SessionHydrator() {
  const dispatch = useAppDispatch()
  const hydrated = useAppSelector((state) => state.auth.hydrated)
  const accessToken = useAppSelector((state) => state.auth.accessToken)
  const refreshToken = useAppSelector((state) => state.auth.refreshToken)
  const [getMe] = useLazyGetMeQuery()

  useEffect(() => {
    if (hydrated) return
    let cancelled = false
    const run = async () => {
      try {
        if (!accessToken && refreshToken) await refreshAccessToken(dispatch, refreshToken)
        if (accessToken || refreshToken) await getMe().unwrap()
      } catch {
        /* 无效管理员令牌由 baseQuery 清理 */
      } finally {
        if (!cancelled) dispatch(markHydrated())
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [accessToken, dispatch, getMe, hydrated, refreshToken])

  return null
}
