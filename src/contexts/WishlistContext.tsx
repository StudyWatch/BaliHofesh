// src/contexts/WishlistContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface WishlistItem {
  id: string;
  name_he: string;
  name_en?: string;
  price?: number;
  category: string;
  image_url?: string;
  type: 'product' | 'benefit';
}

interface WishlistContextType {
  items: WishlistItem[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (item: WishlistItem) => void;
  clearWishlist: () => void;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_STORAGE_KEY = 'bali-wishlist';

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_STORAGE_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const toggleFavorite = (item: WishlistItem) => {
    setItems(prev =>
      prev.some(i => i.id === item.id)
        ? prev.filter(i => i.id !== item.id)
        : [...prev, item]
    );
  };

  const isFavorite = (productId: string) =>
    items.some(i => i.id === productId);

  const clearWishlist = () => setItems([]);

  return (
    <WishlistContext.Provider value={{ items, isFavorite, toggleFavorite, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlistContext = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlistContext must be used within a WishlistProvider');
  }
  return context;
};
