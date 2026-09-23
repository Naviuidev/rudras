import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import Layout from '../components/Layout';
import AdminNavIcon, { type AdminNavIconKey } from '../components/AdminNavIcon';
import { getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const defaultStats: any = {
  total_customers: 0,
  active_subscriptions: 0,
  paused_subscriptions: 0,
  expired_subscriptions: 0,
  total_products: 0,
  total_orders: 0,
  todays_deliveries: 0,
  tomorrows_deliveries: 0,
  pending_payments: 0,
  monthly_revenue: 0,
  total_revenue: 0,
  low_stock_products: 0,
  daily_revenue: [],
  monthly_revenue_chart: [],
  subscription_growth: [],
  product_sales: [],
  recent_customers: [],
  recent_orders: [],
  recent_payments: [],
  recent_skip_requests: [],
};

const statusColors: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  packed: 'primary',
  out_for_delivery: 'info',
  delivered: 'success',
  cancelled: 'danger',
  paid: 'success',
  failed: 'danger',
};

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#111',
      titleFont: { family: 'Poppins', size: 12 },
      bodyFont: { family: 'Poppins', size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { font: { family: 'Poppins', size: 11 }, color: '#888' },
    },
    y: {
      grid: { color: '#f0f0f0' },
      border: { display: false },
      ticks: { font: { family: 'Poppins', size: 11 }, color: '#888' },
    },
  },
};

