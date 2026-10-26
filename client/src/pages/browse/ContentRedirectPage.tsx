import { Spin } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLazyGetArticleQuery, useLazyGetVideoQuery } from '../../api/api'
import { ErrorAlert } from '../../components/ErrorAlert'
import { contentPath } from '../../lib/contentPath'
import { getErrorCode } from '../../lib/errors'

export function ContentRedirectPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [getVideo] = useLazyGetVideoQuery()
  const [getArticle] = useLazyGetArticleQuery()
  const [error, setError] = useState<unknown>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const video = await getVideo(id).unwrap()
        if (!cancelled) navigate(contentPath(video.kind, video.id), { replace: true })
      } catch (videoError) {
        if (getErrorCode(videoError) !== 'RESOURCE_NOT_FOUND') {
          if (!cancelled) setError(videoError)
          return
        }
        try {
          const article = await getArticle(id).unwrap()
          if (!cancelled) navigate(contentPath(article.kind, article.id), { replace: true })
        } catch (articleError) {
          if (!cancelled) setError(articleError)
        }
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [getArticle, getVideo, id, navigate])

  return <div className="page">{error ? <ErrorAlert error={error} /> : <Spin />}</div>
}
