import { useEffect, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  getSkipRequests,
  getCarryForward,
  getActiveSubscription,
  createSkipRequest,
  getErrorMessage,
} from '../services/api';
import type { SkipRequest, CarryForwardLog, Subscription } from '../types';

function requestBadge(status: string) {
  const map: Record<string, string> = { pending: 'warning', approved: 'success', rejected: 'danger' };
  return map[status] || 'secondary';
}

export default function SkipManagementPage() {
  const [requests, setRequests] = useState<SkipRequest[]>([]);
  const [carryForward, setCarryForward] = useState<CarryForwardLog[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [skipDate, setSkipDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    Promise.all([getSkipRequests(), getCarryForward(), getActiveSubscription()])
      .then(([reqs, cf, sub]) => {
        setRequests(reqs);
        setCarryForward(cf);
        setSubscription(sub);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!subscription) {
      setError('No active subscription found');
      return;
    }

    setSubmitting(true);
    try {
      await createSkipRequest({
        subscription_id: subscription.id,
        skip_date: skipDate,
        reason,
      });
      setSuccess('Skip request submitted successfully');
      setSkipDate('');
      setReason('');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const totalBalance = carryForward.reduce((sum, c) => sum + (c.balance_days || 0), 0);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title mb-0">Skip Management</h4>
        <Link to="/subscriptions" className="btn btn-sm btn-outline-success">
          Back
        </Link>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Row className="g-4">
        <Col lg={5}>
          <Card className="card-brand mb-3">
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Request Skip
              </h6>
              {!subscription ? (
                <EmptyState
                  title="No active subscription"
                  message="You need an active subscription to skip deliveries"
                  actionLabel="View Subscriptions"
                  actionHref="/subscriptions"
                />
              ) : (
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Skip Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={skipDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSkipDate(e.target.value)}
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Reason (optional)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Travel, festival, etc."
                    />
                  </Form.Group>
                  <Button type="submit" className="btn-accent w-100" disabled={submitting}>
                    {submitting ? 'Submitting...' : 'Submit Skip Request'}
                  </Button>
                </Form>
              )}
            </Card.Body>
          </Card>

          <Card className="card-brand">
            <Card.Body>
              <h6 className="fw-semibold mb-2" style={{ color: 'var(--accent)' }}>
                Carry Forward Summary
              </h6>
              <p className="mb-1">
                Total balance days: <strong>{totalBalance}</strong>
              </p>
              {carryForward.length === 0 ? (
                <p className="text-muted small mb-0">No carry forward history</p>
              ) : (
                carryForward.slice(0, 5).map((cf) => (
                  <div key={cf.id} className="small border-bottom py-2">
                    <span>Skipped: {cf.skipped_days} | Added: {cf.added_days} | Balance: {cf.balance_days}</span>
                    {cf.note && <p className="text-muted mb-0">{cf.note}</p>}
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={7}>
          <Card className="card-brand">
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Skip Requests
              </h6>
              {requests.length === 0 ? (
                <p className="text-muted text-center py-4">No skip requests yet</p>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="d-flex justify-content-between align-items-center border-bottom py-3">
                    <div>
                      <Badge bg={requestBadge(req.status)} className="badge-status text-capitalize mb-1">
                        {req.status}
                      </Badge>
                      <p className="mb-0 small">
                        <strong>{req.skip_date}</strong>
                        {req.reason && ` — ${req.reason}`}
                      </p>
                    </div>
                    <small className="text-muted">{req.created_at?.split(' ')[0]}</small>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
