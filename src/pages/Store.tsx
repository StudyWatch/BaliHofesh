import React, { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProducts } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  ShoppingCart, Tag, Star, Gift, ArrowLeft, ArrowRight, Filter as FilterIcon, X
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import CartAndWishlistButtons from '@/components/store/CartAndWishlistButtons';

// אייקון קטגוריה חכם
const getCategoryIcon = (category: string) => {
  switch ((category || '').trim().toLowerCase()) {
    case 'software': case 'תוכנות': return <Gift className="w-4 h-4 mr-1 text-blue-600" />;
    case 'books': case 'ספרים': return <Star className="w-4 h-4 mr-1 text-purple-700" />;
    case 'electronics': case 'אלקטרוניקה': return <ShoppingCart className="w-4 h-4 mr-1 text-yellow-700" />;
    case 'courses': case 'קורסים': return <Star className="w-4 h-4 mr-1 text-green-700" />;
    case 'supplies': case 'ציוד לימודים': return <ShoppingCart className="w-4 h-4 mr-1 text-pink-600" />;
    case 'entertainment': case 'בידור': return <Gift className="w-4 h-4 mr-1 text-orange-600" />;
    default: return <Tag className="w-4 h-4 mr-1 text-gray-400" />;
  }
};

const Store = () => {
  const navigate = useNavigate();
  const { dir } = useLanguage();
  const { data: products = [], isLoading } = useProducts();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const categoriesRowRef = useRef<HTMLDivElement>(null);

  // קטגוריות דינמיות מתוך כל המוצרים
  const dynamicCategories = useMemo(() => {
    const cats = products
      .map(p => (p.category && String(p.category).trim()) || '')
      .filter(Boolean);
    return Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b, 'he'));
  }, [products]);

  // סינון לפי חיפוש קטגוריה
  const filteredCategories = useMemo(() =>
    !categorySearch.trim()
      ? dynamicCategories
      : dynamicCategories.filter(cat =>
          cat.toLowerCase().includes(categorySearch.trim().toLowerCase())
        ),
    [dynamicCategories, categorySearch]
  );

  // סינון מוצרים
  const filteredProducts = selectedCategories.length === 0
    ? products
    : products.filter(
        p => selectedCategories.includes((p.category && String(p.category).trim()) || '')
      );

  // Toggle בחירה מרובה
  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // גלילה חכמה לקטגוריות במחשב
  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoriesRowRef.current) {
      const scrollAmount = categoriesRowRef.current.offsetWidth * 0.6;
      categoriesRowRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // רכישה/שיתוף
  const handlePurchase = (product: any) => {
    if (product.link && product.link !== '#') window.open(product.link, '_blank');
    else alert(`רכישה: ${product.name_he}`);
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
      className="min-h-screen relative overflow-x-hidden"
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
      {/* רקע אנימטיבי */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-200/20 rounded-full animate-bounce" style={{ animationDelay: '0s', animationDuration: '4s' }} />
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-200/20 rounded-full animate-bounce" style={{ animationDelay: '2s', animationDuration: '3s' }} />
        <div className="absolute top-1/2 left-3/4 w-16 h-16 bg-pink-200/20 rounded-full animate-bounce" style={{ animationDelay: '1s', animationDuration: '5s' }} />
        <div className="absolute top-1/6 right-1/6 w-28 h-28 bg-green-200/20 rounded-full animate-pulse" style={{ animationDelay: '3s', animationDuration: '4s' }} />
      </div>

      {/* עגלה ולב */}
      <div className="fixed bottom-24 right-4 z-50 sm:bottom-28 sm:right-6">
        <CartAndWishlistButtons />
      </div>

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

      {/* קטגוריות */}
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Card className="mb-8 bg-white/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              קטגוריות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* מובייל: Sheet */}
            <div className="sm:hidden">
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-2 mb-3">
                    <FilterIcon className="w-4 h-4" />
                    סנן לפי קטגוריה
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="max-h-[60vh] overflow-auto">
                  <SheetHeader>
                    <SheetTitle>בחר קטגוריות</SheetTitle>
                  </SheetHeader>
                  <Input
                    placeholder="חיפוש קטגוריה..."
                    className="mb-3 mt-2"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                  />
                  <div className="flex flex-wrap gap-2">
                    {filteredCategories.map(category => (
                      <Button
                        key={category}
                        variant={selectedCategories.includes(category) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(category)}
                        className="rounded-full font-semibold whitespace-nowrap"
                      >
                        {getCategoryIcon(category)}
                        {category}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedCategories([]); setCategorySearch(''); }}
                    className="mt-4 text-blue-600"
                  >
                    <X className="w-4 h-4 mr-2" />
                    נקה הכל
                  </Button>
                </SheetContent>
              </Sheet>
              {selectedCategories.length > 0 && (
                <div className="mt-2 text-sm text-blue-700 flex flex-wrap gap-2">
                  <b>נבחרו:</b>
                  {selectedCategories.map(cat => (
                    <span key={cat} className="bg-blue-100 rounded-full px-3 py-1">{cat}</span>
                  ))}
                </div>
              )}
            </div>

            {/* מחשב: גלילה חכמה עם חצים */}
            <div className="hidden sm:block">
              <div className="flex items-center gap-3 mb-3">
                <Input
                  placeholder="חפש קטגוריה..."
                  className="w-[240px]"
                  value={categorySearch}
                  onChange={e => setCategorySearch(e.target.value)}
                />
                {selectedCategories.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategories([])}
                    className="text-blue-600"
                  >
                    <X className="w-4 h-4 mr-1" />
                    נקה הכל
                  </Button>
                )}
              </div>
              <div className="relative">
                <div className="flex overflow-x-auto hide-scrollbar gap-2 py-2" ref={categoriesRowRef} tabIndex={0}>
                  {filteredCategories.map(category => (
                    <Button
                      key={category}
                      variant={selectedCategories.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleCategory(category)}
                      className={`
                        rounded-full font-semibold whitespace-nowrap flex items-center justify-center transition-all duration-200
                        ${selectedCategories.includes(category) ? "ring-2 ring-blue-500 bg-gradient-to-r from-blue-100 to-purple-100" : ""}
                      `}
                    >
                      {getCategoryIcon(category)}
                      {category}
                    </Button>
                  ))}
                </div>
                {/* חצים גלילה */}
                {filteredCategories.length > 6 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => scrollCategories('left')}
                      className="absolute right-[-16px] top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white/90 border z-20"
                      aria-label="הזז שמאלה"
                      style={{ direction: 'ltr' }}
                    >
                      <ArrowLeft />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => scrollCategories('right')}
                      className="absolute left-[-16px] top-1/2 -translate-y-1/2 rounded-full shadow-md bg-white/90 border z-20"
                      aria-label="הזז ימינה"
                      style={{ direction: 'ltr' }}
                    >
                      <ArrowRight />
                    </Button>
                  </>
                )}
              </div>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-7 lg:gap-9 justify-items-center animate-fadein-slow min-h-[370px]">
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
            <h3 className="text-xl font-semibold mb-2">אין מוצרים בקטגוריות אלו</h3>
            <p className="text-gray-600">נסה לבחור קטגוריה אחרת או נקה סינון</p>
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
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Store;
