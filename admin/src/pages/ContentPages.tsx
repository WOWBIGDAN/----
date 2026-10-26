import { Button, Form, Input, InputNumber, Modal, Select, Space, Table, Tag } from 'antd'
import { useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  useCreateCategoryMutation,
  useCreateChapterMutation,
  useCreateColumnMutation,
  useCreateContentMutation,
  useDeleteCategoryMutation,
  useDeleteChapterMutation,
  useDeleteColumnContentMutation,
  useDeleteColumnMutation,
  useDeleteContentMutation,
  useGetCategoriesQuery,
  useGetChapterBodyQuery,
  useGetChaptersQuery,
  useGetColumnContentsQuery,
  useGetColumnsQuery,
  useGetContentBodyQuery,
  useGetContentQuery,
  useGetContentsQuery,
  usePatchCategoryMutation,
  usePatchChapterMutation,
  usePatchContentMutation,
  usePublishChapterMutation,
  usePublishColumnMutation,
  usePublishContentMutation,
  usePutChapterBodyMutation,
  usePutColumnContentMutation,
  usePutContentBodyMutation,
  useUnpublishChapterMutation,
  useUnpublishColumnMutation,
  useUnpublishContentMutation,
} from '../api/api'
import type { AdminChapter, Category, ContentKind } from '../api/types'
import { ErrorAlert } from '../components/ErrorAlert'
import { MediaUpload } from '../components/MediaUpload'
import { formatCents, formatTime, yuanToCents } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { accessPolicyLabel, kindLabel, labelOf, statusLabel } from '../lib/labels'

export function CategoryPage() {
  const [scope, setScope] = useState<string>()
  const query = useGetCategoriesQuery({ page: 1, pageSize: 100, scope })
  const [createCategory] = useCreateCategoryMutation()
  const [patchCategory] = usePatchCategoryMutation()
  const [remove] = useDeleteCategoryMutation()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [form] = Form.useForm<{ name: string; scope: 'CONTENT' | 'PRODUCT'; sortOrder?: number }>()

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>分类</h2>
        <Select allowClear placeholder="作用域" style={{ width: 140 }} value={scope} onChange={setScope} options={[{ value: 'CONTENT', label: '内容' }, { value: 'PRODUCT', label: '商品' }]} />
        <Button type="primary" onClick={() => setOpen(true)}>新建</Button>
      </Space>
      <ErrorAlert error={query.error || error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={false} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '作用域', dataIndex: 'scope' },
        { title: '排序', dataIndex: 'sortOrder' },
        { title: '启用', dataIndex: 'enabled', render: (value: boolean) => (value ? '是' : '否') },
        {
          title: '操作',
          render: (_v, row: Category) => (
            <Space>
              <Button size="small" onClick={() => void patchCategory({ id: row.id, body: { enabled: !row.enabled, version: row.version } }).catch(setError)}>
                {row.enabled ? '停用' : '启用'}
              </Button>
              <Button size="small" danger onClick={() => void remove(row.id).unwrap().catch(setError)}>删除</Button>
            </Space>
          ),
        },
      ]} />
      <Modal title="新建分类" open={open} onCancel={() => setOpen(false)} onOk={() => void form.validateFields().then(async (values) => {
        await createCategory(values).unwrap()
        setOpen(false)
        form.resetFields()
      }).catch(setError)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, max: 32 }]}><Input /></Form.Item>
          <Form.Item name="scope" label="作用域" rules={[{ required: true }]}>
            <Select options={[{ value: 'CONTENT', label: '内容' }, { value: 'PRODUCT', label: '商品' }]} />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序"><InputNumber min={0} /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export function ContentListPage() {
  const [params, setParams] = useSearchParams()
  const kind = params.get('kind') || undefined
  const status = params.get('status') || undefined
  const keyword = params.get('keyword') || undefined
  const page = Number(params.get('page') || '1')
  const query = useGetContentsQuery({ page, pageSize: 20, kind, status, keyword })
  const [remove] = useDeleteContentMutation()
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>科普与课程</h2>
        <Link to="/content/new"><Button type="primary">新建</Button></Link>
      </Space>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search allowClear placeholder="标题" defaultValue={keyword} onSearch={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('keyword', value)
          else next.delete('keyword')
          next.delete('page')
          setParams(next)
        }} />
        <Select allowClear placeholder="类型" style={{ width: 140 }} value={kind} options={Object.entries(kindLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('kind', value)
          else next.delete('kind')
          setParams(next)
        }} />
        <Select allowClear placeholder="状态" style={{ width: 120 }} value={status} options={Object.entries(statusLabel).map(([value, label]) => ({ value, label }))} onChange={(value) => {
          const next = new URLSearchParams(params)
          if (value) next.set('status', value)
          else next.delete('status')
          setParams(next)
        }} />
      </Space>
      <ErrorAlert error={query.error} />
      <Table rowKey="id" loading={query.isLoading} dataSource={query.data?.items ?? []} pagination={{ current: page, pageSize: 20, total: query.data?.total ?? 0, onChange: (next) => {
        const draft = new URLSearchParams(params)
        draft.set('page', String(next))
        setParams(draft)
      } }} columns={[
        { title: '标题', dataIndex: 'title', render: (title: string, row) => <Link to={`/content/${row.id}`}>{title}</Link> },
        { title: '类型', dataIndex: 'kind', render: (value: string) => labelOf(kindLabel, value) },
        { title: '状态', dataIndex: 'status', render: (value: string) => <Tag>{labelOf(statusLabel, value)}</Tag> },
        { title: '价格', dataIndex: 'priceCents', render: (value: number) => formatCents(value) },
        { title: '更新', dataIndex: 'updatedAt', render: (value: string) => formatTime(value) },
        { title: '操作', render: (_v, row) => <Button size="small" danger onClick={() => void remove(row.id)}>删除</Button> },
      ]} />
    </div>
  )
}

