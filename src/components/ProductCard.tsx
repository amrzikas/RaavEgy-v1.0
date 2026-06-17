import React from 'react';
import { Eye, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { getProductPrice } from '../utils';

interface ProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
  isArabic: boolean;
  isFavorited?: boolean;
  onToggleFavorite?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetails,
  onQuickAddToCart,
  isArabic,
  isFavorited = false,
  onToggleFavorite
}) => {
  const { current, original, hasDiscount } = getProductPrice(product);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'men': return isArabic ? 'رجال' : 'Men';
      case 'women': return isArabic ? 'حريمي' : 'Women';
      case 'kids': return isArabic ? 'أطفال' : 'Kids';
      case 'accessories': return isArabic ? 'إكسسوارات' : 'Accessories';
      default: return cat;
    }
  };

  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-zinc-200 transition flex flex-col group h-full"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] bg-zinc-50 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(product)}>
        <img
          src={product.image}
          alt={isArabic ? product.nameAr : product.nameEn}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            // Fallback image in case the remote picture fails
            e.currentTarget.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=600";
          }}
        />

        {/* Favorite toggle button */}
        {onToggleFavorite && (
          <motion.button
            whileHover={{ scale: 1.12 }}
            whileTap={{ scale: 0.88 }}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(product);
            }}
            className={`absolute top-3 ${isArabic ? 'left-3' : 'right-3'} z-10 p-2 rounded-full backdrop-blur-md transition-all shadow-sm border cursor-pointer ${
              isFavorited 
                ? 'bg-rose-50 text-rose-500 border-rose-200' 
                : 'bg-white/90 text-zinc-400 border-zinc-100 hover:text-rose-500 font-bold'
            }`}
            title={isArabic ? "أضف للمفضلة" : "Toggle Favorite"}
          >
            <Heart size={15} fill={isFavorited ? "currentColor" : "none"} strokeWidth={2.5} />
          </motion.button>
        )}

        {/* Category sticker */}
        <span className={`absolute top-3 ${isArabic ? 'right-3' : 'left-3'} bg-white/95 backdrop-blur-md text-zinc-900 border border-zinc-100 text-[9px] font-bold px-3 py-1.5 rounded-full font-sans uppercase tracking-widest shadow-sm`}>
          {getCategoryLabel(product.category)}
        </span>

        {/* Stock sticker */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
            <span className="text-red-700 bg-red-50 border border-red-100 text-xs font-semibold tracking-widest uppercase px-4 py-2 rounded-md font-sans shadow-sm">
              {isArabic ? "نفد من المخزن" : "OUT OF STOCK"}
            </span>
          </div>
        )}

        {/* Action icons appearing on hover over the image */}
        {product.inStock && (
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(product);
              }}
              className="p-3 bg-white text-zinc-900 rounded-full hover:bg-black hover:text-white shadow-md transition duration-200 cursor-pointer border border-zinc-100"
              title={isArabic ? "تفاصيل سريعة" : "View Details"}
            >
              <Eye size={17} strokeWidth={2} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddToCart(product);
              }}
              className="p-3 bg-black text-white rounded-full hover:bg-white hover:text-black hover:border-zinc-200 shadow-md transition duration-200 cursor-pointer border border-transparent"
              title={isArabic ? "أضف للسلة سريعاً" : "Quick Add to Cart"}
            >
              <ShoppingCart size={17} strokeWidth={2} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Info card body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
        <h3 className="text-zinc-900 font-serif font-medium text-base tracking-tight mb-1.5 cursor-pointer line-clamp-1 hover:text-amber-800 transition" onClick={() => onOpenDetails(product)}>
          {isArabic ? product.nameAr : product.nameEn}
        </h3>
        
        <p className="text-zinc-500 text-xs mb-4 line-clamp-2 h-8 leading-relaxed font-sans font-light">
          {isArabic ? product.descriptionAr : product.descriptionEn}
        </p>

        {/* Pricing & Cart controls */}
        <div className="mt-auto pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
          <div className="flex flex-col">
            {hasDiscount && (
              <span className="text-zinc-400 line-through text-[11px] sm:text-xs font-serif leading-none mb-1">
                {original} {isArabic ? 'ج.م' : 'EGP'}
              </span>
            )}
            <div>
              <span className={hasDiscount ? "text-red-600 font-bold text-base sm:text-lg font-serif" : "text-zinc-900 font-bold text-base sm:text-lg font-serif"}>
                {current} 
              </span>
              <span className="text-xs text-zinc-500 font-sans ml-1 mr-1">
                {isArabic ? 'ج.م' : 'EGP'}
              </span>
              {hasDiscount && (
                <span className="inline-block bg-red-50 text-red-600 text-[9px] px-1 py-0.5 rounded font-bold uppercase shrink-0 select-none align-middle ml-1 mr-1">
                  {isArabic ? 'خصم' : 'Sale'}
                </span>
              )}
            </div>
          </div>

          {product.inStock ? (
            <button
              onClick={() => onOpenDetails(product)}
              className="px-3.5 py-1.5 bg-zinc-950 hover:bg-amber-800 text-white rounded-full text-xs font-medium transition cursor-pointer font-sans"
            >
              <span>{isArabic ? "شراء" : "Select"}</span>
            </button>
          ) : (
            <span className="text-[10px] text-zinc-400 font-sans italic">
              {isArabic ? "غير متوفر" : "Unavailable"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
