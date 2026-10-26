import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import { store } from './store'
import { router } from './router'
import { theme } from './theme'
import 'antd/dist/reset.css'
import './index.css'

dayjs.locale('zh-cn')

const root = document.getElementById('root')
if (!root) throw new Error('缺少根节点')

createRoot(root).render(
  <StrictMode>
    <Provider store={store}>
        <ConfigProvider locale={zhCN} theme={theme} button={{ autoInsertSpace: false }}>
        <AntApp>
          <RouterProvider router={router} />
        </AntApp>
      </ConfigProvider>
    </Provider>
  </StrictMode>,
)