export function ContentEditPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const detail = useGetContentQuery(id ?? '', { skip: isNew })
  const body = useGetContentBodyQuery(id ?? '', { skip: isNew })
  const categories = useGetCategoriesQuery({ scope: 'CONTENT', pageSize: 100 })
  const [createContent, createState] = useCreateContentMutation()
  const [patchContent, patchState] = usePatchContentMutation()
  const [putBody] = usePutContentBodyMutation()
  const [publish] = usePublishContentMutation()
  const [unpublish] = useUnpublishContentMutation()
  const [error, setError] = useState<unknown>(null)
  const [coverMediaId, setCoverMediaId] = useState<string>()
  const [form] = Form.useForm()
  const content = detail.data
  const isCourse = content ? content.kind.endsWith('COURSE') : false

  return (
    <div>
      <h2>{isNew ? '新建内容' : '编辑内容'}</h2>
      <ErrorAlert error={detail.error || error} />
      <Form
        form={form}
        layout="vertical"
        key={content?.id ?? 'new'}
        initialValues={content ? {
          ...content,
          categoryId: content.category.id,
          priceYuan: content.priceCents / 100,
          tags: content.tags.join(','),
        } : { accessPolicy: 'FREE', priceYuan: 0, kind: 'SCIENCE_ARTICLE' }}
        onFinish={async (values: {
          kind: ContentKind
          title: string
          summary: string
          descriptionHtml?: string
          categoryId: string
          authorName?: string
          tags?: string
          accessPolicy: 'FREE' | 'PURCHASE' | 'MEMBER_OR_PURCHASE'
          priceYuan: number
        }) => {
          const science = values.kind?.startsWith('SCIENCE') || content?.kind.startsWith('SCIENCE')
          const payload = {
            title: values.title,
            summary: values.summary,
            descriptionHtml: values.descriptionHtml,
            categoryId: values.categoryId,
            authorName: values.authorName,
            tags: values.tags ? values.tags.split(',').map((item) => item.trim()).filter(Boolean) : [],
            accessPolicy: science ? 'FREE' : values.accessPolicy,
            priceCents: science ? 0 : yuanToCents(values.priceYuan || 0),
            coverMediaId: coverMediaId || content?.cover.id,
          }
          try {
            if (isNew) {
              const created = await createContent({ ...payload, kind: values.kind }).unwrap()
              navigate(`/content/${created.id}`)
            } else if (content) {
              await patchContent({ id: content.id, body: { ...payload, version: content.version } }).unwrap()
            }
          } catch (submitError) {
            setError(submitError)
          }
        }}
      >
        {isNew ? (
          <Form.Item name="kind" label="类型" rules={[{ required: true }]}>
            <Select options={Object.entries(kindLabel).map(([value, label]) => ({ value, label }))} />
          </Form.Item>
        ) : <p>类型：{labelOf(kindLabel, content?.kind)} · 状态：{labelOf(statusLabel, content?.status)} · 版本 {content?.version}</p>}
        <Form.Item name="title" label="标题" rules={[{ required: true, max: 120 }]}><Input /></Form.Item>
        <Form.Item name="summary" label="简介" rules={[{ required: true, max: 2000 }]}><Input.TextArea rows={3} /></Form.Item>
        <Form.Item name="authorName" label="作者"><Input maxLength={64} /></Form.Item>
        <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
          <Select options={(categories.data?.items ?? []).map((item) => ({ value: item.id, label: item.name }))} />
        </Form.Item>
        <Form.Item name="tags" label="标签，逗号分隔"><Input /></Form.Item>
        <Form.Item name="accessPolicy" label="访问策略">
          <Select options={Object.entries(accessPolicyLabel).map(([value, label]) => ({ value, label }))} />
        </Form.Item>
        <Form.Item name="priceYuan" label="价格（元）"><InputNumber min={0} /></Form.Item>
        <Form.Item name="descriptionHtml" label="介绍 HTML"><Input.TextArea rows={4} /></Form.Item>
        <Form.Item label="封面">
          <MediaUpload purpose="CONTENT_COVER" onUploaded={setCoverMediaId} />
          <span>{coverMediaId || content?.cover.id}</span>
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={createState.isLoading || patchState.isLoading}>保存</Button>
        {content ? (
          <Space style={{ marginLeft: 8 }}>
            <Button onClick={() => void publish({ id: content.id, version: content.version }).unwrap().catch(setError)}>发布</Button>
            <Button onClick={() => void unpublish({ id: content.id, version: content.version }).unwrap().catch(setError)}>下架</Button>
          </Space>
        ) : null}
      </Form>
      {content && !isCourse ? <BodyEditor kind={content.kind} version={body.data?.version} initialHtml={body.data?.bodyHtml} initialVideo={body.data?.videoMediaId} onSave={(payload) => void putBody({ id: content.id, body: payload }).unwrap().catch(setError)} /> : null}
      {content && isCourse ? <ChapterEditor courseId={content.id} video={content.kind === 'VIDEO_COURSE'} /> : null}
    </div>
  )
}

