import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  steps?: { label: string; active: boolean; done?: boolean }[];
}

export default function AuthLayout({ title, subtitle, children, footer, steps }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-brand-panel">
          <div className="auth-brand-inner">
            <img src="/logo.png" alt="Rudra's Farm Fresh" className="auth-brand-logo" />
            <h1 className="auth-brand-title">Rudra&apos;s Farm Fresh</h1>
            <p className="auth-brand-tagline">
              Farm-fresh milk &amp; dairy delivered to your doorstep.
            </p>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-form-inner">
            {steps && steps.length > 0 && (
              <div className="auth-steps" aria-label="Sign up progress">
                {steps.map((step, i) => (
                  <div key={step.label} className="auth-step-wrap">
                    <div
                      className={`auth-step ${step.done ? 'done' : ''} ${step.active ? 'active' : ''}`}
                    >
                      {step.done ? '✓' : i + 1}
                    </div>
                    <span className={`auth-step-label ${step.active ? 'active' : ''}`}>{step.label}</span>
                    {i < steps.length - 1 && <div className={`auth-step-line ${step.done ? 'done' : ''}`} />}
                  </div>
                ))}
              </div>
            )}

            <div className="auth-form-header">
              <h2 className="auth-form-title">{title}</h2>
              <p className="auth-form-subtitle">{subtitle}</p>
            </div>

            {children}

            {footer ?? (
              <p className="auth-legal">
                By continuing, you agree to our{' '}
                <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
