import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getProducts } from '../services/api';
import { buildProductsParams } from '../utils/productShopParams';
import { useAuth } from '../context/AuthContext';
import { productBrowsePath } from '../utils/authRedirect';
import type { Product } from '../types';

interface NavbarSearchProps {
  className?: string;
  onSubmit?: () => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 320;
const PREVIEW_LIMIT = 6;

function formatPrice(product: Product) {
  const price = product.price_after_offer ?? product.price;
  return `₹${Number(price).toFixed(0)}`;
}

export default function NavbarSearch({
  className = '',
  onSubmit,
  placeholder = 'Search milk, curd, ghee…',
}: NavbarSearchProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const shopBase = isAuthenticated ? '/shop' : '/products';
  const isShopPage = location.pathname === '/products' || location.pathname === '/shop';
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (isShopPage) {
      const params = new URLSearchParams(location.search);
      if (!params.get('product')) {
        setQuery(params.get('search') || '');
      }
    }
  }, [location.pathname, location.search]);

  const runSearch = useCallback(
    async (q: string, syncProductsPage: boolean) => {
      if (!q) {
        setResults([]);
        setTotalCount(0);
        setOpen(false);
        setLoading(false);
        if (syncProductsPage && isShopPage) {
          const params = new URLSearchParams(location.search);
          navigate(`${shopBase}?${new URLSearchParams(buildProductsParams(params, { search: null })).toString()}`, {
            replace: true,
          });
        }
        return;
      }

      setLoading(true);
      try {
        const items = await getProducts(undefined, q);
        setResults(items.slice(0, PREVIEW_LIMIT));
        setTotalCount(items.length);
        setOpen(true);

        if (syncProductsPage && isShopPage) {
          const params = new URLSearchParams(location.search);
          const next = new URLSearchParams(
            buildProductsParams(params, { search: q, category: params.get('category') })
          );
          const nextStr = next.toString();
          const current = location.search.replace(/^\?/, '');
          if (nextStr !== current) {
            navigate(`${shopBase}?${nextStr}`, { replace: true });
          }
        }
      } catch {
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [location.pathname, location.search, navigate, isShopPage, shopBase]
  );

  useEffect(() => {
    const q = query.trim();
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      runSearch(q, isShopPage);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [query, runSearch]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToProduct = (product: Product) => {
    setOpen(false);
    onSubmit?.();
    setQuery('');
    navigate(productBrowsePath(product.id, isAuthenticated));
  };

  const goToAllResults = (q: string) => {
    setOpen(false);
    onSubmit?.();
    navigate(`${shopBase}?search=${encodeURIComponent(q)}`);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    onSubmit?.();
    setOpen(false);
    if (!q) {
      navigate(shopBase);
      return;
    }
    goToAllResults(q);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setOpen(false);
    if (isShopPage) {
      const params = new URLSearchParams(location.search);
      navigate(`${shopBase}?${new URLSearchParams(buildProductsParams(params, { search: null })).toString()}`, {
        replace: true,
      });
    }
  };

  const handleFocus = () => {
    if (query.trim() && (results.length > 0 || loading)) {
      setOpen(true);
    }
  };

  const showPanel = open && query.trim().length > 0;

  return (
    <div className={`navbar-search-wrap ${className}`.trim()} ref={wrapRef}>
      <form className="navbar-search" onSubmit={handleSubmit} role="search">
        <svg className="navbar-search-icon" viewBox="0 0 24 24" aria-hidden width="18" height="18">
          <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" strokeWidth="1.75" />
          <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M16.5 16.5 21 21" />
        </svg>
        <input
          type="search"
          className="navbar-search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          aria-label="Search products"
          aria-expanded={showPanel}
          aria-controls="navbar-search-results"
          autoComplete="off"
        />
        {loading && <span className="navbar-search-spinner" aria-hidden />}
        {query && !loading && (
          <button type="button" className="navbar-search-clear" aria-label="Clear search" onClick={handleClear}>
            ×
          </button>
        )}
      </form>

      {showPanel && (
        <div id="navbar-search-results" className="navbar-search-panel" role="listbox">
          {loading && results.length === 0 ? (
            <div className="navbar-search-panel-status">Searching…</div>
          ) : results.length === 0 ? (
            <div className="navbar-search-panel-status">No products found</div>
          ) : (
            <>
              <ul className="navbar-search-list">
                {results.map((product) => (
                  <li key={product.id}>
                    <button
                      type="button"
                      className="navbar-search-item"
                      role="option"
                      onClick={() => goToProduct(product)}
                    >
                      <span className="navbar-search-item-img">
                        {product.image ? (
                          <img src={product.image} alt="" />
                        ) : (
                          <span className="navbar-search-item-placeholder">🥛</span>
                        )}
                      </span>
                      <span className="navbar-search-item-body">
                        <span className="navbar-search-item-name">{product.name}</span>
                        {product.category_name && (
                          <span className="navbar-search-item-meta">{product.category_name}</span>
                        )}
                      </span>
                      <span className="navbar-search-item-price">{formatPrice(product)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {totalCount > 0 && (
                <button
                  type="button"
                  className="navbar-search-view-all"
                  onClick={() => goToAllResults(query.trim())}
                >
                  View all {totalCount} result{totalCount !== 1 ? 's' : ''}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
