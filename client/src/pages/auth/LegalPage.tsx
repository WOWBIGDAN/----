import { useParams } from 'react-router-dom'
import { useGetLegalQuery } from '../../api/api'
import { HtmlContent } from '../../components/HtmlContent'
import { PageState } from '../../components/PageState'
import { formatTime } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'

export function LegalPage() {
  const { type } = useParams()
  const legalType = type === 'PRIVACY' ? 'PRIVACY' : 'TERMS'
  const query = useGetLegalQuery(legalType)
  useTitle(legalType === 'TERMS' ? '用户协议' : '隐私政策')

  return (
    <div className="page">
      <PageState isLoading={query.isLoading} error={query.error}>
        {query.data ? (
          <>
            <div className="page-head">
              <h1>{legalType === 'TERMS' ? '用户协议' : '隐私政策'}</h1>
              <p>
                版本 {query.data.version} · 更新于 {formatTime(query.data.updatedAt)}
              </p>
            </div>
            <HtmlContent html={query.data.contentHtml} />
          </>
        ) : null}
      </PageState>
    </div>
  )
}
