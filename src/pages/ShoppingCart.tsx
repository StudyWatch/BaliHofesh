import React from 'react';
import { useCart } from '@/hooks/useCart';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ShoppingCart, Trash2, ArrowRight, ArrowLeft, CheckCircle, Info, Store
} from 'lucide-react';
import ProductCard from '@/components/ProductCard';

const ShoppingCartPage: React.FC = () => {
  const { cartItems, removeFromCart, clearCart } = useCart();
  const { language, dir } = useLanguage();
  const navigate = useNavigate();

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  const handleCheckout = () => {
    alert('בעתיד: כאן תועבר לתשלום מאובטח! 😃');
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative py-10 px-2 sm:px-6"
      dir={dir}
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 70% 30%, #b2fefa40 0%, transparent 80%),
          radial-gradient(circle at 10% 90%, #e0c3fc30 0%, transparent 80%)
        `,
        backgroundRepeat: "no-repeat"
      }}
    >
      {/* עיצוב רקע דינמי */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-10 top-20 w-40 h-40 bg-green-200/20 rounded-full blur-2xl animate-blob" />
        <div className="absolute right-10 bottom-20 w-56 h-56 bg-blue-200/20 rounded-full blur-2xl animate-blob2" />
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
          {cartItems.length > 0 && (
            <Button
              variant="outline"
              onClick={clearCart}
              className="flex items-center gap-2 border-green-400 text-green-600 hover:bg-green-50 hover:text-green-800 text-xs"
            >
              <Trash2 className="w-4 h-4" />
              נקה את כל העגלה
            </Button>
          )}
        </div>

        <Card className="bg-white/95 shadow-xl border border-gray-100 rounded-2xl p-1 sm:p-3 overflow-visible">
          <CardHeader className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-gray-800 tracking-tight">
              <ShoppingCart className="text-green-600 w-7 h-7 animate-bounce" />
              עגלת קניות
            </CardTitle>
            {cartItems.length > 0 && (
              <span className="text-sm text-gray-500">{cartItems.length} מוצרים</span>
            )}
          </CardHeader>

          <CardContent>
            {cartItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400 relative">
                <ShoppingCart className="mx-auto w-16 h-16 mb-6 text-green-200 animate-bounce" />
                <h3 className="text-xl font-semibold mb-2">העגלה שלך ריקה</h3>
                <p className="mb-6">לא נבחרו מוצרים. הוסף פריטים שתרצה לרכוש מהחנות</p>
                <Button
                  onClick={() => navigate('/store')}
                  variant="outline"
                  className="flex items-center gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <Store className="w-4 h-4" />
                  לדף החנות
                </Button>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4" />
                  טיפ: כל הפריטים בעגלה יישמרו גם לאחר רענון/יציאה מהאתר
                </div>
              </div>
            ) : (
              <>
                {/* גריד מרווח ואסתטי */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-7 gap-y-9 animate-fadein-slow">
                  {cartItems.map((product) => (
                    <div key={product.id} className="relative group">
                      <ProductCard
                        product={product}
                        onPurchase={() => window.open(product.link || '#', '_blank')}
                        onShare={() => navigator.clipboard.writeText(product.name_he)}
                        onAddToCart={() => removeFromCart(product.id)}
                        inCart
                      />
                      <button
                        className="absolute top-2 left-2 bg-white/90 hover:bg-white text-red-500 p-1 rounded-full shadow-md opacity-80 hover:opacity-100 transition
                                   hidden sm:inline-block group-hover:inline-block"
                        title="הסר מהעגלה"
                        onClick={() => removeFromCart(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* סיכום רכישה ופעולות */}
                <div className="mt-10 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 border-t pt-6 text-right">
                  <div>
                    <p className="text-xl font-bold text-gray-800">
                      סה"כ לתשלום: <span className="text-green-600">₪{totalPrice.toFixed(2)}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">כולל כל ההנחות במידה ויש</p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="text-sm border-green-400 text-green-600 hover:bg-green-50"
                      onClick={clearCart}
                    >
                      <Trash2 className="w-4 h-4 ml-1" />
                      נקה עגלה
                    </Button>
                    <Button
                      onClick={handleCheckout}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold shadow-md flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4 ml-1" />
                      המשך לרכישה
                    </Button>
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4" />
                  שים לב: תשלום יתבצע בעתיד דרך Stripe/Pelecard או קופה מאובטחת אחרת
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* אנימציות רקע */}
      <style>{`
        @keyframes blob {
          0%,100% { transform: scale(1) translateY(0);}
          33% { transform: scale(1.11,0.92) translateY(5px);}
          66% { transform: scale(0.96,1.15) translateY(-7px);}
        }
        .animate-blob { animation: blob 13s infinite linear alternate; }
        .animate-blob2 { animation: blob 22s infinite linear alternate; }
        @keyframes fadein-slow { from { opacity: 0; transform: translateY(32px);} to { opacity: 1; transform: none;} }
        .animate-fadein-slow { animation: fadein-slow 1.2s cubic-bezier(0.22,0.68,0.52,1.15); }
      `}</style>
    </div>
  );
};

export default ShoppingCartPage;
