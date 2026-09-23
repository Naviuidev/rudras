export type AdminNavIconKey =
  | 'dashboard'
  | 'customers'
  | 'products'
  | 'subscriptions'
  | 'skip'
  | 'orders'
  | 'inventory'
  | 'payments'
  | 'notifications'
  | 'marketing'
  | 'reports'
  | 'content'
  | 'faq'
  | 'map'
  | 'support';

interface AdminNavIconProps {
  name: AdminNavIconKey;
  className?: string;
}

export default function AdminNavIcon({ name, className = '' }: AdminNavIconProps) {
  return (
    <svg
      className={`admin-nav-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
}

const fill = { fill: 'currentColor' };

const iconPaths: Record<AdminNavIconKey, JSX.Element> = {
  dashboard: (
    <path
      {...fill}
      d="M3 3h8v8H3V3zm10 0h8v5h-8V3zM3 13h8v8H3v-8zm10 3h8v8h-8v-8z"
    />
  ),
  customers: (
    <path
      {...fill}
      d="M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-6 13v-1.2A5.8 5.8 0 0 1 9 14a5.8 5.8 0 0 1 6 5.8V21H3zm13.2-7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM20 21v-1.1a4.4 4.4 0 0 0-3.8-4.35A4.9 4.9 0 0 1 20 18.9V21z"
    />
  ),
  products: (
    <path
      {...fill}
      d="M8 4h8a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1V6a2 2 0 0 1 2-2zm2 2v1h4V6h-4zm-3 5v6h2v-6H7zm4 0v6h2v-6h-2zm4 0v6h2v-6h-2z"
    />
  ),
  subscriptions: (
    <path
      {...fill}
      d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm1 4v2h8V7H8zm0 4v2h4v-2H8zm0 4v2h8v-2H8zM16 3v3h2V5a1 1 0 0 0-1-1h-1zM8 3v3H6V5a1 1 0 0 1 1-1h1z"
    />
  ),
  skip: (
    <path
      {...fill}
      d="M5 11h8.2l-2.6-2.6L12 7l5 5-5 5-1.4-1.4 2.6-2.6H5v-2zm11-5h2v12h-2V6z"
    />
  ),
  orders: (
    <path
      {...fill}
      d="M8 4h8l2 4v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8l2-4zm2 0v3h4V4h-4zm-1 8h2v2H9v-2zm4 0h2v2h-2v-2zm-4 3h2v2H9v-2zm4 0h2v2h-2v-2z"
    />
  ),
  inventory: (
    <path
      {...fill}
      d="M8 3h8a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h1V5a2 2 0 0 1 2-2zm2 2v1h4V5h-4zM7 10h10v2H7v-2zm0 4h10v2H7v-2z"
    />
  ),
  payments: (
    <path
      {...fill}
      d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7zm2 4h14v-2H5v2zm3 3h4v-2H8v2z"
    />
  ),
  notifications: (
    <path
      {...fill}
      d="M12 3a5 5 0 0 1 5 5v2.8l1.4 2.3H5.6L7 10.8V8a5 5 0 0 1 5-5zm0 18a2.5 2.5 0 0 0 2.45-2h-4.9A2.5 2.5 0 0 0 12 21z"
    />
  ),
  marketing: (
    <path
      {...fill}
      d="M4 9.5v5L18 20V4L4 9.5zM16 8v8l-8-4.5V12.5L16 8z"
    />
  ),
  reports: (
    <path
      {...fill}
      d="M5 19V5h2v14H5zm4-4V9h2v6H9zm4 2v-8h2v8h-2zm4-6v6h2v-6h-2zM3 19h18v2H3v-2z"
    />
  ),
  content: (
    <path
      {...fill}
      d="M8 3h6l4 4v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm6 1.5V8h3.5L14 4.5zM9 12h6v2H9v-2zm0 4h6v2H9v-2z"
    />
  ),
  faq: (
    <path
      {...fill}
      d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
    />
  ),
  map: (
    <path
      {...fill}
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5A2.5 2.5 0 1 1 12 6a2.5 2.5 0 0 1 0 5.5z"
    />
  ),
  support: (
    <path
      {...fill}
      d="M12 1C5.93 1 1 5.93 1 12h2a9 9 0 0 1 9-9V1zm0 4C7.58 5 4 8.58 4 13h2a7 7 0 0 1 7-7V5zm0 4c-2.21 0-4 1.79-4 4h2a2 2 0 0 1 2-2V9zm7 3h2c0-4.96-4.04-9-9-9v2c3.87 0 7 3.13 7 7zm-2 2h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3zm-4 3.5c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"
    />
  ),
};
