import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SubscriptionCreateForm from '../components/SubscriptionCreateForm';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProducts } from '../services/api';
import { useServiceArea } from '../context/ServiceAreaContext';
import type { Product } from '../types';

export default function CreateSubscriptionPage() {
  const { promptForServiceArea, status } = useServiceArea();
  const [products, setProducts] = useState<Product[]>([]);
  const [initialProductId, setInitialProductId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('product');

    getProducts()
      .then((list) => {
        const subs = list.filter((p) => p.monthly_subscription === 1);
        const items = subs.length > 0 ? subs : list;
        setProducts(items);
        if (preselect && list.some((p) => p.id === Number(preselect))) {
          setInitialProductId(Number(preselect));
        }
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (status === 'unknown') {
      promptForServiceArea();
    }
  }, [status, promptForServiceArea]);

  if (loading) {
    return (
      <div className="user-account-content">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="user-account-content subscription-create-page subscription-create-page--wizard">
      <div className="subscription-create-page-toolbar">
        <Link to="/subscriptions" className="subscription-create-back-link">
          ← My subscriptions
        </Link>
      </div>
      <SubscriptionCreateForm
        products={products}
        initialProductId={initialProductId}
        layout="modal"
      />
    </div>
  );
}
