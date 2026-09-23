import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const needsPassword = sessionStorage.getItem('needs_password') === '1';

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: `${location.pathname}${location.search}` }}
        replace
      />
    );
  }

  if (needsPassword) {
    const otpEmail = sessionStorage.getItem('otp_email');
    return <Navigate to={otpEmail ? '/verify-otp' : '/set-password'} replace />;
  }

  return <>{children}</>;
}
