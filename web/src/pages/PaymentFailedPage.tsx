import { Link, useSearchParams } from 'react-router-dom';
import { Container, Card, Button, Alert } from 'react-bootstrap';

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams();
  const reason = searchParams.get('reason') || searchParams.get('message') || '';
  const txnId = searchParams.get('txn') || searchParams.get('transaction_id') || '';

  return (
    <div className="user-account-content">
      <Card className="card-brand text-center mx-auto" style={{ maxWidth: 480 }}>
        <Card.Body className="p-4">
          <div style={{ fontSize: '3rem' }}>❌</div>
          <h5 className="mt-3 text-danger">Payment Failed</h5>
          <p className="text-muted">
            Your payment could not be completed. No amount has been charged.
          </p>
          {reason && <Alert variant="danger">{reason}</Alert>}
          {txnId && <p className="small text-muted">Reference: {txnId}</p>}
          <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
            <Link to="/checkout" className="btn btn-accent">
              Try Again
            </Link>
            <Link to="/cart" className="btn btn-outline-success">
              Back to Cart
            </Link>
            <Link to="/support" className="btn btn-link" style={{ color: 'var(--accent)' }}>
              Contact Support
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
