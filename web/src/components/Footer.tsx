import { Link } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import FooterFaq from './FooterFaq';

const ACTION_LINKS = [
  { to: '/faqs', label: 'FAQs' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/return-policy', label: 'Return Policy' },
  { to: '/terms', label: 'Terms and Conditions' },
  { to: '/billing-cycle', label: 'Billing Cycle' },
];

const SOCIAL_LINKS = [
  {
    label: 'Twitter',
    href: 'https://twitter.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'Facebook',
    href: 'https://facebook.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
  },
];

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export default function Footer() {
  return (
    <footer className="site-footer">
      <Container>
        <FooterFaq />

        <div className="site-footer-brand">
          <Link to="/" className="site-footer-logo-link" aria-label="Rudra's Farm Fresh home">
            <img src="/logo.png" alt="Rudra's Farm Fresh" className="site-footer-logo" />
          </Link>
          <p className="site-footer-tagline">
            We supply fresh raw milk which reaches your door step within few hours of milking.
          </p>
        </div>

        <div className="site-footer-columns">
          <div className="site-footer-col">
            <h3 className="site-footer-col-title">Write us</h3>
            <a href="mailto:rudrasfarmfresh@gmail.com" className="site-footer-text-link">
              rudrasfarmfresh@gmail.com
            </a>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-col-title">Address</h3>
            <p className="site-footer-col-text">
              13-1521/1, 2nd Floor-1 B C Colony. Balaji Nagar Arilova, Visakhapatnam Urban, Pin:530040
            </p>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-col-title">Phone</h3>
            <a href="tel:+917989149573" className="site-footer-text-link site-footer-phone">
              +91 7989149573
            </a>
            <a href="tel:+919014108517" className="site-footer-text-link site-footer-phone">
              +91 9014108517
            </a>
          </div>

          <div className="site-footer-col">
            <h3 className="site-footer-col-title">Actions</h3>
            <nav className="site-footer-actions" aria-label="Footer actions">
              {ACTION_LINKS.map((link) => (
                <Link key={link.to} to={link.to} className="site-footer-action-link">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="site-footer-bottom">
          <div className="site-footer-social">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                className="site-footer-social-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
              >
                {social.icon}
              </a>
            ))}
          </div>

          <button
            type="button"
            className="site-footer-back-top"
            onClick={scrollToTop}
            aria-label="Back to top"
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 8l-6 6h12z" />
            </svg>
          </button>
        </div>
      </Container>
      <div className="site-footer-wave" aria-hidden />
    </footer>
  );
}
