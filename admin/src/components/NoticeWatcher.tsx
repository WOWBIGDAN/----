import { useEffect } from 'react'
import { App } from 'antd'
import { clearNotice } from '../store/authSlice'
import { useAppDispatch, useAppSelector } from '../store/hooks'

export function NoticeWatcher() {
  const notice = useAppSelector((state) => state.auth.notice)
  const dispatch = useAppDispatch()
  const { message } = App.useApp()
  useEffect(() => {
    if (!notice) return
    message.warning(notice)
    dispatch(clearNotice())
  }, [dispatch, message, notice])
  return null
}
