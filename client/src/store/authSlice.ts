import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AuthTokens, UserSummary } from '../api/types'

const ACCESS_KEY = 'chunai.accessToken'
const REFRESH_KEY = 'chunai.refreshToken'
const USER_KEY = 'chunai.user'

function readUser(): UserSummary | null {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserSummary
  } catch {
    return null
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: UserSummary | null
  hydrated: boolean
  notice: string | null
}

const hasCredential = Boolean(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY))

const initialState: AuthState = {
  accessToken: localStorage.getItem(ACCESS_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
  user: readUser(),
  hydrated: !hasCredential,
  notice: null,
}

function persist(state: AuthState) {
  if (state.accessToken) localStorage.setItem(ACCESS_KEY, state.accessToken)
  else localStorage.removeItem(ACCESS_KEY)
  if (state.refreshToken) localStorage.setItem(REFRESH_KEY, state.refreshToken)
  else localStorage.removeItem(REFRESH_KEY)
  if (state.user) localStorage.setItem(USER_KEY, JSON.stringify(state.user))
  else localStorage.removeItem(USER_KEY)
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AuthTokens>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.user = action.payload.user
      state.hydrated = true
      state.notice = null
      persist(state)
    },
    setUser(state, action: PayloadAction<UserSummary>) {
      state.user = action.payload
      persist(state)
    },
    markHydrated(state) {
      state.hydrated = true
    },
    clearNotice(state) {
      state.notice = null
    },
    clearAuth(state, action: PayloadAction<string | undefined>) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      state.hydrated = true
      state.notice = action.payload ?? null
      persist(state)
    },
  },
})

export const { setCredentials, setUser, markHydrated, clearNotice, clearAuth } = authSlice.actions
export default authSlice.reducer
