import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import CategorySidebar from '../components/CategorySidebar';
import ProductGridCard from '../components/ProductGridCard';
import ProductDetailPanel from '../components/ProductDetailPanel';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getProducts, getCategories, getProduct, getErrorMessage } from '../services/api';
import { toCategoryDisplayItems } from '../config/categoryDisplay';
import {
  buildProductsParams,
  filterProductsByShop,
  parseShopType,
  type ShopType,
} from '../utils/productShopParams';
import type { CategoryDisplayItem } from '../config/categoryDisplay';
import type { Product } from '../types';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchFromUrl = searchParams.get('search')?.trim() || '';
  const categoryFromUrl = searchParams.get('category') || '';
  const productIdFromUrl = searchParams.get('product') || '';
  const shopType = parseShopType(searchParams.get('shop'));

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(searchFromUrl);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState('');

  const isProductView = Boolean(productIdFromUrl);
  const isSearchMode = searchFromUrl.length > 0;
  const activeCategory =
    categoryFromUrl ||
    (isProductView && selectedProduct?.category) ||
    (isSearchMode ? '' : categories[0]?.slug || '');

  const visibleProducts = filterProductsByShop(products, shopType);

  const updateParams = (patch: Parameters<typeof buildProductsParams>[1]) => {
    setSearchParams((prev) => buildProductsParams(new URLSearchParams(prev), patch));
  };

  useEffect(() => {
    getCategories()
      .then((apiCategories) => setCategories(toCategoryDisplayItems(apiCategories)))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    if (isProductView || categories.length === 0) return;
    if (!categoryFromUrl && !isSearchMode) {
      setSearchParams(
        (prev) =>
          buildProductsParams(new URLSearchParams(prev), {
            category: categories[0].slug,
            shop: parseShopType(new URLSearchParams(prev).get('shop')),
          }),
        { replace: true }
      );
    }
  }, [categories, categoryFromUrl, isSearchMode, isProductView, setSearchParams]);

  useEffect(() => {
    setSearchInput(searchFromUrl);
  }, [searchFromUrl]);

  useEffect(() => {
    if (isProductView) return;
    const q = searchInput.trim();
    if (q === searchFromUrl) return;

    const timer = setTimeout(() => {
      if (q) {
        updateParams({ search: q, category: categoryFromUrl || null });
      } else {
        updateParams({
          search: null,
          category: categoryFromUrl || categories[0]?.slug || null,
        });
      }
    }, 320);

    return () => clearTimeout(timer);
  }, [searchInput, searchFromUrl, categoryFromUrl, categories, isProductView]);

  useEffect(() => {
    if (!isProductView) {
      setSelectedProduct(null);
      setProductError('');
      return;
    }

    const id = Number(productIdFromUrl);
    if (!id) {
      setProductError('Invalid product');
      return;
    }

    setProductLoading(true);
    setProductError('');
    getProduct(id)
      .then(setSelectedProduct)
      .catch((err) => {
        setSelectedProduct(null);
        setProductError(getErrorMessage(err));
      })
      .finally(() => setProductLoading(false));
  }, [productIdFromUrl, isProductView]);

  useEffect(() => {
    if (isProductView) return;

    setLoading(true);
    const category = isSearchMode ? categoryFromUrl || undefined : activeCategory || undefined;
    getProducts(category, searchFromUrl || undefined)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [searchFromUrl, categoryFromUrl, activeCategory, isSearchMode, isProductView]);

  const handleCategorySelect = (slug: string) => {
    updateParams({
      category: slug,
      search: isSearchMode ? searchFromUrl : null,
      product: null,
    });
  };

  const handleShopTypeChange = (type: ShopType) => {
    updateParams({
      shop: type,
      ...(isProductView ? { product: null } : {}),
    });
  };

  const clearProductView = () => {
    updateParams({
      product: null,
      search: searchFromUrl || null,
      category:
        selectedProduct?.category || categoryFromUrl || categories[0]?.slug || null,
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) {
      updateParams({ search: q, category: categoryFromUrl || null });
    } else {
      updateParams({
        search: null,
        category: categoryFromUrl || categories[0]?.slug || null,
      });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    updateParams({
      search: null,
      category: categoryFromUrl || categories[0]?.slug || null,
    });
  };

  const selectedCategoryName = categories.find((c) => c.slug === activeCategory)?.name;

  const pageTitle = isProductView
    ? selectedProduct?.name || 'Product'
    : isSearchMode
      ? `Search results for "${searchFromUrl}"`
      : selectedCategoryName || 'Products';

  const sidebarSelectedSlug = isProductView
    ? selectedProduct?.category || activeCategory
    : isSearchMode && !categoryFromUrl
      ? ''
      : activeCategory;

  const shopLabel = shopType === 'subscription' ? 'Subscriptions' : 'One time delivery';

  return (
    <Container className="page-container">
      <div className="category-shop-page">
        <CategorySidebar
          categories={categories}
          selectedSlug={sidebarSelectedSlug}
          onSelect={handleCategorySelect}
        />

        <main className="category-shop-main">
          {!isProductView && (
            <div className="category-shop-header">
              <h1 className="category-shop-title">{pageTitle}</h1>

              <div className="category-shop-toolbar">
                <div
                  className="auth-mode-switch category-shop-type-switch"
                  role="tablist"
                  aria-label="Product type"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={shopType === 'subscription'}
                    className={`auth-mode-btn ${shopType === 'subscription' ? 'active' : ''}`}
                    onClick={() => handleShopTypeChange('subscription')}
                  >
                    Subscriptions
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={shopType === 'one_time'}
                    className={`auth-mode-btn ${shopType === 'one_time' ? 'active' : ''}`}
                    onClick={() => handleShopTypeChange('one_time')}
                  >
                    One time delivery
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="category-shop-search-form">
                  <div className="navbar-search-wrap category-shop-search-wrap">
                    <div className="navbar-search category-shop-search">
                      <svg
                        className="navbar-search-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        aria-hidden
                      >
                        <circle cx="11" cy="11" r="7" />
                        <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
                      </svg>
                      <input
                        type="search"
                        className="navbar-search-input"
                        placeholder="Search products in this category…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        aria-label="Search products"
                      />
                      {searchInput && (
                        <button
                          type="button"
                          className="navbar-search-clear"
                          onClick={clearSearch}
                          aria-label="Clear search"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <p className="category-shop-subtitle text-muted small mb-0">
                {loading ? (
                  'Loading products…'
                ) : (
                  <>
                    {visibleProducts.length}{' '}
                    {shopType === 'subscription' ? 'subscription' : 'one-time delivery'} product
                    {visibleProducts.length === 1 ? '' : 's'}
                    {selectedCategoryName && !isSearchMode && ` in ${selectedCategoryName}`}
                    {isSearchMode && (
                      <>
                        {' '}
                        matching &ldquo;{searchFromUrl}&rdquo;
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          )}

          {isProductView ? (
            productLoading ? (
              <LoadingSpinner />
            ) : productError ? (
              <Alert variant="danger">{productError}</Alert>
            ) : selectedProduct ? (
              <ProductDetailPanel product={selectedProduct} onBack={clearProductView} />
            ) : (
              <EmptyState title="Product not found" message="This product may have been removed." />
            )
          ) : loading ? (
            <LoadingSpinner />
          ) : visibleProducts.length === 0 ? (
            <EmptyState
              title="No products found"
              message={
                isSearchMode
                  ? `No ${shopLabel.toLowerCase()} products match "${searchFromUrl}". Try another search or switch delivery type.`
                  : `No ${shopLabel.toLowerCase()} products in this category yet. Try another category or switch to ${
                      shopType === 'subscription' ? 'one time delivery' : 'subscriptions'
                    }.`
              }
            />
          ) : (
            <div className="product-grid">
              {visibleProducts.map((p) => (
                <ProductGridCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>
    </Container>
  );
}
