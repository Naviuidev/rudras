import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Row, Col, Card, Alert } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import DashboardTicketsModal, { type DashboardTicketFilter } from '../components/DashboardTicketsModal';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  getActiveSubscription,
  getMySupportTickets,
  getOrders,
  replyToSupportTicket,
  closeSupportTicket,
} from '../services/api';
import type { PaymentSupportTicket } from '../types';

const QUICK_LINKS = [
  { to: '/shop', icon: '🛍️', title: 'Browse shop', desc: 'Fresh milk, ghee & dairy' },
  { to: '/cart', icon: '🛒', title: 'Your cart', desc: 'Review items & checkout' },
  { to: '/orders', icon: '📦', title: 'Order history', desc: 'Track past deliveries' },
  { to: '/subscriptions', icon: '📅', title: 'Subscriptions', desc: 'Schedule daily delivery' },
  { to: '/addresses', icon: '📍', title: 'Addresses', desc: 'Manage delivery locations' },
  { to: '/profile', icon: '👤', title: 'Profile', desc: 'Account & contact details' },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { itemCount } = useCart();
  const location = useLocation();
  const orderSuccess = (location.state as { orderSuccess?: boolean; orderNumber?: string } | null)?.orderSuccess;
  const orderNumber = (location.state as { orderNumber?: string } | null)?.orderNumber;
  const [loading, setLoading] = useState(true);
  const [activeSub, setActiveSub] = useState<boolean>(false);
  const [recentOrders, setRecentOrders] = useState(0);
  const [tickets, setTickets] = useState<PaymentSupportTicket[]>([]);
  const [showTicketsModal, setShowTicketsModal] = useState(false);
  const [ticketFilter, setTicketFilter] = useState<DashboardTicketFilter>('all');
  const [ticketActionLoading, setTicketActionLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getActiveSubscription().then((sub) => setActiveSub(!!sub)),
      getOrders().then((orders) => setRecentOrders(orders.length)),
      getMySupportTickets().then(setTickets).catch(() => setTickets([])),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.name || user?.email?.split('@')[0] || 'Customer';
  const answeredCount = tickets.filter((ticket) => ticket.status === 'resolved').length;
  const pendingCount = tickets.filter(
    (ticket) => ticket.status === 'pending' || ticket.status === 'in_progress'
  ).length;

  const openTickets = (filter: DashboardTicketFilter) => {
    setTicketFilter(filter);
    setShowTicketsModal(true);
  };

  const handleTicketUpdated = (ticket: PaymentSupportTicket) => {
    setTickets((prev) => prev.map((item) => (item.id === ticket.id ? ticket : item)));
  };

  const handleTicketReply = async (ticketId: number, message: string) => {
    setTicketActionLoading(true);
    try {
      const updated = await replyToSupportTicket(ticketId, message);
      handleTicketUpdated(updated);
    } finally {
      setTicketActionLoading(false);
    }
  };

  const handleTicketClose = async (ticketId: number) => {
    setTicketActionLoading(true);
    try {
      const updated = await closeSupportTicket(ticketId);
      handleTicketUpdated(updated);
    } finally {
      setTicketActionLoading(false);
    }
  };

  return (
    <div className="user-account-content">
      <div className="dashboard-hero mb-4">
        <h1 className="dashboard-title">Welcome back, {displayName}!</h1>
        <p className="text-muted mb-0">
          Your account hub — shop fresh dairy, manage deliveries, and track orders from here.
        </p>
      </div>

      {orderSuccess && (
        <Alert variant="success" className="mb-4">
          Payment successful{orderNumber ? ` — order ${orderNumber} has been placed` : ''}. Thank you for your order!
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <Row className="g-3 mb-4">
            <Col xs={6} md={3}>
              <Card className="card-brand dashboard-stat h-100">
                <Card.Body>
                  <div className="text-muted small">Subscription</div>
                  <div className="fw-semibold" style={{ color: 'var(--accent)' }}>
                    {activeSub ? 'Active' : 'None'}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="card-brand dashboard-stat h-100">
                <Card.Body>
                  <div className="text-muted small">Total orders</div>
                  <div className="fw-semibold" style={{ color: 'var(--accent)' }}>
                    {recentOrders}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="card-brand dashboard-stat h-100">
                <Card.Body>
                  <div className="text-muted small">Cart items</div>
                  <div className="fw-semibold" style={{ color: 'var(--accent)' }}>
                    {itemCount}
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={6} md={3}>
              <Card className="card-brand dashboard-stat h-100">
                <Card.Body className="d-flex align-items-center justify-content-between gap-2">
                  <div>
                    <div className="text-muted small">Daily milk</div>
                    <div className="fw-semibold small">{activeSub ? 'Manage plan' : 'Start plan'}</div>
                  </div>
                  <Link
                    to={activeSub ? '/subscriptions' : '/subscriptions/create'}
                    className="btn btn-sm btn-accent"
                  >
                    {activeSub ? 'View' : 'Subscribe'}
                  </Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <section className="mb-4">
            <h2 className="h6 fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
              Quick actions
            </h2>
            <Row className="g-3">
              {QUICK_LINKS.map((link) => (
                <Col xs={6} md={4} lg={4} key={link.to}>
                  <Link to={link.to} className="dashboard-link-card">
                    <span className="dashboard-link-icon" aria-hidden>
                      {link.icon}
                    </span>
                    <span className="dashboard-link-title">{link.title}</span>
                    <span className="dashboard-link-desc">{link.desc}</span>
                  </Link>
                </Col>
              ))}
            </Row>
          </section>

          <section className="dashboard-tickets-section">
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <h2 className="h6 fw-semibold mb-0" style={{ color: 'var(--accent)' }}>
                Support tickets
              </h2>
              <Link to="/help" className="btn btn-sm btn-outline-success rounded-pill">
                Get help
              </Link>
            </div>

            <div className="dashboard-tile-row">
              <button type="button" className="dashboard-tile" onClick={() => openTickets('all')}>
                <span className="dashboard-tile-label">Your tickets</span>
                <span className="dashboard-tile-count">{tickets.length}</span>
              </button>

              <button type="button" className="dashboard-tile" onClick={() => openTickets('answered')}>
                <span className="dashboard-tile-label">Answered</span>
                <span className="dashboard-tile-count">{answeredCount}</span>
              </button>

              <button type="button" className="dashboard-tile" onClick={() => openTickets('pending')}>
                <span className="dashboard-tile-label">Pending</span>
                <span className="dashboard-tile-count">{pendingCount}</span>
              </button>
            </div>
          </section>

          <DashboardTicketsModal
            show={showTicketsModal}
            onClose={() => setShowTicketsModal(false)}
            tickets={tickets}
            filter={ticketFilter}
            onReply={handleTicketReply}
            onCloseTicket={handleTicketClose}
            actionLoading={ticketActionLoading}
          />
        </>
      )}
    </div>
  );
}
