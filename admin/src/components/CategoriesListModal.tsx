import { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import AdminNavIcon from './AdminNavIcon';
import AdminHelpModal from './AdminHelpModal';
import BtnIcon from './BtnIcon';

export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  created_at: string;
}

interface CategoriesListModalProps {
  show: boolean;
  onHide: () => void;
  categories: CategoryItem[];
  onDelete: (category: CategoryItem) => void;
}

export default function CategoriesListModal({
  show,
  onHide,
  categories,
  onDelete,
}: CategoriesListModalProps) {
  const [query, setQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(q) ||
        cat.slug.toLowerCase().includes(q)
    );
  }, [categories, query]);

  const handleHide = () => {
    setQuery('');
    onHide();
  };

  return (
    <>
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
        <Modal.Title className="categories-list-modal-title">All Categories</Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-list-modal-body">
        <div className="categories-list-modal-toolbar">
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
              placeholder="Search categories…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search categories"
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
          <button
            type="button"
            className="categories-list-modal-help-btn rounded-pill"
            aria-label="Help"
            onClick={() => setShowHelp(true)}
          >
            Help
            <svg
              className="categories-list-modal-help-icon"
              viewBox="0 0 24 24"
              aria-hidden
              width="16"
              height="16"
            >
              <path
                fill="currentColor"
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
              />
            </svg>
          </button>
        </div>

        {categories.length === 0 ? (
          <p className="categories-list-modal-empty">No categories yet. Create one from the panel on the right.</p>
        ) : filtered.length === 0 ? (
          <p className="categories-list-modal-empty">No categories match your search.</p>
        ) : (
          <div className="categories-list-modal-grid">
            {filtered.map((cat) => (
              <article key={cat.id} className="categories-list-modal-option">
                <div className="categories-list-modal-option-icon">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt=""
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <AdminNavIcon name="products" />
                  )}
                </div>
                <div className="categories-list-modal-option-text">
                  <span className="categories-list-modal-option-name">{cat.name}</span>
                  <code className="categories-list-modal-option-slug">{cat.slug}</code>
                </div>
                <button
                  type="button"
                  className="categories-list-modal-delete-btn"
                  aria-label={`Delete ${cat.name}`}
                  onClick={() => onDelete(cat)}
                >
                  <BtnIcon name="delete" />
                </button>
              </article>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>

    <AdminHelpModal show={showHelp} onHide={() => setShowHelp(false)} />
    </>
  );
}
