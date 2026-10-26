import { configureStore } from '@reduxjs/toolkit'
import { api } from '../api/api'
import { registerAuthReset } from '../api/authEvents'
import authReducer from './authSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
})

registerAuthReset(() => {
  store.dispatch(api.util.resetApiState())
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
