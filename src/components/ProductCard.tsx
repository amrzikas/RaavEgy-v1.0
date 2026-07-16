import React from 'react';
import { Eye, ShoppingCart, Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';
import { getProductPrice } from '../utils';
import { optimizeUnsplashUrl } from '../utils/imageOptimizer';

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

  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (product.image) list.push(product.image);
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && img !== product.image) {
          list.push(img);
        }
      });
    }
    return list;
  }, [product.image, product.images]);

  const [hoverIndex, setHoverIndex] = React.useState(0);
  const [isHovered, setIsHovered] = React.useState(false);

  React.useEffect(() => {
    if (!isHovered || allImages.length <= 1) {
      setHoverIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setHoverIndex((prev) => (prev + 1) % allImages.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [isHovered, allImages]);

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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-zinc-200 transition flex flex-col group h-full"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-[4/5] bg-zinc-50 overflow-hidden cursor-pointer" onClick={() => onOpenDetails(product)}>
        <img
          src={optimizeUnsplashUrl(allImages[hoverIndex] || product.image, 450, 70)}
          alt={isArabic ? product.nameAr : product.nameEn}
          key={hoverIndex}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          onError={(e) => {
            // Fallback image in case the remote picture fails
            e.currentTarget.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=70&w=450";
          }}
        />

        {/* Hover image pagination indicators */}
        {allImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 backdrop-blur-md py-1 px-2.5 rounded-full transition-opacity duration-300 opacity-0 group-hover:opacity-100">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  hoverIndex === idx ? 'w-3 bg-white' : 'w-1.5 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}

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
        <h3 className="text-zinc-950 font-serif font-bold text-xs sm:text-sm tracking-tight mb-1.5 cursor-pointer hover:text-amber-800 transition break-words" onClick={() => onOpenDetails(product)}>
          {isArabic ? product.nameAr : product.nameEn}
        </h3>
        
        <p className="text-zinc-500 text-xs mb-4 line-clamp-2 h-8 leading-relaxed font-sans font-light">
          {isArabic ? product.descriptionAr : product.descriptionEn}
        </p>

        {/* Pricing & Cart controls */}
        <div className="mt-auto pt-3 border-t border-zinc-150/60 grid grid-cols-3 items-center w-full gap-1.5" dir="ltr">
          {/* Left Visual side: Original line-through price on discount, or a luxury seal label */}
          <div className="flex justify-start items-center">
            {hasDiscount ? (
              <span className="text-red-650 line-through text-[9px] xs:text-[10px] sm:text-[11px] font-sans font-bold leading-none block">
                {original} {isArabic ? 'ج' : 'EGP'}
              </span>
            ) : (
              <span className="text-[8px] xs:text-[9.5px] sm:text-[10.5px] text-zinc-400 font-sans tracking-tight uppercase leading-none font-bold">
                {isArabic ? "سوليد" : "Elite"}
              </span>
            )}
          </div>

          {/* Center Visual side: The actual Price centered in a prominent high-contrast solid badge */}
          <div className="flex justify-center items-center">
            <div className="inline-flex items-center gap-0.5 bg-amber-500 text-zinc-950 border border-amber-450 rounded-full py-1 px-2.5 sm:px-3 text-[10.5px] xs:text-[11.5px] sm:text-xs font-black shadow-xs font-sans whitespace-nowrap">
              <span>{current}</span>
              <span className="text-[7.5px] xs:text-[8.5px] sm:text-[9px] uppercase font-black text-zinc-900/90 ml-0.5">{isArabic ? 'ج.م' : 'EGP'}</span>
            </div>
          </div>

          {/* Right Visual side: High-contrast BUY action badge */}
          <div className="flex justify-end items-center">
            {product.inStock ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(product);
                }}
                className="bg-zinc-950 hover:bg-amber-600 text-white rounded-full py-1 px-3 sm:py-1.5 sm:px-4.5 text-[9px] xs:text-[10.5px] sm:text-[11.5px] font-black uppercase tracking-wider transition-all duration-200 shadow-xs border border-zinc-900 hover:scale-105 active:scale-95 cursor-pointer shrink-0"
              >
                {isArabic ? "شراء" : "BUY"}
              </button>
            ) : (
              <span className="text-[8px] xs:text-[9.5px] sm:text-[10.5px] text-zinc-450 bg-zinc-100 border border-zinc-200 rounded-md px-1.5 py-0.5 font-bold italic shrink-0">
                {isArabic ? "نفد" : "Out"}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
