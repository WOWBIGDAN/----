import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0f766e',
    colorInfo: '#0f766e',
    borderRadius: 8,
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  components: {
    Layout: { siderBg: '#0f172a', triggerBg: '#0f172a' },
    Menu: { darkItemBg: '#0f172a', darkItemSelectedBg: '#134e4a' },
  },
}
