import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { User } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('web_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (token: string, userData: User) => {
    localStorage.setItem('web_token', token);
    localStorage.setItem('web_user', JSON.stringify(userData));
    setUser(userData);
  };

  const isAuthenticated = Boolean(user && localStorage.getItem('web_token'));

  const logout = () => {
    localStorage.removeItem('web_token');
    localStorage.removeItem('web_user');
    setUser(null);
  };

  const updateUser = (userData: User) => {
    localStorage.setItem('web_user', JSON.stringify(userData));
    setUser(userData);
  };

  useEffect(() => {
    const token = localStorage.getItem('web_token');
    if (!token) setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
