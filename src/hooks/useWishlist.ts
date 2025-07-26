// src/hooks/useWishlist.ts

import { useWishlistContext } from '@/contexts/WishlistContext';

// הוק מותאם ונקי לשימוש ברכיבים
export const useWishlist = () => {
  const {
    items,
    isFavorite,
    toggleFavorite,
    clearWishlist,
  } = useWishlistContext();

  return {
    wishlist: items,
    isFavorite,
    toggleFavorite,
    clearWishlist,
    total: items.length,
  };
};
