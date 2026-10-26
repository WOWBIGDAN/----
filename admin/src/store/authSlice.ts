import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { AdminAuthTokens, AdminPrincipal } from '../api/types'

const ACCESS_KEY = 'chunai.admin.accessToken'
const REFRESH_KEY = 'chunai.admin.refreshToken'
const PROFILE_KEY = 'chunai.admin.profile'

function readProfile(): AdminPrincipal | null {
  const raw = localStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as AdminPrincipal
  } catch {
    return null
  }
}

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  admin: AdminPrincipal | null
  hydrated: boolean
  notice: string | null
}

const hasCredential = Boolean(localStorage.getItem(ACCESS_KEY) || localStorage.getItem(REFRESH_KEY))

const initialState: AuthState = {
  accessToken: localStorage.getItem(ACCESS_KEY),
  refreshToken: localStorage.getItem(REFRESH_KEY),
  admin: readProfile(),
  hydrated: !hasCredential,
  notice: null,
}

function persist(state: AuthState) {
  if (state.accessToken) localStorage.setItem(ACCESS_KEY, state.accessToken)
  else localStorage.removeItem(ACCESS_KEY)
  if (state.refreshToken) localStorage.setItem(REFRESH_KEY, state.refreshToken)
  else localStorage.removeItem(REFRESH_KEY)
  if (state.admin) localStorage.setItem(PROFILE_KEY, JSON.stringify(state.admin))
  else localStorage.removeItem(PROFILE_KEY)
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<AdminAuthTokens>) {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      state.admin = action.payload.admin
      state.hydrated = true
      state.notice = null
      persist(state)
    },
    setAdmin(state, action: PayloadAction<AdminPrincipal>) {
      state.admin = action.payload
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
      state.admin = null
      state.hydrated = true
      state.notice = action.payload ?? null
      persist(state)
    },
  },
})

export const { setCredentials, setAdmin, markHydrated, clearNotice, clearAuth } = authSlice.actions
export default authSlice.reducer
