import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error';
  onClose: () => void;
}

export default function Toast({ message, type = 'success', onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast-popup toast-${type}`} role="status">
      <span className="toast-popup-icon" aria-hidden>
        {type === 'success' ? '✓' : '✕'}
      </span>
      <span className="toast-popup-message">{message}</span>
    </div>
  );
}
