import { Card, Tag } from 'antd'
import { Link } from 'react-router-dom'
import type { ContentSummary } from '../api/types'
import { contentPath } from '../lib/contentPath'
import { accessPolicyLabel, contentKindLabel } from '../lib/labels'
import { Money } from './Money'

export function ContentCard({ item }: { item: ContentSummary }) {
  return (
    <Link to={contentPath(item.kind, item.id)}>
      <Card
        hoverable
        cover={
          <div className="cover">
            {item.cover.publicUrl ? (
              <img src={item.cover.publicUrl} alt={item.title} />
            ) : (
              <div className="cover-fallback">纯爱健康</div>
            )}
          </div>
        }
      >
        <Tag>{contentKindLabel[item.kind]}</Tag>
        <Tag color={item.accessPolicy === 'FREE' ? 'green' : 'gold'}>{accessPolicyLabel[item.accessPolicy]}</Tag>
        <Card.Meta
          title={item.title}
          description={
            <>
              <div style={{ minHeight: 44, margin: '8px 0' }}>{item.summary}</div>
              <Money cents={item.priceCents} freeAsText />
              {item.chapterCount > 0 ? <span style={{ marginLeft: 8, color: '#52606d' }}>{item.chapterCount} 节</span> : null}
            </>
          }
        />
      </Card>
    </Link>
  )
}
