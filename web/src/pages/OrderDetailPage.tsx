import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Card, Badge, Alert, Table } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { getOrder, getErrorMessage } from '../services/api';
import type { Order } from '../types';

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getOrder(Number(id))
      .then(setOrder)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;

  if (error || !order) {
    return (
      <div className="user-account-content">
        <Alert variant="danger">{error || 'Order not found'}</Alert>
        <Link to="/orders">Back to orders</Link>
      </div>
    );
  }

  return (
    <div className="user-account-content">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h4 className="section-title mb-0">Order {order.order_number}</h4>
        <Link to="/orders" style={{ color: 'var(--accent)' }}>← Back</Link>
      </div>

      <Card className="card-brand mb-3">
        <Card.Body>
          <div className="d-flex flex-wrap gap-2 mb-3">
            <Badge bg="info" className="badge-status text-capitalize">
              {order.order_status.replace(/_/g, ' ')}
            </Badge>
            {order.payment_status && (
              <Badge bg={order.payment_status === 'paid' ? 'success' : 'warning'} className="badge-status text-capitalize">
                Payment: {order.payment_status}
              </Badge>
            )}
          </div>
          <p className="small mb-1"><strong>Date:</strong> {order.created_at}</p>
          <p className="small mb-1"><strong>Total:</strong> ₹{order.total_amount}</p>
          {order.delivery_address && (
            <p className="small mb-0"><strong>Delivery:</strong> {order.delivery_address}</p>
          )}
        </Card.Body>
      </Card>

      {order.items && order.items.length > 0 && (
        <Card className="card-brand">
          <Card.Body>
            <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>Items</h6>
            <div className="table-responsive">
              <Table size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td>{item.product_name || `Product #${item.product_id}`}</td>
                      <td>{item.quantity}</td>
                      <td>₹{item.price}</td>
                      <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}
