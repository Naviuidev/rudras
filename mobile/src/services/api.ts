import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/theme';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const sendOtp = (email: string) =>
  api.post('/auth/send-otp', { email: email.toLowerCase().trim() });
export const loginWithPassword = (email: string, password: string) =>
  api.post('/auth/login', { email: email.toLowerCase().trim(), password });
export const verifyOtp = (email: string, otp: string) =>
  api.post('/auth/verify-otp', { email: email.toLowerCase().trim(), otp: otp.replace(/\D/g, '') });
export const setPassword = (password: string) => api.post('/auth/set-password', { password });

// Profile
export const getProfile = () => api.get('/profile');
export const updateProfile = (data: { name?: string; mobile?: string; push_token?: string }) =>
  api.put('/profile', data);

// Products
export const getProducts = (params?: { category?: string; search?: string }) =>
  api.get('/products', { params });
export const getProduct = (id: number) => api.get(`/products/${id}`);

// Banners
export const getBanners = () => api.get('/banners');

// Categories
export const getCategories = () => api.get('/categories');

// Addresses
export const getAddresses = () => api.get('/addresses');
export const createAddress = (data: {
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
}) => api.post('/addresses', data);
export const updateAddress = (
  id: number,
  data: Partial<{
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
  }>
) => api.put(`/addresses/${id}`, data);
export const deleteAddress = (id: number) => api.delete(`/addresses/${id}`);

// Service locations
export const getServiceLocations = () => api.get('/service-locations');
export const checkServiceArea = (lat: number, lng: number) =>
  api.post('/service-locations/check', { lat, lng });

export const getErrorMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || err.message || 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
};

// Orders
export const getOrders = () => api.get('/orders');
export const getOrder = (id: number) => api.get(`/orders/${id}`);
export const placeOrder = (data: {
  items: { product_id: number; quantity: number }[];
  delivery_address?: string;
  delivery_lat?: number;
  delivery_lng?: number;
}) => api.post('/orders', data);

// Payments
export const initiatePayment = (data: {
  amount: number;
  reference_type: string;
  reference_id: number;
}) => api.post('/payments/initiate', data);

export const verifyPayment = (data: {
  transaction_id: string;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
}) => api.post('/payments/verify', data);

// Subscriptions
export const getSubscriptions = () => api.get('/subscriptions');
export const getActiveSubscription = () => api.get('/subscriptions/active');
export const createSubscription = (data: {
  quantity: number;
  total_days: number;
  price_per_day: number;
  start_date: string;
  end_date?: string;
  frequency?: string;
  product_id?: number;
  delivery_dates?: string[];
  total_amount?: number;
}) => api.post('/subscriptions', data);
export const pauseDeliveryDates = (id: number, dates: string[]) =>
  api.post(`/subscriptions/${id}/pause-dates`, { dates });
export const resumeSubscription = (id: number) => api.put(`/subscriptions/${id}/resume`);
export const getDeliveryLogs = () => api.get('/subscriptions/delivery-logs');

// CMS
export const getCmsPage = (slug: string) => api.get(`/cms/${slug}`);

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id: number) => api.put(`/notifications/${id}/read`);
