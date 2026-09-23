import { useCallback, useEffect, useRef, useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Button, Alert } from 'react-bootstrap';
import DeliveryDatePicker from './DeliveryDatePicker';
import LoadingSpinner from './LoadingSpinner';
import { createSubscription, initiatePayment, getErrorMessage } from '../services/api';
import { runRazorpayCheckout } from '../utils/razorpay';
import { useServiceArea } from '../context/ServiceAreaContext';
import type { Product, SubscriptionFrequency } from '../types';
import { FREQUENCY_OPTIONS } from '../utils/subscriptionOptions';
import {
  DEFAULT_DELIVERY_COUNT,
  formatDisplayDate,
  generateDeliveryDates,
  sortDates,
  tomorrowIso,
} from '../utils/subscriptionDates';

const MODAL_WIZARD_STEPS = [
  { id: 2 as const, label: 'Schedule' },
  { id: 3 as const, label: 'Review' },
];

function qtyLabel(product: Product) {
  if (product.quantity && product.quantity_unit) {
    return `${product.quantity} ${product.quantity_unit}`;
  }
  return product.quantity_unit || '';
}

export interface SubscriptionCreateFormProps {
  products: Product[];
  initialProductId?: number;
  loading?: boolean;
  layout?: 'page' | 'modal';
  onCancel?: () => void;
}

