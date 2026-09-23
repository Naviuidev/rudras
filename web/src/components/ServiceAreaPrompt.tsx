interface ServiceAreaPromptProps {
  show: boolean;
  loading: boolean;
  onAllow: () => void;
  onDismiss: () => void;
}

export default function ServiceAreaPrompt({
  show,
  loading,
  onAllow,
  onDismiss,
}: ServiceAreaPromptProps) {
  if (!show) return null;

  return (
    <div className="auth-popup-backdrop" role="presentation">
      <div
        className="auth-popup service-area-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-area-prompt-title"
        aria-describedby="service-area-prompt-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="service-area-prompt-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              fill="currentColor"
              d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
            />
          </svg>
        </div>

        <div className="auth-popup-body service-area-prompt-body">
          <h3 id="service-area-prompt-title" className="auth-popup-title">
            Check delivery availability
          </h3>
          <p id="service-area-prompt-message" className="auth-popup-message">
            Allow location access so we can check your position against all configured delivery
            areas and confirm subscriptions or one-time orders are available near you.
          </p>
        </div>

        <div className="service-area-prompt-actions">
          <button
            type="button"
            className="btn btn-outline-secondary rounded-pill"
            onClick={onDismiss}
            disabled={loading}
          >
            Not now
          </button>
          <button
            type="button"
            className="btn btn-outline-success rounded-pill"
            onClick={onAllow}
            disabled={loading}
          >
            {loading ? 'Checking…' : 'Allow location'}
          </button>
        </div>
      </div>
    </div>
  );
}
