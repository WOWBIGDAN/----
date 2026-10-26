import { Button, Card, Space, Typography } from 'antd'
import { Link, useParams } from 'react-router-dom'
import { useGetArticleQuery, useGetChapterBodyQuery, useGetChapterPlaybackQuery, useGetChaptersQuery, useGetVideoQuery } from '../../api/api'
import { AccessPanel } from '../../components/AccessPanel'
import { HtmlContent } from '../../components/HtmlContent'
import { PageState } from '../../components/PageState'
import { VideoPlayer } from '../../components/VideoPlayer'
import { getErrorCode } from '../../lib/errors'
import { useTitle } from '../../lib/useTitle'

export function ChapterPage() {
  const { courseId = '', chapterId = '' } = useParams()
  const video = useGetVideoQuery(courseId)
  const videoMissing = video.isError && getErrorCode(video.error) === 'RESOURCE_NOT_FOUND'
  const article = useGetArticleQuery(courseId, { skip: !videoMissing })
  const course = video.data ?? article.data
  const chapters = useGetChaptersQuery({ id: courseId, page: 1, pageSize: 100 })
  const chapter = chapters.data?.items.find((item) => item.id === chapterId)
  const playback = useGetChapterPlaybackQuery(chapterId, { skip: chapter?.kind !== 'VIDEO' })
  const body = useGetChapterBodyQuery(chapterId, { skip: chapter?.kind !== 'ARTICLE' })
  useTitle(chapter?.title ?? '章节')
  const denied = playback.error || body.error
  const accessDenied = getErrorCode(denied) === 'CONTENT_ACCESS_DENIED' || getErrorCode(denied) === 'AUTH_REQUIRED'

  return (
    <div className="page">
      <PageState isLoading={chapters.isLoading || video.isLoading} error={chapters.error}>
        <Card>
          <Typography.Paragraph>
            <Link to={`/courses/${courseId}`}>{course?.title ?? '返回课程'}</Link>
          </Typography.Paragraph>
          <Typography.Title level={3}>{chapter?.title ?? '章节'}</Typography.Title>
          {chapter?.kind === 'VIDEO' ? (
            <PageState isLoading={playback.isLoading} error={accessDenied ? undefined : playback.error}>
              {playback.data ? <VideoPlayer url={playback.data.playbackUrl} /> : null}
            </PageState>
          ) : null}
          {chapter?.kind === 'ARTICLE' ? (
            <PageState isLoading={body.isLoading} error={accessDenied ? undefined : body.error}>
              {body.data ? <HtmlContent html={body.data.bodyHtml} /> : null}
            </PageState>
          ) : null}
          {accessDenied && course ? (
            <AccessPanel
              access={{ canAccess: false, reason: getErrorCode(denied) === 'AUTH_REQUIRED' ? 'LOGIN_REQUIRED' : 'PURCHASE_REQUIRED' }}
              policy={course.accessPolicy}
              priceCents={course.priceCents}
              courseId={course.id}
            />
          ) : null}
          <Space style={{ marginTop: 16 }}>
            {chapters.data?.items.map((item) => (
              <Link key={item.id} to={`/courses/${courseId}/chapters/${item.id}`}>
                <Button type={item.id === chapterId ? 'primary' : 'default'}>{item.title}</Button>
              </Link>
            ))}
          </Space>
        </Card>
      </PageState>
    </div>
  )
}
