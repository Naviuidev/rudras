import { useState } from 'react';
import Layout from '../components/Layout';
import { useToast } from '../context/ToastContext';
import { sendNotification } from '../services/api';
import BtnIcon from '../components/BtnIcon';

export default function NotificationsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', type: 'promo', user_id: '' });
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await sendNotification({
        title: form.title,
        body: form.body,
        type: form.type,
        user_id: form.user_id ? +form.user_id : null,
      });
      setForm({ title: '', body: '', type: 'promo', user_id: '' });
      showToast('Notification sent successfully!');
    } catch {
      showToast('Failed to send notification', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Push Notifications">
      <div className="page-card" style={{ maxWidth: 600 }}>
        <form onSubmit={handleSend}>
          <div className="mb-3">
            <label className="form-label">Title</label>
            <input className="form-control" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Message</label>
            <textarea className="form-control" rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
          </div>
          <div className="mb-3">
            <label className="form-label">Type</label>
            <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="promo">Promotional</option>
              <option value="order">Order Update</option>
              <option value="subscription">Subscription</option>
              <option value="delivery">Delivery</option>
              <option value="general">General</option>
            </select>
          </div>
          <div className="mb-3">
            <label className="form-label">User ID (leave empty for broadcast)</label>
            <input type="number" className="form-control" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} />
          </div>
          <button type="submit" className="btn btn-accent" disabled={loading}>
            <BtnIcon name={loading ? 'wait' : 'send'} /> {loading ? 'Sending...' : 'Send Notification'}
          </button>
        </form>
      </div>
    </Layout>
  );
}
