import { API_BASE } from './config'

export interface SseEvent {
  id?: string
  event: string
  data: string
}

export async function readSse(response: Response, onEvent: (event: SseEvent) => void, signal: AbortSignal) {
  const reader = response.body?.getReader()
  if (!reader) throw new Error('浏览器不支持流式读取')
  const decoder = new TextDecoder()
  let buffer = ''
  while (!signal.aborted) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split(/\r?\n\r?\n/)
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) parseChunk(chunk, onEvent)
  }
  if (buffer.trim()) parseChunk(buffer, onEvent)
}

function parseChunk(chunk: string, onEvent: (event: SseEvent) => void) {
  let id: string | undefined
  let event = 'message'
  const data: string[] = []
  let hasBusinessLine = false
  for (const line of chunk.split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue
    hasBusinessLine = true
    if (line.startsWith('id:')) id = line.slice(3).trim()
    else if (line.startsWith('event:')) event = line.slice(6).trim()
    else if (line.startsWith('data:')) data.push(line.slice(5).trim())
  }
  if (hasBusinessLine) onEvent({ id, event, data: data.join('\n') })
}

export interface StreamHandlers {
  onDelta: (text: string) => void
  onDone: (finishReason: string) => void
  onError: (message: string) => void
}

export async function streamGeneration(options: {
  generationId: string
  signal: AbortSignal
  getToken: () => string | null
  refresh: () => Promise<string | null>
  handlers: StreamHandlers
}) {
  const seen = new Set<string>()
  let lastId: string | undefined
  let attempts = 0
  while (!options.signal.aborted && attempts < 3) {
    attempts += 1
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    const token = options.getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    if (lastId) headers['Last-Event-ID'] = lastId
    const response = await fetch(`${API_BASE}/ai/generations/${options.generationId}/events`, {
      headers,
      signal: options.signal,
    })
    if (response.status === 401) {
      const next = await options.refresh()
      if (!next) {
        options.handlers.onError('登录已失效，请重新登录')
        return
      }
      continue
    }
    if (response.status === 410) {
      options.handlers.onDone('STOP')
      return
    }
    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { message?: string } | null
      options.handlers.onError(body?.message || '暂时无法接收回答')
      return
    }
    let finished = false
    await readSse(
      response,
      (event) => {
        if (event.id) {
          if (seen.has(event.id)) return
          seen.add(event.id)
          lastId = event.id
        }
        if (event.event === 'delta') {
          const payload = JSON.parse(event.data) as { text?: string }
          if (payload.text) options.handlers.onDelta(payload.text)
        } else if (event.event === 'done') {
          finished = true
          const payload = JSON.parse(event.data) as { finishReason?: string }
          options.handlers.onDone(payload.finishReason || 'STOP')
        } else if (event.event === 'error') {
          finished = true
          const payload = JSON.parse(event.data) as { message?: string }
          options.handlers.onError(payload.message || '生成失败')
        }
      },
      options.signal,
    )
    if (finished || options.signal.aborted) return
  }
}
