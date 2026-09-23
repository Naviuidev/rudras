import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getSubscriptions, pauseSubscription, resumeSubscription } from '../services/api';
import BtnIcon from '../components/BtnIcon';

interface SubscriptionsPageProps {
  status?: string;
  title?: string;
}

export default function SubscriptionsPage({ status = '', title = 'All Subscriptions' }: SubscriptionsPageProps) {
  const [subs, setSubs] = useState<any[]>([]);
  const filter = status;

  const load = () => getSubscriptions(filter || undefined).then((res) => setSubs(res.data.data || []));
  useEffect(() => { load(); }, [filter]);

  return (
    <Layout title={title}>
      <div className="page-card">
        <table className="table">
          <thead><tr><th>User</th><th>Quantity</th><th>Days Left</th><th>Carried Forward</th><th>Period</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {subs.length === 0 && (
              <tr><td colSpan={7} className="text-muted text-center py-4">No subscriptions found.</td></tr>
            )}
            {subs.map((s) => (
              <tr key={s.id}>
                <td>{s.user_name}<br /><small className="text-muted">{s.user_email}</small></td>
                <td>{s.quantity}L/day</td>
                <td className="fw-bold" style={{ color: '#2d5016' }}>{s.remaining_days}/{s.total_days}</td>
                <td>{s.carried_forward_days || 0}</td>
                <td><small>{s.start_date} → {s.end_date}</small></td>
                <td><span className={`badge bg-${s.status === 'active' ? 'success' : s.status === 'paused' ? 'warning' : s.status === 'cancelled' ? 'danger' : 'secondary'}`}>{s.status}</span></td>
                <td>
                  {s.status === 'active' && (
                    <button className="btn btn-sm btn-outline-warning me-1" onClick={async () => { await pauseSubscription(s.id); load(); }}>
                      <BtnIcon name="pause" /> Pause
                    </button>
                  )}
                  {s.status === 'paused' && (
                    <button className="btn btn-sm btn-outline-success" onClick={async () => { await resumeSubscription(s.id); load(); }}>
                      <BtnIcon name="resume" /> Resume
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
