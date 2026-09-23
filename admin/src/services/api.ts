import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    return Promise.reject(err);
  }
);

export const adminLogin = (username: string, password: string) =>
  api.post('/auth/admin-login', { username, password });

export const getCategories = () => api.get('/categories', { params: { all: 1 } });
export const createCategory = (data: { name: string; image?: string; display_order?: number }) =>
  api.post('/categories', data);
export const updateCategory = (id: number, data: { name?: string; image?: string; display_order?: number }) =>
  api.put(`/categories/${id}`, data);
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

export const getServiceLocations = () => api.get('/service-locations', { params: { all: 1 } });
export const previewServiceLocation = (map_url: string) =>
  api.post('/service-locations/preview', { map_url });
export const createServiceLocation = (data: { map_url: string; name?: string; display_order?: number }) =>
  api.post('/service-locations', data);
export const deleteServiceLocation = (id: number) => api.delete(`/service-locations/${id}`);

export const getDashboardStats = () => api.get('/dashboard/stats');

export const getUsers = (params?: { search?: string; status?: string; subscription_status?: string }) =>
  api.get('/users', { params });
export const getCustomer = (id: number) => api.get(`/customers/${id}`);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

export const getSkipRequests = (status?: string) =>
  api.get('/skip-requests', { params: status ? { status } : {} });
export const approveSkipRequest = (id: number) => api.put(`/skip-requests/${id}/approve`);
export const rejectSkipRequest = (id: number) => api.put(`/skip-requests/${id}/reject`);
export const getCarryForwardHistory = () => api.get('/carry-forward');

export const getInventoryStock = () => api.get('/inventory/stock');
export const getDailyRequirement = (date?: string) =>
  api.get('/inventory/daily-requirement', { params: date ? { date } : {} });
export const adjustStock = (data: any) => api.post('/inventory/adjust', data);

export const getPayments = (status?: string) =>
  api.get('/payments', { params: status ? { status } : {} });
export const getCustomerLedger = (userId: number) => api.get(`/payments/ledger/${userId}`);

export const getSalesReport = (days?: number) =>
  api.get('/reports/sales', { params: days ? { days } : {} });
export const getSubscriptionReport = () => api.get('/reports/subscriptions');
export const getCustomerReport = () => api.get('/reports/customers');

export const getFaqs = () => api.get('/faqs');
export const createFaq = (data: any) => api.post('/faqs', data);
export const updateFaq = (id: number, data: any) => api.put(`/faqs/${id}`, data);
export const deleteFaq = (id: number) => api.delete(`/faqs/${id}`);

export const getProducts = () => api.get('/products?all=1');
export const createProduct = (data: any) => api.post('/products', data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

export const getBanners = () => api.get('/banners?all=1');
export const createBanner = (data: any) => api.post('/banners', data);
export const updateBanner = (id: number, data: any) => api.put(`/banners/${id}`, data);
export const deleteBanner = (id: number) => api.delete(`/banners/${id}`);

export const getOrders = (status?: string) => api.get('/orders', { params: status ? { status } : {} });
export const getOrder = (id: number) => api.get(`/orders/${id}`);
export const updateOrderStatus = (id: number, order_status: string) =>
  api.put(`/orders/${id}/status`, { order_status });

export const getSubscriptions = (status?: string) =>
  api.get('/subscriptions', { params: status ? { status } : {} });
export const pauseSubscription = (id: number) => api.put(`/subscriptions/${id}/pause`);
export const resumeSubscription = (id: number) => api.put(`/subscriptions/${id}/resume`);
export const cancelSubscription = (id: number) => api.put(`/subscriptions/${id}/cancel`);

export const getCmsPages = () => api.get('/cms');
export const updateCmsPage = (slug: string, data: any) => api.put(`/cms/${slug}`, data);

export const sendNotification = (data: any) => api.post('/notifications/send', data);

export const sendAdminHelp = (data: { issue_type: string; message: string }) =>
  api.post('/support/admin-help', data);

export const getPaymentSupportTickets = () => api.get('/support/payment-tickets');
export const replyPaymentSupportTicket = (id: number, message: string) =>
  api.post(`/support/payment-tickets/${id}/reply`, { message });
export const updatePaymentSupportTicketStatus = (
  id: number,
  data: { status: string }
) => api.put(`/support/payment-tickets/${id}/status`, data);
export const closePaymentSupportTicket = (id: number) =>
  api.put(`/support/payment-tickets/${id}/close`);

export const uploadFile = (file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
};

export default api;
