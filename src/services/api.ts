import api from '../lib/api';
import type {
  Admin,
  User,
  Transaction,
  OverviewStats,
  ChartData,
  LogFile,
  LogEntry,
  ServerHealth,
  PaginatedResponse,
} from '../types';

// ============================================
// AUTH SERVICE
// ============================================

export const authService = {
  async login(email: string, password: string): Promise<Admin> {
    const { data } = await api.post<Admin>('/admin/auth/login', { email, password });
    return data;
  },

  async getMe(): Promise<Admin> {
    const { data } = await api.get<Admin>('/admin/auth/me');
    return data;
  },

  async createAdmin(adminData: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<Admin> {
    const { data } = await api.post<Admin>('/admin/auth/create', adminData);
    return data;
  },
};

// ============================================
// STATS SERVICE
// ============================================

export const statsService = {
  async getOverview(): Promise<OverviewStats> {
    const { data } = await api.get<OverviewStats>('/admin/stats/overview');
    return data;
  },

  async getCharts(period: '7d' | '30d' | '90d' = '7d'): Promise<ChartData> {
    const { data } = await api.get<ChartData>('/admin/stats/charts', {
      params: { period },
    });
    return data;
  },
};

// ============================================
// USERS SERVICE
// ============================================

interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const usersService = {
  async getUsers(params: GetUsersParams = {}): Promise<PaginatedResponse<User> & { users: User[] }> {
    const { data } = await api.get<PaginatedResponse<User> & { users: User[] }>('/admin/users', {
      params,
    });
    return data;
  },

  async getUserById(id: string): Promise<{
    user: User;
    stats: Array<{ _id: string; total: number; count: number }>;
    recentTransactions: Transaction[];
  }> {
    const { data } = await api.get(`/admin/users/${id}`);
    return data;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const { data } = await api.delete(`/admin/users/${id}`);
    return data;
  },
};

// ============================================
// TRANSACTIONS SERVICE
// ============================================

interface GetTransactionsParams {
  page?: number;
  limit?: number;
  type?: 'income' | 'expense';
  userId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export const transactionsService = {
  async getTransactions(
    params: GetTransactionsParams = {}
  ): Promise<PaginatedResponse<Transaction> & { transactions: Transaction[] }> {
    const { data } = await api.get<PaginatedResponse<Transaction> & { transactions: Transaction[] }>(
      '/admin/transactions',
      { params }
    );
    return data;
  },
};

// ============================================
// LOGS SERVICE
// ============================================

export const logsService = {
  async getLogFiles(): Promise<{ files: LogFile[] }> {
    const { data } = await api.get<{ files: LogFile[] }>('/admin/logs');
    return data;
  },

  async getLogContent(
    filename: string,
    params: { lines?: number; search?: string } = {}
  ): Promise<{ filename: string; totalLines: number; logs: LogEntry[] }> {
    const { data } = await api.get(`/admin/logs/${filename}`, { params });
    return data;
  },
};

// ============================================
// SERVER SERVICE
// ============================================

export const serverService = {
  async getHealth(): Promise<ServerHealth> {
    const { data } = await api.get<ServerHealth>('/admin/server/health');
    return data;
  },
};
