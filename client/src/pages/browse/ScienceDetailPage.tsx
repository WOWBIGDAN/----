import { Card, Space, Tag, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { useGetArticleBodyQuery, useGetArticleQuery, useGetColumnQuery, useGetVideoPlaybackQuery, useGetVideoQuery } from '../../api/api'
import { AccessPanel } from '../../components/AccessPanel'
import { HtmlContent } from '../../components/HtmlContent'
import { PageState } from '../../components/PageState'
import { VideoPlayer } from '../../components/VideoPlayer'
import { formatTime } from '../../lib/format'
import { useTitle } from '../../lib/useTitle'

function ColumnLink({ id }: { id: string }) {
  const query = useGetColumnQuery(id)
  return <Link to={`/columns/${id}`}>{query.data?.name ?? '专栏'}</Link>
}

export function ScienceDetailPage({ media }: { media: 'video' | 'article' }) {
  const { id = '' } = useParams()
  const video = useGetVideoQuery(id, { skip: media !== 'video' })
  const article = useGetArticleQuery(id, { skip: media !== 'article' })
  const detail = media === 'video' ? video : article
  const playback = useGetVideoPlaybackQuery(id, { skip: media !== 'video' || !detail.data?.access.canAccess })
  const body = useGetArticleBodyQuery(id, { skip: media !== 'article' || !detail.data?.access.canAccess })
  useTitle(detail.data?.title ?? '科普')

  return (
    <div className="page">
      <PageState isLoading={detail.isLoading} error={detail.error}>
        {detail.data ? (
          <Card>
            <Space wrap>
              <Tag>{detail.data.category.name}</Tag>
              {detail.data.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>
            <Typography.Title level={2}>{detail.data.title}</Typography.Title>
            <Typography.Paragraph type="secondary">
              {detail.data.authorName} · {formatTime(detail.data.publishedAt)}
            </Typography.Paragraph>
            <Typography.Paragraph>{detail.data.summary}</Typography.Paragraph>
            {detail.data.columnIds.length ? (
              <Space wrap style={{ marginBottom: 16 }}>
                {detail.data.columnIds.map((columnId) => (
                  <ColumnLink key={columnId} id={columnId} />
                ))}
              </Space>
            ) : null}
            {detail.data.descriptionHtml ? <HtmlContent html={detail.data.descriptionHtml} /> : null}
            <AccessPanel access={detail.data.access} policy={detail.data.accessPolicy} priceCents={detail.data.priceCents} />
            {media === 'video' && detail.data.access.canAccess ? (
              <PageState isLoading={playback.isLoading} error={playback.error}>
                {playback.data ? <VideoPlayer url={playback.data.playbackUrl} /> : null}
              </PageState>
            ) : null}
            {media === 'article' && detail.data.access.canAccess ? (
              <PageState isLoading={body.isLoading} error={body.error}>
                {body.data ? <HtmlContent html={body.data.bodyHtml} /> : null}
              </PageState>
            ) : null}
          </Card>
        ) : null}
      </PageState>
    </div>
  )
}