function BodyEditor({
  kind,
  version,
  initialHtml,
  initialVideo,
  onSave,
}: {
  kind: string
  version?: number
  initialHtml?: string | null
  initialVideo?: string | null
  onSave: (body: Record<string, unknown>) => void
}) {
  const [html, setHtml] = useState(initialHtml ?? '')
  const [images, setImages] = useState<string[]>([])
  const [videoId, setVideoId] = useState(initialVideo ?? '')
  if (!version) return <ErrorAlert error={{ data: { code: 'BODY', message: '正文版本尚未加载', details: [] } }} />
  if (kind.includes('VIDEO')) {
    return (
      <div style={{ marginTop: 24 }}>
        <h3>视频素材</h3>
        <MediaUpload purpose="CONTENT_VIDEO" onUploaded={setVideoId} />
        <Input style={{ margin: '8px 0' }} value={videoId} onChange={(event) => setVideoId(event.target.value)} />
        <Button onClick={() => onSave({ version, videoMediaId: videoId })}>保存视频引用</Button>
      </div>
    )
  }
  return (
    <div style={{ marginTop: 24 }}>
      <h3>图文正文</h3>
      <Input.TextArea rows={8} value={html} onChange={(event) => setHtml(event.target.value)} />
      <MediaUpload purpose="CONTENT_BODY_IMAGE" onUploaded={(id) => setImages((prev) => [...prev, id])} />
      <p>图片 ID：{images.join(', ') || '无'}</p>
      <Button onClick={() => onSave({ version, bodyHtml: html, imageMediaIds: images })}>保存正文</Button>
    </div>
  )
}

