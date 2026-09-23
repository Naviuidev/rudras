import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BannersPage from './pages/BannersPage';
import ProductsPage from './pages/ProductsPage';
import OrdersPage from './pages/OrdersPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import UsersPage from './pages/UsersPage';
import CategoriesPage from './pages/CategoriesPage';
import NotificationsPage from './pages/NotificationsPage';
import PlaceholderPage from './pages/PlaceholderPage';
import ContentPage from './pages/ContentPage';
import CustomerProfilePage from './pages/CustomerProfilePage';
import SkipRequestsPage from './pages/SkipRequestsPage';
import CarryForwardPage from './pages/CarryForwardPage';
import InventoryStockPage from './pages/InventoryStockPage';
import DailyRequirementPage from './pages/DailyRequirementPage';
import PaymentsTransactionsPage from './pages/PaymentsTransactionsPage';
import CustomerLedgerPage from './pages/CustomerLedgerPage';
import SalesReportPage, { SubscriptionReportPage, CustomerReportPage } from './pages/ReportsPages';
import FaqsPage from './pages/FaqsPage';
import ServiceLocationsPage from './pages/ServiceLocationsPage';
import SupportPage from './pages/SupportPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/admin/dashboard" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/admin/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />

          <Route path="/admin/customers" element={<ProtectedRoute><UsersPage /></ProtectedRoute>} />
          <Route path="/admin/customers/profile" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />
          <Route path="/admin/customers/:id" element={<ProtectedRoute><CustomerProfilePage /></ProtectedRoute>} />

          <Route path="/admin/products/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/products/list" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />

          <Route path="/admin/subscriptions/active" element={<ProtectedRoute><SubscriptionsPage status="active" title="Active Subscriptions" /></ProtectedRoute>} />
          <Route path="/admin/subscriptions/paused" element={<ProtectedRoute><SubscriptionsPage status="paused" title="Paused Subscriptions" /></ProtectedRoute>} />
          <Route path="/admin/subscriptions/expired" element={<ProtectedRoute><SubscriptionsPage status="expired" title="Expired Subscriptions" /></ProtectedRoute>} />
          <Route path="/admin/subscriptions/cancelled" element={<ProtectedRoute><SubscriptionsPage status="cancelled" title="Cancelled Subscriptions" /></ProtectedRoute>} />

          <Route path="/admin/skip/requests" element={<ProtectedRoute><SkipRequestsPage /></ProtectedRoute>} />
          <Route path="/admin/skip/carry-forward" element={<ProtectedRoute><CarryForwardPage /></ProtectedRoute>} />

          <Route path="/admin/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
          <Route path="/admin/orders/pending" element={<ProtectedRoute><OrdersPage status="pending" title="Pending Orders" /></ProtectedRoute>} />
          <Route path="/admin/orders/delivered" element={<ProtectedRoute><OrdersPage status="delivered" title="Delivered Orders" /></ProtectedRoute>} />

          <Route path="/admin/inventory/stock" element={<ProtectedRoute><InventoryStockPage /></ProtectedRoute>} />
          <Route path="/admin/inventory/daily-requirement" element={<ProtectedRoute><DailyRequirementPage /></ProtectedRoute>} />

          <Route path="/admin/payments/transactions" element={<ProtectedRoute><PaymentsTransactionsPage /></ProtectedRoute>} />
          <Route path="/admin/payments/ledger" element={<ProtectedRoute><CustomerLedgerPage /></ProtectedRoute>} />

          <Route path="/admin/notifications/push" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
          <Route path="/admin/notifications/sms" element={<ProtectedRoute><PlaceholderPage title="SMS Notifications" description="Bulk bulk SMS, individual SMS, and scheduled SMS will be available here." /></ProtectedRoute>} />

          <Route path="/admin/marketing/banners" element={<ProtectedRoute><BannersPage /></ProtectedRoute>} />

          <Route path="/admin/reports/sales" element={<ProtectedRoute><SalesReportPage /></ProtectedRoute>} />
          <Route path="/admin/reports/subscriptions" element={<ProtectedRoute><SubscriptionReportPage /></ProtectedRoute>} />
          <Route path="/admin/reports/customers" element={<ProtectedRoute><CustomerReportPage /></ProtectedRoute>} />

          <Route path="/admin/faq" element={<ProtectedRoute><FaqsPage /></ProtectedRoute>} />
          <Route path="/admin/content/faqs" element={<Navigate to="/admin/faq" replace />} />
          <Route path="/admin/content/:slug" element={<ProtectedRoute><ContentPage /></ProtectedRoute>} />

          <Route path="/admin/map" element={<ProtectedRoute><ServiceLocationsPage /></ProtectedRoute>} />
          <Route path="/admin/support" element={<ProtectedRoute><SupportPage /></ProtectedRoute>} />

          <Route path="/admin/banners" element={<Navigate to="/admin/marketing/banners" replace />} />
          <Route path="/admin/products" element={<Navigate to="/admin/products/list" replace />} />
          <Route path="/admin/categories" element={<Navigate to="/admin/products/categories" replace />} />
          <Route path="/admin/users" element={<Navigate to="/admin/customers" replace />} />
          <Route path="/admin/subscriptions" element={<Navigate to="/admin/subscriptions/active" replace />} />
          <Route path="/admin/cms" element={<Navigate to="/admin/content/about-us" replace />} />
          <Route path="/admin/notifications" element={<Navigate to="/admin/notifications/push" replace />} />

          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/" element={<Navigate to="/admin/login" replace />} />
          <Route path="*" element={<Navigate to="/admin/login" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
