import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getCarryForwardHistory } from '../services/api';

export default function CarryForwardPage() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { getCarryForwardHistory().then((res) => setLogs(res.data.data || [])); }, []);

  return (
    <Layout title="Carry Forward History">
      <div className="page-card">
        <table className="table table-hover">
          <thead><tr><th>Customer</th><th>Subscription</th><th>Skipped Days</th><th>Added Days</th><th>Balance Days</th><th>Note</th><th>Date</th></tr></thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id}>
                <td>{l.user_name}</td><td>#{l.subscription_id}</td><td>{l.skipped_days}</td><td>{l.added_days}</td><td>{l.balance_days}</td><td>{l.note || '—'}</td><td>{new Date(l.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {!logs.length && <tr><td colSpan={7} className="text-muted text-center">No carry forward history yet</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
