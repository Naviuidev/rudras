import { Modal } from 'react-bootstrap';
import BtnIcon from './BtnIcon';

interface CategoriesCreateModalProps {
  show: boolean;
  onHide: () => void;
  name: string;
  image: string;
  loading: boolean;
  onNameChange: (value: string) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CategoriesCreateModal({
  show,
  onHide,
  name,
  image,
  loading,
  onNameChange,
  onImageUpload,
  onSubmit,
}: CategoriesCreateModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      className="categories-create-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">Create Category</Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-create-modal-body">
        <form className="categories-form" onSubmit={onSubmit}>
          <div className="categories-form-field">
            <label htmlFor="category-name" className="form-label">
              Category name
            </label>
            <input
              id="category-name"
              type="text"
              className="form-control"
              placeholder="e.g. Milk, Curd, Paneer"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="categories-form-field">
            <label htmlFor="category-image" className="form-label">
              Category image <span className="text-muted">(optional)</span>
            </label>
            <input
              id="category-image"
              type="file"
              className="form-control"
              accept="image/*"
              onChange={onImageUpload}
            />
            {image && (
              <div className="categories-form-preview">
                <img src={image} alt="Preview" className="categories-form-preview-img" />
              </div>
            )}
          </div>

          <button type="submit" className="btn btn-accent rounded-pill w-100" disabled={loading}>
            <BtnIcon name={loading ? 'wait' : 'add'} /> {loading ? 'Creating…' : 'Create Category'}
          </button>
        </form>
      </Modal.Body>
    </Modal>
  );
}
