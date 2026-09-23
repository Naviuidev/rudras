import { Link } from 'react-router-dom';
import { Card } from 'react-bootstrap';
import type { Product } from '../types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const displayPrice = product.price_after_offer ?? product.price;
  const hasOffer = product.price_after_offer != null && product.price_after_offer < product.price;

  return (
    <Card className="card-brand h-100">
      <Link to={`/products/${product.id}`}>
        <Card.Img
          variant="top"
          src={product.image || '/logo.png'}
          alt={product.name}
          className="product-card-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logo.png';
          }}
        />
      </Link>
      <Card.Body className="d-flex flex-column">
        <Card.Title className="fs-6 mb-1">{product.name}</Card.Title>
        <Card.Text className="text-muted small flex-grow-1">
          {product.description?.slice(0, 60)}
          {(product.description?.length ?? 0) > 60 ? '...' : ''}
        </Card.Text>
        <div className="d-flex justify-content-between align-items-center mt-2">
          <div>
            <span className="price-tag">₹{displayPrice}</span>
            {hasOffer && (
              <small className="text-muted text-decoration-line-through ms-2">₹{product.price}</small>
            )}
            {product.quantity_unit && (
              <small className="text-muted d-block">/{product.quantity_unit}</small>
            )}
          </div>
          <Link to={`/products/${product.id}`} className="btn btn-sm btn-outline-accent">
            View
          </Link>
        </div>
      </Card.Body>
    </Card>
  );
}
