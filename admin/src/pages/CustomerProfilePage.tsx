import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BtnIcon from '../components/BtnIcon';
import { useToast } from '../context/ToastContext';
import { getCustomer, pauseSubscription, resumeSubscription, cancelSubscription } from '../services/api';

export default function CustomerProfilePage() {
  const { id } = useParams<{ id?: string }>();
  const { showToast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    if (!id) { setLoading(false); return; }
    getCustomer(+id).then((res) => setData(res.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleSubAction = async (action: 'pause' | 'resume' | 'cancel') => {
    const subId = data?.active_subscription?.id;
    if (!subId) return;
    try {
      if (action === 'pause') await pauseSubscription(subId);
      if (action === 'resume') await resumeSubscription(subId);
      if (action === 'cancel') await cancelSubscription(subId);
      showToast(`Subscription ${action}d`);
      load();
    } catch {
      showToast('Action failed', 'error');
    }
  };

  if (!id) {
    return (
      <Layout title="Customer Profile">
        <div className="page-card">
          <p className="text-muted mb-3">Select a customer from the list to view their profile.</p>
          <Link to="/admin/customers" className="btn btn-accent"><BtnIcon name="manage" /> Go to Customer List</Link>
        </div>
      </Layout>
    );
  }

  if (loading) return <Layout title="Customer Profile"><div className="page-card text-muted">Loading...</div></Layout>;
  if (!data?.user) return <Layout title="Customer Profile"><div className="page-card text-muted">Customer not found.</div></Layout>;

  const { user, active_subscription, orders, payments, ledger, skip_requests, delivery_summary } = data;

  return (
    <Layout title={`Customer — ${user.name || user.email}`}>
      <div className="row g-4">
        <div className="col-lg-6">
          <div className="page-card">
            <h6 className="fw-semibold mb-3">Personal Information</h6>
            {[['Name', user.name], ['Mobile', user.mobile], ['Email', user.email], ['Area', user.area], ['Address', user.address], ['Registered', new Date(user.created_at).toLocaleDateString()]].map(([l, v]) => (
              <div className="profile-field" key={l as string}><span>{l}</span><strong>{v || '—'}</strong></div>
            ))}
          </div>
        </div>
        <div className="col-lg-6">
          <div className="page-card">
            <h6 className="fw-semibold mb-3">Subscription Information</h6>
            {active_subscription ? (
              <>
                <div className="profile-field"><span>Status</span><strong>{active_subscription.status}</strong></div>
                <div className="profile-field"><span>Quantity</span><strong>{active_subscription.quantity}L/day</strong></div>
                <div className="profile-field"><span>Remaining Days</span><strong>{active_subscription.remaining_days}</strong></div>
                <div className="profile-field"><span>Carry Forward</span><strong>{active_subscription.carried_forward_days} days</strong></div>
                {delivery_summary && (
                  <div className="profile-field"><span>Delivered / Skipped</span><strong>{delivery_summary.delivered_days} / {delivery_summary.skipped_days}</strong></div>
                )}
                <div className="d-flex flex-wrap gap-2 mt-3">
                  {active_subscription.status === 'active' && <button className="btn btn-sm btn-outline-warning" onClick={() => handleSubAction('pause')}><BtnIcon name="pause" /> Pause</button>}
                  {active_subscription.status === 'paused' && <button className="btn btn-sm btn-outline-success" onClick={() => handleSubAction('resume')}><BtnIcon name="resume" /> Resume</button>}
                  <button className="btn btn-sm btn-outline-danger" onClick={() => handleSubAction('cancel')}><BtnIcon name="delete" /> Cancel</button>
                </div>
              </>
            ) : <p className="text-muted mb-0">No active subscription</p>}
          </div>
          <div className="page-card mt-3">
            <h6 className="fw-semibold mb-3">Wallet & Ledger</h6>
            <div className="profile-field"><span>Wallet Balance</span><strong>₹{ledger?.wallet_balance ?? 0}</strong></div>
            <div className="profile-field"><span>Paid</span><strong>₹{ledger?.paid ?? 0}</strong></div>
            <div className="profile-field"><span>Pending</span><strong>₹{ledger?.pending ?? 0}</strong></div>
          </div>
        </div>
      </div>

      <div className="page-card mt-4">
        <h6 className="fw-semibold mb-3">Order History</h6>
        <table className="table table-sm"><thead><tr><th>Order #</th><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>{(orders || []).map((o: any) => <tr key={o.id}><td>{o.order_number}</td><td>{new Date(o.created_at).toLocaleDateString()}</td><td>₹{o.total_amount}</td><td>{o.order_status}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="page-card mt-4">
        <h6 className="fw-semibold mb-3">Payment History</h6>
        <table className="table table-sm"><thead><tr><th>Txn ID</th><th>Amount</th><th>Method</th><th>Status</th></tr></thead>
          <tbody>{(payments || []).map((p: any) => <tr key={p.id}><td>{p.transaction_id}</td><td>₹{p.amount}</td><td>{p.payment_method}</td><td>{p.payment_status}</td></tr>)}</tbody>
        </table>
      </div>

      {skip_requests?.length > 0 && (
        <div className="page-card mt-4">
          <h6 className="fw-semibold mb-3">Skip Requests</h6>
          <table className="table table-sm"><thead><tr><th>Date</th><th>Reason</th><th>Status</th></tr></thead>
            <tbody>{skip_requests.map((s: any) => <tr key={s.id}><td>{s.skip_date}</td><td>{s.reason || '—'}</td><td>{s.status}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      <Link to="/admin/customers" className="btn btn-outline-secondary mt-3"><BtnIcon name="cancel" /> Back to List</Link>
    </Layout>
  );
}
