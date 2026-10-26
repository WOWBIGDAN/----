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
    const finish = () => {
      if (!cancelled) dispatch(markHydrated())
    }
    const run = async () => {
      try {
        if (!accessToken && refreshToken) {
          await refreshAccessToken(dispatch, refreshToken)
        }
        if (accessToken || refreshToken) await getMe().unwrap()
      } catch {
        /* 失败时保留本地会话，后续请求会按错误码处理 */
      } finally {
        finish()
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [accessToken, dispatch, getMe, hydrated, refreshToken])

  return null
}