function ChapterEditor({ courseId, video }: { courseId: string; video: boolean }) {
  const chapters = useGetChaptersQuery({ id: courseId, pageSize: 100 })
  const [createChapter] = useCreateChapterMutation()
  const [publish] = usePublishChapterMutation()
  const [unpublish] = useUnpublishChapterMutation()
  const [remove] = useDeleteChapterMutation()
  const [patch] = usePatchChapterMutation()
  const [title, setTitle] = useState('')
  const [sortOrder, setSortOrder] = useState(1)
  const [error, setError] = useState<unknown>(null)
  return (
    <div style={{ marginTop: 24 }}>
      <h3>章节</h3>
      <ErrorAlert error={chapters.error || error} />
      <Space>
        <Input placeholder="章节标题" value={title} onChange={(event) => setTitle(event.target.value)} />
        <InputNumber min={0} value={sortOrder} onChange={(value) => setSortOrder(value ?? 0)} />
        <Button onClick={() => void createChapter({ id: courseId, title, sortOrder }).unwrap().then(() => setTitle('')).catch(setError)}>添加章节</Button>
      </Space>
      <Table style={{ marginTop: 12 }} rowKey="id" dataSource={chapters.data?.items ?? []} pagination={false} columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '状态', dataIndex: 'status', render: (value: string) => labelOf(statusLabel, value) },
        { title: '预览', dataIndex: 'isPreview', render: (value: boolean) => (value ? '是' : '否') },
        {
          title: '操作',
          render: (_v, row: AdminChapter) => (
            <Space>
              <Button size="small" onClick={() => void publish({ id: row.id, version: row.version }).unwrap().catch(setError)}>发布</Button>
              <Button size="small" onClick={() => void unpublish({ id: row.id, version: row.version }).unwrap().catch(setError)}>下架</Button>
              <Button size="small" onClick={() => void patch({ id: row.id, body: { isPreview: !row.isPreview, version: row.version } }).unwrap().catch(setError)}>切换预览</Button>
              <Button size="small" danger onClick={() => void remove(row.id).unwrap().catch(setError)}>删除</Button>
              <ChapterBody chapterId={row.id} video={video} />
            </Space>
          ),
        },
      ]} />
    </div>
  )
}

function ChapterBody({ chapterId, video }: { chapterId: string; video: boolean }) {
  const body = useGetChapterBodyQuery(chapterId)
  const [put] = usePutChapterBodyMutation()
  const [text, setText] = useState('')
  const [mediaId, setMediaId] = useState('')
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="small" onClick={() => { setText(body.data?.bodyHtml ?? ''); setMediaId(body.data?.videoMediaId ?? ''); setOpen(true) }}>正文</Button>
      <Modal title="章节正文" open={open} onCancel={() => setOpen(false)} onOk={() => {
        if (!body.data) return
        const payload = video
          ? { version: body.data.version, videoMediaId: mediaId }
          : { version: body.data.version, bodyHtml: text, imageMediaIds: [] as string[] }
        void put({ id: chapterId, body: payload }).unwrap().then(() => setOpen(false)).catch((error: unknown) => setText(getErrorMessage(error)))
      }}>
        {video ? <MediaUpload purpose="CONTENT_VIDEO" onUploaded={setMediaId} /> : null}
        {video ? <Input value={mediaId} onChange={(event) => setMediaId(event.target.value)} /> : <Input.TextArea rows={6} value={text} onChange={(event) => setText(event.target.value)} />}
      </Modal>
    </>
  )
}

