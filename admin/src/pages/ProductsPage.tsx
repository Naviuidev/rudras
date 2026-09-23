import { useEffect, useState, useMemo } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { getProducts, createProduct, updateProduct, deleteProduct, uploadFile, getCategories } from '../services/api';
import BtnIcon from '../components/BtnIcon';

const emptyForm = {
  name: '',
  description: '',
  image: '',
  category: 'other',
  price: '',
  quantity: '',
  quantity_unit: 'L' as 'L' | 'ml',
  monthly_subscription: false,
  offer_percentage: '',
  coupon_active: false,
  coupon_code: '',
  coupon_percentage: '',
  active_status: 1,
};

function parseNumeric(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = String(value).replace(/[^\d.]/g, '');
  return cleaned ? parseFloat(cleaned) : 0;
}

function calcPriceAfterOffer(
  price: string | number,
  offerPercentage: string | number,
  couponActive: boolean,
  couponPercentage: string | number
): number | null {
  const priceNum = parseNumeric(price);
  const offerNum = parseNumeric(offerPercentage);
  const couponNum = parseNumeric(couponPercentage);
  const discounts: number[] = [];
  if (offerNum > 0) discounts.push(offerNum);
  if (couponActive && couponNum > 0) discounts.push(couponNum);
  if (!discounts.length || priceNum <= 0) return null;
  const best = Math.max(...discounts);
  return Math.round(priceNum * (1 - best / 100) * 100) / 100;
}

