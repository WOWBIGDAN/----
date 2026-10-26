import { Button, Card, List, Space, Tag, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGetArticleQuery, useGetChaptersQuery, useGetColumnQuery, useGetVideoQuery } from '../../api/api'
import { AccessPanel } from '../../components/AccessPanel'
import { ErrorAlert } from '../../components/ErrorAlert'
import { HtmlContent } from '../../components/HtmlContent'
import { Money } from '../../components/Money'
import { PageState } from '../../components/PageState'
import { getErrorCode } from '../../lib/errors'
import { formatDuration, formatTime } from '../../lib/format'
import { accessPolicyLabel, accessReasonLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

function ColumnLink({ id }: { id: string }) {
  const query = useGetColumnQuery(id)
  return <Link to={`/columns/${id}`}>{query.data?.name ?? '专栏'}</Link>
}

export function CourseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const video = useGetVideoQuery(id)
  const videoMissing = video.isError && getErrorCode(video.error) === 'RESOURCE_NOT_FOUND'
  const article = useGetArticleQuery(id, { skip: !videoMissing })
  const detail = video.data ?? article.data
  const loading = video.isLoading || (videoMissing && article.isLoading)
  const error = videoMissing ? article.error : video.error && getErrorCode(video.error) !== 'RESOURCE_NOT_FOUND' ? video.error : undefined
  const chapters = useGetChaptersQuery({ id, page: 1, pageSize: 100 }, { skip: !detail })
  useTitle(detail?.title ?? '课程')

  return (
    <div className="page">
      <PageState isLoading={loading} error={error}>
        {detail ? (
          <Card>
            <Space wrap>
              <Tag>{detail.category.name}</Tag>
              <Tag color="gold">{accessPolicyLabel[detail.accessPolicy]}</Tag>
              {detail.access.canAccess ? <Tag color="green">{accessReasonLabel[detail.access.reason]}</Tag> : null}
            </Space>
            <Typography.Title level={2}>{detail.title}</Typography.Title>
            <Typography.Paragraph type="secondary">
              {detail.authorName} · {formatTime(detail.publishedAt)} · {detail.chapterCount} 节
            </Typography.Paragraph>
            <Typography.Paragraph>
              <Money cents={detail.priceCents} freeAsText />
            </Typography.Paragraph>
            <Typography.Paragraph>{detail.summary}</Typography.Paragraph>
            {detail.columnIds.length ? (
              <Space wrap>
                {detail.columnIds.map((columnId) => (
                  <ColumnLink key={columnId} id={columnId} />
                ))}
              </Space>
            ) : null}
            {detail.descriptionHtml ? <HtmlContent html={detail.descriptionHtml} /> : null}
            <AccessPanel access={detail.access} policy={detail.accessPolicy} priceCents={detail.priceCents} courseId={detail.id} />
            <Typography.Title level={4}>课程目录</Typography.Title>
            {chapters.error ? <ErrorAlert error={chapters.error} /> : null}
            <List
              loading={chapters.isLoading}
              dataSource={chapters.data?.items ?? []}
              locale={{ emptyText: '暂无章节' }}
              renderItem={(chapter, index) => (
                <List.Item
                  actions={[
                    <Button key="open" type="link" onClick={() => navigate(`/courses/${id}/chapters/${chapter.id}`)}>
                      {chapter.access.canAccess ? '学习' : '查看'}
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space>
                        <span>
                          {index + 1}. {chapter.title}
                        </span>
                        {chapter.isPreview ? <Tag>预览</Tag> : null}
                        {!chapter.access.canAccess ? <Tag>未解锁</Tag> : null}
                      </Space>
                    }
                    description={chapter.kind === 'VIDEO' ? `视频 · ${formatDuration(chapter.durationSeconds)}` : '图文'}
                  />
                </List.Item>
              )}
            />
          </Card>
        ) : null}
      </PageState>
    </div>
  )
}