export default function SubscriptionCreateForm({
  products,
  initialProductId,
  loading = false,
  layout = 'page',
  onCancel,
}: SubscriptionCreateFormProps) {
  const { ensureServiceArea } = useServiceArea();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [startDate, setStartDate] = useState(tomorrowIso);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>('daily');
  const [selectedDates, setSelectedDates] = useState<string[]>(() =>
    generateDeliveryDates('daily', tomorrowIso())
  );
  const [wizardStep, setWizardStep] = useState<2 | 3>(2);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const calendarRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const isModalWizard = layout === 'modal';

  const scrollToCalendar = useCallback(() => {
    window.setTimeout(() => {
      const el = calendarRef.current;
      if (!el) return;

      const heading = el.querySelector('.subscription-delivery-dates-heading') as HTMLElement | null;
      const target = heading ?? el;
      const scrollArea = scrollAreaRef.current;

      if (scrollArea) {
        const areaTop = scrollArea.getBoundingClientRect().top;
        const targetTop = target.getBoundingClientRect().top;
        scrollArea.scrollTo({
          top: Math.max(0, scrollArea.scrollTop + (targetTop - areaTop) - 8),
          behavior: 'smooth',
        });
        return;
      }

      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 180);
  }, []);

  const resetSchedule = useCallback((freq: SubscriptionFrequency, anchor: string) => {
    if (freq === 'custom') {
      setSelectedDates([]);
    } else {
      setSelectedDates(generateDeliveryDates(freq, anchor));
    }
  }, []);

  useEffect(() => {
    if (products.length === 0) return;
    const match = initialProductId && products.some((p) => p.id === initialProductId);
    if (match) {
      setProductId(String(initialProductId));
    } else {
      setProductId(String(products[0].id));
    }
  }, [products, initialProductId]);

  const handleFrequencyChange = (freq: SubscriptionFrequency) => {
    setFrequency(freq);
    resetSchedule(freq, startDate);
    scrollToCalendar();
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    if (frequency !== 'custom') {
      resetSchedule(frequency, value);
    }
  };

  const selectedProduct = products.find((p) => p.id === Number(productId));
  const pricePerDay = selectedProduct ? (selectedProduct.price_after_offer ?? selectedProduct.price) : 0;
  const deliveryCount = selectedDates.length;
  const totalAmount = pricePerDay * quantity * deliveryCount;
  const frequencyLabel =
    FREQUENCY_OPTIONS.find((f) => f.value === frequency)?.label ?? frequency;
  const sortedDates = sortDates(selectedDates);
  const firstDelivery = sortedDates[0] ?? '';
  const lastDelivery = sortedDates[sortedDates.length - 1] ?? '';

  const validateWizardStep = (step: 2 | 3): string | null => {
    if (step === 2 && deliveryCount < 1) {
      return 'Please select at least one delivery date';
    }
    return null;
  };

  const goNext = () => {
    setError('');
    const err = validateWizardStep(wizardStep);
    if (err) {
      setError(err);
      scrollToCalendar();
      return;
    }
    if (wizardStep < 3) setWizardStep(3);
  };

  const goBack = () => {
    setError('');
    if (wizardStep > 2) setWizardStep(2);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedProduct) {
      setError('Please select a product');
      return;
    }
    if (deliveryCount < 1) {
      setError('Please select at least one delivery date');
      return;
    }

    const allowed = await ensureServiceArea();
    if (!allowed) return;

    setSubmitting(true);
    try {
      const subscription = await createSubscription({
        quantity,
        total_days: deliveryCount,
        price_per_day: pricePerDay,
        start_date: firstDelivery,
        end_date: lastDelivery,
        frequency,
        product_id: selectedProduct.id,
        delivery_dates: sortedDates,
        total_amount: totalAmount,
      });

      const paymentInit = await initiatePayment({
        amount: subscription.total_amount || totalAmount,
        reference_type: 'subscription',
        reference_id: subscription.id,
      });

      const { paid } = await runRazorpayCheckout(paymentInit);
      if (!paid) {
        setError('Payment was not completed. Please try again.');
        setSubmitting(false);
        return;
      }

      window.location.href = '/dashboard';
    } catch (err) {
      setError(getErrorMessage(err));
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  const showProductPicker = products.length > 1;

  const productHero = selectedProduct ? (
    <div className="subscription-create-product-hero">
      <div className="subscription-create-product-image">
        <img
          src={selectedProduct.image || '/logo.png'}
          alt={selectedProduct.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />
      </div>
      <div>
        <h3 className="subscription-create-product-name">{selectedProduct.name}</h3>
        {qtyLabel(selectedProduct) && (
          <p className="subscription-create-product-meta">{qtyLabel(selectedProduct)}</p>
        )}
        <p className="subscription-create-product-price">
          ₹{pricePerDay}
          <span>/delivery</span>
        </p>
      </div>
    </div>
  ) : null;

  const summaryBlock = selectedProduct ? (
    <>
      <ul className="subscription-create-summary-lines">
        <li>
          <span>Type</span>
          <span>{frequencyLabel}</span>
        </li>
        <li>
          <span>Quantity</span>
          <span>{quantity}</span>
        </li>
        <li>
          <span>Deliveries</span>
          <span>{deliveryCount}</span>
        </li>
        {firstDelivery && (
          <li>
            <span>First</span>
            <span>{formatDisplayDate(firstDelivery)}</span>
          </li>
        )}
        {lastDelivery && deliveryCount > 1 && (
          <li>
            <span>Last</span>
            <span>{formatDisplayDate(lastDelivery)}</span>
          </li>
        )}
      </ul>
      <div className="subscription-create-summary-total">
        <span>Total payable</span>
        <span className="subscription-create-summary-amount">₹{totalAmount.toFixed(2)}</span>
      </div>
    </>
  ) : null;

  const frequencySection = (
    <>
      <div className="subscription-create-frequency-grid">
        {FREQUENCY_OPTIONS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`subscription-create-frequency-chip ${frequency === f.value ? 'selected' : ''}`}
            onClick={() => handleFrequencyChange(f.value)}
          >
            <span className="subscription-create-frequency-label">{f.label}</span>
            <span className="subscription-create-frequency-hint">{f.hint}</span>
          </button>
        ))}
      </div>
      {frequency !== 'custom' && (
        <div className="subscription-create-start-field">
          <label className="subscription-create-field-label" htmlFor={`start-date-${layout}`}>
            First delivery date
          </label>
          <input
            id={`start-date-${layout}`}
            type="date"
            className="subscription-create-date-input"
            value={startDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleStartDateChange(e.target.value)}
            required
          />
          <p className="subscription-create-start-hint">
            {DEFAULT_DELIVERY_COUNT} dates prefilled — scroll down to review or edit on the calendar.
          </p>
        </div>
      )}
    </>
  );

  const datesSection = (
    <div ref={calendarRef} className="subscription-calendar-anchor">
      <h2 className="subscription-create-section-title subscription-delivery-dates-heading">
        <span className="subscription-create-step">3</span>
        Delivery dates
      </h2>
      <DeliveryDatePicker
        selectedDates={selectedDates}
        onChange={setSelectedDates}
        frequency={frequency}
        showReset={frequency !== 'custom'}
        onReset={() => resetSchedule(frequency, startDate)}
      />
    </div>
  );

  const quantitySection = (
    <div className="subscription-create-qty-control">
      <Button
        type="button"
        variant="outline-success"
        className="rounded-pill subscription-create-qty-btn"
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        disabled={quantity <= 1}
        aria-label="Decrease quantity"
      >
        −
      </Button>
      <span className="subscription-create-qty-value">{quantity}</span>
      <Button
        type="button"
        variant="outline-success"
        className="rounded-pill subscription-create-qty-btn"
        onClick={() => setQuantity((q) => Math.min(10, q + 1))}
        disabled={quantity >= 10}
        aria-label="Increase quantity"
      >
        +
      </Button>
    </div>
  );

  if (isModalWizard) {
    const currentIdx = MODAL_WIZARD_STEPS.findIndex((s) => s.id === wizardStep);

    const wizardSummaryCard = (
      <aside className="subscription-wizard-summary-col">
        <div className="subscription-create-summary-card subscription-wizard-summary-card">
          <h2 className="subscription-create-summary-title">Order summary</h2>
          {selectedProduct ? (
            <>
              <div className="subscription-create-summary-product">
                <img
                  src={selectedProduct.image || '/logo.png'}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/logo.png';
                  }}
                />
                <div>
                  <p className="subscription-create-summary-name">{selectedProduct.name}</p>
                  <p className="subscription-create-summary-rate">₹{pricePerDay}/delivery</p>
                </div>
              </div>
              {summaryBlock}
              <div className="subscription-wizard-summary-actions">
                {wizardStep > 2 ? (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="rounded-pill"
                    onClick={goBack}
                    disabled={submitting}
                  >
                    Back
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline-secondary"
                    className="rounded-pill"
                    onClick={onCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                )}
                {wizardStep < 3 ? (
                  <Button type="button" variant="outline-success" className="rounded-pill" onClick={goNext}>
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="outline-success"
                    className="rounded-pill"
                    disabled={submitting || !selectedProduct || deliveryCount < 1}
                  >
                    {submitting ? 'Processing…' : 'Confirm & pay'}
                  </Button>
                )}
              </div>
              <p className="subscription-create-summary-note">
                Secure payment · Cancel or pause anytime
              </p>
            </>
          ) : (
            <p className="text-muted small mb-0">Select a product to see your summary.</p>
          )}
        </div>
      </aside>
    );

    return (
      <div className="subscription-wizard">
        <div className="subscription-wizard-header">
          {selectedProduct && (
            <div className="subscription-wizard-product-bar">
              <img
                src={selectedProduct.image || '/logo.png'}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/logo.png';
                }}
              />
              <div className="subscription-wizard-product-bar-text">
                <span className="subscription-wizard-product-bar-name">{selectedProduct.name}</span>
                <span className="subscription-wizard-product-bar-price">₹{pricePerDay}/delivery</span>
              </div>
              <span className="subscription-wizard-step-badge">
                Step {wizardStep === 2 ? 1 : 2} of {MODAL_WIZARD_STEPS.length}
              </span>
            </div>
          )}

          <div className="subscription-wizard-progress" aria-hidden>
            {MODAL_WIZARD_STEPS.map((step, i) => (
              <span
                key={step.id}
                className={`subscription-wizard-dot ${i <= currentIdx ? 'active' : ''} ${i < currentIdx ? 'done' : ''}`}
              />
            ))}
          </div>

          {error && (
            <Alert variant="danger" className="subscription-create-alert py-2 mb-0">
              {error}
            </Alert>
          )}
        </div>

        <form onSubmit={handleSubmit} className="subscription-wizard-grid">
          <div ref={scrollAreaRef} className="subscription-wizard-scroll">
            {wizardStep === 2 && (
              <>
                <section className="subscription-create-card subscription-wizard-panel">
                  <h2 className="subscription-create-section-title subscription-wizard-frequency-heading">
                    <span className="subscription-create-step">2</span>
                    Delivery frequency
                  </h2>
                  <p className="subscription-wizard-step-desc">
                    Choose frequency — the calendar below updates automatically.
                  </p>
                  {frequencySection}
                </section>
                <section className="subscription-create-card subscription-wizard-panel">
                  {datesSection}
                </section>
              </>
            )}

            {wizardStep === 3 && (
              <section className="subscription-create-card subscription-wizard-panel">
                <h2 className="subscription-create-section-title">
                  <span className="subscription-create-step">4</span>
                  Quantity per delivery
                </h2>
                <p className="subscription-wizard-step-desc">Confirm quantity before payment.</p>
                {quantitySection}
              </section>
            )}
          </div>

          {wizardSummaryCard}
        </form>
      </div>
    );
  }

  return (
    <div className="subscription-create-form">
      <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to="/subscriptions">Subscriptions</Link>
        <span>/</span>
        <span className="product-detail-breadcrumb-current">Create</span>
      </nav>

      <header className="subscription-create-header">
        <div>
          <h1 className="subscription-create-title">Start your subscription</h1>
          <p className="subscription-create-subtitle">
            Fresh farm products delivered on your schedule — pause or skip anytime.
          </p>
        </div>
        <Link to="/subscriptions" className="subscription-create-back-link">
          ← My subscriptions
        </Link>
      </header>

      {error && (
        <Alert variant="danger" className="subscription-create-alert">
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="subscription-create-layout">
        <div className="subscription-create-main">
          <section className="subscription-create-card">
            <h2 className="subscription-create-section-title">
              <span className="subscription-create-step">1</span>
              {showProductPicker ? 'Choose product' : 'Product'}
            </h2>
            {products.length === 0 ? (
              <p className="text-muted small mb-0">No subscription products available right now.</p>
            ) : showProductPicker ? (
              <div className="subscription-create-product-grid">
                {products.map((p) => {
                  const price = p.price_after_offer ?? p.price;
                  const selected = String(p.id) === productId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      className={`subscription-create-product-option ${selected ? 'selected' : ''}`}
                      onClick={() => setProductId(String(p.id))}
                    >
                      <div className="subscription-create-product-option-image">
                        <img
                          src={p.image || '/logo.png'}
                          alt=""
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/logo.png';
                          }}
                        />
                      </div>
                      <span className="subscription-create-product-option-name">{p.name}</span>
                      <span className="subscription-create-product-option-price">₹{price}/mo</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              productHero
            )}
          </section>

          <section className="subscription-create-card">
            <h2 className="subscription-create-section-title">
              <span className="subscription-create-step">2</span>
              Delivery frequency
            </h2>
            {frequencySection}
          </section>

          <section className="subscription-create-card">
            {datesSection}
          </section>

          <section className="subscription-create-card">
            <h2 className="subscription-create-section-title">
              <span className="subscription-create-step">4</span>
              Quantity per delivery
            </h2>
            {quantitySection}
          </section>
        </div>

        <aside className="subscription-create-summary">
          <div className="subscription-create-summary-card">
            <h2 className="subscription-create-summary-title">Order summary</h2>
            {selectedProduct ? (
              <>
                <div className="subscription-create-summary-product">
                  <img
                    src={selectedProduct.image || '/logo.png'}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                  <div>
                    <p className="subscription-create-summary-name">{selectedProduct.name}</p>
                    <p className="subscription-create-summary-rate">₹{pricePerDay}/delivery</p>
                  </div>
                </div>
                {summaryBlock}
                <Button
                  type="submit"
                  variant="outline-success"
                  className="rounded-pill w-100 subscription-create-pay-btn"
                  disabled={submitting || !selectedProduct || deliveryCount < 1}
                >
                  {submitting ? 'Processing…' : 'Confirm & pay with Razorpay'}
                </Button>
                <p className="subscription-create-summary-note">
                  Secure payment · Cancel or pause anytime from your account
                </p>
              </>
            ) : (
              <p className="text-muted small mb-0">Select a product to see your summary.</p>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
