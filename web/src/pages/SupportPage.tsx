import { useEffect, useState, FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Row, Col } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { getSupportInfo, sendSupportMessage, getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { SupportInfo } from '../types';

export default function SupportPage() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const inAccountShell = pathname === '/help';
  const [info, setInfo] = useState<SupportInfo | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getSupportInfo()
      .then(setInfo)
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email);
    }
  }, [user]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await sendSupportMessage({ name, email, message });
      setSuccess('Your message has been sent. We will get back to you soon.');
      setMessage('');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const content = (
    <div className={inAccountShell ? 'user-account-content' : ''}>
      <h1 className={inAccountShell ? 'category-shop-title mb-3' : 'section-title'}>
        Support & Help
      </h1>

      <Row className="g-4">
        <Col md={5}>
          <Card className="card-brand h-100">
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Contact Information
              </h6>
              {info ? (
                <>
                  <p className="mb-2">
                    <strong>Phone:</strong>{' '}
                    <a href={`tel:${info.phone}`} style={{ color: 'var(--accent)' }}>
                      {info.phone}
                    </a>
                  </p>
                  <p className="mb-2">
                    <strong>Email:</strong>{' '}
                    <a href={`mailto:${info.email}`} style={{ color: 'var(--accent)' }}>
                      {info.email}
                    </a>
                  </p>
                  <p className="mb-0">
                    <strong>WhatsApp:</strong>{' '}
                    <a
                      href={`https://wa.me/${info.whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)' }}
                    >
                      {info.whatsapp}
                    </a>
                  </p>
                </>
              ) : (
                <p className="text-muted">Contact info unavailable</p>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={7}>
          <Card className="card-brand">
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Send us a Message
              </h6>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control value={name} onChange={(e) => setName(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    placeholder="How can we help you?"
                  />
                </Form.Group>
                <Button type="submit" className="btn-accent" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  if (inAccountShell) return content;

  return <Container className="page-container">{content}</Container>;
}
