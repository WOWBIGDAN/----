import { useEffect } from 'react'

export function useTitle(title: string) {
  useEffect(() => {
    document.title = `${title} · 纯爱健康`
    return () => {
      document.title = '纯爱健康'
    }
  }, [title])
}
