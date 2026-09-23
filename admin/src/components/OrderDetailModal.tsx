import { type ReactNode } from 'react';
import { Modal } from 'react-bootstrap';

export interface OrderDetailUser {
  id: number;
  name?: string | null;
  email?: string | null;
  mobile?: string | null;
  area?: string | null;
  address?: string | null;
  wallet_balance?: number | string | null;
  created_at?: string;
}

export interface OrderDetailItem {
  id: number;
  product_id: number;
  product_name?: string;
  product_image?: string | null;
  quantity: number;
  price: number | string;
}

export interface OrderDetailPayment {
  id: number;
  transaction_id: string;
  amount: number | string;
  payment_method: string;
  payment_status: string;
  payment_date?: string;
}

export interface OrderDetailData {
  id: number;
  order_number: string;
  user_id: number;
  total_amount: number | string;
  payment_status: string;
  order_status: string;
  delivery_address?: string | null;
  delivery_lat?: number | string | null;
  delivery_lng?: number | string | null;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
  user?: OrderDetailUser | null;
  payment?: OrderDetailPayment | null;
  items?: OrderDetailItem[];
}

interface OrderDetailModalProps {
  show: boolean;
  onHide: () => void;
  order: OrderDetailData | null;
  loading: boolean;
}

function formatMoney(value: number | string | undefined | null): string {
  const num = Number(value || 0);
  return `₹${num.toFixed(2)}`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  return new Date(value).toLocaleString();
}

function buildDeliveryNavigationUrl(order: OrderDetailData): string | null {
  const lat = order.delivery_lat != null && order.delivery_lat !== '' ? Number(order.delivery_lat) : null;
  const lng = order.delivery_lng != null && order.delivery_lng !== '' ? Number(order.delivery_lng) : null;

  if (lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }

  if (order.delivery_address) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(order.delivery_address)}`;
  }

  return null;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="order-detail-row">
      <span className="order-detail-label">{label}</span>
      <span className="order-detail-value">{value}</span>
    </div>
  );
}

export default function OrderDetailModal({ show, onHide, order, loading }: OrderDetailModalProps) {
  const navigationUrl = order ? buildDeliveryNavigationUrl(order) : null;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      className="categories-list-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">
          {order ? `Order ${order.order_number}` : 'Order details'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-list-modal-body">
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-success" role="status" />
            <p className="text-muted small mt-2 mb-0">Loading order details…</p>
          </div>
        ) : !order ? (
          <p className="text-muted mb-0">Could not load order details.</p>
        ) : (
          <div className="order-detail-grid">
            <section className="order-detail-section">
              <h6 className="order-detail-section-title">Customer</h6>
              <DetailRow label="Name" value={order.user?.name || '—'} />
              <DetailRow label="Email" value={order.user?.email || '—'} />
              <DetailRow label="Mobile" value={order.user?.mobile || '—'} />
              <DetailRow label="Profile area" value={order.user?.area || '—'} />
              <DetailRow label="Profile address" value={order.user?.address || '—'} />
              <DetailRow label="Member since" value={formatDate(order.user?.created_at)} />
            </section>

            <section className="order-detail-section">
              <h6 className="order-detail-section-title">Order & payment</h6>
              <DetailRow label="Order status" value={order.order_status.replace(/_/g, ' ')} />
              <DetailRow label="Payment status" value={order.payment_status} />
              <DetailRow label="Total amount" value={formatMoney(order.total_amount)} />
              <DetailRow
                label="Payment method"
                value={order.payment?.payment_method?.replace(/_/g, ' ') || '—'}
              />
              <DetailRow label="Transaction ID" value={order.payment?.transaction_id || '—'} />
              <DetailRow label="Payment date" value={formatDate(order.payment?.payment_date)} />
              <DetailRow label="Placed on" value={formatDate(order.created_at)} />
            </section>

            <section className="order-detail-section order-detail-section--full">
              <div className="order-detail-section-head">
                <h6 className="order-detail-section-title mb-0">Delivery address</h6>
                {navigationUrl && (
                  <a
                    href={navigationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="order-detail-nav-link"
                    title="Open navigation in Google Maps"
                  >
                    <svg viewBox="0 0 24 24" aria-hidden focusable="false">
                      <path
                        fill="currentColor"
                        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
                      />
                    </svg>
                    Navigate
                  </a>
                )}
              </div>
              <p className="order-detail-address mb-0">{order.delivery_address || '—'}</p>
              {order.delivery_lat != null && order.delivery_lng != null && (
                <p className="order-detail-coords mb-0">
                  GPS: {Number(order.delivery_lat).toFixed(5)}, {Number(order.delivery_lng).toFixed(5)}
                </p>
              )}
            </section>

            <section className="order-detail-section order-detail-section--full">
              <h6 className="order-detail-section-title">Ordered products</h6>
              {(order.items || []).length === 0 ? (
                <p className="text-muted mb-0">No items found.</p>
              ) : (
                <div className="order-detail-items">
                  {(order.items || []).map((item) => (
                    <div key={item.id} className="order-detail-item">
                      <div>
                        <strong>{item.product_name || `Product #${item.product_id}`}</strong>
                        <div className="text-muted small">Qty: {item.quantity}</div>
                      </div>
                      <div className="order-detail-item-price">{formatMoney(item.price)}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
