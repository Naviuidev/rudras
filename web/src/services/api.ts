import axios from 'axios';
import type {
  Address,
  AddressInput,
  ApiResponse,
  Banner,
  CarryForwardLog,
  Category,
  CmsPage,
  DeliveryLog,
  Faq,
  Ledger,
  Order,
  Payment,
  Product,
  PaymentSupportTicket,
  SkipRequest,
  Subscription,
  SubscriptionFrequency,
  SupportInfo,
  ServiceAreaCheckResult,
  ServiceLocation,
  User,
} from '../types';

const API_URL = import.meta.env.VITE_WEB_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('web_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const isAuthEndpoint =
        err.config?.url?.includes('/auth/verify-otp') ||
        err.config?.url?.includes('/auth/send-otp') ||
        err.config?.url?.includes('/auth/login') ||
        err.config?.url?.includes('/auth/set-password');
      if (!isAuthEndpoint) {
        localStorage.removeItem('web_token');
        localStorage.removeItem('web_user');
      }
      if (
        !isAuthEndpoint &&
        !window.location.pathname.startsWith('/login') &&
        !window.location.pathname.startsWith('/verify-otp') &&
        !window.location.pathname.startsWith('/set-password')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);


export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

export const getErrorCode = (err: unknown): string | undefined => {
  if (axios.isAxiosError(err)) {
    const errors = err.response?.data?.errors;
    if (errors && typeof errors === 'object' && 'code' in errors) {
      return String((errors as { code: string }).code);
    }
  }
  return undefined;
};

export const sendOtp = (email: string) =>
  api.post<ApiResponse<{ message: string }>>('/auth/send-otp', { email: email.toLowerCase().trim() });

export const loginWithPassword = (email: string, password: string) =>
  api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
    email: email.toLowerCase().trim(),
    password,
  });

export const verifyOtp = (email: string, otp: string) =>
  api.post<ApiResponse<{ token: string; user: User; is_new_user: boolean; needs_password: boolean }>>(
    '/auth/verify-otp',
    {
      email: email.toLowerCase().trim(),
      otp: otp.replace(/\D/g, ''),
    }
  );

export const setPassword = (password: string) =>
  api.post<ApiResponse<{ user: User }>>('/auth/set-password', { password });

export interface ProfileResponse {
  user: User;
  active_subscription?: unknown;
  subscription_history?: unknown[];
  order_history?: unknown[];
}

export const getProfile = async (): Promise<ProfileResponse> => {
  const res = await api.get<ApiResponse<ProfileResponse>>('/profile');
  return res.data.data;
};

export const updateProfile = (data: { name?: string; mobile?: string; area?: string; address?: string }) =>
  api.put<ApiResponse<User>>('/profile', data);

export const getBanners = async (): Promise<Banner[]> => {
  const res = await api.get<ApiResponse<Banner[]>>('/banners');
  return res.data.data;
};

export const getProducts = async (category?: string, search?: string): Promise<Product[]> => {
  const params: Record<string, string> = {};
  if (category) params.category = category;
  if (search) params.search = search;
  const res = await api.get<ApiResponse<Product[]>>('/products', { params });
  return res.data.data;
};

export const getProduct = async (id: number): Promise<Product> => {
  const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
  return res.data.data;
};

export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get<ApiResponse<Category[]>>('/categories');
  return res.data.data;
};

export const getCmsPage = async (slug: string): Promise<CmsPage> => {
  const res = await api.get<ApiResponse<CmsPage>>(`/cms/${slug}`);
  return res.data.data;
};

export const getFaqsPublic = async (): Promise<Faq[]> => {
  const res = await api.get<ApiResponse<Faq[]>>('/faqs/public');
  return res.data.data;
};

export const getSupportInfo = async (): Promise<SupportInfo> => {
  const res = await api.get<ApiResponse<SupportInfo>>('/support/info');
  return res.data.data;
};

export const sendSupportMessage = (data: { name: string; email: string; message: string }) =>
  api.post<ApiResponse<null>>('/support/contact', data);

export const submitPaymentSupport = async (data: {
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  message: string;
}) => {
  const res = await api.post<ApiResponse<{ ticket_number: string; status: string }>>('/support/payment', data);
  return res.data.data;
};

export const getMySupportTickets = async (): Promise<PaymentSupportTicket[]> => {
  const res = await api.get<ApiResponse<PaymentSupportTicket[]>>('/support/tickets');
  return res.data.data;
};

export const replyToSupportTicket = async (id: number, message: string): Promise<PaymentSupportTicket> => {
  const res = await api.post<ApiResponse<PaymentSupportTicket>>(`/support/tickets/${id}/reply`, { message });
  return res.data.data;
};

export const closeSupportTicket = async (id: number): Promise<PaymentSupportTicket> => {
  const res = await api.put<ApiResponse<PaymentSupportTicket>>(`/support/tickets/${id}/close`);
  return res.data.data;
};

export const getServiceLocations = async (): Promise<ServiceLocation[]> => {
  const res = await api.get<ApiResponse<ServiceLocation[]>>('/service-locations');
  return res.data.data;
};

