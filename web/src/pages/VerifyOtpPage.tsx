import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { verifyOtp, sendOtp, setPassword, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getPostLoginPath } from '../utils/authRedirect';
import AuthLayout from '../components/AuthLayout';
import AuthPasswordField from '../components/AuthPasswordField';
import { AuthButton } from '../components/AuthButton';

type Step = 'otp' | 'password';

export default function VerifyOtpPage() {
  const [step, setStep] = useState<Step>('otp');
  const [otp, setOtp] = useState('');
  const [password, setPasswordValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const email = (sessionStorage.getItem('otp_email') || '').toLowerCase().trim();

  useEffect(() => {
    if (!email) {
      navigate('/login', { replace: true });
      return;
    }
    const token = localStorage.getItem('web_token');
    if (token && sessionStorage.getItem('needs_password') === '1') {
      setStep('password');
    }
  }, [email, navigate]);

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const code = otp.replace(/\D/g, '');
    if (code.length !== 6) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await verifyOtp(email, code);
      const { token, user, needs_password } = res.data.data;
      login(token, user);

      if (needs_password) {
        sessionStorage.setItem('needs_password', '1');
        setStep('password');
      } else {
        sessionStorage.removeItem('otp_email');
        sessionStorage.removeItem('needs_password');
        const from = (location.state as { from?: string } | null)?.from;
        navigate(getPostLoginPath(from), { replace: true });
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
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
      sessionStorage.removeItem('otp_email');
      sessionStorage.removeItem('needs_password');
      const from = (location.state as { from?: string } | null)?.from;
      navigate(getPostLoginPath(from), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setSuccess('');
    try {
      await sendOtp(email);
      setSuccess('A new code has been sent to your email.');
      setOtp('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setResending(false);
    }
  };

  const steps = [
    { label: 'Verify', active: step === 'otp', done: step === 'password' },
    { label: 'Password', active: step === 'password', done: false },
  ];

  return (
    <AuthLayout
      title={step === 'otp' ? 'Check your email' : 'Secure your account'}
      subtitle={
        step === 'otp'
          ? `We sent a 6-digit code to ${email}`
          : 'Choose a password for future sign-ins.'
      }
      steps={steps}
    >
      {success && <div className="auth-alert auth-alert-success">{success}</div>}
      {error && <div className="auth-alert auth-alert-error">{error}</div>}

      {step === 'otp' ? (
        <>
          <form className="auth-form" onSubmit={handleOtpSubmit}>
            <div className="auth-field">
              <label htmlFor="otp-code" className="auth-label">
                One-time code
              </label>
              <input
                id="otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="· · · · · ·"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="auth-input auth-input-otp"
                required
                autoFocus
              />
            </div>
            <AuthButton type="submit" loading={loading} loadingText="Verifying…">
              Verify code
            </AuthButton>
          </form>

          <div className="auth-secondary-actions">
            <button
              type="button"
              className="auth-text-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
            <span className="auth-dot">·</span>
            <Link to="/login" className="auth-text-btn">
              Change email
            </Link>
          </div>
        </>
      ) : (
        <form className="auth-form" onSubmit={handlePasswordSubmit}>
          <AuthPasswordField
            id="new-password"
            label="Password"
            value={password}
            onChange={setPasswordValue}
            placeholder="At least 6 characters"
            autoComplete="new-password"
            autoFocus
          />
          <AuthPasswordField
            id="confirm-password"
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
      )}

      <p className="auth-footer-link text-center">
        <Link to="/">← Back to home</Link>
      </p>
    </AuthLayout>
  );
}
