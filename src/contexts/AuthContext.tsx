import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { authService } from '../services/api';
import type { Admin } from '../types';

interface AuthContextType {
  admin: Admin | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('adminToken');
      const storedAdmin = localStorage.getItem('admin');

      if (storedToken && storedAdmin) {
        try {
          const adminData = await authService.getMe();
          setAdmin(adminData);
          setToken(storedToken);
        } catch {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('admin');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const adminData = await authService.login(email, password);
      
      if (adminData.token) {
        localStorage.setItem('adminToken', adminData.token);
        localStorage.setItem('admin', JSON.stringify(adminData));
        setToken(adminData.token);
      }
      
      setAdmin(adminData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    setAdmin(null);
    setToken(null);
  }, []);

  const isSuperAdmin = admin?.role === 'super_admin';

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isLoading,
        error,
        login,
        logout,
        isSuperAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
