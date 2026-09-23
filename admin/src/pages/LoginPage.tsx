import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import AuthPopup from '../components/AuthPopup';
import { AuthButton } from '../components/AuthButton';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState({ show: false, title: '', message: '' });

  const showPopup = (title: string, message: string) => {
    setPopup({ show: true, title, message });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    closePopup();

    const trimmedId = userId.trim();
    if (!trimmedId) {
      showPopup('Missing user ID', 'Please enter your admin user ID.');
      return;
    }
    if (!password) {
      showPopup('Missing password', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await adminLogin(trimmedId, password);
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/admin/dashboard', { replace: true });
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showPopup('Sign in failed', message || 'Invalid user ID or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title="Welcome back"
        subtitle="Sign in to manage products, orders, subscriptions & deliveries."
      >
        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-field">
            <label htmlFor="admin-user-id" className="auth-label">
              User ID
            </label>
            <input
              id="admin-user-id"
              type="text"
              className="auth-input"
              placeholder="Enter your user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              autoComplete="username"
              required
              autoFocus
            />
          </div>

          <AuthPasswordField
            id="admin-password"
            label="Password"
            value={password}
            onChange={setPassword}
            placeholder="Enter your password"
            autoComplete="current-password"
          />

          <AuthButton type="submit" loading={loading} loadingText="Signing in…">
            Sign in
          </AuthButton>
        </form>
      </AuthLayout>

      <AuthPopup
        show={popup.show}
        title={popup.title}
        message={popup.message}
        onClose={closePopup}
      />
    </>
  );
}
