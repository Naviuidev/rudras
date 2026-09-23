import type { UserNavIconKey } from '../components/UserNavIcon';

export interface UserNavItem {
  to: string;
  label: string;
  icon: UserNavIconKey;
  end?: boolean;
  matchPrefix?: boolean;
}

/** Primary account sidebar navigation. */
export const USER_NAV_ITEMS: UserNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/shop', label: 'Shop', icon: 'products', matchPrefix: true },
  { to: '/wishlist', label: 'Wishlist', icon: 'wishlist' },
  { to: '/cart', label: 'Cart', icon: 'cart' },
  { to: '/orders', label: 'Orders', icon: 'orders', matchPrefix: true },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions', matchPrefix: true },
  { to: '/addresses', label: 'Addresses', icon: 'address' },
  { to: '/profile', label: 'Profile', icon: 'profile' },
  { to: '/payments', label: 'Payments', icon: 'payments' },
  { to: '/help', label: 'Help', icon: 'help' },
];

/** Compact navbar dropdown (no duplicate of full sidebar). */
export const USER_DROPDOWN_ITEMS: UserNavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: 'home', end: true },
  { to: '/shop', label: 'Shop', icon: 'products', matchPrefix: true },
  { to: '/profile', label: 'Profile settings', icon: 'profile' },
  { to: '/orders', label: 'My orders', icon: 'orders', matchPrefix: true },
  { to: '/subscriptions', label: 'Subscriptions', icon: 'subscriptions', matchPrefix: true },
  { to: '/help', label: 'Help & support', icon: 'help' },
];
