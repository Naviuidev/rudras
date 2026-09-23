import { FormEvent, useEffect, useRef, useState } from 'react';
import { Modal } from 'react-bootstrap';
import BtnIcon from './BtnIcon';
import { previewServiceLocation } from '../services/api';

interface MapPreview {
  embed_url: string;
  place_name?: string | null;
}

interface ServiceLocationsCreateModalProps {
  show: boolean;
  onHide: () => void;
  name: string;
  mapUrl: string;
  loading: boolean;
  onNameChange: (value: string) => void;
  onMapUrlChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function ServiceLocationsCreateModal({
  show,
  onHide,
  name,
  mapUrl,
  loading,
  onNameChange,
  onMapUrlChange,
  onSubmit,
}: ServiceLocationsCreateModalProps) {
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<MapPreview | null>(null);
  const [previewError, setPreviewError] = useState('');
  const autoFilledLandmark = useRef(false);

  useEffect(() => {
    if (!show) {
      setPreview(null);
      setPreviewError('');
      setPreviewLoading(false);
      autoFilledLandmark.current = false;
      return;
    }

    const url = mapUrl.trim();
    if (!url) {
      setPreview(null);
      setPreviewError('');
      setPreviewLoading(false);
      autoFilledLandmark.current = false;
      return;
    }

    const timer = window.setTimeout(async () => {
      setPreviewLoading(true);
      setPreviewError('');
      try {
        const res = await previewServiceLocation(url);
        const data = res.data.data as MapPreview & { place_name?: string | null };
        if (data?.embed_url) {
          setPreview({ embed_url: data.embed_url, place_name: data.place_name });
          if (!autoFilledLandmark.current && data.place_name) {
            onNameChange(data.place_name);
            autoFilledLandmark.current = true;
          }
        } else {
          setPreview(null);
          setPreviewError('Could not load a map preview for this link.');
        }
      } catch (err: unknown) {
        setPreview(null);
        const message =
          err && typeof err === 'object' && 'response' in err
            ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
            : undefined;
        setPreviewError(message || 'Could not preview this map link.');
      } finally {
        setPreviewLoading(false);
      }
    }, 500);

    return () => window.clearTimeout(timer);
  }, [mapUrl, show, onNameChange]);

  const showDetails = mapUrl.trim().length > 0;

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="categories-create-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">Add Service Location</Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-create-modal-body">
        <form className="categories-form" onSubmit={onSubmit}>
          <div className="categories-form-field">
            <label htmlFor="service-location-url" className="form-label">
              Google Maps link
            </label>
            <input
              id="service-location-url"
              type="url"
              className="form-control"
              placeholder="e.g. https://maps.app.goo.gl/… or https://www.google.com/maps/place/…"
              value={mapUrl}
              onChange={(e) => onMapUrlChange(e.target.value)}
              autoFocus
              required
            />
          </div>

          {showDetails && (
            <div className="categories-form-field">
              <span className="form-label">Map preview</span>
              <div className="service-location-map-preview">
                {previewLoading && (
                  <div className="service-location-map-preview-status">
                    <div className="spinner-border spinner-border-sm text-success" role="status" />
                    <span>Loading map preview…</span>
                  </div>
                )}
                {!previewLoading && preview && (
                  <iframe
                    src={preview.embed_url}
                    title="Map location preview"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                )}
                {!previewLoading && !preview && previewError && (
                  <div className="service-location-map-preview-status service-location-map-preview-status--error">
                    {previewError}
                  </div>
                )}
              </div>
            </div>
          )}

          {showDetails && (
            <div className="categories-form-field">
              <label htmlFor="service-location-name" className="form-label">
                Landmark
              </label>
              <input
                id="service-location-name"
                type="text"
                className="form-control"
                placeholder="e.g. Hyderabad — Banjara Hills"
                value={name}
                onChange={(e) => onNameChange(e.target.value)}
              />
            </div>
          )}

          {showDetails && (
            <button
              type="submit"
              className="btn btn-outline-success rounded-pill w-100"
              disabled={loading || !mapUrl.trim() || previewLoading}
            >
              <BtnIcon name={loading ? 'wait' : 'add'} /> {loading ? 'Adding…' : 'Add Location'}
            </button>
          )}
        </form>
      </Modal.Body>
    </Modal>
  );
}
