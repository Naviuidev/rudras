import { Link, useNavigate } from 'react-router-dom';
import { Card, Button, Row, Col } from 'react-bootstrap';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
const MAX_CART_QTY = 99;

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleDecrease = (productId: number, quantity: number) => {
    updateQuantity(productId, quantity - 1);
  };

  const handleIncrease = (productId: number, quantity: number) => {
    if (quantity >= MAX_CART_QTY) return;
    updateQuantity(productId, quantity + 1);
  };

  if (items.length === 0) {
    return (
      <div className="user-account-content">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Add some fresh dairy products to get started"
          actionLabel="Browse Products"
          actionHref="/shop"
        />
      </div>
    );
  }

  return (
    <div className="user-account-content">
      <h4 className="section-title">Shopping Cart</h4>
      <Row className="g-4">
        <Col lg={8}>
          {items.map((item) => (
            <Card key={item.product_id} className="card-brand mb-3">
              <Card.Body>
                <Row className="align-items-center g-3">
                  <Col xs={3} sm={2}>
                    <img
                      src={item.image || '/logo.png'}
                      alt={item.name}
                      className="rounded w-100"
                      style={{ height: 64, objectFit: 'cover' }}
                    />
                  </Col>
                  <Col xs={9} sm={4}>
                    <h6 className="mb-0">{item.name}</h6>
                    <span className="price-tag">₹{item.price}</span>
                  </Col>
                  <Col xs={6} sm={3}>
                    <div className="product-detail-qty-control cart-qty-control">
                      <Button
                        variant="outline-success"
                        className="rounded-pill product-detail-qty-btn"
                        onClick={() => handleDecrease(item.product_id, item.quantity)}
                        aria-label={`Decrease quantity for ${item.name}`}
                      >
                        −
                      </Button>
                      <span className="product-detail-qty-value">{item.quantity}</span>
                      <Button
                        variant="outline-success"
                        className="rounded-pill product-detail-qty-btn"
                        onClick={() => handleIncrease(item.product_id, item.quantity)}
                        disabled={item.quantity >= MAX_CART_QTY}
                        aria-label={`Increase quantity for ${item.name}`}
                      >
                        +
                      </Button>
                    </div>
                  </Col>
                  <Col xs={4} sm={2} className="text-end">
                    <strong>₹{(item.price * item.quantity).toFixed(2)}</strong>
                  </Col>
                  <Col xs={2} sm={1} className="text-end">
                    <Button
                      variant="link"
                      className="text-danger p-0"
                      onClick={() => removeItem(item.product_id)}
                    >
                      ✕
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>
        <Col lg={4}>
          <Card className="card-brand sticky-top" style={{ top: 80 }}>
            <Card.Body>
              <h6 className="fw-semibold mb-3" style={{ color: 'var(--accent)' }}>
                Order Summary
              </h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 text-muted small">
                <span>Delivery</span>
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
              <Button type="button" className="btn btn-accent w-100" onClick={handleCheckout}>
                Proceed to Checkout
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
