const STORAGE_KEY = 'chunai.idempotency'

function readMap() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

export function getOrCreateIdempotencyKey(scope: string) {
  const map = readMap()
  if (!map[scope]) {
    map[scope] = crypto.randomUUID()
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  }
  return map[scope]
}

export function clearIdempotencyKey(scope: string) {
  const map = readMap()
  delete map[scope]
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}
