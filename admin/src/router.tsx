import { Navigate, createBrowserRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { AdminShell } from './components/AdminShell'
import { RequireAdmin } from './components/RequireAdmin'
import { RequirePermission } from './components/RequirePermission'
import { CategoryPage, ColumnPage, ContentEditPage, ContentListPage } from './pages/ContentPages'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { AfterSaleDetailPage, AfterSaleListPage } from './pages/AfterSalePages'
import { AuditPage, MembershipPlanPage, NotificationPage } from './pages/OperatePages'
import { OrderDetailPage, OrderListPage } from './pages/OrderPages'
import { ProductEditPage, ProductListPage } from './pages/ProductPages'
import { UserDetailPage, UserListPage } from './pages/UserPages'

function guard(permission: string, element: ReactNode) {
  return <RequirePermission permission={permission}>{element}</RequirePermission>
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAdmin><AdminShell /></RequireAdmin>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'content', element: guard('content:write', <ContentListPage />) },
      { path: 'content/categories', element: guard('content:write', <CategoryPage />) },
      { path: 'content/columns', element: guard('content:write', <ColumnPage />) },
      { path: 'content/new', element: guard('content:write', <ContentEditPage />) },
      { path: 'content/:id', element: guard('content:write', <ContentEditPage />) },
      { path: 'products', element: guard('products:write', <ProductListPage />) },
      { path: 'products/new', element: guard('products:write', <ProductEditPage />) },
      { path: 'products/:id', element: guard('products:write', <ProductEditPage />) },
      { path: 'orders', element: guard('orders:read', <OrderListPage />) },
      { path: 'orders/:id', element: guard('orders:read', <OrderDetailPage />) },
      { path: 'aftersales', element: guard('aftersales:review', <AfterSaleListPage />) },
      { path: 'aftersales/:id', element: guard('aftersales:review', <AfterSaleDetailPage />) },
      { path: 'users', element: guard('users:read', <UserListPage />) },
      { path: 'users/:id', element: guard('users:read', <UserDetailPage />) },
      { path: 'membership-plans', element: guard('membership:write', <MembershipPlanPage />) },
      { path: 'notifications', element: guard('notifications:write', <NotificationPage />) },
      { path: 'audit', element: guard('audit:read', <AuditPage />) },
    ],
  },
])
