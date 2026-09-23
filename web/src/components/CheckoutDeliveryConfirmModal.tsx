import { Button, Form, Modal } from 'react-bootstrap';
import type { Address } from '../types';

type AddressServiceStatus = 'serviceable' | 'unserviceable' | 'unknown' | 'checking';

interface CheckoutDeliveryConfirmModalProps {
  show: boolean;
  onHide: () => void;
  addresses: Address[];
  serviceStatus: Record<number, AddressServiceStatus>;
  highlightAddressId?: number | null;
  selectedId: number | null;
  onSelect: (id: number) => void;
  onConfirm: () => void;
  confirming: boolean;
  title?: string;
}

function formatShortAddress(a: Address): string {
  return `${a.address_line}${a.area ? ', ' + a.area : ''}, ${a.city}, ${a.state} - ${a.pincode}`;
}

export default function CheckoutDeliveryConfirmModal({
  show,
  onHide,
  addresses,
  serviceStatus,
  highlightAddressId,
  selectedId,
  onSelect,
  onConfirm,
  confirming,
  title = 'Choose delivery location',
}: CheckoutDeliveryConfirmModalProps) {
  const serviceable = addresses.filter((a) => serviceStatus[a.id] === 'serviceable');
  const checking = addresses.some((a) => serviceStatus[a.id] === 'checking');

  return (
    <Modal show={show} onHide={onHide} centered className="checkout-delivery-confirm-modal">
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="checkout-delivery-confirm-lead mb-3">
          {highlightAddressId
            ? 'Your new address has been saved. Select where you want this order delivered, then continue to payment.'
            : 'Select the delivery address for this order.'}
        </p>

        {checking && (
          <p className="text-muted small mb-3">Checking delivery availability for your addresses…</p>
        )}

        {serviceable.length === 0 && !checking ? (
          <p className="text-danger small mb-0">
            No serviceable addresses found. Please add an address within our delivery area.
          </p>
        ) : (
          <div className="checkout-delivery-confirm-list">
            {serviceable.map((a) => {
              const isHighlighted = highlightAddressId === a.id;
              const isSelected = selectedId === a.id;

              return (
                <label
                  key={a.id}
                  className={`checkout-delivery-confirm-option${isSelected ? ' checkout-delivery-confirm-option--selected' : ''}${isHighlighted ? ' checkout-delivery-confirm-option--new' : ''}`}
                >
                  <Form.Check
                    type="radio"
                    name="delivery-confirm-address"
                    checked={isSelected}
                    onChange={() => onSelect(a.id)}
                    className="checkout-address-radio"
                  />
                  <div className="checkout-delivery-confirm-content">
                    <div className="checkout-delivery-confirm-name">
                      {a.name}
                      {isHighlighted && <span className="checkout-delivery-confirm-new-badge">New</span>}
                    </div>
                    <div className="checkout-delivery-confirm-meta">{a.mobile}</div>
                    <div className="checkout-delivery-confirm-address">{formatShortAddress(a)}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" className="rounded-pill" onClick={onHide} disabled={confirming}>
          Cancel
        </Button>
        <Button
          className="btn-accent rounded-pill"
          onClick={onConfirm}
          disabled={confirming || !selectedId || serviceStatus[selectedId!] !== 'serviceable'}
        >
          {confirming ? 'Processing…' : 'Confirm & Pay with Razorpay'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
