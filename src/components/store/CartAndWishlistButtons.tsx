import React from 'react';
import { useCart } from '@/hooks/useCart';
import { useWishlist } from '@/hooks/useWishlist';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CartAndWishlistButtons: React.FC = () => {
  const { cartItems } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-3 sm:bottom-6 sm:right-6">
      <button
        onClick={() => navigate('/shopping-cart')}
        className="relative p-3 bg-gradient-to-br from-green-500 to-blue-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
        title="עגלת קניות"
      >
        <ShoppingCart className="w-5 h-5" />
        {cartItems.length > 0 && (
          <Badge className="absolute -top-1 -left-1 bg-white text-green-600 text-xs px-2 rounded-full shadow-sm">
            {cartItems.length}
          </Badge>
        )}
      </button>

      <button
        onClick={() => navigate('/wishlist')}
        className="relative p-3 bg-gradient-to-br from-pink-500 to-purple-500 text-white rounded-full shadow-lg hover:scale-110 transition-all"
        title="מועדפים"
      >
        <Heart className="w-5 h-5" />
        {wishlist.length > 0 && (
          <Badge className="absolute -top-1 -left-1 bg-white text-pink-600 text-xs px-2 rounded-full shadow-sm">
            {wishlist.length}
          </Badge>
        )}
      </button>
    </div>
  );
};

export default CartAndWishlistButtons;
