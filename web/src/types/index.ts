export interface User {
  id: number;
  name: string | null;
  email: string;
  mobile: string | null;
  role?: string;
  area?: string | null;
  address?: string | null;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  image: string | null;
  category: string;
  category_name?: string | null;
  category_image?: string | null;
  price: number;
  price_after_offer?: number | null;
  offer_percentage?: number;
  quantity?: number;
  quantity_unit?: string;
  monthly_subscription?: number;
  stock: number;
  active_status: number;
}

export interface Banner {
  id: number;
  title: string;
  image: string;
  link?: string | null;
  active_status?: number;
}

export interface Category {
  id: number;
  name: string;
  slug?: string;
  image?: string | null;
  display_order?: number;
}

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  image?: string | null;
  quantity: number;
}

export interface Address {
  id: number;
  user_id: number;
  name: string;
  mobile: string;
  address_line: string;
  area?: string | null;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: number | boolean;
}

export interface AddressInput {
  name: string;
  mobile: string;
  address_line: string;
  area?: string;
  city: string;
  state: string;
  pincode: string;
  lat?: number | null;
  lng?: number | null;
  is_default?: boolean;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: number;
  total_amount: number;
  order_status: string;
  payment_status?: string;
  delivery_address?: string | null;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
  items?: OrderItem[];
  created_at?: string;
}

export interface OrderItem {
  product_id: number;
  product_name?: string;
  quantity: number;
  price: number;
}

export interface Subscription {
  id: number;
  user_id: number;
  product_id?: number | null;
  frequency?: SubscriptionFrequency;
  start_date: string;
  end_date: string;
  quantity: number;
  total_days: number;
  remaining_days: number;
  price_per_day: number;
  total_amount: number;
  carried_forward_days?: number;
  status: 'active' | 'paused' | 'expired' | 'cancelled';
  next_delivery?: string | null;
  pauses?: DeliveryPause[];
  created_at?: string;
}

export interface DeliveryPause {
  id: number;
  subscription_id: number;
  pause_date: string;
}

export interface DeliveryLog {
  id: number;
  user_id: number;
  subscription_id: number;
  delivery_date: string;
  quantity: number;
  status: 'scheduled' | 'delivered' | 'skipped' | 'paused';
}

export interface SkipRequest {
  id: number;
  user_id: number;
  subscription_id: number;
  product_id?: number | null;
  skip_date: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

export interface CarryForwardLog {
  id: number;
  user_id: number;
  subscription_id: number;
  skipped_days: number;
  added_days: number;
  balance_days: number;
  note?: string | null;
  created_at?: string;
}

export interface Payment {
  id: number;
  transaction_id: string;
  user_id: number;
  amount: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed';
  reference_type?: string | null;
  reference_id?: number | null;
  payment_date?: string;
}

export interface Ledger {
  user: User;
  subscription_amount: number;
  paid: number;
  pending: number;
  wallet_balance: number;
  carry_forward_balance: number;
  payments: Payment[];
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  display_order?: number;
  is_active?: number;
  sort_order?: number;
}

export interface CmsPage {
  slug: string;
  title: string;
  content: string;
}

export interface SupportInfo {
  phone: string;
  email: string;
  whatsapp: string;
}

export interface SupportTicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface PaymentSupportTicket {
  id: number;
  ticket_number: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  closed_by?: 'user' | 'admin' | null;
  closed_at?: string | null;
  messages?: SupportTicketMessage[];
  can_user_reply?: boolean;
  can_admin_reply?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceLocation {
  id: number;
  name: string;
  map_url?: string | null;
  lat?: number | null;
  lng?: number | null;
  display_order?: number;
  is_active?: number;
}

export interface ServiceAreaCheckResult {
  in_service_area: boolean;
  distance_km?: number | null;
  radius_km?: number;
  message?: string;
  location?: { id: number; name: string };
  nearest?: { id: number; name: string; lat: number; lng: number; distance_km?: number };
  total_locations?: number;
  locations_checked?: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export type SubscriptionFrequency = 'daily' | 'alternate_day' | 'weekly' | 'custom';
