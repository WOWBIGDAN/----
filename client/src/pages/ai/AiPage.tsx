import { Button, Input, List, Modal, Space, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  useCancelGenerationMutation,
  useCreateConversationMutation,
  useDeleteConversationMutation,
  useGetAiQuotaQuery,
  useGetConversationsQuery,
  useLazyGetAiMessagesQuery,
  useRenameConversationMutation,
  useSendAiMessageMutation,
} from '../../api/api'
import { refreshAccessToken } from '../../api/baseQuery'
import { streamGeneration } from '../../api/sse'
import type { AiMessage } from '../../api/types'
import { ErrorAlert } from '../../components/ErrorAlert'
import { getErrorMessage } from '../../lib/errors'
import { clearIdempotencyKey, getOrCreateIdempotencyKey } from '../../lib/idempotency'
import { useTitle } from '../../lib/useTitle'
import { store } from '../../store'

export function AiPage() {
  useTitle('AI 问答')
  const [params, setParams] = useSearchParams()
  const activeId = params.get('id')
  const conversations = useGetConversationsQuery({ page: 1, pageSize: 50 })
  const quota = useGetAiQuotaQuery()
  const [loadMessages] = useLazyGetAiMessagesQuery()
  const [createConversation, createState] = useCreateConversationMutation()
  const [sendMessage, sendState] = useSendAiMessageMutation()
  const [cancelGeneration] = useCancelGenerationMutation()
  const [renameConversation] = useRenameConversationMutation()
  const [deleteConversation] = useDeleteConversationMutation()
  const [messages, setMessages] = useState<AiMessage[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [streaming, setStreaming] = useState('')
  const [generationId, setGenerationId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [renameOpen, setRenameOpen] = useState(false)
  const [title, setTitle] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const clientMessageRef = useRef<string | null>(null)
  const skipLoadRef = useRef(false)
  const scroller = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      setCursor(null)
      setHasMore(false)
      return
    }
    if (skipLoadRef.current) {
      skipLoadRef.current = false
      return
    }
    let cancelled = false
    loadMessages({ id: activeId, limit: 40 })
      .unwrap()
      .then((page) => {
        if (cancelled) return
        setMessages([...page.items].reverse())
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError)
      })
    return () => {
      cancelled = true
    }
  }, [activeId, loadMessages])

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight })
  }, [messages, streaming])

  const selectConversation = (id: string) => {
    abortRef.current?.abort()
    setGenerationId(null)
    setStreaming('')
    setParams({ id })
  }

  const startNew = () => {
    abortRef.current?.abort()
    setGenerationId(null)
    setStreaming('')
    setParams({})
  }

  const loadOlder = async () => {
    if (!activeId || !cursor) return
    const page = await loadMessages({ id: activeId, cursor, limit: 40 }).unwrap()
    setMessages((prev) => {
      const older = [...page.items].reverse()
      const ids = new Set(prev.map((item) => item.id))
      return [...older.filter((item) => !ids.has(item.id)), ...prev]
    })
    setCursor(page.nextCursor)
    setHasMore(page.hasMore)
  }

  const onSend = async () => {
    const content = draft.trim()
    if (!content || generationId) return
    setError(null)
    let conversationId = activeId
    try {
      if (!conversationId) {
        const created = await createConversation().unwrap()
        conversationId = created.id
        skipLoadRef.current = true
        setParams({ id: created.id })
      }
      const resolvedId = conversationId
      if (!resolvedId) return
      if (!clientMessageRef.current) clientMessageRef.current = crypto.randomUUID()
      const clientMessageId = clientMessageRef.current
      const idempotencyKey = getOrCreateIdempotencyKey(`ai:${resolvedId}:${clientMessageId}`)
      const localId = `local-${clientMessageId}`
      setMessages((prev) => [
        ...prev,
        {
          id: localId,
          conversationId: resolvedId,
          role: 'USER',
          content,
          status: 'COMPLETED',
          generationId: null,
          createdAt: new Date().toISOString(),
        },
      ])
      setDraft('')
      const generation = await sendMessage({ id: resolvedId, clientMessageId, content, idempotencyKey }).unwrap()
      clientMessageRef.current = null
      clearIdempotencyKey(`ai:${resolvedId}:${clientMessageId}`)
      setGenerationId(generation.id)
      const controller = new AbortController()
      abortRef.current = controller
      let failed = false
      await streamGeneration({
        generationId: generation.id,
        signal: controller.signal,
        getToken: () => store.getState().auth.accessToken,
        refresh: async () => {
          const refreshToken = store.getState().auth.refreshToken
          if (!refreshToken) return null
          return refreshAccessToken(store.dispatch, refreshToken)
        },
        handlers: {
          onDelta: (text) => setStreaming((prev) => prev + text),
          onDone: () => undefined,
          onError: (message) => {
            failed = true
            setError({ data: { code: 'AI_ERROR', message, details: [] } })
          },
        },
      })
      if (controller.signal.aborted) return
      setGenerationId(null)
      setStreaming('')
      if (!failed) {
        const page = await loadMessages({ id: resolvedId, limit: 40 }).unwrap()
        setMessages([...page.items].reverse())
        setCursor(page.nextCursor)
        setHasMore(page.hasMore)
      }
    } catch (sendError) {
      setDraft(content)
      setError(sendError)
      setGenerationId(null)
    }
  }

  const stop = async () => {
    if (!generationId) return
    abortRef.current?.abort()
    try {
      await cancelGeneration({ id: generationId, idempotencyKey: getOrCreateIdempotencyKey(`cancel:${generationId}`) }).unwrap()
    } catch (cancelError) {
      setError(cancelError)
    } finally {
      setGenerationId(null)
    }
  }

  const active = conversations.data?.items.find((item) => item.id === activeId)

  return (
    <div className="page">
      <div className="ai-layout">
        <div style={{ background: '#fff', borderRadius: 12, padding: 12 }}>
          <Button block onClick={startNew} loading={createState.isLoading}>
            新对话
          </Button>
          <List
            style={{ marginTop: 12 }}
            loading={conversations.isLoading}
            dataSource={conversations.data?.items ?? []}
            locale={{ emptyText: conversations.error ? getErrorMessage(conversations.error) : '暂无会话' }}
            renderItem={(item) => (
              <List.Item style={{ cursor: 'pointer', background: item.id === activeId ? '#e7f4f2' : undefined }} onClick={() => selectConversation(item.id)}>
                <Typography.Text ellipsis>{item.title}</Typography.Text>
              </List.Item>
            )}
          />
        </div>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column' }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 8 }}>
            健康知识辅助，不能替代医师的诊断、处方或治疗建议。
            {quota.data ? ` 今日剩余 ${quota.data.remaining} 次。` : ''}
          </Typography.Paragraph>
          {active ? (
            <Space style={{ marginBottom: 8 }}>
              <strong>{active.title}</strong>
              <Button size="small" onClick={() => { setTitle(active.title); setRenameOpen(true) }}>重命名</Button>
              <Button
                size="small"
                danger
                onClick={() => {
                  void deleteConversation(active.id).then(() => {
                    if (activeId === active.id) startNew()
                  })
                }}
              >
                删除
              </Button>
            </Space>
          ) : null}
          <div className="ai-messages" ref={scroller}>
            {hasMore ? <Button type="link" onClick={() => void loadOlder()}>查看更早的消息</Button> : null}
            {messages.map((item) => (
              <div key={item.id} className={`ai-bubble ${item.role === 'USER' ? 'user' : 'assistant'}`} style={{ marginBottom: 12 }}>
                {item.content || (item.status === 'FAILED' ? '这次回答没有完成' : '')}
              </div>
            ))}
            {streaming ? <div className="ai-bubble assistant">{streaming}</div> : null}
          </div>
          {error ? <ErrorAlert error={error} /> : null}
          <Space.Compact style={{ width: '100%', marginTop: 12 }}>
            <Input.TextArea
              value={draft}
              rows={3}
              maxLength={4000}
              placeholder="请描述你想了解的健康知识"
              disabled={quota.data?.remaining === 0}
              onChange={(event) => setDraft(event.target.value)}
            />
          </Space.Compact>
          <Space style={{ marginTop: 8 }}>
            <Button type="primary" loading={sendState.isLoading} disabled={!draft.trim() || quota.data?.remaining === 0} onClick={() => void onSend()}>
              发送
            </Button>
            {generationId ? <Button onClick={() => void stop()}>停止生成</Button> : null}
          </Space>
        </div>
      </div>
      <Modal
        title="重命名会话"
        open={renameOpen}
        onCancel={() => setRenameOpen(false)}
        onOk={() => {
          if (!activeId || !title.trim()) return
          void renameConversation({ id: activeId, title: title.trim() }).unwrap().then(() => setRenameOpen(false))
        }}
      >
        <Input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} />
      </Modal>
    </div>
  )
}
