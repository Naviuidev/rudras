import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const needsPassword = sessionStorage.getItem('needs_password') === '1';

  if (isAuthenticated && !needsPassword) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
