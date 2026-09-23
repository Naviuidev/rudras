import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import BtnIcon from '../components/BtnIcon';
import { useToast } from '../context/ToastContext';
import { getSkipRequests, approveSkipRequest, rejectSkipRequest } from '../services/api';

export default function SkipRequestsPage() {
  const { showToast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState('');

  const load = () => getSkipRequests(filter || undefined).then((res) => setRequests(res.data.data || []));
  useEffect(() => { load(); }, [filter]);

  const handleApprove = async (id: number) => {
    try { await approveSkipRequest(id); showToast('Skip approved'); load(); } catch { showToast('Failed', 'error'); }
  };
  const handleReject = async (id: number) => {
    try { await rejectSkipRequest(id); showToast('Skip rejected'); load(); } catch { showToast('Failed', 'error'); }
  };

  return (
    <Layout title="Skip Requests">
      <select className="form-select w-auto rounded-pill mb-3" value={filter} onChange={(e) => setFilter(e.target.value)}>
        <option value="">All</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
      </select>
      <div className="page-card">
        <table className="table table-hover">
          <thead><tr><th>Customer</th><th>Subscription</th><th>Product</th><th>Skip Date</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id}>
                <td>{r.user_name}</td><td>#{r.subscription_id}</td><td>{r.product_name || 'Milk'}</td><td>{r.skip_date}</td><td>{r.reason || '—'}</td>
                <td><span className={`badge bg-${r.status === 'pending' ? 'warning' : r.status === 'approved' ? 'success' : 'danger'}`}>{r.status}</span></td>
                <td>
                  {r.status === 'pending' && (
                    <>
                      <button className="btn btn-sm btn-outline-success me-1" onClick={() => handleApprove(r.id)}><BtnIcon name="submit" /> Approve</button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleReject(r.id)}><BtnIcon name="cancel" /> Reject</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!requests.length && <tr><td colSpan={7} className="text-muted text-center">No skip requests</td></tr>}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
