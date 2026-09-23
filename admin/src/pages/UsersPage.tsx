import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import BtnIcon from '../components/BtnIcon';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { getUsers, deleteCustomer } from '../services/api';

export default function UsersPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);

  const load = () => {
    getUsers({
      search: search || undefined,
      status: status || undefined,
      subscription_status: subscriptionStatus || undefined,
    }).then((res) => setUsers(res.data.data || []));
  };

  useEffect(() => { load(); }, [search, status, subscriptionStatus]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCustomer(deleteTarget.id);
      showToast('Customer deleted');
      setDeleteTarget(null);
      load();
    } catch {
      showToast('Failed to delete customer', 'error');
    }
  };

  return (
    <Layout title="Customer List">
      <div className="page-card mb-3">
        <div className="row g-2">
          <div className="col-md-4">
            <input className="form-control rounded-pill" placeholder="Search name, mobile, email, area..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="col-md-3">
            <select className="form-select rounded-pill" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-select rounded-pill" value={subscriptionStatus} onChange={(e) => setSubscriptionStatus(e.target.value)}>
              <option value="">All Subscriptions</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="page-card">
        <table className="table table-hover">
          <thead>
            <tr>
              <th>ID</th><th>Name</th><th>Mobile</th><th>Email</th><th>Area</th>
              <th>Subscription</th><th>Wallet</th><th>Registered</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td className="fw-medium">{u.name || '—'}</td>
                <td>{u.mobile || '—'}</td>
                <td>{u.email}</td>
                <td>{u.area || '—'}</td>
                <td>{u.active_subscription ? <span className="badge bg-success">Active</span> : <span className="badge bg-light text-dark">{u.subscription_status || 'None'}</span>}</td>
                <td>₹{parseFloat(u.wallet_balance || 0).toFixed(2)}</td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td><span className={`badge bg-${u.is_active ? 'success' : 'secondary'}`}>{u.is_active ? 'Active' : 'Inactive'}</span></td>
                <td>
                  <Link to={`/admin/customers/${u.id}`} className="btn btn-sm btn-outline-primary me-1"><BtnIcon name="edit" /> View</Link>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(u)}><BtnIcon name="delete" /> Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog open={!!deleteTarget} title="Delete Customer" message={`Delete "${deleteTarget?.name}"?`} confirmText="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </Layout>
  );
}