export default function ProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<'all' | 'subscription' | 'one-time'>('all');

  const priceAfterOffer = useMemo(
    () => calcPriceAfterOffer(form.price, form.offer_percentage, form.coupon_active, form.coupon_percentage),
    [form.price, form.offer_percentage, form.coupon_active, form.coupon_percentage]
  );

  const load = () => {
    setPageLoading(true);
    Promise.all([
      getProducts().then((res) => setProducts(res.data.data || [])),
      getCategories().then((res) => setCategories(res.data.data || [])),
    ])
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const categoryLabel = (slug: string) =>
    categories.find((c) => c.slug === slug)?.name || slug;

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return products.filter((p) => {
      const isSubscription = !!p.monthly_subscription;
      if (subscriptionFilter === 'subscription' && !isSubscription) return false;
      if (subscriptionFilter === 'one-time' && isSubscription) return false;

      if (!q) return true;

      const categoryName = (p.category_name || categoryLabel(p.category)).toLowerCase();
      return (
        String(p.name || '').toLowerCase().includes(q) ||
        String(p.description || '').toLowerCase().includes(q) ||
        String(p.category || '').toLowerCase().includes(q) ||
        categoryName.includes(q)
      );
    });
  }, [products, searchQuery, subscriptionFilter, categories]);

  const openNewProduct = () => {
    const defaultCategory = categories[0]?.slug || '';
    setForm({ ...emptyForm, category: defaultCategory });
    setEditing(null);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setForm({ ...form, image: res.data.data.url });
    } catch {
      showToast('Failed to upload image', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.coupon_active) {
      if (form.coupon_code.length !== 5 || !/^[A-Za-z]+$/.test(form.coupon_code)) {
        showToast('Coupon code must be exactly 5 letters', 'error');
        return;
      }
    }

    if (!form.category) {
      showToast('Please select a category. Create categories in Admin → Categories first.', 'error');
      return;
    }

    if (categories.length > 0 && !categories.some((c) => c.slug === form.category)) {
      showToast('Selected category is invalid. Please choose from admin categories.', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        coupon_code: form.coupon_active ? form.coupon_code.toUpperCase() : '',
        coupon_active: form.coupon_active ? 1 : 0,
        monthly_subscription: form.monthly_subscription ? 1 : 0,
      };
      if (editing) await updateProduct(editing, payload);
      else await createProduct(payload);
      setShowForm(false);
      setEditing(null);
      setForm(emptyForm);
      load();
      showToast(editing ? 'Product updated!' : 'Product created!');
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Failed to save product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      name: p.name,
      description: p.description || '',
      image: p.image || '',
      category: p.category,
      price: p.price != null ? String(p.price) : '',
      quantity: p.quantity != null ? String(parseFloat(p.quantity)) : '',
      quantity_unit: p.quantity_unit === 'ml' ? 'ml' : 'L',
      monthly_subscription: !!p.monthly_subscription,
      offer_percentage: p.offer_percentage != null && parseFloat(p.offer_percentage) > 0 ? String(p.offer_percentage) : '',
      coupon_active: !!p.coupon_active,
      coupon_code: p.coupon_code || '',
      coupon_percentage: p.coupon_percentage != null && parseFloat(p.coupon_percentage) > 0 ? String(p.coupon_percentage) : '',
      active_status: p.active_status,
    });
    setEditing(p.id);
    setShowForm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setLoading(true);
    try {
      await deleteProduct(deleteTarget.id);
      load();
      showToast('Product deleted!');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete product', 'error');
    } finally {
      setLoading(false);
    }
  };

  const isMonthly = form.monthly_subscription;
  const priceLabel = isMonthly ? 'Price (₹/month)' : 'Price (₹)';
  const offerLabel = isMonthly ? 'Offer (%/month)' : 'Offer (%)';
  const couponOfferLabel = isMonthly ? 'Coupon Offer (%/month)' : 'Coupon Offer (%)';
  const priceAfterLabel = isMonthly ? 'Price after offer (per month):' : 'Price after offer:';

  return (
    <Layout title="Product Management">
      <div className="products-page">
        {pageLoading ? (
          <div className="categories-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading products…</span>
          </div>
        ) : (
          <div className="categories-tile-row">
            <div className="categories-tile categories-tile--static">
              <span className="categories-tile-label">Total Products</span>
              <span className="categories-tile-count">{products.length}</span>
            </div>

            <button type="button" className="btn btn-outline-success rounded-pill products-add-btn" onClick={openNewProduct}>
              Add Product
            </button>
          </div>
        )}

        <div className="page-card products-table-card">
          <div className="products-table-toolbar">
            <div className="products-table-toolbar-head">
              <p className="products-table-toolbar-title mb-0">Product catalogue</p>
              <p className="products-table-toolbar-meta mb-0">Manage pricing, offers, and subscription products</p>
            </div>

            {!pageLoading && products.length > 0 && (
              <div className="products-table-controls">
                <div className="categories-list-modal-search products-table-search">
                  <svg
                    className="categories-list-modal-search-icon"
                    viewBox="0 0 24 24"
                    aria-hidden
                    width="16"
                    height="16"
                  >
                    <path
                      fill="currentColor"
                      d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"
                    />
                  </svg>
                  <input
                    type="text"
                    role="searchbox"
                    className="categories-list-modal-search-input"
                    placeholder="Search products…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search products"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="categories-list-modal-search-clear"
                      aria-label="Clear search"
                      onClick={() => setSearchQuery('')}
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="products-table-filters">
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill products-filter-btn ${
                      subscriptionFilter === 'subscription' ? 'products-filter-btn--active' : 'btn-outline-success'
                    }`}
                    onClick={() =>
                      setSubscriptionFilter((prev) => (prev === 'subscription' ? 'all' : 'subscription'))
                    }
                  >
                    Subscriptions
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm rounded-pill products-filter-btn ${
                      subscriptionFilter === 'one-time' ? 'products-filter-btn--active' : 'btn-outline-success'
                    }`}
                    onClick={() =>
                      setSubscriptionFilter((prev) => (prev === 'one-time' ? 'all' : 'one-time'))
                    }
                  >
                    One-time delivery
                  </button>
                </div>
              </div>
            )}
          </div>

          {pageLoading ? null : products.length === 0 ? (
            <div className="products-empty">
              <p className="mb-0">No products yet. Add your first product to get started.</p>
              <button type="button" className="btn btn-outline-success rounded-pill products-add-btn" onClick={openNewProduct}>
                Add Product
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="products-empty">
              <p className="mb-0">No products match your search or filter.</p>
              <button
                type="button"
                className="btn btn-outline-success rounded-pill products-add-btn"
                onClick={() => {
                  setSearchQuery('');
                  setSubscriptionFilter('all');
                }}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="products-table-wrap">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Offer Price</th>
                    <th>Qty</th>
                    <th>Subscription</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        {p.image ? (
                          <img src={p.image} alt="" className="product-table-thumb" />
                        ) : (
                          <span className="product-table-thumb product-table-thumb--empty">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="product-table-name">{p.name}</div>
                        {p.description && (
                          <div className="product-table-meta text-truncate" style={{ maxWidth: 220 }}>
                            {p.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className="product-table-badge">
                          {p.category_name || categoryLabel(p.category)}
                        </span>
                      </td>
                      <td>₹{p.price}</td>
                      <td>{p.price_after_offer ? `₹${p.price_after_offer}` : '—'}</td>
                      <td>{p.quantity != null ? `${parseFloat(p.quantity)}${p.quantity_unit || 'L'}` : '—'}</td>
                      <td>
                        <span
                          className={`product-table-badge ${
                            p.monthly_subscription ? 'product-table-badge--subscription' : ''
                          }`}
                        >
                          {p.monthly_subscription ? 'Monthly' : 'One-time'}
                        </span>
                      </td>
                      <td>
                        <div className="product-table-actions">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            onClick={() => handleEdit(p)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger rounded-pill"
                            onClick={() => setDeleteTarget(p)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal open={showForm} title={editing ? 'Edit Product' : 'Add Product'} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit}>
          <label className="form-label fw-medium">Title</label>
          <input
            className="form-control mb-3"
            placeholder="Product title"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <div className="row g-3 mb-3 product-form-compact">
            <div className="col-md-4">
              <label className="form-label">Quantity</label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 1 or 500"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  required
                />
                <select
                  className="form-select unit-select"
                  value={form.quantity_unit}
                  onChange={(e) => setForm({ ...form, quantity_unit: e.target.value as 'L' | 'ml' })}
                >
                  <option value="L">L</option>
                  <option value="ml">ml</option>
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <label className="form-label">{priceLabel}</label>
              <input
                type="text"
                className="form-control"
                placeholder={isMonthly ? 'e.g. 60 per month' : 'e.g. 60'}
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">{offerLabel}</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. 10%"
                value={form.offer_percentage}
                onChange={(e) => setForm({ ...form, offer_percentage: e.target.value })}
              />
            </div>
          </div>

          <div className="product-form-compact mb-3">
            <label className="form-label">Monthly Subscription Model</label>
            <select
              className="form-select"
              value={form.monthly_subscription ? 'yes' : 'no'}
              onChange={(e) => setForm({ ...form, monthly_subscription: e.target.value === 'yes' })}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </select>
          </div>

          <div className="coupon-section mb-3">
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                id="couponActive"
                checked={form.coupon_active}
                onChange={(e) => setForm({ ...form, coupon_active: e.target.checked })}
              />
              <label className="form-check-label fw-medium" htmlFor="couponActive">
                Activate Coupon Offer
              </label>
            </div>

            {form.coupon_active && (
              <div className="row g-3 product-form-compact">
                <div className="col-md-6">
                  <label className="form-label">Coupon Code (5 letters)</label>
                  <input
                    type="text"
                    maxLength={5}
                    className="form-control text-uppercase"
                    placeholder="e.g. FRESH"
                    value={form.coupon_code}
                    onChange={(e) => setForm({ ...form, coupon_code: e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase() })}
                    required={form.coupon_active}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{couponOfferLabel}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 15%"
                    value={form.coupon_percentage}
                    onChange={(e) => setForm({ ...form, coupon_percentage: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          {priceAfterOffer !== null && (
            <div className="price-after-offer mb-3">
              <span className="label">{priceAfterLabel}</span>
              <span className="value">₹{priceAfterOffer.toFixed(2)}</span>
              <small className="text-muted ms-2">(was ₹{parseNumeric(form.price).toFixed(2)}{isMonthly ? '/month' : ''})</small>
            </div>
          )}

          <label className="form-label fw-medium">Category</label>
          {categories.length === 0 ? (
            <p className="text-danger small mb-3">
              No categories found. Add categories under Admin → Categories before creating products.
            </p>
          ) : (
            <select
              className="form-select mb-3"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
          )}

          <label className="form-label fw-medium">Image</label>
          <input type="file" className="form-control mb-3" accept="image/*" onChange={handleImageUpload} />

          <label className="form-label fw-medium">Description</label>
          <textarea
            className="form-control mb-3"
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          {form.image && <img src={form.image} alt="" className="modal-preview-img mb-3" />}

          <div className="modal-actions">
            <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={() => setShowForm(false)}>
              <BtnIcon name="cancel" /> Cancel
            </button>
            <button type="submit" className="btn btn-outline-success rounded-pill" disabled={loading}>
              <BtnIcon name={loading ? 'wait' : 'submit'} /> {loading ? 'Saving...' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Product"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={loading}
      />
    </Layout>
  );
}
