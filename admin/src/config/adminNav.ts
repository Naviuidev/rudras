import type { AdminNavIconKey } from '../components/AdminNavIcon';

export interface NavChild {
  to: string;
  label: string;
}

export interface NavGroup {
  id: string;
  label: string;
  icon: AdminNavIconKey;
  to?: string;
  children?: NavChild[];
}

export const adminNav: NavGroup[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', to: '/admin/dashboard' },
  {
    id: 'customers',
    label: 'Customers',
    icon: 'customers',
    children: [
      { to: '/admin/customers', label: 'Customer List' },
      { to: '/admin/customers/profile', label: 'Customer Profile' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    icon: 'products',
    children: [
      { to: '/admin/products/categories', label: 'Categories' },
      { to: '/admin/products/list', label: 'Products' },
    ],
  },
  {
    id: 'subscriptions',
    label: 'Subscriptions',
    icon: 'subscriptions',
    children: [
      { to: '/admin/subscriptions/active', label: 'Active' },
      { to: '/admin/subscriptions/paused', label: 'Paused' },
      { to: '/admin/subscriptions/expired', label: 'Expired' },
      { to: '/admin/subscriptions/cancelled', label: 'Cancelled' },
    ],
  },
  {
    id: 'skip',
    label: 'Skip Management',
    icon: 'skip',
    children: [
      { to: '/admin/skip/requests', label: 'Skip Requests' },
      { to: '/admin/skip/carry-forward', label: 'Carry Forward History' },
    ],
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: 'orders',
    children: [
      { to: '/admin/orders', label: 'All Orders' },
      { to: '/admin/orders/pending', label: 'Pending' },
      { to: '/admin/orders/delivered', label: 'Delivered' },
    ],
  },
  {
    id: 'inventory',
    label: 'Inventory',
    icon: 'inventory',
    children: [
      { to: '/admin/inventory/stock', label: 'Stock' },
      { to: '/admin/inventory/daily-requirement', label: 'Daily Requirement Report' },
    ],
  },
  {
    id: 'payments',
    label: 'Payments',
    icon: 'payments',
    children: [
      { to: '/admin/payments/transactions', label: 'Transactions' },
      { to: '/admin/payments/ledger', label: 'Customer Ledger' },
    ],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'notifications',
    children: [
      { to: '/admin/notifications/push', label: 'Push Notifications' },
      { to: '/admin/notifications/sms', label: 'SMS Notifications' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    icon: 'marketing',
    children: [{ to: '/admin/marketing/banners', label: 'Banners' }],
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: 'reports',
    children: [
      { to: '/admin/reports/sales', label: 'Sales Report' },
      { to: '/admin/reports/subscriptions', label: 'Subscription Report' },
      { to: '/admin/reports/customers', label: 'Customer Report' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    icon: 'content',
    children: [
      { to: '/admin/content/about-us', label: 'About Us' },
      { to: '/admin/content/privacy-policy', label: 'Privacy Policy' },
      { to: '/admin/content/terms', label: 'Terms & Conditions' },
    ],
  },
  { id: 'faq', label: 'FAQ', icon: 'faq', to: '/admin/faq' },
  { id: 'map', label: 'Map', icon: 'map', to: '/admin/map' },
  { id: 'support', label: 'Support', icon: 'support', to: '/admin/support' },
];

export const CONTENT_SLUGS: Record<string, string> = {
  'about-us': 'about_us',
  'privacy-policy': 'privacy_policy',
  terms: 'terms_conditions',
};
