import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist, productToWishlistItem } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import type { Product } from '../types';
import { useServiceArea } from '../context/ServiceAreaContext';
import { productBrowsePath } from '../utils/authRedirect';

interface ProductGridCardProps {
  product: Product;
}

export default function ProductGridCard({ product }: ProductGridCardProps) {
  const { addItem, items, updateQuantity } = useCart();
  const { ensureServiceArea } = useServiceArea();
  const { isAuthenticated } = useAuth();
  const { isWishlisted, toggleItem } = useWishlist();
  const displayPrice = product.price_after_offer ?? product.price;
  const hasOffer = product.price_after_offer != null && product.price_after_offer < product.price;
  const inCart = items.find((i) => i.product_id === product.id);
  const qtyLabel =
    product.quantity && product.quantity_unit
      ? `${product.quantity} ${product.quantity_unit}`
      : product.quantity_unit || '1 pc';

  const discountLabel =
    hasOffer && product.offer_percentage && product.offer_percentage > 0
      ? `${Math.round(product.offer_percentage)}% OFF`
      : hasOffer
        ? `${Math.round((1 - displayPrice / product.price) * 100)}% OFF`
        : null;

  const handleAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.stock <= 0) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    addItem(
      {
        product_id: product.id,
        name: product.name,
        price: displayPrice,
        image: product.image,
      },
      1
    );
  };

  const handleIncrease = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!inCart) return;
    const allowed = await ensureServiceArea();
    if (!allowed) return;
    updateQuantity(product.id, inCart.quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) updateQuantity(product.id, inCart.quantity - 1);
  };

  const outOfStock = product.stock <= 0;
  const wishlisted = isWishlisted(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(productToWishlistItem(product));
  };

  return (
    <article className="product-grid-card">
      {discountLabel && <span className="product-grid-discount-badge">{discountLabel}</span>}
      <button
        type="button"
        className={`product-grid-wishlist-btn ${wishlisted ? 'active' : ''}`}
        onClick={handleWishlist}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        {wishlisted ? '❤️' : '🤍'}
      </button>

      <Link to={productBrowsePath(product.id, isAuthenticated)} className="product-grid-card-link">
        <div className="product-grid-card-image-wrap">
          <img
            src={product.image || '/logo.png'}
            alt={product.name}
            className="product-grid-card-image"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        </div>
        <div className="product-grid-delivery">
          <span className="product-grid-delivery-icon" aria-hidden>
            ⏱
          </span>
          8 MINS
        </div>
        <h3 className="product-grid-card-title">{product.name}</h3>
        <p className="product-grid-qty-text">{qtyLabel}</p>
      </Link>

      <div className="product-grid-card-footer">
        <div className="product-grid-price">
          <span className="product-grid-price-value">₹{displayPrice}</span>
          {hasOffer && <span className="product-grid-price-mrp">₹{product.price}</span>}
        </div>

        {outOfStock ? (
          <span className="product-grid-out-of-stock">Out of stock</span>
        ) : inCart ? (
          <div className="product-grid-qty-control">
            <button type="button" className="qty-btn" onClick={handleDecrease} aria-label="Decrease quantity">
              −
            </button>
            <span className="qty-value">{inCart.quantity}</span>
            <button type="button" className="qty-btn" onClick={handleIncrease} aria-label="Increase quantity">
              +
            </button>
          </div>
        ) : (
          <button type="button" className="product-grid-add-btn" onClick={handleAdd}>
            ADD
          </button>
        )}
      </div>
    </article>
  );
}
