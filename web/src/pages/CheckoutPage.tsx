import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Form, Row, Col, Accordion } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import CheckoutAddAddressModal from '../components/CheckoutAddAddressModal';
import CheckoutDeliveryConfirmModal from '../components/CheckoutDeliveryConfirmModal';
import {
  getAddresses,
  createAddress,
  createOrder,
  initiatePayment,
  checkServiceArea,
  getServiceLocations,
  getErrorMessage,
} from '../services/api';
import { useCart } from '../context/CartContext';
import { runRazorpayCheckout } from '../utils/razorpay';
import { evaluateAddressServiceability } from '../utils/serviceAreaAddress';
import type { Address, AddressInput, ServiceLocation } from '../types';

type AddressServiceStatus = 'serviceable' | 'unserviceable' | 'unknown' | 'checking';

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [serviceLocations, setServiceLocations] = useState<ServiceLocation[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [serviceStatus, setServiceStatus] = useState<Record<number, AddressServiceStatus>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showDeliveryConfirm, setShowDeliveryConfirm] = useState(false);
  const [highlightAddressId, setHighlightAddressId] = useState<number | null>(null);
  const [expandedAddressId, setExpandedAddressId] = useState<string | null>(null);
  const navigate = useNavigate();

  const serviceableAddresses = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');
  const multipleServiceable = serviceableAddresses.length > 1;
  const needsDeliveryChoice = multipleServiceable && selectedId == null;

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    getAddresses()
      .then((list) => {
        setAddresses(list);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));

    getServiceLocations()
      .then(setServiceLocations)
      .catch(() => setServiceLocations([]));
  }, [items.length, navigate]);

  const evaluateAddresses = useCallback(
    async (list: Address[]) => {
      if (list.length === 0) {
        setServiceStatus({});
        return;
      }

      const initial: Record<number, AddressServiceStatus> = {};
      list.forEach((address) => {
        initial[address.id] = 'checking';
      });
      setServiceStatus(initial);

      const results = await Promise.all(
        list.map(async (address) => ({
          id: address.id,
          status: await evaluateAddressServiceability(address, serviceLocations, checkServiceArea),
        }))
      );

      setServiceStatus((prev) => {
        const next = { ...prev };
        results.forEach(({ id, status: nextStatus }) => {
          next[id] = nextStatus;
        });
        return next;
      });
    },
    [serviceLocations]
  );

  useEffect(() => {
    if (addresses.length > 0 && serviceLocations.length >= 0) {
      void evaluateAddresses(addresses);
    }
  }, [addresses, serviceLocations, evaluateAddresses]);

  useEffect(() => {
    if (addresses.length === 0) return;

    const stillChecking = addresses.some(
      (address) => serviceStatus[address.id] === 'checking' || serviceStatus[address.id] === undefined
    );
    if (stillChecking) return;

    setSelectedId((prev) => {
      const serviceable = addresses.filter((address) => serviceStatus[address.id] === 'serviceable');

      if (serviceable.length === 1) {
        return serviceable[0].id;
      }

      if (serviceable.length > 1) {
        if (prev != null && serviceStatus[prev] === 'serviceable') return prev;
        return null;
      }

      if (prev != null && serviceStatus[prev] !== 'unserviceable') return prev;

      return null;
    });
  }, [addresses, serviceStatus]);

  const formatAddress = (a: Address) =>
    `${a.name}, ${a.address_line}${a.area ? ', ' + a.area : ''}, ${a.city}, ${a.state} - ${a.pincode} (${a.mobile})`;

  const processPayment = async (addressId: number) => {
    const selected = addresses.find((a) => a.id === addressId);
    if (!selected) {
      setError('Please select a delivery address');
      return;
    }

    const selectedStatus = serviceStatus[selected.id];
    if (selectedStatus === 'unserviceable') {
      setError('The selected address is outside our delivery area. Please choose a serviceable address.');
      return;
    }
    if (selectedStatus === 'unknown') {
      setError('Please add or update this address using current location so we can verify delivery.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const order = await createOrder({
        items: items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        delivery_address: formatAddress(selected),
        delivery_lat: selected.lat != null ? Number(selected.lat) : null,
        delivery_lng: selected.lng != null ? Number(selected.lng) : null,
      });

      const paymentInit = await initiatePayment({
        amount: order.total_amount || total,
        reference_type: 'order',
        reference_id: order.id,
      });

      const { paid } = await runRazorpayCheckout(paymentInit);

      if (!paid) {
        setError('Payment was not completed. Please try again.');
        setSubmitting(false);
        return;
      }

      clearCart();
      setShowDeliveryConfirm(false);
      navigate('/dashboard', { replace: true, state: { orderSuccess: true, orderNumber: order.order_number } });
    } catch (err) {
      const message = getErrorMessage(err);
      if (message !== 'Payment cancelled') {
        setError(message);
      }
      setSubmitting(false);
    }
  };

  const handleSaveAddress = async (address: AddressInput) => {
    const created = await createAddress(address);
    const nextAddresses = [...addresses, created];
    setAddresses(nextAddresses);
    setShowAdd(false);
    await evaluateAddresses(nextAddresses);
    setHighlightAddressId(created.id);
    setSelectedId(created.id);
    setShowDeliveryConfirm(true);
  };

  const handlePay = async () => {
    setError('');

    if (multipleServiceable && selectedId == null) {
      setShowDeliveryConfirm(true);
      return;
    }

    if (!selectedId) {
      setError('Please select a delivery address');
      return;
    }

    await processPayment(selectedId);
  };

  const handleConfirmDelivery = async () => {
    if (!selectedId) return;
    setSelectedId(selectedId);
    await processPayment(selectedId);
  };

  const openAddModal = () => {
    setShowAdd(true);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <h4 className="section-title">Checkout</h4>
      {error && <Alert variant="danger">{error}</Alert>}

      <Row className="g-4">
        <Col lg={7}>
          <Card className="card-brand mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="fw-semibold mb-0" style={{ color: 'var(--accent)' }}>
                  Delivery Address
                </h6>
                <Button size="sm" variant="outline-success" className="rounded-pill" onClick={openAddModal}>
                  + Add New
                </Button>
              </div>

              {addresses.length === 0 ? (
                <Alert variant="warning">
                  No saved addresses.{' '}
                  <Button variant="link" className="p-0" onClick={openAddModal}>
                    Add one now
                  </Button>
                </Alert>
              ) : (
                <>
                  {needsDeliveryChoice && (
                    <Alert variant="light" className="checkout-address-pick-alert mb-3">
                      You have {serviceableAddresses.length} delivery locations. Please choose where to deliver.
                    </Alert>
                  )}

                  <Accordion
                    activeKey={expandedAddressId ?? undefined}
                    onSelect={(key) =>
                      setExpandedAddressId(key === expandedAddressId ? null : typeof key === 'string' ? key : null)
                    }
                    className="checkout-address-accordion"
                    flush
                  >
                    {addresses.map((a) => {
                      const statusForAddress = serviceStatus[a.id] || 'checking';
                      const isServiceable = statusForAddress === 'serviceable';
                      const isSelected = selectedId === a.id;
                      const statusClass =
                        statusForAddress === 'serviceable'
                          ? 'checkout-address-accordion-item--serviceable'
                          : statusForAddress === 'unserviceable'
                            ? 'checkout-address-accordion-item--unserviceable'
                            : 'checkout-address-accordion-item--unknown';

                      return (
                        <Accordion.Item
                          key={a.id}
                          eventKey={String(a.id)}
                          className={`checkout-address-accordion-item ${statusClass}${isSelected ? ' checkout-address-accordion-item--selected' : ''}`}
                        >
                          <Accordion.Header>
                            <div className="checkout-address-accordion-header">
                              {isServiceable ? (
                                <Form.Check
                                  type="radio"
                                  name="delivery-address"
                                  id={`addr-${a.id}`}
                                  checked={isSelected}
                                  onChange={() => setSelectedId(a.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="checkout-address-radio"
                                  aria-label={`Deliver to ${a.name}`}
                                />
                              ) : (
                                <span className="checkout-address-radio-spacer" aria-hidden />
                              )}
                              <div className="checkout-address-accordion-summary">
                                <span className="checkout-address-accordion-name">{a.name}</span>
                                <span className="checkout-address-accordion-meta">
                                  {a.area ? `${a.area}, ` : ''}
                                  {a.city}, {a.state}
                                </span>
                              </div>
                              <span
                                className={`checkout-address-badge checkout-address-badge--${statusForAddress}`}
                              >
                                {statusForAddress === 'checking' && 'Checking…'}
                                {statusForAddress === 'serviceable' && 'Deliver here'}
                                {statusForAddress === 'unserviceable' && 'Not serviceable'}
                                {statusForAddress === 'unknown' && 'Not verified'}
                              </span>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body>
                            <div className="checkout-address-detail">
                              <p className="mb-1">
                                <strong>{a.name}</strong> · {a.mobile}
                              </p>
                              <p className="mb-1">{a.address_line}</p>
                              {a.area && <p className="mb-1">{a.area}</p>}
                              <p className="mb-0">
                                {a.city}, {a.state} — {a.pincode}
                              </p>
                            </div>
                            {isServiceable && (
                              <Button
                                size="sm"
                                variant={isSelected ? 'success' : 'outline-success'}
                                className="rounded-pill mt-3"
                                onClick={() => setSelectedId(a.id)}
                              >
                                {isSelected ? 'Selected for delivery' : 'Deliver to this address'}
                              </Button>
                            )}
                          </Accordion.Body>
                        </Accordion.Item>
                      );
                    })}
                  </Accordion>
                </>
              )}
            </Card.Body>
          </Card>

          <Card className="card-brand">
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Items ({items.length})
              </h6>
              {items.map((item) => (
                <div key={item.product_id} className="d-flex justify-content-between small border-bottom py-2">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        <Col lg={5}>
          <Card className="card-brand sticky-top" style={{ top: 80 }}>
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Payment Summary
              </h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted small">
                <span>Delivery Charge</span>
                <span>₹0</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted small">
                <span>Tax</span>
                <span>₹0</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-semibold mb-3">
                <span>Total</span>
                <span className="price-tag">₹{total.toFixed(2)}</span>
              </div>
              <Button
                className="btn-accent w-100 mb-2"
                onClick={handlePay}
                disabled={
                  submitting ||
                  addresses.length === 0 ||
                  serviceableAddresses.length === 0 ||
                  (multipleServiceable
                    ? false
                    : !selectedId || (selectedId != null && serviceStatus[selectedId] !== 'serviceable'))
                }
              >
                {submitting
                  ? 'Processing...'
                  : needsDeliveryChoice
                    ? 'Choose delivery location'
                    : 'Pay with Razorpay'}
              </Button>
              <Link to="/cart" className="btn btn-link w-100" style={{ color: 'var(--accent)' }}>
                Back to Cart
              </Link>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <CheckoutAddAddressModal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        onSave={handleSaveAddress}
      />

      <CheckoutDeliveryConfirmModal
        show={showDeliveryConfirm}
        onHide={() => {
          setShowDeliveryConfirm(false);
          setHighlightAddressId(null);
        }}
        addresses={addresses}
        serviceStatus={serviceStatus}
        highlightAddressId={highlightAddressId}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onConfirm={handleConfirmDelivery}
        confirming={submitting}
        title={highlightAddressId ? 'Confirm delivery address' : 'Choose delivery location'}
      />
    </div>
  );
}
