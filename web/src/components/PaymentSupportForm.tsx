import { FormEvent, useEffect, useState } from 'react';
import { Form, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage, submitPaymentSupport } from '../services/api';

export const PAYMENT_SUPPORT_SERVICES = [
  'Payment success but order not confirmed',
  'Payment status pending but money got debited',
  'Issue with the payment initiation',
  'Message us',
] as const;

function SupportSuccessPopup({
  show,
  ticketNumber,
  onClose,
}: {
  show: boolean;
  ticketNumber: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!show) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="auth-popup-backdrop" onClick={onClose} role="presentation">
      <div
        className="auth-popup packaging-support-success-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-support-success-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="packaging-support-success-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="26" height="26">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.75" />
            <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M8 12l3 3 5-6" />
          </svg>
        </div>
        <h3 id="payment-support-success-title" className="auth-popup-title">
          Thanks for reaching us
        </h3>
        <p className="auth-popup-message">
          We will get back to you soon. Your ticket <strong>{ticketNumber}</strong> has been created.
        </p>
        <p className="auth-popup-message mb-0">
          Check the status of your ticket in the{' '}
          <Link to="/dashboard" onClick={onClose}>
            profile dashboard
          </Link>
          .
        </p>
        <button
          type="button"
          className="btn btn-outline-success rounded-pill packaging-info-popup-btn mt-3"
          onClick={onClose}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default function PaymentSupportForm() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successTicket, setSuccessTicket] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.mobile || '');
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const result = await submitPaymentSupport({
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        service_type: serviceType,
        message: message.trim(),
      });
      setSuccessTicket(result.ticket_number);
      setShowSuccess(true);
      setMessage('');
      setServiceType('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="payment-support-form-card">
        <h3 className="payment-support-form-title">Payment &amp; Order Support</h3>
        <p className="payment-support-form-subtitle">
          Facing a payment or order issue? Tell us and we will help you resolve it quickly.
        </p>

        {error && <div className="payment-support-form-error">{error}</div>}

        <Form onSubmit={handleSubmit} className="payment-support-form">
          <Row className="g-3 mb-3">
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Full name</Form.Label>
                <Form.Control
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="Your full name"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                />
              </Form.Group>
            </Col>
            <Col xs={12} md={4}>
              <Form.Group>
                <Form.Label>Mobile</Form.Label>
                <Form.Control
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Select service</Form.Label>
            <Form.Select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              <option value="" disabled>
                Choose an issue type
              </option>
              {PAYMENT_SUPPORT_SERVICES.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              placeholder={
                serviceType === 'Message us'
                  ? 'Type your message…'
                  : 'Describe your payment or order issue…'
              }
            />
          </Form.Group>

          <button
            type="submit"
            className="btn btn-outline-success rounded-pill w-100"
            disabled={submitting}
          >
            {submitting ? 'Submitting…' : 'Submit'}
          </button>
        </Form>
      </div>

      <SupportSuccessPopup
        show={showSuccess}
        ticketNumber={successTicket}
        onClose={() => setShowSuccess(false)}
      />
    </>
  );
}
