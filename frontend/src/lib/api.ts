import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: any) => api.put('/auth/profile', data),
};

// Services API
export const servicesApi = {
  getAll: (params?: any) => api.get('/services', { params }),
  getBySlug: (slug: string) => api.get(`/services/${slug}`),
};

// Categories API
export const categoriesApi = {
  getAll: () => api.get('/categories'),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

// Bookings API
export const bookingsApi = {
  getMy: (params?: any) => api.get('/bookings/my', { params }),
  getById: (id: string) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  cancel: (id: string) => api.put(`/bookings/${id}/cancel`),
};

// Payments API
export const paymentsApi = {
  createIntent: (data: any) => api.post('/payments/create-intent', data),
  confirm: (data: any) => api.post('/payments/confirm', data),
  getStatus: (bookingId: string) => api.get(`/payments/${bookingId}`),
};

// Reviews API
export const reviewsApi = {
  getByService: (serviceId: string, params?: any) => 
    api.get(`/reviews/service/${serviceId}`, { params }),
  create: (data: any) => api.post('/reviews', data),
};

// Admin API
export const adminApi = {
  getAnalytics: (params?: any) => api.get('/admin/analytics', { params }),
  getUsers: (params?: any) => api.get('/admin/users', { params }),
  getAllBookings: (params?: any) => api.get('/admin/bookings/all', { params }),
  updateUserRole: (userId: string, role: string) => 
    api.put(`/admin/users/${userId}/role`, { role }),
};
