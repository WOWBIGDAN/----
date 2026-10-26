import { Alert, Timeline, Typography } from 'antd'
import { useParams } from 'react-router-dom'
import { useGetLogisticsQuery } from '../../api/api'
import { PageState } from '../../components/PageState'
import { formatTime } from '../../lib/format'
import { labelOf, shipmentStatusLabel, syncStatusLabel } from '../../lib/labels'
import { useTitle } from '../../lib/useTitle'

export function LogisticsPage() {
  useTitle('物流信息')
  const { id = '' } = useParams()
  const logistics = useGetLogisticsQuery(id)
  const data = logistics.data

  return (
    <PageState isLoading={logistics.isLoading} error={logistics.error}>
      {data ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 20 }}>
          <Typography.Title level={3}>物流信息</Typography.Title>
          <Alert
            type={data.syncStatus === 'FAILED' ? 'warning' : 'info'}
            showIcon
            message={labelOf(syncStatusLabel, data.syncStatus)}
            style={{ marginBottom: 16 }}
          />
          {data.shipment ? (
            <Typography.Paragraph>
              {data.shipment.carrierName} {data.shipment.trackingNo} · {labelOf(shipmentStatusLabel, data.shipment.status)}
              <br />
              发货时间 {formatTime(data.shipment.shippedAt)}
              {data.shipment.lastSyncedAt ? ` · 最近同步 ${formatTime(data.shipment.lastSyncedAt)}` : ''}
            </Typography.Paragraph>
          ) : null}
          <Timeline
            items={
              data.events.length
                ? data.events.map((event) => ({
                    children: (
                      <div>
                        <div>{event.description}</div>
                        <div style={{ color: '#52606d' }}>
                          {formatTime(event.time)} {event.location ?? ''}
                        </div>
                      </div>
                    ),
                  }))
                : [{ children: '暂无物流轨迹' }]
            }
          />
        </div>
      ) : null}
    </PageState>
  )
}
