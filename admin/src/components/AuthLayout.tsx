import type { ReactNode } from 'react';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}

export default function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <aside className="auth-brand-panel">
          <div className="auth-brand-inner">
            <img src="/logo.png" alt="Rudra's Farm Fresh" className="auth-brand-logo" />
            <h1 className="auth-brand-title">Rudra&apos;s Farm Fresh</h1>
            <p className="auth-brand-tagline">
              Admin dashboard — manage products, orders, subscriptions &amp; deliveries.
            </p>
          </div>
        </aside>

        <section className="auth-form-panel">
          <div className="auth-form-inner">
            <div className="auth-form-header">
              <h2 className="auth-form-title">{title}</h2>
              <p className="auth-form-subtitle">{subtitle}</p>
            </div>

            {children}

            {footer ?? (
              <p className="auth-legal">Authorized staff only. Keep your credentials secure.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
