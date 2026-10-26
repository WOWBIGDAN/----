import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export function ForbiddenPage() {
  const navigate = useNavigate()
  return (
    <Result
      status="403"
      title="无权访问"
      subTitle="当前管理员账号没有这个页面所需的权限。页面数据不会被请求。"
      extra={<Button type="primary" onClick={() => navigate('/dashboard')}>返回工作台</Button>}
    />
  )
}
