import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import CategorySidebar from '../components/CategorySidebar';
import ProductDetailPanel from '../components/ProductDetailPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProduct, getCategories, getErrorMessage } from '../services/api';
import { toCategoryDisplayItems } from '../config/categoryDisplay';
import type { CategoryDisplayItem } from '../config/categoryDisplay';
import type { Product } from '../types';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<CategoryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCategories()
      .then((apiCategories) => setCategories(toCategoryDisplayItems(apiCategories)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    getProduct(Number(id))
      .then(setProduct)
      .catch((err) => {
        setProduct(null);
        setError(getErrorMessage(err));
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCategorySelect = (slug: string) => {
    navigate(`/products?category=${encodeURIComponent(slug)}`);
  };

  const handleBack = () => {
    if (product?.category) {
      navigate(`/products?category=${encodeURIComponent(product.category)}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <Container className="page-container">
      <div className="category-shop-page">
        <CategorySidebar
          categories={categories}
          selectedSlug={product?.category || ''}
          onSelect={handleCategorySelect}
        />

        <main className="category-shop-main">
          {loading ? (
            <LoadingSpinner />
          ) : error || !product ? (
            <>
              <Alert variant="danger">{error || 'Product not found'}</Alert>
              <Link to="/products">Back to products</Link>
            </>
          ) : (
            <ProductDetailPanel product={product} onBack={handleBack} />
          )}
        </main>
      </div>
    </Container>
  );
}
