import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, ArrowLeft, ShoppingCart, Tag, Star, Gift } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import CartAndWishlistButtons from '@/components/store/CartAndWishlistButtons';

const Store = () => {
  const navigate = useNavigate();
  const { language, dir } = useLanguage();
  const { data: products = [], isLoading } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState('all');

  // הגדר קטגוריות עם צבע ואייקון לכל אחת
  const categories = [
    { id: 'all', name: 'הכל', color: 'bg-gradient-to-r from-blue-400 to-purple-500', icon: <Tag className="w-4 h-4 mr-1" /> },
    { id: 'software', name: 'תוכנות', color: 'bg-blue-100 text-blue-600', icon: <Gift className="w-4 h-4 mr-1" /> },
    { id: 'books', name: 'ספרים', color: 'bg-purple-100 text-purple-700', icon: <Star className="w-4 h-4 mr-1" /> },
    { id: 'electronics', name: 'אלקטרוניקה', color: 'bg-yellow-100 text-yellow-700', icon: <ShoppingCart className="w-4 h-4 mr-1" /> },
    { id: 'courses', name: 'קורסים', color: 'bg-green-100 text-green-700', icon: <Star className="w-4 h-4 mr-1" /> },
    { id: 'supplies', name: 'ציוד לימודים', color: 'bg-pink-100 text-pink-600', icon: <ShoppingCart className="w-4 h-4 mr-1" /> },
    { id: 'entertainment', name: 'בידור', color: 'bg-orange-100 text-orange-600', icon: <Gift className="w-4 h-4 mr-1" /> },
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(product => product.category === selectedCategory);

  const handlePurchase = (product: any) => {
    if (product.link && product.link !== '#') {
      window.open(product.link, '_blank');
    } else {
      alert(`רכישה: ${product.name_he}`);
    }
  };

  const handleShare = (product: any) => {
    if (navigator.share) {
      navigator.share({
        title: product.name_he,
        text: product.description_he,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(`${product.name_he} - ${window.location.href}`);
      alert('הקישור הועתק!');
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      dir={dir}
      style={{
        background: `
          linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c, #4facfe, #00f2fe, #43e97b, #38f9d7),
          linear-gradient(45deg, rgba(102, 126, 234, 0.13), rgba(118, 75, 162, 0.12), rgba(240, 147, 251, 0.12))
        `,
        backgroundSize: '600% 600%, 100% 100%',
        animation: 'gradientShift 20s ease infinite'
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-pink-200/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }} />
        <div className="absolute top-1/6 right-1/6 w-28 h-28 bg-green-200/20 rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '4s' }} />
      </div>

      {/* Cart and Wishlist Floating Buttons */}
      <CartAndWishlistButtons />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md border-b relative z-10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              חזור לדף הבית
            </Button>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Gift className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  הטבות לסטודנטים 🎁
                </span>
              </h1>
            </div>
            <p className="text-xl text-gray-700 max-w-2xl mx-auto">
              הנחות בלעדיות, קופונים לכלים שימושיים במיוחד – במיוחד בשבילכם
            </p>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              קטגוריות
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {categories.map(category => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`mb-2 transition-all duration-200 hover:scale-105 rounded-full font-semibold px-4 py-2 ${selectedCategory === category.id ? category.color : ''}`}
                >
                  {category.icon}
                  {category.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">טוען מוצרים...</p>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7 lg:gap-9 justify-items-center animate-fadein-slow">
          {filteredProducts.map((product, index) => (
            <div
              key={product.id}
              className="animate-fade-in w-full max-w-[320px]"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <ProductCard
                product={product}
                onPurchase={handlePurchase}
                onShare={handleShare}
              />
            </div>
          ))}
        </div>

        {/* No products state */}
        {filteredProducts.length === 0 && !isLoading && (
          <Card className="p-8 text-center bg-white/80 backdrop-blur-sm mt-7">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">אין מוצרים בקטגוריה זו</h3>
            <p className="text-gray-600">נסה לבחור קטגוריה אחרת או חזור מאוחר יותר</p>
          </Card>
        )}

        {/* Why us */}
        <Card className="mt-14 bg-gradient-to-r from-purple-500 to-pink-500 text-white overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20"></div>
          <CardContent className="p-8 text-center relative z-10">
            <h2 className="text-2xl font-bold mb-4">למה לקנות דרכנו?</h2>
            <div className="grid md:grid-cols-3 gap-7 mt-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <Tag className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">מחירים מסובסדים</h3>
                <p className="text-sm opacity-90">הנחות בלעדיות לקהילת הסטודנטים</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <Star className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">איכות מובטחת</h3>
                <p className="text-sm opacity-90">מוצרים נבחרים ובדוקים במיוחד עבורכם</p>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-3">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="font-semibold mb-2">רכישה פשוטה</h3>
                <p className="text-sm opacity-90">תהליך רכישה מהיר ונוח</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadein-slow { from { opacity:0; transform: translateY(36px);} to { opacity:1; transform: none;} }
        .animate-fade-in { animation: fade-in 0.7s cubic-bezier(.62,1.64,.44,.98) forwards; }
        .animate-fadein-slow { animation: fadein-slow 1.4s cubic-bezier(.62,1.64,.44,.98) both;}
      `}</style>
    </div>
  );
};

export default Store;