export function ColumnPage() {
  const columns = useGetColumnsQuery({ pageSize: 50 })
  const [createColumn] = useCreateColumnMutation()
  const [publish] = usePublishColumnMutation()
  const [unpublish] = useUnpublishColumnMutation()
  const [remove] = useDeleteColumnMutation()
  const [open, setOpen] = useState(false)
  const [coverMediaId, setCoverMediaId] = useState('')
  const [form] = Form.useForm<{ name: string; description?: string; sortOrder?: number }>()
  const [error, setError] = useState<unknown>(null)
  const [active, setActive] = useState<string>()
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>专栏</h2>
        <Button type="primary" onClick={() => setOpen(true)}>新建专栏</Button>
      </Space>
      <ErrorAlert error={columns.error || error} />
      <Table rowKey="id" loading={columns.isLoading} dataSource={columns.data?.items ?? []} pagination={false} columns={[
        { title: '名称', dataIndex: 'name' },
        { title: '状态', dataIndex: 'status', render: (value: string) => labelOf(statusLabel, value) },
        { title: '内容数', dataIndex: 'contentCount' },
        {
          title: '操作',
          render: (_v, row) => (
            <Space>
              <Button size="small" onClick={() => setActive(row.id)}>内容</Button>
              <Button size="small" onClick={() => void publish({ id: row.id, version: row.version }).unwrap().catch(setError)}>发布</Button>
              <Button size="small" onClick={() => void unpublish({ id: row.id, version: row.version }).unwrap().catch(setError)}>下架</Button>
              <Button size="small" danger onClick={() => void remove(row.id).unwrap().catch(setError)}>删除</Button>
            </Space>
          ),
        },
      ]} />
      {active ? <ColumnContents columnId={active} /> : null}
      <Modal title="新建专栏" open={open} onCancel={() => setOpen(false)} onOk={() => void form.validateFields().then(async (values) => {
        await createColumn({ ...values, coverMediaId }).unwrap()
        setOpen(false)
      }).catch(setError)}>
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, max: 64 }]}><Input /></Form.Item>
          <Form.Item name="description" label="说明"><Input.TextArea /></Form.Item>
          <Form.Item name="sortOrder" label="排序"><InputNumber min={0} /></Form.Item>
          <MediaUpload purpose="COLUMN_COVER" onUploaded={setCoverMediaId} />
        </Form>
      </Modal>
    </div>
  )
}

function ColumnContents({ columnId }: { columnId: string }) {
  const contents = useGetColumnContentsQuery({ id: columnId, pageSize: 100 })
  const [put] = usePutColumnContentMutation()
  const [remove] = useDeleteColumnContentMutation()
  const [contentId, setContentId] = useState('')
  const [sortOrder, setSortOrder] = useState(0)
  const [error, setError] = useState<unknown>(null)
  return (
    <div style={{ marginTop: 16 }}>
      <h3>专栏内容</h3>
      <ErrorAlert error={contents.error || error} />
      <Space>
        <Input placeholder="内容 ID" value={contentId} onChange={(event) => setContentId(event.target.value)} />
        <InputNumber min={0} value={sortOrder} onChange={(value) => setSortOrder(value ?? 0)} />
        <Button onClick={() => void put({ id: columnId, contentId, sortOrder }).unwrap().catch(setError)}>设置排序</Button>
      </Space>
      <Table style={{ marginTop: 12 }} rowKey="id" dataSource={contents.data?.items ?? []} pagination={false} columns={[
        { title: '标题', dataIndex: 'title' },
        { title: '类型', dataIndex: 'kind', render: (value: string) => labelOf(kindLabel, value) },
        { title: '操作', render: (_v, row) => <Button size="small" danger onClick={() => void remove({ id: columnId, contentId: row.id }).unwrap().catch(setError)}>移出</Button> },
      ]} />
    </div>
  )
}
