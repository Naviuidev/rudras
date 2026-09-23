import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateProfile } from '../services/api';

interface User {
  id: number;
  name: string;
  email: string;
  mobile?: string;
}

interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const [storedToken, storedUser, storedCart] = await Promise.all([
        AsyncStorage.getItem('auth_token'),
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('cart'),
      ]);
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));
      if (storedCart) setCart(JSON.parse(storedCart));
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    await AsyncStorage.setItem('auth_token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['auth_token', 'user', 'cart']);
    setToken(null);
    setUser(null);
    setCart([]);
  };

  const updateUser = async (data: Partial<User>) => {
    const response = await updateProfile(data);
    const updated = response.data.data;
    await AsyncStorage.setItem('user', JSON.stringify(updated));
    setUser(updated);
  };

  const persistCart = async (newCart: CartItem[]) => {
    await AsyncStorage.setItem('cart', JSON.stringify(newCart));
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === item.product_id);
      const newCart = existing
        ? prev.map((c) =>
            c.product_id === item.product_id ? { ...c, quantity: c.quantity + qty } : c
          )
        : [...prev, { ...item, quantity: qty }];
      void persistCart(newCart);
      return newCart;
    });
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => {
      const newCart = prev.filter((c) => c.product_id !== productId);
      void persistCart(newCart);
      return newCart;
    });
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => {
      const newCart = prev.map((c) => (c.product_id === productId ? { ...c, quantity } : c));
      void persistCart(newCart);
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    void AsyncStorage.removeItem('cart');
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
        updateUser,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
