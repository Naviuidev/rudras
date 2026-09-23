import { Link, useNavigate } from 'react-router-dom';
import { Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { USER_DROPDOWN_ITEMS } from '../config/userNav';

interface UserAccountDropdownProps {
  onNavigate?: () => void;
  variant?: 'navbar' | 'menu';
}

export default function UserAccountDropdown({ onNavigate, variant = 'navbar' }: UserAccountDropdownProps) {
  const { logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();

  const badgeFor = (to: string) => {
    if (to === '/cart' && itemCount > 0) return itemCount;
    if (to === '/wishlist' && wishlistCount > 0) return wishlistCount;
    return 0;
  };

  const handleLogout = () => {
    logout();
    onNavigate?.();
    navigate('/');
  };

  if (variant === 'menu') {
    return (
      <div className="user-menu-list">
        {USER_DROPDOWN_ITEMS.map((item) => {
          const badge = badgeFor(item.to);
          return (
            <Link key={item.to} to={item.to} className="user-menu-link" onClick={onNavigate}>
              {item.label}
              {badge > 0 && <span className="user-menu-badge">{badge}</span>}
            </Link>
          );
        })}
        <button type="button" className="user-menu-link user-menu-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <Dropdown align="end" className="user-account-dropdown">
      <Dropdown.Toggle id="user-account-dropdown" variant="link" className="user-dropdown-toggle">
        <span className="user-dropdown-label">Account</span>
        <span className="user-dropdown-chevron" aria-hidden>▾</span>
      </Dropdown.Toggle>

      <Dropdown.Menu className="user-dropdown-menu shadow-sm">
        {USER_DROPDOWN_ITEMS.map((item) => {
          const badge = badgeFor(item.to);
          return (
            <Dropdown.Item key={item.to} as={Link} to={item.to} className="user-dropdown-item">
              <span>{item.label}</span>
              {badge > 0 && <span className="user-menu-badge">{badge}</span>}
            </Dropdown.Item>
          );
        })}
        <Dropdown.Divider className="my-2" />
        <Dropdown.Item
          as="button"
          type="button"
          className="user-dropdown-item user-dropdown-logout"
          onClick={handleLogout}
        >
          Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
}
