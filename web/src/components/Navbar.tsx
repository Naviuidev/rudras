import { Link, NavLink } from 'react-router-dom';
import { Container, Offcanvas } from 'react-bootstrap';
import { useState } from 'react';
import NavbarSearch from './NavbarSearch';
import NavbarCartLink from './NavbarCartLink';
import UserAccountDropdown from './UserAccountDropdown';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const [show, setShow] = useState(false);

  const closeMenu = () => setShow(false);
  const homeTo = isAuthenticated ? '/dashboard' : '/';
  const shopTo = isAuthenticated ? '/shop' : '/products';

  return (
    <header className="site-navbar sticky-top">
      <Container className="site-navbar-inner">
        <Link to={homeTo} className="site-navbar-logo" aria-label="Rudra's Farm Fresh home">
          <img src="/logo.png" alt="" className="navbar-brand-logo" />
        </Link>

        <NavbarSearch className="site-navbar-search d-none d-lg-flex" />

        <nav className="site-navbar-actions d-none d-lg-flex" aria-label="Main">
          <NavLink to={homeTo} end className="site-nav-link">
            {isAuthenticated ? 'Dashboard' : 'Home'}
          </NavLink>
          <NavLink to={shopTo} className="site-nav-link">
            Shop
          </NavLink>
          {isAuthenticated ? (
            <>
              <NavbarCartLink />
              <UserAccountDropdown />
            </>
          ) : (
            <Link to="/login" className="site-nav-login btn btn-sm btn-outline-success rounded-pill">
              Login
            </Link>
          )}
        </nav>

        <div className="site-navbar-mobile-actions d-lg-none">
          {isAuthenticated && <NavbarCartLink />}
          <button
            type="button"
            className="site-navbar-toggle"
            aria-label="Open menu"
            onClick={() => setShow(true)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </Container>

      <Offcanvas show={show} onHide={closeMenu} placement="end" className="site-navbar-drawer">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <NavbarSearch className="mb-4" onSubmit={closeMenu} />
          <nav className="site-drawer-nav">
            <NavLink to={homeTo} end className="site-nav-link" onClick={closeMenu}>
              {isAuthenticated ? 'Dashboard' : 'Home'}
            </NavLink>
            <NavLink to={shopTo} className="site-nav-link" onClick={closeMenu}>
              Shop
            </NavLink>
            {isAuthenticated ? (
              <div className="mt-3">
                <Link to="/cart" className="site-nav-link site-drawer-cart-link" onClick={closeMenu}>
                  Cart
                </Link>
                <div className="mt-3">
                  <UserAccountDropdown variant="menu" onNavigate={closeMenu} />
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="site-nav-login btn btn-outline-success rounded-pill w-100 mt-3"
                onClick={closeMenu}
              >
                Login
              </Link>
            )}
          </nav>
        </Offcanvas.Body>
      </Offcanvas>
    </header>
  );
}
