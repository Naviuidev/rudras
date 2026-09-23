import { Navigate } from 'react-router-dom';

export default function PasswordSetupRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('web_token');
  const needsPassword = sessionStorage.getItem('needs_password') === '1';

  if (!token || !needsPassword) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
