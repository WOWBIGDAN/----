export const permissionLabel: Record<string, string> = {
  'content:write': '内容管理',
  'media:write': '素材上传',
  'products:write': '商品与库存',
  'orders:read': '查看订单',
  'orders:ship': '发货',
  'aftersales:review': '售后处理',
  'users:read': '查看用户',
  'users:ban': '封禁用户',
  'membership:write': '会员方案',
  'notifications:write': '站内通知',
  'audit:read': '审计日志',
}

export function hasAllPermissions(owned: string[], required: string[]) {
  return required.every((item) => owned.includes(item))
}
