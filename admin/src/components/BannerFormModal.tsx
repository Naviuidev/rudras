import { Modal } from 'react-bootstrap';
import BtnIcon from './BtnIcon';

export interface BannerFormValues {
  title: string;
  image: string;
  sort_order: number;
  is_active: number;
}

interface BannerFormModalProps {
  show: boolean;
  editing: boolean;
  loading: boolean;
  form: BannerFormValues;
  onHide: () => void;
  onChange: (patch: Partial<BannerFormValues>) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function BannerFormModal({
  show,
  editing,
  loading,
  form,
  onHide,
  onChange,
  onImageUpload,
  onSubmit,
}: BannerFormModalProps) {
  const canSubmit = Boolean(form.image.trim());

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="banner-form-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">
          {editing ? 'Edit Banner' : 'Add Banner'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-create-modal-body">
        <form className="categories-form banner-form" onSubmit={onSubmit}>
          <div className="categories-form-field">
            <label htmlFor="banner-image" className="form-label">
              Banner image
            </label>
            <label htmlFor="banner-image" className="banner-upload-zone">
              {form.image ? (
                <img src={form.image} alt="" className="banner-upload-preview" />
              ) : (
                <div className="banner-upload-placeholder">
                  <span className="banner-upload-icon" aria-hidden>
                    🖼️
                  </span>
                  <span className="banner-upload-text">Click to upload banner image</span>
                  <span className="banner-upload-hint">PNG, JPG or WebP · wide image works best</span>
                </div>
              )}
              <input
                id="banner-image"
                type="file"
                className="banner-upload-input"
                accept="image/*"
                onChange={onImageUpload}
              />
            </label>
          </div>

          <div className="categories-form-field">
            <label htmlFor="banner-title" className="form-label">
              Banner text <span className="text-muted">(optional)</span>
            </label>
            <input
              id="banner-title"
              type="text"
              className="form-control"
              placeholder="e.g. Fresh milk delivered daily"
              value={form.title}
              onChange={(e) => onChange({ title: e.target.value })}
            />
          </div>

          <div className="banner-form-row">
            <div className="categories-form-field banner-form-sort">
              <label htmlFor="banner-sort" className="form-label">
                Sort order
              </label>
              <input
                id="banner-sort"
                type="number"
                min={0}
                className="form-control"
                value={form.sort_order}
                onChange={(e) => onChange({ sort_order: Number(e.target.value) || 0 })}
              />
            </div>

            <div className="categories-form-field banner-form-status">
              <span className="form-label">Status</span>
              <label className="banner-status-toggle">
                <input
                  type="checkbox"
                  checked={form.is_active === 1}
                  onChange={(e) => onChange({ is_active: e.target.checked ? 1 : 0 })}
                />
                <span className="banner-status-track">
                  <span className="banner-status-thumb" />
                </span>
                <span className="banner-status-label">
                  {form.is_active === 1 ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-outline-success rounded-pill w-100"
            disabled={loading || !canSubmit}
          >
            <BtnIcon name={loading ? 'wait' : editing ? 'save' : 'add'} />{' '}
            {loading ? 'Saving…' : editing ? 'Save Banner' : 'Add Banner'}
          </button>
        </form>
      </Modal.Body>
    </Modal>
  );
}
