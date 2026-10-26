import { Button, Result } from 'antd'
import { Link, Navigate, createBrowserRouter } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { AccountLayout } from './pages/account/AccountLayout'
import { AddressPage } from './pages/account/AddressPage'
import { AfterSaleCreatePage } from './pages/account/AfterSaleCreatePage'
import { AfterSaleDetailPage } from './pages/account/AfterSaleDetailPage'
import { AfterSaleListPage } from './pages/account/AfterSaleListPage'
import { LogisticsPage } from './pages/account/LogisticsPage'
import { MembershipPage } from './pages/account/MembershipPage'
import { NotificationsPage } from './pages/account/NotificationsPage'
import { OrderDetailPage } from './pages/account/OrderDetailPage'
import { OrderListPage } from './pages/account/OrderListPage'
import { OverviewPage } from './pages/account/OverviewPage'
import { PaymentPage } from './pages/account/PaymentPage'
import { PurchasedCoursesPage } from './pages/account/PurchasedCoursesPage'
import { SecurityPage } from './pages/account/SecurityPage'
import { AiPage } from './pages/ai/AiPage'
import { LegalPage } from './pages/auth/LegalPage'
import { LoginPage } from './pages/auth/LoginPage'
import { RegisterPage } from './pages/auth/RegisterPage'
import { ChapterPage } from './pages/browse/ChapterPage'
import { ColumnDetailPage } from './pages/browse/ColumnDetailPage'
import { ContentRedirectPage } from './pages/browse/ContentRedirectPage'
import { CourseDetailPage } from './pages/browse/CourseDetailPage'
import { CourseListPage } from './pages/browse/CourseListPage'
import { ScienceDetailPage } from './pages/browse/ScienceDetailPage'
import { SciencePage } from './pages/browse/SciencePage'
import { CheckoutPage } from './pages/shop/CheckoutPage'
import { ProductDetailPage } from './pages/shop/ProductDetailPage'
import { ProductListPage } from './pages/shop/ProductListPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/science" replace /> },
      { path: 'science', element: <SciencePage /> },
      { path: 'science/videos/:id', element: <ScienceDetailPage media="video" /> },
      { path: 'science/articles/:id', element: <ScienceDetailPage media="article" /> },
      { path: 'columns/:id', element: <ColumnDetailPage /> },
      { path: 'content/:id', element: <ContentRedirectPage /> },
      { path: 'courses', element: <CourseListPage /> },
      { path: 'courses/:id', element: <CourseDetailPage /> },
      { path: 'courses/:courseId/chapters/:chapterId', element: <ChapterPage /> },
      { path: 'products', element: <ProductListPage /> },
      { path: 'products/:id', element: <ProductDetailPage /> },
      { path: 'checkout', element: <RequireAuth><CheckoutPage /></RequireAuth> },
      { path: 'ai', element: <RequireAuth><AiPage /></RequireAuth> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'legal/:type', element: <LegalPage /> },
      {
        path: 'account',
        element: (
          <RequireAuth>
            <AccountLayout />
          </RequireAuth>
        ),
        children: [
          { index: true, element: <OverviewPage /> },
          { path: 'orders', element: <OrderListPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'orders/:id/pay', element: <PaymentPage /> },
          { path: 'orders/:id/logistics', element: <LogisticsPage /> },
          { path: 'addresses', element: <AddressPage /> },
          { path: 'aftersales', element: <AfterSaleListPage /> },
          { path: 'aftersales/new', element: <AfterSaleCreatePage /> },
          { path: 'aftersales/:id', element: <AfterSaleDetailPage /> },
          { path: 'courses', element: <PurchasedCoursesPage /> },
          { path: 'membership', element: <MembershipPage /> },
          { path: 'notifications', element: <NotificationsPage /> },
          { path: 'security', element: <SecurityPage /> },
        ],
      },
      {
        path: '*',
        element: (
          <div className="page">
            <Result status="404" title="页面不存在" extra={<Link to="/science"><Button type="primary">返回科普</Button></Link>} />
          </div>
        ),
      },
    ],
  },
])
