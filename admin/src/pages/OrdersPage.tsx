import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import OrderDetailModal, { type OrderDetailData } from '../components/OrderDetailModal';
import { getOrders, getOrder, updateOrderStatus } from '../services/api';

const STATUSES = ['pending', 'confirmed', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];

const statusColors: Record<string, string> = {
  pending: 'warning', confirmed: 'info', packed: 'primary',
  out_for_delivery: 'info', delivered: 'success', cancelled: 'danger',
};

interface OrdersPageProps {
  status?: string;
  title?: string;
}

export default function OrdersPage({ status: fixedStatus, title = 'All Orders' }: OrdersPageProps) {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState(fixedStatus || '');
  const [detailOrder, setDetailOrder] = useState<OrderDetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    setFilter(fixedStatus || '');
  }, [fixedStatus]);

  const load = () => getOrders(filter || undefined).then((res) => setOrders(res.data.data || []));
  useEffect(() => { load(); }, [filter]);

  const handleStatusChange = async (id: number, status: string) => {
    await updateOrderStatus(id, status);
    load();
  };

  const openOrderDetail = async (orderId: number) => {
    setShowDetail(true);
    setDetailLoading(true);
    setDetailOrder(null);
    try {
      const res = await getOrder(orderId);
      setDetailOrder(res.data.data);
    } catch {
      setDetailOrder(null);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <Layout title={title}>
      {!fixedStatus && (
        <div className="mb-3">
          <select className="form-select w-auto d-inline-block rounded-pill" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      )}

      <div className="page-card">
        <table className="table">
          <thead><tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th><th>Details</th><th>Update</th></tr></thead>
          <tbody>
            {orders.length === 0 && (
              <tr><td colSpan={8} className="text-muted text-center py-4">No orders found.</td></tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="fw-medium">{o.order_number}</td>
                <td>{o.user_name || o.user_email}</td>
                <td>{o.items?.map((i: any) => `${i.product_name}×${i.quantity}`).join(', ')}</td>
                <td>₹{o.total_amount}</td>
                <td><span className={`badge bg-${statusColors[o.order_status]}`}>{o.order_status.replace(/_/g, ' ')}</span></td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
                <td>
                  <button
                    type="button"
                    className="orders-detail-icon-btn"
                    onClick={() => openOrderDetail(o.id)}
                    title="View order details"
                    aria-label={`View details for ${o.order_number}`}
                  >
                    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 12.5a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-2.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z"
                      />
                    </svg>
                  </button>
                </td>
                <td>
                  <select className="form-select form-select-sm rounded-pill" value={o.order_status} onChange={(e) => handleStatusChange(o.id, e.target.value)}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrderDetailModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        order={detailOrder}
        loading={detailLoading}
      />
    </Layout>
  );
}
