import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));
  const [user, setUser] = useState<AdminUser | null>(() => {
    const stored = localStorage.getItem('admin_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, adminUser: AdminUser) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(adminUser));
    setIsAuthenticated(true);
    setUser(adminUser);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth required');
  return ctx;
}
