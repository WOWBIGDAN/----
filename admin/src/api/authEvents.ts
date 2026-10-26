let resetCache: (() => void) | undefined

export function registerAuthReset(fn: () => void) {
  resetCache = fn
}

export function resetSessionCache() {
  resetCache?.()
}
