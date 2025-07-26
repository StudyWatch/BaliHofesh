import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShoppingCart, ExternalLink, Share, Flame, Sparkles, Heart, HeartCrack, GraduationCap,
  Star, BookOpen, Laptop, Gift
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWishlist } from '@/hooks/useWishlist';

interface Product {
  id: string;
  name_he: string;
  name_en?: string;
  description_he?: string;
  description_en?: string;
  price?: number;
  original_price?: number;
  category?: string;
  tags?: string[];
  image_url?: string;
  link?: string;
  affiliate_link?: string;
  type: 'benefit' | 'product';
  is_subsidized?: boolean;
  is_popular?: boolean;
  is_new?: boolean;
  is_exclusive?: boolean;
  benefit_value?: number;
}

interface ProductCardProps {
  product: Product;
  onPurchase: (product: Product) => void;
  onShare: (product: Product) => void;
  onAddToCart?: (product: Product) => void;
  inCart?: boolean;
}

const categoryIcon = (category?: string) => {
  switch (category) {
    case 'software':
    case 'תוכנות': return <Laptop className="w-4 h-4 mr-1 text-blue-500" />;
    case 'books':
    case 'ספרים': return <BookOpen className="w-4 h-4 mr-1 text-purple-500" />;
    case 'courses':
    case 'קורסים': return <Star className="w-4 h-4 mr-1 text-yellow-500" />;
    case 'supplies':
    case 'ציוד לימודי': return <ShoppingCart className="w-4 h-4 mr-1 text-green-500" />;
    case 'benefit':
    case 'הטבה': return <Gift className="w-4 h-4 mr-1 text-pink-500" />;
    default: return null;
  }
};

const getTagColor = (tag: string) => {
  switch (tag) {
    case 'פופולרי': return 'bg-red-100 text-red-800';
    case 'חדש': return 'bg-green-100 text-green-800';
    case 'בלעדי לסטודנטים': return 'bg-purple-100 text-purple-800';
    case 'מומלץ': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

const ProductCard: React.FC<ProductCardProps> = ({
  product, onPurchase, onShare, onAddToCart, inCart
}) => {
  const { language } = useLanguage();
  const { isFavorite, toggleFavorite } = useWishlist();
  const isFav = isFavorite(product.id);

  const isBenefit = product.type === 'benefit';

  // true רק אם product.type === 'product' וגם יש מחיר > 0
  const showPrice = product.type === 'product' && typeof product.price === 'number' && product.price > 0;

  // עוזר גם אם price לא קיים בכלל או =0
  const isFreeOrBenefit =
    isBenefit ||
    !product.price ||
    Number(product.price) === 0;

  const benefitLabel = product.benefit_value
    ? `שווה עד ₪${product.benefit_value}`
    : (product.price && product.price > 0
      ? `שווה עד ₪${product.price}`
      : 'הטבה!');

  // כפתור עגלה/הפניה
  const actionButton = isBenefit || isFreeOrBenefit ? (
    <Button
      onClick={() => onPurchase(product)}
      size="sm"
      className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105"
    >
      <ExternalLink className="w-4 h-4 mr-2" />
      הפעל הטבה
    </Button>
  ) : (
    <Button
      onClick={onAddToCart ? () => onAddToCart(product) : () => onPurchase(product)}
      size="sm"
      className={`flex-1 ${inCart ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600'} text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:scale-105`}
      disabled={inCart}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      {inCart ? 'בעגלה' : 'הוסף לעגלה'}
    </Button>
  );

  return (
    <Card className="w-full h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border-2 hover:border-blue-300 bg-white/95 backdrop-blur-sm group cursor-pointer rounded-2xl">
      <CardContent className="p-5 h-full flex flex-col">
        {/* Image / Badge */}
        <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg mb-4 flex items-center justify-center relative overflow-hidden h-[130px] group-hover:shadow-lg transition-shadow duration-300">
          {product.image_url
            ? <img src={product.image_url} alt={product.name_he} className="w-full h-full object-contain rounded-lg" />
            : (
              isFreeOrBenefit
                ? <Gift className="w-10 h-10 text-pink-400 group-hover:text-pink-500 transition-colors duration-300" />
                : <ShoppingCart className="w-10 h-10 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
            )
          }
          {product.is_popular && (
            <div className="absolute top-2 right-2 animate-pulse z-10">
              <span title="פופולרי">
                <Flame className="w-5 h-5 text-red-500" />
              </span>
            </div>
          )}
          {product.is_new && (
            <div className="absolute top-2 left-2 animate-bounce z-10">
              <span title="חדש">
                <Sparkles className="w-5 h-5 text-green-500" />
              </span>
            </div>
          )}
          {isBenefit && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10">
              <Badge className="bg-purple-500 text-white text-xs px-2 py-1 flex gap-1">
                <GraduationCap className="w-4 h-4" /> סטודנטים בלבד
              </Badge>
            </div>
          )}
        </div>

        <div className="flex-1 flex flex-col">
          <div className="mb-3 flex flex-row items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors duration-300 mb-1">
                {language === 'he' ? product.name_he : (product.name_en || product.name_he)}
              </h3>
              <div className="flex items-center gap-2">
                {categoryIcon(product.category)}
                <span className="text-xs text-gray-500">{product.category}</span>
              </div>
            </div>
            <button
              className="ml-2 mt-1"
              aria-label={isFav ? 'הסר ממועדפים' : 'הוסף למועדפים'}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite({
                  id: product.id,
                  name_he: product.name_he,
                  name_en: product.name_en,
                  price: product.price,
                  category: product.category!,
                  image_url: product.image_url,
                  type: product.type,
                });
              }}
            >
              {isFav ? (
                <Heart className="w-5 h-5 text-red-500 fill-red-500 transition" />
              ) : (
                <HeartCrack className="w-5 h-5 text-gray-300 hover:text-red-400 transition" />
              )}
            </button>
          </div>
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {product.tags.slice(0, 3).map((tag, i) => (
                <Badge key={i} className={`${getTagColor(tag)} text-xs py-1 px-2 rounded-md`}>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          <p className="text-gray-600 text-xs md:text-sm line-clamp-3 mb-3 leading-relaxed">
            {language === 'he' ? product.description_he : (product.description_en || product.description_he)}
          </p>

          {/* מחיר/הטבה */}
          <div className="mb-3">
            {isFreeOrBenefit ? (
              <span className="text-base font-semibold text-blue-600 flex items-center gap-2">
                {benefitLabel}
              </span>
            ) : showPrice && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold text-green-600">
                  ₪{product.price}
                </span>
                {product.original_price && product.price && product.price > 0 && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      ₪{product.original_price}
                    </span>
                    <Badge variant="secondary" className="text-green-600 text-xs bg-green-50">
                      {Math.round((1 - (product.price / product.original_price)) * 100)}% חיסכון
                    </Badge>
                  </>
                )}
                {product.is_subsidized && (
                  <Badge className="bg-green-500 text-white text-xs px-2 py-1 ml-2">
                    מסובסד
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-auto">
            {actionButton}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onShare(product)}
              className="hover:bg-gray-50 px-3 transition-all duration-300 hover:scale-105"
              title="שיתוף"
            >
              <Share className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
