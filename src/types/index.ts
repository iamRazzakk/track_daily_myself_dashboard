// API Types for Admin Dashboard

export interface Admin {
  _id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'viewer';
  lastLogin?: string;
  token?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  dailyExpenseTarget: number;
  dailyIncomeTarget: number;
  monthlyExpenseBudget: number;
  monthlyIncomeGoal: number;
  profileImage?: string;
  createdAt: string;
  updatedAt: string;
  transactionCount?: number;
}

export interface Transaction {
  _id: string;
  userId: string | { _id: string; name: string; email: string };
  amount: number;
  type: 'income' | 'expense';
  category: string;
  note?: string;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface OverviewStats {
  users: {
    total: number;
    today: number;
  };
  transactions: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  financials: {
    totalIncome: number;
    totalExpense: number;
    netBalance: number;
    incomeCount: number;
    expenseCount: number;
  };
  recentUsers: Array<{
    _id: string;
    name: string;
    email: string;
    createdAt: string;
  }>;
}

export interface ChartData {
  userRegistrations: Array<{
    _id: string;
    count: number;
  }>;
  transactionVolume: Array<{
    _id: {
      date: string;
      type: string;
    };
    total: number;
    count: number;
  }>;
  categoryDistribution: Array<{
    _id: {
      category: string;
      type: string;
    };
    total: number;
    count: number;
  }>;
}

export interface LogFile {
  name: string;
  size: number;
  modified: string;
}

export interface LogEntry {
  timestamp?: string;
  level?: string;
  message?: string;
  type?: string;
  action?: string;
  userId?: string;
  email?: string;
  method?: string;
  url?: string;
  status?: number;
  responseTime?: string;
  raw?: string;
  success?: boolean;
  stack?: string;
  [key: string]: unknown;
}

export interface ServerHealth {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: {
    seconds: number;
    formatted: string;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
    heapUsedMB: number;
    heapTotalMB: number;
  };
  cpu: {
    user: number;
    system: number;
  };
  system: {
    platform: string;
    arch: string;
    hostname: string;
    nodeVersion: string;
    cpus: number;
    totalMemory: number;
    freeMemory: number;
    loadAverage: number[];
  };
  database: {
    status: 'connected' | 'disconnected';
  };
}

export interface PaginatedResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  users?: T[];
  transactions?: T[];
}
