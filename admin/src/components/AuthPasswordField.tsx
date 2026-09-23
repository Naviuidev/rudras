import { useState } from 'react';

interface AuthPasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export default function AuthPasswordField({
  id,
  label,
  value,
  onChange,
  placeholder = 'Enter password',
  autoComplete = 'current-password',
  required = true,
  autoFocus = false,
}: AuthPasswordFieldProps) {
  const [show, setShow] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-input-wrap">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="auth-input"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required={required}
          autoFocus={autoFocus}
        />
        <button
          type="button"
          className="auth-input-action"
          onClick={() => setShow(!show)}
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.8-2.1M6.4 6.5A10.8 10.8 0 0 1 12 5c6 0 10 7 10 7a11.6 11.6 0 0 1-2.1 2.8M9.9 9.9A3 3 0 0 0 12 9a3 3 0 0 1 3 3"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
              <path
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
              />
              <circle fill="none" stroke="currentColor" strokeWidth="1.75" cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
