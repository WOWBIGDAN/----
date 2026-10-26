import type { ThemeConfig } from 'antd'

export const theme: ThemeConfig = {
  token: {
    colorPrimary: '#0f766e',
    colorInfo: '#0f766e',
    colorLink: '#0f766e',
    colorSuccess: '#15803d',
    borderRadius: 10,
    colorBgLayout: '#f3f6f5',
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    colorText: '#1f2933',
  },
  components: {
    Menu: {
      horizontalItemSelectedColor: '#0f766e',
      itemSelectedColor: '#0f766e',
      itemSelectedBg: '#e7f4f2',
    },
    Card: { borderRadiusLG: 14 },
    Button: { controlHeight: 36 },
  },
}
