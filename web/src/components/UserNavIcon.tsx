export type UserNavIconKey =
  | 'home'
  | 'products'
  | 'wishlist'
  | 'cart'
  | 'orders'
  | 'subscriptions'
  | 'address'
  | 'help'
  | 'profile'
  | 'payments'
  | 'logout';

interface UserNavIconProps {
  name: UserNavIconKey;
  className?: string;
}

export default function UserNavIcon({ name, className = '' }: UserNavIconProps) {
  return (
    <svg
      className={`user-nav-icon ${className}`.trim()}
      viewBox="0 0 24 24"
      aria-hidden
      focusable="false"
    >
      {iconPaths[name]}
    </svg>
  );
}

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const iconPaths: Record<UserNavIconKey, JSX.Element> = {
  home: (
    <>
      <path {...stroke} d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
    </>
  ),
  products: (
    <>
      <path {...stroke} d="M4 7h16v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z" />
      <path {...stroke} d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path {...stroke} d="M8 11h8" />
    </>
  ),
  wishlist: (
    <>
      <path {...stroke} d="M12 20.5s-7-4.6-7-10a4 4 0 0 1 7-2.5 4 4 0 0 1 7 2.5c0 5.4-7 10-7 10z" />
    </>
  ),
  cart: (
    <>
      <path {...stroke} d="M6 6h15l-1.5 9h-12L6 6z" />
      <path {...stroke} d="M6 6 5 3H2" />
      <circle {...stroke} cx="9" cy="20" r="1" />
      <circle {...stroke} cx="18" cy="20" r="1" />
    </>
  ),
  orders: (
    <>
      <path {...stroke} d="M7 4h10l2 4v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V8l2-4z" />
      <path {...stroke} d="M7 4v4h12V4" />
      <path {...stroke} d="M9 13h6M9 17h4" />
    </>
  ),
  subscriptions: (
    <>
      <path {...stroke} d="M8 3h8v4a4 4 0 0 1-8 0V3z" />
      <path {...stroke} d="M12 11v7M9 21h6" />
    </>
  ),
  address: (
    <>
      <path {...stroke} d="M12 21s6-5.2 6-10a6 6 0 1 0-12 0c0 4.8 6 10 6 10z" />
      <circle {...stroke} cx="12" cy="11" r="2.5" />
    </>
  ),
  help: (
    <>
      <path {...stroke} d="M12 18h.01" />
      <path {...stroke} d="M9.5 9.5a3 3 0 1 1 5 2.2c-.8.8-2 1.3-2 2.3v.5" />
      <circle {...stroke} cx="12" cy="12" r="9" />
    </>
  ),
  profile: (
    <>
      <circle {...stroke} cx="12" cy="8" r="3.5" />
      <path {...stroke} d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  payments: (
    <>
      <rect {...stroke} x="3" y="6" width="18" height="12" rx="2" />
      <path {...stroke} d="M3 10h18" />
      <path {...stroke} d="M7 15h3" />
    </>
  ),
  logout: (
    <>
      <path {...stroke} d="M10 7V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-8a1 1 0 0 1-1-1v-2" />
      <path {...stroke} d="M14 12H4M7 9l-3 3 3 3" />
    </>
  ),
};
