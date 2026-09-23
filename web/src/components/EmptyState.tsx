import { Button } from 'react-bootstrap';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export default function EmptyState({ icon = '📭', title, message, actionLabel, actionHref, onAction, children }: EmptyStateProps) {
  return (
    <div className="text-center py-5">
      <div style={{ fontSize: '3rem' }}>{icon}</div>
      <h5 className="mt-3">{title}</h5>
      {message && <p className="text-muted">{message}</p>}
      {actionLabel && actionHref && (
        <Button href={actionHref} className="btn-accent mt-2">
          {actionLabel}
        </Button>
      )}
      {actionLabel && onAction && (
        <Button className="btn-accent mt-2" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
