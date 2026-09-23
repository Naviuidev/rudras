import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import type { Product } from '../types';

const WISHLIST_KEY = 'rudra_web_wishlist';

export interface WishlistItem {
  product_id: number;
  name: string;
  price: number;
  image?: string | null;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  isWishlisted: (productId: number) => boolean;
  toggleItem: (item: WishlistItem) => void;
  removeItem: (productId: number) => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

function loadWishlist(): WishlistItem[] {
  try {
    const raw = localStorage.getItem(WISHLIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>(loadWishlist);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  }, [items]);

  const isWishlisted = useCallback((productId: number) => items.some((i) => i.product_id === productId), [items]);

  const toggleItem = useCallback((item: WishlistItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.product_id === item.product_id);
      if (exists) return prev.filter((i) => i.product_id !== item.product_id);
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  return (
    <WishlistContext.Provider
      value={{ items, count: items.length, isWishlisted, toggleItem, removeItem }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
}

export function productToWishlistItem(product: Product): WishlistItem {
  return {
    product_id: product.id,
    name: product.name,
    price: product.price_after_offer ?? product.price,
    image: product.image,
  };
}
