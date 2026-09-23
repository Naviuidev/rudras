import type { ButtonHTMLAttributes } from 'react';
import { Button } from 'react-bootstrap';

/** Shared auth flow button classes */
export const AUTH_BTN_CLASS = 'btn-outline-success rounded-pill';

interface AuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
}

export function AuthButton({
  children,
  loading = false,
  loadingText,
  fullWidth = true,
  className = '',
  disabled,
  ...props
}: AuthButtonProps) {
  return (
    <Button
      variant="outline-success"
      className={`rounded-pill ${fullWidth ? 'w-100 auth-form-btn' : ''} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading && loadingText ? loadingText : children}
    </Button>
  );
}
