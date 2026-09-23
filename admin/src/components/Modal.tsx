interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export default function Modal({ open, title, onClose, children, size = 'md' }: ModalProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div
        className={`modal-box ${size === 'sm' ? 'modal-box-sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header-row">
          <h5 id="modal-title" className="modal-title">
            {title}
          </h5>
          <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
