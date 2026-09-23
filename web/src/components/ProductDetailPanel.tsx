import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import ProductGridCard from './ProductGridCard';
import LoadingSpinner from './LoadingSpinner';
import SubscriptionCreateModal from './SubscriptionCreateModal';
import { getProducts } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useServiceArea } from '../context/ServiceAreaContext';
import { categoryBrowsePath } from '../utils/authRedirect';
import type { Product } from '../types';

interface ProductDetailPanelProps {
  product: Product;
  onBack?: () => void;
}

function qtyLabel(product: Product) {
  if (product.quantity && product.quantity_unit) {
    return `${product.quantity} ${product.quantity_unit}`;
  }
  return product.quantity_unit || '';
}

export default function ProductDetailPanel({ product, onBack }: ProductDetailPanelProps) {
  const [related, setRelated] = useState<Product[]>([]);
  const [relatedLoading, setRelatedLoading] = useState(true);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const { addItem, items, updateQuantity } = useCart();
  const { isAuthenticated } = useAuth();
  const { ensureServiceArea } = useServiceArea();
  const navigate = useNavigate();
  const location = useLocation();
  const inAccountShell = location.pathname.startsWith('/shop');

  const inCart = items.find((i) => i.product_id === product.id);
  const isMonthly = product.monthly_subscription === 1;

  const displayPrice = product.price_after_offer ?? product.price;
  const hasOffer = product.price_after_offer != null && product.price_after_offer < product.price;
  const discountPct =
    hasOffer && product.offer_percentage && product.offer_percentage > 0
      ? Math.round(product.offer_percentage)
      : hasOffer
        ? Math.round((1 - displayPrice / product.price) * 100)
        : null;

  const categoryName = product.category_name || product.category;

  useEffect(() => {
    setRelatedLoading(true);
    getProducts(product.category)
      .then((items) => setRelated(items.filter((p) => p.id !== product.id).slice(0, 8)))
      .catch(() => setRelated([]))
      .finally(() => setRelatedLoading(false));
  }, [product.id, product.category]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (product.stock <= 0) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    if (inCart) {
      updateQuantity(product.id, inCart.quantity + 1);
      return;
    }
    addItem({
      product_id: product.id,
      name: product.name,
      price: displayPrice,
      image: product.image,
    });
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (product.stock <= 0) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    if (!inCart) {
      addItem({
        product_id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
      });
    }
    navigate('/checkout');
  };

  const handleDecrease = () => {
    if (inCart) updateQuantity(product.id, inCart.quantity - 1);
  };

  const handleIncrease = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (inCart) {
      const allowed = await ensureServiceArea();
      if (!allowed) return;
      updateQuantity(product.id, inCart.quantity + 1);
    } else {
      await handleAddToCart();
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    setShowSubscribeModal(true);
  };

  return (
    <div className="product-detail-panel">
      <nav className="product-detail-breadcrumb" aria-label="Breadcrumb">
        <Link to="/">Home</Link>
        <span>/</span>
        <Link to={categoryBrowsePath(product.category, inAccountShell)}>{categoryName}</Link>
        <span>/</span>
        <span className="product-detail-breadcrumb-current">{product.name}</span>
      </nav>

      <div className="product-detail-hero">
        <div className="product-detail-image-wrap">
          <img
            src={product.image || '/logo.png'}
            alt={product.name}
            className="product-detail-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>

        <div className="product-detail-info">
          <h1 className="product-detail-title">{product.name}</h1>
          {qtyLabel(product) && <p className="product-detail-qty">{qtyLabel(product)}</p>}
          <p className="product-detail-subscription-tag">
            Monthly subscription: <strong>{isMonthly ? 'Yes' : 'No'}</strong>
          </p>

          <div className="product-detail-price-row">
            <div className="product-detail-price-block">
              <div className="product-detail-price-line">
                <span className="product-detail-price">
                  ₹{displayPrice}
                  {isMonthly && <span className="product-detail-per-month">/month</span>}
                </span>
                {hasOffer && (
                  <span className="product-detail-mrp">MRP ₹{product.price}</span>
                )}
                {discountPct != null && discountPct > 0 && (
                  <span className="product-detail-discount">{discountPct}% OFF</span>
                )}
              </div>
              <p className="product-detail-tax">(Inclusive of all taxes)</p>
              {product.stock > 0 ? (
                <p className="product-detail-stock text-success small mb-0">In stock</p>
              ) : (
                <p className="product-detail-stock text-danger small mb-0">Out of stock</p>
              )}
            </div>
          </div>

          <div className="product-detail-actions">
            {product.stock <= 0 ? (
              <span className="product-detail-out-of-stock">Out of stock</span>
            ) : (
              <>
                {inCart && (
                  <div className="product-detail-qty-control">
                    <Button
                      variant="outline-success"
                      className="rounded-pill product-detail-qty-btn"
                      onClick={handleDecrease}
                      aria-label="Decrease quantity"
                    >
                      −
                    </Button>
                    <span className="product-detail-qty-value">{inCart.quantity}</span>
                    <Button
                      variant="outline-success"
                      className="rounded-pill product-detail-qty-btn"
                      onClick={handleIncrease}
                      aria-label="Increase quantity"
                    >
                      +
                    </Button>
                  </div>
                )}

                <div className="product-detail-action-buttons">
                  <Button
                    variant="outline-success"
                    className="rounded-pill product-detail-add-btn"
                    onClick={handleAddToCart}
                  >
                    {inCart ? 'Add one more' : 'Add to Cart'}
                  </Button>
                  <Button
                    className="btn-accent rounded-pill product-detail-buy-btn"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                </div>
              </>
            )}
          </div>

          {isMonthly && (
            <>
              <div className="product-detail-subscribe-step">
                <span className="subscription-create-step">1</span>
                <span>Product selected — schedule your deliveries below</span>
              </div>
              <Button
                variant="outline-success"
                className="rounded-pill mt-2"
                size="sm"
                onClick={handleSubscribe}
              >
                Continue to schedule →
              </Button>
            </>
          )}

          {onBack && (
            <button type="button" className="product-detail-back-btn" onClick={onBack}>
              ← Back to products
            </button>
          )}
        </div>
      </div>

      <section className="product-detail-section">
        <h2 className="product-detail-section-title">Product Description</h2>
        {product.description?.trim() ? (
          <div className="product-detail-description">{product.description}</div>
        ) : (
          <p className="product-detail-description-empty text-muted">
            No description available for this product.
          </p>
        )}
      </section>

      <section className="product-detail-section">
        <h2 className="product-detail-section-title">
          Related Products
          {categoryName && <span className="product-detail-section-sub"> in {categoryName}</span>}
        </h2>
        {relatedLoading ? (
          <LoadingSpinner />
        ) : related.length === 0 ? (
          <p className="text-muted small mb-0">No other products in this category yet.</p>
        ) : (
          <div className="product-grid product-grid-related">
            {related.map((p) => (
              <ProductGridCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      <SubscriptionCreateModal
        show={showSubscribeModal}
        onHide={() => setShowSubscribeModal(false)}
        product={product}
      />
    </div>
  );
}
