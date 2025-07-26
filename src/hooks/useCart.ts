import { useEffect, useState } from 'react';

export interface CartItem {
  id: string;
  name_he: string;
  price: number;
  link: string;
  image_url?: string;
}

const CART_KEY = 'student_cart';

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(CART_KEY);
    if (stored) setCartItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: CartItem) => {
    setCartItems(prev => {
      if (prev.find(p => p.id === product.id)) return prev;
      return [...prev, product];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(p => p.id !== id));
  };

  const clearCart = () => setCartItems([]);

  return {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart
  };
}
