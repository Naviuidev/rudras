import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getSalesReport, getSubscriptionReport, getCustomerReport } from '../services/api';

export default function SalesReportPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getSalesReport(30).then((res) => setData(res.data.data)); }, []);
  return (
    <Layout title="Sales Report">
      <div className="page-card">
        <div className="profile-field"><span>Monthly Revenue</span><strong>₹{data?.monthly_revenue ?? 0}</strong></div>
        <h6 className="fw-semibold mt-3 mb-2">Daily Sales (30 days)</h6>
        <table className="table table-sm"><thead><tr><th>Date</th><th>Orders</th><th>Revenue</th></tr></thead>
          <tbody>{(data?.daily || []).map((d: any) => <tr key={d.date}><td>{d.date}</td><td>{d.count}</td><td>₹{d.revenue}</td></tr>)}</tbody>
        </table>
        <p className="text-muted small mt-3 mb-0">Export PDF / Excel / CSV — coming soon.</p>
      </div>
    </Layout>
  );
}

export function SubscriptionReportPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getSubscriptionReport().then((res) => setData(res.data.data)); }, []);
  return (
    <Layout title="Subscription Report">
      <div className="page-card row g-3">
        {[['Active', data?.active], ['Paused', data?.paused], ['Expired', data?.expired], ['Cancelled', data?.cancelled]].map(([l, v]) => (
          <div className="col-md-3" key={l as string}><div className="stat-card"><div className="stat-value stat-value-sm">{v ?? 0}</div><div className="stat-label">{l}</div></div></div>
        ))}
      </div>
    </Layout>
  );
}

export function CustomerReportPage() {
  const [data, setData] = useState<any>(null);
  useEffect(() => { getCustomerReport().then((res) => setData(res.data.data)); }, []);
  return (
    <Layout title="Customer Report">
      <div className="page-card">
        <div className="profile-field"><span>Total Customers</span><strong>{data?.total ?? 0}</strong></div>
        <h6 className="fw-semibold mt-3">Recent Customers</h6>
        <table className="table table-sm"><thead><tr><th>Name</th><th>Email</th><th>Registered</th></tr></thead>
          <tbody>{(data?.recent || []).map((c: any) => <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}</tbody>
        </table>
      </div>
    </Layout>
  );
}
