import { Link } from 'react-router-dom';
import UserNavIcon from './UserNavIcon';
import { useCart } from '../context/CartContext';

interface NavbarCartLinkProps {
  className?: string;
  onClick?: () => void;
}

export default function NavbarCartLink({ className = '', onClick }: NavbarCartLinkProps) {
  const { itemCount } = useCart();

  return (
    <Link
      to="/cart"
      className={`site-navbar-cart ${className}`.trim()}
      aria-label={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}
      onClick={onClick}
    >
      <UserNavIcon name="cart" />
      {itemCount > 0 && (
        <span className="site-navbar-cart-badge">{itemCount > 99 ? '99+' : itemCount}</span>
      )}
    </Link>
  );
}
