import { Link, useNavigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import BtnIcon from './BtnIcon';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <header className="admin-header sticky-top">
      <Container fluid className="admin-header-inner">
        <Link to="/admin/dashboard" className="admin-header-brand">
          <img src="/logo.png" alt="Rudra's Farm Fresh" className="admin-header-logo" />
          <span className="admin-header-brand-text">Rudra&apos;s Farm Fresh</span>
        </Link>

        <span className="admin-header-badge">Admin Panel</span>

        <div className="admin-header-actions">
          {user && (
            <div className="admin-header-user">
              <span className="admin-header-avatar" aria-hidden>
                {(user.username || user.name || 'A').charAt(0).toUpperCase()}
              </span>
              <div className="admin-header-user-meta">
                <span className="admin-header-user-name">{user.username || user.name}</span>
                <span className="admin-header-user-role">Administrator</span>
              </div>
            </div>
          )}
          <button type="button" className="btn btn-sm btn-outline-accent admin-header-logout" onClick={handleLogout}>
            <BtnIcon name="logout" /> Logout
          </button>
        </div>
      </Container>
    </header>
  );
}
