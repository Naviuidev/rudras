import { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import BtnIcon from './BtnIcon';

export interface BannerItem {
  id: number;
  title: string;
  image: string;
  sort_order: number;
  is_active: number;
}

interface BannersListModalProps {
  show: boolean;
  onHide: () => void;
  banners: BannerItem[];
  onEdit: (banner: BannerItem) => void;
  onDelete: (banner: BannerItem) => void;
}

function displayTitle(title: string) {
  return title.trim() || 'Untitled banner';
}

export default function BannersListModal({
  show,
  onHide,
  banners,
  onEdit,
  onDelete,
}: BannersListModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return banners;
    return banners.filter((banner) => {
      const title = displayTitle(banner.title).toLowerCase();
      const order = String(banner.sort_order);
      const status = banner.is_active ? 'active' : 'inactive';
      return title.includes(q) || order.includes(q) || status.includes(q);
    });
  }, [banners, query]);

  const handleHide = () => {
    setQuery('');
    onHide();
  };

  return (
    <Modal
      show={show}
      onHide={handleHide}
      size="lg"
      centered
      scrollable
      className="categories-list-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">All Banners</Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-list-modal-body">
        <div className="categories-list-modal-toolbar categories-list-modal-toolbar--search-only">
          <div className="categories-list-modal-search">
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
              placeholder="Search banners…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search banners"
            />
            {query && (
              <button
                type="button"
                className="categories-list-modal-search-clear"
                aria-label="Clear search"
                onClick={() => setQuery('')}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {banners.length === 0 ? (
          <p className="categories-list-modal-empty">
            No banners yet. Add one using the Add Banner tile.
          </p>
        ) : filtered.length === 0 ? (
          <p className="categories-list-modal-empty">No banners match your search.</p>
        ) : (
          <div className="categories-list-modal-grid">
            {filtered.map((banner) => (
              <article key={banner.id} className="categories-list-modal-option">
                <div className="categories-list-modal-option-icon banner-list-modal-thumb">
                  <img
                    src={banner.image}
                    alt=""
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="categories-list-modal-option-text">
                  <span className="categories-list-modal-option-name">
                    {displayTitle(banner.title)}
                  </span>
                  <code className="categories-list-modal-option-slug">
                    Order #{banner.sort_order} · {banner.is_active ? 'Active' : 'Inactive'}
                  </code>
                </div>
                <div className="banner-list-modal-actions">
                  <button
                    type="button"
                    className="categories-list-modal-delete-btn banner-list-modal-edit-btn"
                    aria-label={`Edit ${displayTitle(banner.title)}`}
                    onClick={() => onEdit(banner)}
                  >
                    <BtnIcon name="edit" />
                  </button>
                  <button
                    type="button"
                    className="categories-list-modal-delete-btn"
                    aria-label={`Delete ${displayTitle(banner.title)}`}
                    onClick={() => onDelete(banner)}
                  >
                    <BtnIcon name="delete" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
