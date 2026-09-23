import { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import SubscriptionCreateForm from './SubscriptionCreateForm';
import LoadingSpinner from './LoadingSpinner';
import { getProducts } from '../services/api';
import type { Product } from '../types';

interface SubscriptionCreateModalProps {
  show: boolean;
  onHide: () => void;
  product?: Product;
  productId?: number;
}

export default function SubscriptionCreateModal({
  show,
  onHide,
  product,
  productId,
}: SubscriptionCreateModalProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!show) return;

    if (product) {
      setProducts([product]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getProducts()
      .then((list) => {
        const subs = list.filter((p) => p.monthly_subscription === 1);
        setProducts(subs.length > 0 ? subs : list);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [show, product]);

  const resolvedProductId = product?.id ?? productId;

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      scrollable={false}
      className="subscription-create-modal"
      contentClassName="subscription-create-modal-content"
    >
      <Modal.Header closeButton className="subscription-create-modal-header">
        <Modal.Title className="subscription-create-modal-title">
          Schedule delivery
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="subscription-create-modal-body">
        {loading ? (
          <LoadingSpinner />
        ) : (
          <SubscriptionCreateForm
            key={show ? String(resolvedProductId ?? 'list') : 'closed'}
            products={products}
            initialProductId={resolvedProductId}
            layout="modal"
            onCancel={onHide}
          />
        )}
      </Modal.Body>
    </Modal>
  );
}