const quickActions = [
  {
    to: '/admin/customers',
    icon: 'customers' as AdminNavIconKey,
    title: 'Add Customer',
    desc: 'Register a new customer account',
  },
  {
    to: '/admin/products/list',
    icon: 'products' as AdminNavIconKey,
    title: 'Add Product',
    desc: 'List a new farm-fresh product',
  },
  {
    to: '/admin/subscriptions/active',
    icon: 'subscriptions' as AdminNavIconKey,
    title: 'Subscriptions',
    desc: 'View and manage active plans',
  },
  {
    to: '/admin/notifications/push',
    icon: 'notifications' as AdminNavIconKey,
    title: 'Send Notification',
    desc: 'Push alerts to customers',
  },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats({ ...defaultStats, ...(res.data.data || {}) }))
      .catch(() => setStats(defaultStats))
      .finally(() => setLoading(false));
  }, []);

  const displayName = user?.username || user?.name || 'Admin';
  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const primaryKpis = [
    {
      label: 'Monthly Revenue',
      value: `₹${Number(stats.monthly_revenue || 0).toLocaleString('en-IN')}`,
      icon: 'payments' as AdminNavIconKey,
      tone: 'accent',
      to: '/admin/reports/sales',
    },
    {
      label: 'Total Orders',
      value: stats.total_orders,
      icon: 'orders' as AdminNavIconKey,
      tone: 'sky',
      to: '/admin/orders',
    },
    {
      label: 'Total Customers',
      value: stats.total_customers,
      icon: 'customers' as AdminNavIconKey,
      tone: 'mint',
      to: '/admin/customers',
    },
    {
      label: 'Active Subscriptions',
      value: stats.active_subscriptions,
      icon: 'subscriptions' as AdminNavIconKey,
      tone: 'warm',
      to: '/admin/subscriptions/active',
    },
  ];

  const secondaryStats = [
    { label: 'Paused Subscriptions', value: stats.paused_subscriptions, icon: 'subscriptions' as AdminNavIconKey, to: '/admin/subscriptions/paused' },
    { label: 'Expired Subscriptions', value: stats.expired_subscriptions, icon: 'subscriptions' as AdminNavIconKey, to: '/admin/subscriptions/expired' },
    { label: 'Total Products', value: stats.total_products, icon: 'products' as AdminNavIconKey, to: '/admin/products/list' },
    { label: "Today's Deliveries", value: stats.todays_deliveries, icon: 'orders' as AdminNavIconKey, to: '/admin/inventory/daily-requirement' },
    { label: "Tomorrow's Deliveries", value: stats.tomorrows_deliveries, icon: 'orders' as AdminNavIconKey, to: '/admin/inventory/daily-requirement' },
    { label: 'Pending Payments', value: stats.pending_payments, icon: 'payments' as AdminNavIconKey, to: '/admin/payments/transactions' },
    { label: 'Total Revenue', value: `₹${Number(stats.total_revenue || 0).toLocaleString('en-IN')}`, icon: 'reports' as AdminNavIconKey, to: '/admin/reports/sales' },
    { label: 'Low Stock Products', value: stats.low_stock_products, icon: 'inventory' as AdminNavIconKey, to: '/admin/inventory/stock' },
  ];

  const openTableSection = (to: string) => (e: React.MouseEvent | React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('a')) return;
    navigate(to);
  };

  const dailyRevenueChart = {
    labels: stats.daily_revenue?.length ? stats.daily_revenue.map((d: any) => d.date) : ['No data'],
    datasets: [
      {
        label: 'Daily Revenue (₹)',
        data: stats.daily_revenue?.length ? stats.daily_revenue.map((d: any) => d.revenue) : [0],
        borderColor: '#2d5016',
        backgroundColor: 'rgba(45, 80, 22, 0.12)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#2d5016',
      },
    ],
  };

  const monthlyRevenueChart = {
    labels: stats.monthly_revenue_chart?.length
      ? stats.monthly_revenue_chart.map((d: any) => d.date)
      : ['No data'],
    datasets: [
      {
        label: 'Order Revenue (₹)',
        data: stats.monthly_revenue_chart?.length
          ? stats.monthly_revenue_chart.map((d: any) => d.revenue)
          : [0],
        backgroundColor: '#d9e8c9',
        borderColor: '#2d5016',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const subGrowthChart = {
    labels: stats.subscription_growth?.length
      ? stats.subscription_growth.map((d: any) => d.month)
      : ['No data'],
    datasets: [
      {
        label: 'New Subscriptions',
        data: stats.subscription_growth?.length
          ? stats.subscription_growth.map((d: any) => d.count)
          : [0],
        borderColor: '#2d5016',
        backgroundColor: 'rgba(45, 80, 22, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointBackgroundColor: '#2d5016',
      },
    ],
  };

  const productSalesChart = {
    labels: stats.product_sales?.length ? stats.product_sales.map((d: any) => d.name) : ['No data'],
    datasets: [
      {
        label: 'Units Sold',
        data: stats.product_sales?.length ? stats.product_sales.map((d: any) => d.units_sold) : [0],
        backgroundColor: '#d6e8f1',
        borderColor: '#2d5016',
        borderWidth: 2,
        borderRadius: 8,
      },
    ],
  };

  const chartCards = [
    { title: 'Daily Revenue', to: '/admin/reports/sales', type: 'line' as const, data: dailyRevenueChart },
    { title: 'Monthly Revenue (Orders)', to: '/admin/reports/sales', type: 'bar' as const, data: monthlyRevenueChart },
    { title: 'Subscription Growth', to: '/admin/reports/subscriptions', type: 'line' as const, data: subGrowthChart },
    { title: 'Product Sales', to: '/admin/products/list', type: 'bar' as const, data: productSalesChart },
  ];

  return (
    <Layout title="">
      <div className="dashboard-page">
        <header className="dashboard-page-header">
          <div>
            <p className="dashboard-page-eyebrow">{today}</p>
            <h1 className="dashboard-page-title">Welcome back, {displayName}</h1>
            <p className="dashboard-page-subtitle">
              Real-time overview of orders, subscriptions, and deliveries.
            </p>
          </div>
          <div className="dashboard-page-badges">
            <span className="dashboard-live-badge">Live</span>
            <span className="dashboard-meta-pill">{stats.total_orders} orders total</span>
          </div>
        </header>

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading dashboard…</span>
          </div>
        ) : (
          <>
            <section className="dashboard-section">
              <div className="row g-3">
                {primaryKpis.map((kpi) => (
                  <div className="col-6 col-xl-3" key={kpi.label}>
                    <Link to={kpi.to} className={`dashboard-kpi-card dashboard-kpi-${kpi.tone}`}>
                      <div className="dashboard-kpi-icon">
                        <AdminNavIcon name={kpi.icon} />
                      </div>
                      <div className="dashboard-kpi-body">
                        <div className="dashboard-kpi-value">{kpi.value}</div>
                        <div className="dashboard-kpi-label">{kpi.label}</div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="row g-3">
                {secondaryStats.map((item) => (
                  <div className="col-6 col-md-4 col-lg-3" key={item.label}>
                    <Link to={item.to} className="dashboard-stat-card">
                      <div className="dashboard-stat-icon">
                        <AdminNavIcon name={item.icon} />
                      </div>
                      <div className="dashboard-stat-body">
                        <div className="dashboard-stat-value">{item.value}</div>
                        <div className="dashboard-stat-label">{item.label}</div>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <h2 className="dashboard-section-title">Quick Actions</h2>
                <p className="dashboard-section-desc">Jump to common admin tasks</p>
              </div>
              <div className="row g-3">
                {quickActions.map((action) => (
                  <div className="col-6 col-lg-3" key={action.to}>
                    <Link to={action.to} className="dashboard-action-card">
                      <span className="dashboard-action-icon">
                        <AdminNavIcon name={action.icon} />
                      </span>
                      <span className="dashboard-action-title">{action.title}</span>
                      <span className="dashboard-action-desc">{action.desc}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <h2 className="dashboard-section-title">Analytics</h2>
                <p className="dashboard-section-desc">Revenue, growth, and product performance</p>
              </div>
              <div className="row g-4">
                {chartCards.map((card) => (
                  <div className="col-lg-6" key={card.title}>
                    <Link to={card.to} className="dashboard-chart-card">
                      <h3 className="dashboard-chart-title">{card.title}</h3>
                      {card.type === 'line' ? (
                        <Line data={card.data} options={chartOptions} />
                      ) : (
                        <Bar data={card.data} options={chartOptions} />
                      )}
                    </Link>
                  </div>
                ))}
              </div>
            </section>

            <section className="dashboard-section">
              <div className="dashboard-section-head">
                <h2 className="dashboard-section-title">Recent Activity</h2>
                <p className="dashboard-section-desc">Latest customers, orders, and payments</p>
              </div>
              <div className="row g-4">
                <div className="col-lg-6">
                  <article
                    className="dashboard-table-card dashboard-card-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={openTableSection('/admin/customers')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openTableSection('/admin/customers')(e);
                      }
                    }}
                  >
                    <h3 className="dashboard-table-title">Recent Customers</h3>
                    <div className="dashboard-table-wrap">
                      <table className="table table-sm table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Mobile</th>
                            <th>Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats.recent_customers || []).map((c: any) => (
                            <tr key={c.id}>
                              <td>
                                <Link to={`/admin/customers/${c.id}`}>{c.name || c.email}</Link>
                              </td>
                              <td>{c.mobile || '—'}</td>
                              <td>{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                          {!stats.recent_customers?.length && (
                            <tr>
                              <td colSpan={3} className="dashboard-empty-cell">
                                No customers yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
                <div className="col-lg-6">
                  <article
                    className="dashboard-table-card dashboard-card-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={openTableSection('/admin/orders')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openTableSection('/admin/orders')(e);
                      }
                    }}
                  >
                    <h3 className="dashboard-table-title">Recent Orders</h3>
                    <div className="dashboard-table-wrap">
                      <table className="table table-sm table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats.recent_orders || []).map((o: any) => (
                            <tr key={o.id}>
                              <td>{o.order_number}</td>
                              <td>₹{o.total_amount}</td>
                              <td>
                                <span className={`badge bg-${statusColors[o.order_status]}`}>
                                  {o.order_status?.replace(/_/g, ' ')}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {!stats.recent_orders?.length && (
                            <tr>
                              <td colSpan={3} className="dashboard-empty-cell">
                                No orders yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
                <div className="col-lg-6">
                  <article
                    className="dashboard-table-card dashboard-card-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={openTableSection('/admin/payments/transactions')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openTableSection('/admin/payments/transactions')(e);
                      }
                    }}
                  >
                    <h3 className="dashboard-table-title">Recent Payments</h3>
                    <div className="dashboard-table-wrap">
                      <table className="table table-sm table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Txn ID</th>
                            <th>Amount</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats.recent_payments || []).map((p: any) => (
                            <tr key={p.id}>
                              <td>{p.transaction_id}</td>
                              <td>₹{p.amount}</td>
                              <td>
                                <span className={`badge bg-${statusColors[p.payment_status]}`}>
                                  {p.payment_status}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {!stats.recent_payments?.length && (
                            <tr>
                              <td colSpan={3} className="dashboard-empty-cell">
                                No payments yet
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
                <div className="col-lg-6">
                  <article
                    className="dashboard-table-card dashboard-card-clickable"
                    role="link"
                    tabIndex={0}
                    onClick={openTableSection('/admin/skip/requests')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openTableSection('/admin/skip/requests')(e);
                      }
                    }}
                  >
                    <h3 className="dashboard-table-title">Recent Skip Requests</h3>
                    <div className="dashboard-table-wrap">
                      <table className="table table-sm table-hover mb-0">
                        <thead>
                          <tr>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(stats.recent_skip_requests || []).map((s: any) => (
                            <tr key={s.id}>
                              <td>{s.user_name}</td>
                              <td>{s.skip_date}</td>
                              <td>
                                <span className="badge bg-warning">{s.status}</span>
                              </td>
                            </tr>
                          ))}
                          {!stats.recent_skip_requests?.length && (
                            <tr>
                              <td colSpan={3} className="dashboard-empty-cell">
                                No pending skip requests
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </article>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}
