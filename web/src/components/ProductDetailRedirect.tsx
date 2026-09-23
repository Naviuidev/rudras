import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { productBrowsePath } from '../utils/authRedirect';

/** Legacy /products/:id URLs → unified browse + detail panel. */
export default function ProductDetailRedirect() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();
  const productId = Number(id);

  if (!id || Number.isNaN(productId)) {
    return <Navigate to={isAuthenticated ? '/shop' : '/products'} replace />;
  }

  return <Navigate to={productBrowsePath(productId, isAuthenticated)} replace />;
}
