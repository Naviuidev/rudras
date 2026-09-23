import BtnIcon from './BtnIcon';

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title = 'Confirm',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  const isDelete = confirmText.toLowerCase().includes('delete');

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-box modal-box-sm" onClick={(e) => e.stopPropagation()}>
        <h5 className="modal-title">{title}</h5>
        <p className="confirm-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={onCancel} disabled={loading}>
            <BtnIcon name="cancel" /> {cancelText}
          </button>
          <button type="button" className="btn btn-danger rounded-pill" onClick={onConfirm} disabled={loading}>
            <BtnIcon name={loading ? 'wait' : isDelete ? 'delete' : 'submit'} />
            {loading ? 'Please wait...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
