import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getPayments } from '../services/api';

export default function PaymentsTransactionsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getPayments(filter || undefined).then((res) => setPayments(res.data.data || []));
  }, [filter]);

  return (
    <Layout title="Transactions">
      <select className="form-select w-auto rounded-pill mb-3" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All</option><option value="paid">Paid</option><option value="pending">Pending</option><option value="failed">Failed</option>
      </select>
      <div className="page-card">
        <table className="table table-hover">
          <thead><tr><th>Transaction ID</th><th>Customer</th><th>Amount</th><th>Method</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p.id}>
                <td className="fw-medium">{p.transaction_id}</td><td>{p.user_name}</td><td>₹{p.amount}</td><td>{p.payment_method}</td>
                <td>{new Date(p.payment_date).toLocaleDateString()}</td>
                <td><span className={`badge bg-${p.payment_status === 'paid' ? 'success' : p.payment_status === 'pending' ? 'warning' : 'danger'}`}>{p.payment_status}</span></td>
              </tr>
            ))}
            {!payments.length && <tr><td colSpan={6} className="text-muted text-center">No transactions yet</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
