import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { USER_NAV_ITEMS } from '../config/userNav';
import UserNavIcon from './UserNavIcon';

export default function UserSidebar() {
  const { logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const badgeFor = (to: string) => {
    if (to === '/cart' && itemCount > 0) return itemCount;
    if (to === '/wishlist' && wishlistCount > 0) return wishlistCount;
    return 0;
  };

  return (
    <aside className="category-sidebar user-sidebar" aria-label="Account navigation">
      <nav className="category-sidebar-nav">
        {USER_NAV_ITEMS.map((item) => {
          const prefixActive =
            item.matchPrefix &&
            (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
          const badge = badgeFor(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                `category-sidebar-item user-sidebar-item text-decoration-none ${prefixActive || isActive ? 'active' : ''}`
              }
            >
              <span className="category-sidebar-thumb user-sidebar-thumb">
                <UserNavIcon name={item.icon} />
                {badge > 0 && <span className="user-sidebar-badge">{badge}</span>}
              </span>
              <span className="user-sidebar-label">{item.label}</span>
            </NavLink>
          );
        })}

        <button
          type="button"
          className="category-sidebar-item user-sidebar-logout"
          title="Logout"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <span className="category-sidebar-thumb user-sidebar-thumb">
            <UserNavIcon name="logout" />
          </span>
          <span className="user-sidebar-label">Logout</span>
        </button>
      </nav>
    </aside>
  );
}
