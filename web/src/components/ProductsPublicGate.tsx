import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProductsPage from '../pages/ProductsPage';

/** Guests see public shop; logged-in users browse inside the account shell. */
export default function ProductsPublicGate() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (isAuthenticated) {
    return <Navigate to={`/shop${location.search}`} replace />;
  }

  return <ProductsPage />;
}
