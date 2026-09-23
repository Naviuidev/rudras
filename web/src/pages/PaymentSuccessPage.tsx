import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Alert } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { verifyPayment, getErrorMessage } from '../services/api';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState('');
  const txnId = searchParams.get('txn') || searchParams.get('transaction_id') || '';

  useEffect(() => {
    if (!txnId) {
      setError('Transaction ID not found');
      setLoading(false);
      return;
    }

    verifyPayment({ transaction_id: txnId })
      .then((result) => {
        setPaid(result.paid);
        if (result.paid) {
          window.setTimeout(() => navigate('/dashboard', { replace: true }), 1500);
        }
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [txnId, navigate]);

  if (loading) return <LoadingSpinner message="Verifying payment..." />;

  return (
    <div className="user-account-content">
      <Card className="card-brand text-center mx-auto" style={{ maxWidth: 480 }}>
        <Card.Body className="p-4">
          {error ? (
            <>
              <div style={{ fontSize: '3rem' }}>⚠️</div>
              <h5 className="mt-3">Verification Issue</h5>
              <Alert variant="warning" className="mt-3">{error}</Alert>
            </>
          ) : paid ? (
            <>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h5 className="mt-3 text-success">Payment Successful!</h5>
              <p className="text-muted">Redirecting you to your dashboard…</p>
              {txnId && <p className="small text-muted">Transaction: {txnId}</p>}
            </>
          ) : (
            <>
              <div style={{ fontSize: '3rem' }}>❌</div>
              <h5 className="mt-3 text-danger">Payment Not Confirmed</h5>
              <p className="text-muted">We could not verify your payment. Please contact support.</p>
            </>
          )}
          <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
            <Link to="/dashboard" className="btn btn-accent">
              Go to Dashboard
            </Link>
            <Link to="/orders" className="btn btn-outline-success">
              View Orders
            </Link>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
}
