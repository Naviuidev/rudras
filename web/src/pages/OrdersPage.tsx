import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Card, Badge } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getOrders, getErrorMessage } from '../services/api';
import type { Order } from '../types';

function orderStatusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    confirmed: 'info',
    packed: 'primary',
    out_for_delivery: 'info',
    delivered: 'success',
    cancelled: 'danger',
  };
  return map[status] || 'secondary';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <h4 className="section-title">My Orders</h4>
      {error && <p className="text-danger">{error}</p>}

      {orders.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          message="Your order history will appear here"
          actionLabel="Shop Now"
          actionHref="/shop"
        />
      ) : (
        orders.map((order) => (
          <Card key={order.id} className="card-brand mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                <div>
                  <Link to={`/orders/${order.id}`} className="fw-semibold" style={{ color: 'var(--accent)' }}>
                    {order.order_number}
                  </Link>
                  <p className="text-muted small mb-1">{order.created_at?.split(' ')[0]}</p>
                  <p className="mb-0 small">
                    {order.items?.length ?? 0} item(s) | ₹{order.total_amount}
                  </p>
                </div>
                <div className="text-end">
                  <Badge bg={orderStatusBadge(order.order_status)} className="badge-status text-capitalize mb-1">
                    {order.order_status.replace(/_/g, ' ')}
                  </Badge>
                  {order.payment_status && (
                    <Badge bg={order.payment_status === 'paid' ? 'success' : 'warning'} className="badge-status ms-1 text-capitalize">
                      {order.payment_status}
                    </Badge>
                  )}
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </div>
  );
}
