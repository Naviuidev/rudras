import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setPassword, getErrorMessage } from '../services/api';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';

export default function SetPasswordPage() {
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    const needsPassword = sessionStorage.getItem('needs_password') === '1';
    if (!token || !needsPassword) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await setPassword(password);
      sessionStorage.removeItem('needs_password');
      sessionStorage.removeItem('otp_email');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Secure your account"
      subtitle="Choose a password for future sign-ins."
      steps={[
        { label: 'Verify', active: false, done: true },
        { label: 'Password', active: true, done: false },
      ]}
    >
      {error && <div className="auth-alert auth-alert-error">{error}</div>}

      <form className="auth-form" onSubmit={handleSubmit}>
        <AuthPasswordField
          id="set-password"
          label="Password"
          value={password}
          onChange={setPasswordValue}
          placeholder="At least 6 characters"
          autoComplete="new-password"
          autoFocus
        />
        <AuthPasswordField
          id="set-confirm-password"
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter password"
          autoComplete="new-password"
        />
        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? 'Saving…' : 'Complete sign up'}
        </button>
      </form>

      <p className="auth-footer-link text-center">
        <Link to="/login">← Back to login</Link>
      </p>
    </AuthLayout>
  );
}
