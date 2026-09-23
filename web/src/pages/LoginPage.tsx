import { useState, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sendOtp, loginWithPassword, getErrorMessage, getErrorCode } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPostLoginPath } from '../utils/authRedirect';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import AuthPopup from '../components/AuthPopup';
import { AuthButton } from '../components/AuthButton';

type AuthMode = 'login' | 'signup';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [popup, setPopup] = useState({ show: false, title: '', message: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const showPopup = (title: string, message: string) => {
    setPopup({ show: true, title, message });
  };

  const closePopup = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  const validateGmail = (value: string) => /@gmail\.com$/i.test(value.trim());

  const handleModeChange = (next: AuthMode) => {
    setMode(next);
    setPassword('');
    closePopup();
  };

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    closePopup();

    const trimmed = email.trim().toLowerCase();
    if (!validateGmail(trimmed)) {
      showPopup('Invalid email', 'Please enter a valid Gmail address (@gmail.com only).');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(trimmed);
      sessionStorage.setItem('otp_email', trimmed);
      navigate('/verify-otp');
    } catch (err) {
      showPopup('Sign up failed', getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    closePopup();

    const trimmed = email.trim().toLowerCase();
    if (!validateGmail(trimmed)) {
      showPopup('Invalid email', 'Please enter a valid Gmail address (@gmail.com only).');
      return;
    }
    if (!password) {
      showPopup('Missing password', 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginWithPassword(trimmed, password);
      const { token, user } = res.data.data;
      sessionStorage.removeItem('needs_password');
      sessionStorage.removeItem('otp_email');
      login(token, user);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(getPostLoginPath(from), { replace: true });
    } catch (err) {
      const code = getErrorCode(err);
      if (code === 'ACCOUNT_NOT_FOUND') {
        showPopup('Sign in failed', 'No account found');
      } else if (code === 'INVALID_CREDENTIALS') {
        showPopup('Sign in failed', 'Invalid email or password');
      } else {
        showPopup('Sign in failed', getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AuthLayout
        title={mode === 'login' ? 'Welcome back' : 'Create your account'}
        subtitle={
          mode === 'login'
            ? 'Sign in to manage orders, subscriptions & deliveries.'
            : 'Use your Gmail — we’ll verify you with a one-time code.'
        }
      >
        <div className="auth-mode-switch" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => handleModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => handleModeChange('signup')}
          >
            Sign Up
          </button>
        </div>

        {mode === 'signup' ? (
          <form className="auth-form" onSubmit={handleSignup}>
            <div className="auth-field">
              <label htmlFor="signup-email" className="auth-label">
                Gmail address
              </label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
              <p className="auth-hint">Only @gmail.com addresses are supported</p>
            </div>
            <AuthButton type="submit" loading={loading} loadingText="Sending code…">
              Continue with OTP
            </AuthButton>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="auth-field">
              <label htmlFor="login-email" className="auth-label">
                Gmail address
              </label>
              <input
                id="login-email"
                type="email"
                className="auth-input"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                autoFocus
              />
            </div>
            <AuthPasswordField
              id="login-password"
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
        )}

        <p className="auth-footer-link text-center">
          <Link to="/">← Back to home</Link>
        </p>
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
