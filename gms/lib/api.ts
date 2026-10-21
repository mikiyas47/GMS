/**
 * Gym Management System - API Client
 * Connects directly to backend API on http://localhost:5000/api
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface UserSession {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'receptionist';
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('gym_token');
}

export function getStoredUser(): UserSession | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('gym_user');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function storeSession(token: string, user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('gym_token', token);
  localStorage.setItem('gym_user', JSON.stringify(user));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('gym_token');
  localStorage.removeItem('gym_user');
}

// Reusable fetch wrapper with automatic token injection
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `API request failed with status ${res.status}`);
  }
  return data as T;
}

// -------------------------------------------------------------
// Live API Client
// -------------------------------------------------------------
export const api = {
  // --- Auth ---
  async login(email: string, password: string) {
    const data = await apiRequest<{ success: boolean; token: string; user: UserSession }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (data.token && data.user) {
      storeSession(data.token, data.user);
    }
    return data;
  },

  async logout() {
    clearSession();
  },

  // --- Public Endpoints ---
  async getPublicTimetable() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/public/timetable');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getPublicTrainers() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/public/trainers');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getPublicProducts() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/public/products');
      return res.data || [];
    } catch {
      return [];
    }
  },

  // --- Members ---
  async getMembers(search?: string, status?: string) {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'all') params.append('status', status);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<{ success: boolean; data: any[] }>(`/members${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async getMember(id: string) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/members/${id}`);
    return res.data;
  },

  async createMember(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res.data) {
      if (!res.data.id && res.data._id) {
        res.data.id = res.data._id;
      }
    }
    return res.data;
  },

  async updateMember(id: string, data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/members/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteMember(id: string) {
    return await apiRequest<{ success: boolean; message: string }>(`/members/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Memberships ---
  async getMemberships(status?: string, member_id?: string) {
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (member_id) params.append('member_id', member_id);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<{ success: boolean; data: any[] }>(`/memberships${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createMembership(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/memberships', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async freezeMembership(id: string) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/memberships/${id}/freeze`, {
      method: 'PATCH',
    });
    return res.data;
  },

  async unfreezeMembership(id: string) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/memberships/${id}/unfreeze`, {
      method: 'PATCH',
    });
    return res.data;
  },

  // --- Attendance ---
  async getAttendance(currentlyIn?: boolean, date?: string) {
    try {
      const params = new URLSearchParams();
      if (currentlyIn) params.append('currently_in', 'true');
      if (date) params.append('date', date);
      const query = params.toString() ? `?${params.toString()}` : '';

      const res = await apiRequest<{ success: boolean; data: any[] }>(`/attendance${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async checkIn(member_id: string) {
    return await apiRequest<{ success: boolean; message: string; data: any }>('/attendance/checkin', {
      method: 'POST',
      body: JSON.stringify({ member_id }),
    });
  },

  async checkOut(attendance_id: string) {
    return await apiRequest<{ success: boolean; message: string; data: any }>(`/attendance/${attendance_id}/checkout`, {
      method: 'PATCH',
    });
  },

  // --- Payments ---
  async getPayments(member_id?: string) {
    try {
      const query = member_id ? `?member_id=${member_id}` : '';
      const res = await apiRequest<{ success: boolean; data: any[] }>(`/payments${query}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createPayment(data: any) {
    return await apiRequest<{ success: boolean; message: string; data: any }>('/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Products & Sales ---
  async getProducts(lowStockOnly?: boolean) {
    try {
      const q = lowStockOnly ? '?low_stock_only=true' : '';
      const res = await apiRequest<{ success: boolean; data: any[] }>(`/products${q}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createProduct(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateProduct(id: string, data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteProduct(id: string) {
    return await apiRequest<{ success: boolean }>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  async getProductSales() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/product-sales');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createProductSale(data: any) {
    return await apiRequest<{ success: boolean; data: any }>('/product-sales', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // --- Trainers, Classes, Sessions ---
  async getTrainers() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/trainers');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createTrainer(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/trainers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateTrainer(id: string, data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/trainers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getClasses() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/classes');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createClass(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteClass(id: string) {
    return await apiRequest<{ success: boolean }>(`/classes/${id}`, {
      method: 'DELETE',
    });
  },

  async getSessions() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/sessions');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createSession(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteSession(id: string) {
    return await apiRequest<{ success: boolean }>(`/sessions/${id}`, {
      method: 'DELETE',
    });
  },

  // --- Reports (Admin) ---
  async getRevenueReport() {
    try {
      return await apiRequest<{ success: boolean; summary: any; methodBreakdown: any[]; recentPayments: any[] }>('/reports/revenue');
    } catch {
      return {
        success: true,
        summary: {
          grossRevenue: 0,
          membershipRevenue: 0,
          productSalesRevenue: 0,
          totalProductUnitsSold: 0,
        },
        methodBreakdown: [],
        recentPayments: []
      };
    }
  },

  async getAttendanceReport() {
    try {
      return await apiRequest<{ success: boolean; summary: any; currentlyInside: any[]; topActiveMembers: any[] }>('/reports/attendance');
    } catch {
      return {
        success: true,
        summary: {
          totalLifetimeCheckins: 0,
          currentlyInsideCount: 0
        },
        currentlyInside: [],
        topActiveMembers: []
      };
    }
  },

  async getExpiringMembershipsReport(days = 7) {
    try {
      const res = await apiRequest<{ success: boolean; count: number; data: any[] }>(`/reports/expiring-memberships?days=${days}`);
      return res.data || [];
    } catch {
      return [];
    }
  },

  // --- Staff Accounts ---
  async getStaffUsers() {
    try {
      const res = await apiRequest<{ success: boolean; data: any[] }>('/users');
      return res.data || [];
    } catch {
      return [];
    }
  },

  async createStaffUser(data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateStaffUser(id: string, data: any) {
    const res = await apiRequest<{ success: boolean; data: any }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  }
};
