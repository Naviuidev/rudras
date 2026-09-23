import { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import AdminNavIcon from './AdminNavIcon';
import BtnIcon from './BtnIcon';

export interface ServiceLocationItem {
  id: number;
  name: string;
  map_url: string;
  is_active?: number;
  display_order?: number;
  created_at: string;
}

interface ServiceLocationsListModalProps {
  show: boolean;
  onHide: () => void;
  locations: ServiceLocationItem[];
  onDelete: (location: ServiceLocationItem) => void;
}

function shortenUrl(url: string, max = 42): string {
  if (url.length <= max) return url;
  return `${url.slice(0, max - 1)}…`;
}

export default function ServiceLocationsListModal({
  show,
  onHide,
  locations,
  onDelete,
}: ServiceLocationsListModalProps) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.map_url.toLowerCase().includes(q)
    );
  }, [locations, query]);

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
        <Modal.Title className="categories-list-modal-title">Service Locations</Modal.Title>
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
              placeholder="Search locations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search service locations"
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

        {locations.length === 0 ? (
          <p className="categories-list-modal-empty">
            No service locations yet. Add one using the Add Service Location card.
          </p>
        ) : filtered.length === 0 ? (
          <p className="categories-list-modal-empty">No locations match your search.</p>
        ) : (
          <div className="categories-list-modal-grid">
            {filtered.map((loc) => (
              <article key={loc.id} className="categories-list-modal-option">
                <div className="categories-list-modal-option-icon">
                  <AdminNavIcon name="map" />
                </div>
                <div className="categories-list-modal-option-text">
                  <span className="categories-list-modal-option-name">{loc.name}</span>
                  <a
                    href={loc.map_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="service-location-link"
                    title={loc.map_url}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {shortenUrl(loc.map_url)}
                  </a>
                </div>
                <button
                  type="button"
                  className="categories-list-modal-delete-btn"
                  aria-label={`Delete ${loc.name}`}
                  onClick={() => onDelete(loc)}
                >
                  <BtnIcon name="delete" />
                </button>
              </article>
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
}
