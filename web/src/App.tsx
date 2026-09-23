import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import UserAccountLayout from './components/UserAccountLayout';
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';
import LoginPage from './pages/LoginPage';
import VerifyOtpPage from './pages/VerifyOtpPage';
import SetPasswordPage from './pages/SetPasswordPage';
import PasswordSetupRoute from './components/PasswordSetupRoute';
import DashboardPage from './pages/DashboardPage';
import WishlistPage from './pages/WishlistPage';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage';
import ProductsPublicGate from './components/ProductsPublicGate';
import ProductDetailRedirect from './components/ProductDetailRedirect';
import CreateSubscriptionPage from './pages/CreateSubscriptionPage';
import MySubscriptionsPage from './pages/MySubscriptionsPage';
import DeliveryCalendarPage from './pages/DeliveryCalendarPage';
import SkipManagementPage from './pages/SkipManagementPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentFailedPage from './pages/PaymentFailedPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import AddressesPage from './pages/AddressesPage';
import SupportPage from './pages/SupportPage';
import CmsPage from './pages/CmsPage';
import FaqsPage from './pages/FaqsPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/verify-otp" element={<GuestRoute><VerifyOtpPage /></GuestRoute>} />
        <Route
          path="/set-password"
          element={
            <PasswordSetupRoute>
              <SetPasswordPage />
            </PasswordSetupRoute>
          }
        />
        <Route path="/products" element={<ProductsPublicGate />} />
        <Route path="/products/:id" element={<ProductDetailRedirect />} />
        <Route path="/about" element={<CmsPage slug="about" title="About Us" />} />
        <Route path="/privacy" element={<CmsPage slug="privacy" title="Privacy Policy" />} />
        <Route path="/return-policy" element={<CmsPage slug="return-policy" title="Return Policy" />} />
        <Route path="/terms" element={<CmsPage slug="terms" title="Terms & Conditions" />} />
        <Route path="/billing-cycle" element={<CmsPage slug="billing-cycle" title="Billing Cycle" />} />
        <Route path="/faqs" element={<FaqsPage />} />
        <Route path="/support" element={<SupportPage />} />

        <Route element={<ProtectedRoute><UserAccountLayout /></ProtectedRoute>}>
          <Route path="/shop" element={<ProductsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/subscriptions" element={<MySubscriptionsPage />} />
          <Route path="/subscriptions/create" element={<CreateSubscriptionPage />} />
          <Route path="/subscriptions/calendar" element={<DeliveryCalendarPage />} />
          <Route path="/skip" element={<SkipManagementPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment/success" element={<PaymentSuccessPage />} />
          <Route path="/payment/failed" element={<PaymentFailedPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/help" element={<SupportPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
