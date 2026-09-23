import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Nav, Tab, Card, Button, Badge, Alert, Modal, Form } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  getSubscriptions,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  getErrorMessage,
} from '../services/api';
import type { Subscription } from '../types';

const TABS = ['active', 'paused', 'expired', 'cancelled'] as const;

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    expired: 'secondary',
    cancelled: 'danger',
  };
  return map[status] || 'secondary';
}

export default function MySubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [showCancel, setShowCancel] = useState<Subscription | null>(null);

  const load = () => {
    setLoading(true);
    getSubscriptions()
      .then(setSubscriptions)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id: number, action: 'pause' | 'resume' | 'cancel') => {
    setActionLoading(id);
    setError('');
    try {
      if (action === 'pause') await pauseSubscription(id);
      else if (action === 'resume') await resumeSubscription(id);
      else await cancelSubscription(id);
      setShowCancel(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionLoading(null);
    }
  };

  const filterByStatus = (status: string) =>
    subscriptions.filter((s) => s.status === status);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="section-title mb-0">My Subscriptions</h4>
        <div className="d-flex gap-2 flex-wrap">
          <Link to="/subscriptions/create" className="btn btn-sm btn-accent">
            New Subscription
          </Link>
          <Link to="/subscriptions/calendar" className="btn btn-sm btn-outline-success">
            Calendar
          </Link>
          <Link to="/skip" className="btn btn-sm btn-outline-success">
            Skip Delivery
          </Link>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {subscriptions.length === 0 ? (
        <EmptyState
          icon="🥛"
          title="No subscriptions yet"
          message="Start a milk subscription for daily fresh delivery"
          actionLabel="Create Subscription"
          actionHref="/subscriptions/create"
        />
      ) : (
        <Tab.Container defaultActiveKey="active">
          <Nav variant="pills" className="mb-3 flex-nowrap overflow-auto">
            {TABS.map((tab) => (
              <Nav.Item key={tab}>
                <Nav.Link eventKey={tab} className="text-capitalize">
                  {tab} ({filterByStatus(tab).length})
                </Nav.Link>
              </Nav.Item>
            ))}
          </Nav>
          <Tab.Content>
            {TABS.map((tab) => (
              <Tab.Pane key={tab} eventKey={tab}>
                {filterByStatus(tab).length === 0 ? (
                  <p className="text-muted text-center py-4">No {tab} subscriptions</p>
                ) : (
                  filterByStatus(tab).map((sub) => (
                    <Card key={sub.id} className="card-brand mb-3">
                      <Card.Body>
                        <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                          <div>
                            <Badge bg={statusBadge(sub.status)} className="badge-status mb-2 text-capitalize">
                              {sub.status}
                            </Badge>
                            <h6 className="mb-1">Subscription #{sub.id}</h6>
                            <p className="text-muted small mb-1">
                              {sub.start_date} → {sub.end_date}
                            </p>
                            <p className="small mb-0">
                              Qty: {sub.quantity} | {sub.remaining_days}/{sub.total_days} days remaining
                            </p>
                            <p className="small mb-0">₹{sub.price_per_day}/day | Total: ₹{sub.total_amount}</p>
                            {sub.carried_forward_days ? (
                              <p className="small text-warning mb-0">
                                Carry forward: {sub.carried_forward_days} days
                              </p>
                            ) : null}
                          </div>
                          <div className="d-flex gap-2 flex-wrap">
                            {sub.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline-warning"
                                  disabled={actionLoading === sub.id}
                                  onClick={() => handleAction(sub.id, 'pause')}
                                >
                                  Pause
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => setShowCancel(sub)}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {sub.status === 'paused' && (
                              <Button
                                size="sm"
                                className="btn-accent"
                                disabled={actionLoading === sub.id}
                                onClick={() => handleAction(sub.id, 'resume')}
                              >
                                Resume
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  ))
                )}
              </Tab.Pane>
            ))}
          </Tab.Content>
        </Tab.Container>
      )}

      <Modal show={!!showCancel} onHide={() => setShowCancel(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Cancel Subscription</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to cancel subscription #{showCancel?.id}? This action cannot be undone.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCancel(null)}>
            Keep
          </Button>
          <Button
            variant="danger"
            disabled={actionLoading === showCancel?.id}
            onClick={() => showCancel && handleAction(showCancel.id, 'cancel')}
          >
            Cancel Subscription
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
