import React from 'react';
import { useWishlist } from '@/hooks/useWishlist';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Heart, ShoppingCart, Trash2, ArrowRight, ArrowLeft, Info, PlusCircle
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const WishlistPage: React.FC = () => {
  const { wishlist, removeFromWishlist, clearWishlist } = useWishlist();
  const { language, dir } = useLanguage();
  const navigate = useNavigate();

  const handleShare = (product: any) => {
    if (navigator.share) {
      navigator.share({
        title: product.name_he,
        text: product.description_he,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(`${product.name_he} - ${window.location.href}`);
      alert('הקישור הועתק!');
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-tr from-pink-50 via-white to-blue-50 relative py-10 px-2 sm:px-6"
      dir={dir}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 60% 40%, #fbc2eb80 0%, transparent 80%),
          radial-gradient(circle at 20% 80%, #a1c4fd30 0%, transparent 70%)
        `,
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* רקע דינמי */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-10 top-20 w-40 h-40 bg-pink-200/20 rounded-full blur-2xl animate-blob" />
        <div className="absolute right-10 bottom-20 w-52 h-52 bg-blue-200/20 rounded-full blur-2xl animate-blob2" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/store')}
            className="flex items-center gap-2 text-blue-600 hover:underline"
          >
            {dir === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            חזרה לחנות
          </Button>
          {wishlist.length > 0 && (
            <Button
              variant="outline"
              onClick={clearWishlist}
              className="flex items-center gap-2 border-pink-400 text-pink-600 hover:bg-pink-50 hover:text-pink-800 text-xs"
            >
              <Trash2 className="w-4 h-4" />
              נקה את כל הרשימה
            </Button>
          )}
        </div>

        <Card className="bg-white/95 shadow-xl border border-gray-100 rounded-2xl p-1 sm:p-3 overflow-visible">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800 tracking-tight">
              <Heart className="text-pink-500 w-7 h-7 animate-pulse" />
              שמורים שלי
            </CardTitle>
            {wishlist.length > 0 && (
              <span className="text-sm text-gray-500">{wishlist.length} פריטים</span>
            )}
          </CardHeader>

          <CardContent>
            {wishlist.length === 0 ? (
              <div className="text-center py-16 text-gray-400 relative">
                <Heart className="mx-auto w-16 h-16 mb-5 text-pink-300 animate-pulse" />
                <h3 className="text-xl font-semibold mb-2">הרשימה שלך ריקה</h3>
                <p className="mb-6">התחל לשמור קורסים, הטבות ומוצרים מהחנות – הכל במקום אחד ❤️</p>
                <Button
                  onClick={() => navigate('/store')}
                  variant="outline"
                  className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <PlusCircle className="w-4 h-4" />
                  לדף החנות
                </Button>
                <div className="mt-7 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4" />
                  טיפ: שמור הטבות כדי שלא תפספס אף הנחה שווה!
                </div>
              </div>
            ) : (
              <>
                {/* גריד מודרני ומרווח – תומך בגובה שונה (Masonry look) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-9 animate-fadein-slow">
                  {wishlist.map((product, index) => (
                    <div key={product.id} className="relative group">
                      <ProductCard
                        product={product}
                        onPurchase={() => window.open(product.link || '#', '_blank')}
                        onShare={() => handleShare(product)}
                        // אפשרות להסרה ע"י לב – או כפתור פח
                        onToggleFavorite={() => removeFromWishlist(product.id)}
                      />
                      {/* מחיקה ב-hover בלבד – רק בדסקטופ */}
                      <button
                        className="absolute top-2 left-2 bg-white/90 hover:bg-white text-red-500 p-1 rounded-full shadow-md opacity-80 hover:opacity-100 transition
                                   hidden sm:inline-block group-hover:inline-block"
                        title="הסר מרשימה"
                        onClick={() => removeFromWishlist(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                {/* בלוק מידע נוסף – טיפ שימושי */}
                <div className="mt-10 text-center text-gray-400 flex flex-col items-center">
                  <div className="flex items-center gap-2 justify-center mb-2">
                    <Info className="w-4 h-4" />
                    <span>ניתן לשתף כל מוצר, להסיר או לחזור לחנות להוסיף עוד פריטים</span>
                  </div>
                  <div className="text-xs text-gray-400">הרשימה נשמרת אוטומטית בדפדפן ותישאר גם לאחר רענון/יציאה מהאתר</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* אנימציות רקע CSS */}
      <style>{`
        @keyframes blob {
          0%,100% { transform: scale(1) translateY(0);}
          33% { transform: scale(1.15,0.85) translateY(5px);}
          66% { transform: scale(0.95,1.15) translateY(-7px);}
        }
        .animate-blob { animation: blob 16s infinite linear alternate; }
        .animate-blob2 { animation: blob 22s infinite linear alternate; }
        @keyframes fadein-slow { from { opacity: 0; transform: translateY(30px);} to { opacity: 1; transform: none;} }
        .animate-fadein-slow { animation: fadein-slow 1.5s cubic-bezier(0.22,0.68,0.52,1.15); }
      `}</style>
    </div>
  );
};

export default WishlistPage;