export const checkServiceArea = async (lat: number, lng: number): Promise<ServiceAreaCheckResult> => {
  const res = await api.post<ApiResponse<ServiceAreaCheckResult>>('/service-locations/check', { lat, lng });
  return res.data.data;
};

export const getAddresses = async (): Promise<Address[]> => {
  const res = await api.get<ApiResponse<Address[]>>('/addresses');
  return res.data.data;
};

export const createAddress = async (data: AddressInput): Promise<Address> => {
  const res = await api.post<ApiResponse<Address>>('/addresses', data);
  return res.data.data;
};

export const updateAddress = async (id: number, data: Partial<AddressInput>): Promise<Address> => {
  const res = await api.put<ApiResponse<Address>>(`/addresses/${id}`, data);
  return res.data.data;
};

export const deleteAddress = (id: number) => api.delete<ApiResponse<null>>(`/addresses/${id}`);

export const createOrder = async (data: {
  items: { product_id: number; quantity: number }[];
  delivery_address?: string;
  delivery_lat?: number | null;
  delivery_lng?: number | null;
}): Promise<Order> => {
  const res = await api.post<ApiResponse<Order>>('/orders', data);
  return res.data.data;
};

export const getOrders = async (): Promise<Order[]> => {
  const res = await api.get<ApiResponse<Order[]>>('/orders');
  return res.data.data;
};

export const getOrder = async (id: number): Promise<Order> => {
  const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
  return res.data.data;
};

export const getSubscriptions = async (): Promise<Subscription[]> => {
  const res = await api.get<ApiResponse<Subscription[]>>('/subscriptions');
  return res.data.data;
};

export const getActiveSubscription = async (): Promise<Subscription | null> => {
  const res = await api.get<ApiResponse<Subscription | null>>('/subscriptions/active');
  return res.data.data;
};

export const createSubscription = async (data: {
  quantity: number;
  total_days: number;
  price_per_day: number;
  start_date: string;
  end_date?: string;
  frequency?: SubscriptionFrequency;
  product_id?: number;
  delivery_dates?: string[];
  total_amount?: number;
}): Promise<Subscription> => {
  const res = await api.post<ApiResponse<Subscription>>('/subscriptions', data);
  return res.data.data;
};

export const pauseSubscription = async (id: number): Promise<Subscription> => {
  const res = await api.put<ApiResponse<Subscription>>(`/subscriptions/${id}/pause`);
  return res.data.data;
};

export const resumeSubscription = async (id: number): Promise<Subscription> => {
  const res = await api.put<ApiResponse<Subscription>>(`/subscriptions/${id}/resume`);
  return res.data.data;
};

export const cancelSubscription = async (id: number): Promise<Subscription> => {
  const res = await api.put<ApiResponse<Subscription>>(`/subscriptions/${id}/cancel`);
  return res.data.data;
};

export const pauseDates = async (id: number, dates: string[]) => {
  const res = await api.post<ApiResponse<{ paused_days: number; subscription: Subscription }>>(
    `/subscriptions/${id}/pause-dates`,
    { dates }
  );
  return res.data.data;
};

export const getDeliveryLogs = async (): Promise<DeliveryLog[]> => {
  const res = await api.get<ApiResponse<DeliveryLog[]>>('/subscriptions/delivery-logs');
  return res.data.data;
};

export const getSkipRequests = async (): Promise<SkipRequest[]> => {
  const res = await api.get<ApiResponse<SkipRequest[]>>('/skip-requests');
  return res.data.data;
};

export const createSkipRequest = async (data: {
  subscription_id: number;
  skip_date: string;
  reason?: string;
}): Promise<SkipRequest> => {
  const res = await api.post<ApiResponse<SkipRequest>>('/skip-requests', data);
  return res.data.data;
};

export const getCarryForward = async (): Promise<CarryForwardLog[]> => {
  const res = await api.get<ApiResponse<CarryForwardLog[]>>('/carry-forward');
  return res.data.data;
};

export const initiatePayment = async (data: {
  amount: number;
  reference_type: string;
  reference_id: number;
}): Promise<{
  transaction_id: string;
  key_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  mock?: boolean;
  prefill?: { name?: string; email?: string; contact?: string };
}> => {
  const res = await api.post<
    ApiResponse<{
      transaction_id: string;
      key_id: string;
      razorpay_order_id: string;
      amount: number;
      currency: string;
      mock?: boolean;
      prefill?: { name?: string; email?: string; contact?: string };
    }>
  >('/payments/initiate', data);
  return res.data.data;
};

export const verifyPayment = async (data: {
  transaction_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}) => {
  const res = await api.post<ApiResponse<{ paid: boolean; status: string; payment: Payment }>>('/payments/verify', data);
  return res.data.data;
};

export const getPayments = async (): Promise<Payment[]> => {
  const res = await api.get<ApiResponse<Payment[]>>('/payments');
  return res.data.data;
};

export const getMyLedger = async (): Promise<Ledger> => {
  const res = await api.get<ApiResponse<Ledger>>('/payments/ledger');
  return res.data.data;
};

export default api;
