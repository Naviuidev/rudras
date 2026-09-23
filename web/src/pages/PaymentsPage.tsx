import { useEffect, useState } from 'react';
import { Container, Card, Badge, Table, Row, Col } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { getPayments, getMyLedger, getErrorMessage } from '../services/api';
import type { Payment, Ledger } from '../types';

function paymentBadge(status: string) {
  const map: Record<string, string> = { paid: 'success', pending: 'warning', failed: 'danger' };
  return map[status] || 'secondary';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [ledger, setLedger] = useState<Ledger | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getPayments(), getMyLedger()])
      .then(([p, l]) => {
        setPayments(p);
        setLedger(l);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <h4 className="section-title">Payments & Ledger</h4>
      {error && <p className="text-danger">{error}</p>}

      {ledger && (
        <Row xs={2} md={4} className="g-3 mb-4">
          <Col>
            <Card className="card-brand text-center p-3">
              <small className="text-muted">Paid</small>
              <strong className="price-tag">₹{ledger.paid.toFixed(2)}</strong>
            </Card>
          </Col>
          <Col>
            <Card className="card-brand text-center p-3">
              <small className="text-muted">Pending</small>
              <strong>₹{ledger.pending.toFixed(2)}</strong>
            </Card>
          </Col>
          <Col>
            <Card className="card-brand text-center p-3">
              <small className="text-muted">Wallet</small>
              <strong>₹{ledger.wallet_balance.toFixed(2)}</strong>
            </Card>
          </Col>
          <Col>
            <Card className="card-brand text-center p-3">
              <small className="text-muted">Carry Forward</small>
              <strong>{ledger.carry_forward_balance} days</strong>
            </Card>
          </Col>
        </Row>
      )}

      <Card className="card-brand">
        <Card.Body>
          <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
            Transaction History
          </h6>
          {payments.length === 0 ? (
            <p className="text-muted text-center py-4">No transactions yet</p>
          ) : (
            <div className="table-responsive">
              <Table hover size="sm" className="mb-0">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Transaction</th>
                    <th>Amount</th>
                    <th>Type</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="small">{p.payment_date?.split(' ')[0]}</td>
                      <td className="small">{p.transaction_id}</td>
                      <td>₹{p.amount}</td>
                      <td className="text-capitalize small">{p.reference_type || '-'}</td>
                      <td>
                        <Badge bg={paymentBadge(p.payment_status)} className="badge-status text-capitalize">
                          {p.payment_status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}
