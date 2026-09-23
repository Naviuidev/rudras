interface AuthPopupProps {
  show: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmLabel?: string;
}

export default function AuthPopup({
  show,
  title = 'Notice',
  message,
  onClose,
  confirmLabel = 'OK',
}: AuthPopupProps) {
  if (!show) return null;

  return (
    <div className="auth-popup-backdrop" onClick={onClose} role="presentation">
      <div
        className="auth-popup"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="auth-popup-title"
        aria-describedby="auth-popup-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="auth-popup-row">
          <div className="auth-popup-icon" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.75" />
              <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M12 8v5M12 16h.01" />
            </svg>
          </div>

          <div className="auth-popup-body">
            <h3 id="auth-popup-title" className="auth-popup-title">
              {title}
            </h3>
            <p id="auth-popup-message" className="auth-popup-message">
              {message}
            </p>
          </div>

          <button type="button" className="btn btn-outline-success rounded-pill auth-popup-btn" onClick={onClose}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
