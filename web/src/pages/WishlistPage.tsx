import { Link } from 'react-router-dom';
import { Card, Button } from 'react-bootstrap';
import { useWishlist } from '../context/WishlistContext';
import EmptyState from '../components/EmptyState';
import { productBrowsePath } from '../utils/authRedirect';

export default function WishlistPage() {
  const { items, removeItem } = useWishlist();

  return (
    <div className="user-account-content">
      <h1 className="category-shop-title mb-3">Wishlist</h1>

      {items.length === 0 ? (
        <EmptyState title="Your wishlist is empty" message="Save products you love to find them quickly later.">
          <Link to="/shop" className="btn btn-accent mt-2">
            Browse shop
          </Link>
        </EmptyState>
      ) : (
        <div className="wishlist-list">
          {items.map((item) => (
            <Card key={item.product_id} className="card-brand wishlist-row mb-2">
              <Card.Body className="d-flex align-items-center gap-3 py-2">
                <Link to={productBrowsePath(item.product_id, true)}>
                  <img
                    src={item.image || '/logo.png'}
                    alt=""
                    className="wishlist-thumb"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/logo.png';
                    }}
                  />
                </Link>
                <div className="flex-grow-1 min-w-0">
                  <Link
                    to={productBrowsePath(item.product_id, true)}
                    className="fw-semibold text-decoration-none text-dark"
                  >
                    {item.name}
                  </Link>
                  <div className="price-tag">₹{item.price}</div>
                </div>
                <div className="d-flex gap-2 flex-shrink-0">
                  <Link to="/cart" className="btn btn-sm btn-outline-accent">
                    Cart
                  </Link>
                  <Button variant="outline-danger" size="sm" onClick={() => removeItem(item.product_id)}>
                    Remove
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
