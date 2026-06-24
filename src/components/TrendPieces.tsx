import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, ShoppingCart, ChevronUp, ChevronDown } from 'lucide-react';
import { Product, SectionBackdrop } from '../types';
import { getProductPrice } from '../utils';
import { optimizeUnsplashUrl } from '../utils/imageOptimizer';

interface TrendPiecesProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  onQuickAddToCart: (product: Product) => void;
  backdrop?: SectionBackdrop;
}

export default function TrendPieces({
  products,
  onSelectProduct,
  isArabic,
  onQuickAddToCart,
  backdrop
}: TrendPiecesProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Helper to scroll the vertical side panel up
  const scrollUp = () => {
    if (scrollContainerRef.current) {
      const parentHeight = scrollContainerRef.current.clientHeight;
      // Scroll by roughly 1 card height
      scrollContainerRef.current.scrollBy({ top: -parentHeight / 2, behavior: 'smooth' });
    }
  };

  // Helper to scroll the vertical side panel down
  const scrollDown = () => {
    if (scrollContainerRef.current) {
      const parentHeight = scrollContainerRef.current.clientHeight;
      // Scroll by roughly 1 card height
      scrollContainerRef.current.scrollBy({ top: parentHeight / 2, behavior: 'smooth' });
    }
  };

  // Select designated trending items or fall back
  const getTrendProducts = () => {
    if (products.length === 0) return { hero: null, side: [] };
    
    // 1. Gather products designated as trending
    const designatedTrends = products.filter(p => p.isTrend === true);
    
    let hero: Product | null = null;
    let side: Product[] = [];
    
    if (designatedTrends.length > 0) {
      hero = designatedTrends[0];
      side = designatedTrends.slice(1);
    } else {
      // Fallback if none are designated:
      hero = products.find(p => p.category === 'women' && p.inStock) || products[0] || null;
      side = products.filter(p => hero ? p.id !== hero.id : true);
    }
    
    // Ensure we have a generous amount of side products for an elegant scrolling effect
    if (side.length < 5) {
      const extra = products.filter(p => p.id !== hero?.id && !side.find(s => s.id === p.id));
      side = [...side, ...extra];
    }
    
    // De-duplicate side list and exclude hero
    const seenIds = new Set<string>();
    if (hero) seenIds.add(hero.id);
    const uniqueSide: Product[] = [];
    for (const p of side) {
      if (!seenIds.has(p.id)) {
        seenIds.add(p.id);
        uniqueSide.push(p);
      }
    }
    
    return { hero, side: uniqueSide };
  };

  const { hero, side: sideProducts } = getTrendProducts();

  if (!hero) return null;

  const isLightText = backdrop ? backdrop.textColor === 'light' : true; // Default to white text on dark bg

  const customStyle: React.CSSProperties = backdrop ? {
    background: backdrop.type === 'solid'
      ? (backdrop.solidColor || '#252622')
      : `linear-gradient(${
          backdrop.gradientDirection === 'to-r' ? 'to right' :
          backdrop.gradientDirection === 'to-tr' ? 'to top right' :
          backdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
        }, ${backdrop.gradientFrom || '#252622'}, ${backdrop.gradientTo || '#2d2e28'})`
  } : {};

  return (
    <section 
      id="trend-pieces-section" 
      style={customStyle}
      className={`${backdrop ? '' : 'bg-gradient-to-b from-[#252622] to-[#2d2e28]'} py-10 sm:py-16 md:py-24 border-b border-[#2d2e28] select-none ${isLightText ? 'text-white' : 'text-zinc-900'}`}
    >
      <div className="max-w-7xl mx-auto px-2 xs:px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-16 gap-4 sm:gap-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[9px] sm:text-[11px] font-bold tracking-[0.25em] uppercase mb-2 sm:mb-4">
              <Sparkles size={11} className="text-amber-400 animate-pulse" />
              <span>{isArabic ? "موضة الموسم العصري" : "SEASON'S HOTTEST TRENDS"}</span>
            </span>
            <h2 className={`text-2xl xs:text-3xl md:text-5xl font-serif font-light tracking-tight leading-tight ${isLightText ? 'text-white' : 'text-zinc-950'}`}>
              {isArabic ? "قطع الموضة الأكثر تأثيراً" : "The Trend Pieces"}
            </h2>
            <p className={`text-[10px] xs:text-xs mt-2 max-w-lg font-sans leading-relaxed ${isLightText ? 'text-zinc-300' : 'text-zinc-650'}`}>
              {isArabic 
                ? "مختارات حصرية صُممت لتلائم طابع الحياة الراقية وتتميز بتفاصيل ممنوحة خيار تصفح منتجات إضافية مدهشة عبر شريط التمرير." 
                : "A boundary-pushing curation reflecting future street style. Explore additional trend items using our dynamic vertical scroll."}
            </p>
          </div>

          <div className={`hidden md:flex items-center gap-2 text-[11px] font-mono tracking-widest uppercase ${isLightText ? 'text-zinc-400' : 'text-zinc-550'}`}>
            <span>RAAV // COUTURE</span>
          </div>
        </div>

        {/* Avant-Garde Asymmetric Collage/Layout */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 md:gap-8 items-stretch" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          
          {/* Trend Item 1: Massive Hero Split Portrait (Columns 1-7) */}
          <div className="col-span-7 flex flex-col justify-between">
            <motion.div
              whileHover="hover"
              initial="initial"
              className="relative h-[220px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[620px] rounded-xl sm:rounded-[2.5rem] overflow-hidden bg-zinc-900 group shadow-xl flex flex-col justify-end"
            >
              {/* Image layer */}
              <motion.img
                src={hero.image}
                alt={isArabic ? hero.nameAr : hero.nameEn}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover origin-center opacity-90 transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000";
                }}
              />
              
              {/* Premium Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-300 group-hover:bg-gradient-to-t group-hover:from-black/90 group-hover:via-black/50" />

              {/* Aesthetic Top Left Numbering */}
              <div className="absolute top-1.5 left-1.5 xs:top-3 xs:left-3 sm:top-8 sm:left-8 text-white/10 font-serif text-[18px] xs:text-2xl sm:text-[4.5rem] font-black leading-none pointer-events-none select-none">
                01
              </div>

              {/* Tag Sticker */}
              <div className="absolute top-1.5 right-1.5 xs:top-3 xs:right-3 sm:top-8 sm:right-8 bg-amber-500/90 text-white backdrop-blur-md border border-amber-500/30 font-semibold px-1.5 sm:px-4 py-0.5 sm:py-1.5 rounded-full text-[5px] xs:text-[7px] sm:text-[10px] tracking-widest uppercase font-sans">
                {isArabic ? "قطعة مميزة" : "MUST-HAVE"}
              </div>

              {/* Text Content Overlay card (floating and stylish) */}
              <div className="relative z-10 p-2 xs:p-3 sm:p-8 lg:p-10 text-white flex flex-col items-start gap-1 sm:gap-4">
                <div className="space-y-0.5 sm:space-y-2 text-left w-full" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                  <h3 className="text-[10px] xs:text-base sm:text-2xl md:text-3xl font-serif font-medium text-white tracking-tight leading-tight group-hover:text-amber-300 transition line-clamp-1">
                    {isArabic ? hero.nameAr : hero.nameEn}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`text-[8px] xs:text-[10px] font-mono px-2 py-0.5 rounded-full ${hero.quantity && hero.quantity > 0 ? (hero.quantity <= 5 ? 'bg-rose-500/30 text-rose-300 font-bold' : 'bg-white/10 text-zinc-300') : 'bg-red-500/30 text-red-300 font-bold'}`}>
                      {isArabic ? `المخزون المتوفر: ${hero.quantity !== undefined ? hero.quantity : 100}` : `Stock Available: ${hero.quantity !== undefined ? hero.quantity : 100}`}
                    </span>
                  </div>
                  <p className="hidden sm:block text-zinc-350 text-xs sm:text-sm max-w-xl font-sans font-light leading-relaxed line-clamp-2 mt-1">
                    {isArabic ? hero.descriptionAr : hero.descriptionEn}
                  </p>
                </div>

                {(() => {
                  const priceInfo = getProductPrice(hero);
                  return (
                    <div className="w-full pt-1.5 sm:pt-4 border-t border-white/15 flex items-center justify-between gap-1 sm:gap-4">
                      <div className="flex flex-col text-left" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                        {priceInfo.hasDiscount && (
                          <span className="text-zinc-400 line-through text-[6px] xs:text-[9px] sm:text-[11px] font-serif leading-none mb-0.5">
                            {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                          </span>
                        )}
                        <div className="flex items-baseline gap-0.5 sm:gap-1.5">
                          <span className={priceInfo.hasDiscount ? "text-[9px] xs:text-base sm:text-2xl font-serif font-black text-amber-400" : "text-[9px] xs:text-base sm:text-2xl font-serif font-medium text-white"}>
                            {priceInfo.current}
                          </span>
                          <span className="text-[5px] xs:text-[9px] sm:text-xs text-zinc-350 font-sans">{isArabic ? 'ج.م' : 'EGP'}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-0.5 sm:gap-3">
                        <button
                          onClick={() => onSelectProduct(hero)}
                          className="px-1.5 py-1 xs:px-3 xs:py-1.5 sm:px-5 sm:py-2.5 bg-white hover:bg-amber-100 text-zinc-950 rounded-md sm:rounded-full text-[6px] xs:text-[10px] sm:text-xs font-semibold tracking-wider transition cursor-pointer font-sans shadow hover:scale-105"
                        >
                          {isArabic ? "اكتشف" : "EXPLORE"}
                        </button>
                        <button
                          onClick={() => onQuickAddToCart(hero)}
                          className="p-1 xs:p-2 sm:p-2.5 bg-white/10 hover:bg-white hover:text-black text-white rounded-md sm:rounded-full transition cursor-pointer border border-white/20 flex items-center justify-center"
                          title={isArabic ? "إضافة سريعة للسلة" : "Quick Add"}
                        >
                          <ShoppingCart className="w-2.5 h-2.5 sm:w-[15px] sm:h-[15px]" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

            </motion.div>
          </div>

          {/* Trend Items: Custom Scrollable Vertical Panel (Columns 8-12) */}
          <div className="col-span-5 relative flex flex-col pt-5 pb-5 group/scrollbar h-[220px] xs:h-[300px] sm:h-[400px] md:h-[500px] lg:h-[620px]">
            
            {/* Scroll Up Control */}
            {sideProducts.length > 2 && (
              <button 
                onClick={scrollUp}
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 w-7 h-7 md:w-11 md:h-11 bg-amber-400 hover:bg-amber-500 hover:scale-105 active:scale-95 text-zinc-950 rounded-full shadow-lg border border-zinc-900/10 transition duration-300 cursor-pointer flex items-center justify-center"
                title={isArabic ? "تمرير للأعلى" : "Scroll Up"}
              >
                <ChevronUp className="w-4 h-4 md:w-6 md:h-6 stroke-[3]" />
              </button>
            )}

            {/* Scroll Container */}
            <div 
              ref={scrollContainerRef}
              className="w-full h-full overflow-y-auto scrollbar-none flex flex-col gap-1.5 xs:gap-3.5 sm:gap-5 py-2 scroll-smooth snap-y snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {sideProducts.map((product, idx) => {
                const itemNum = idx + 2;
                const paddedNum = String(itemNum).padStart(2, '0');
                const isEven = idx % 2 === 0;

                return (
                  <div 
                    key={product.id}
                    className="flex-none snap-start h-[105px] xs:h-[145px] sm:h-[195px] md:h-[235px] lg:h-[298px]"
                  >
                    <motion.div
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.3 }}
                      className={`h-full border rounded-lg sm:rounded-[2rem] p-1.5 xs:p-3.5 sm:p-5 lg:p-7 flex flex-col justify-between shadow-xs sm:shadow-md relative overflow-hidden group/item select-none transition-colors ${
                        isEven 
                          ? "bg-white border-zinc-150/40 text-zinc-950" 
                          : "bg-zinc-950 border-zinc-900 text-white"
                      }`}
                    >
                      {/* Substantial decorative background index number */}
                      <div className={`absolute right-1 top-0 sm:right-6 sm:top-3 font-serif text-[18px] xs:text-3xl sm:text-[3.5rem] lg:text-[4.5rem] font-bold leading-none pointer-events-none select-none transition-opacity ${
                        isEven ? "text-zinc-100/75" : "text-zinc-900/55"
                      }`}>
                        {paddedNum}
                      </div>

                      <div className="flex gap-1 xs:gap-2.5 sm:gap-5 h-full items-stretch relative z-10" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        
                        {/* Info Column */}
                        <div className="flex-1 flex flex-col justify-between py-0.5 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                          <div className="space-y-0.5 sm:space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[4px] xs:text-[7px] sm:text-[9px] font-sans font-bold tracking-wider uppercase block ${
                                isEven ? "text-amber-805" : "text-amber-400"
                              }`}>
                                {isArabic ? "تنسيق مذهل" : "TREND ELEMENT"}
                              </span>
                              <span className={`text-[6px] xs:text-[8px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full ${
                                product.quantity && product.quantity > 0 
                                  ? (product.quantity <= 5 ? 'bg-rose-500/20 text-rose-300 font-bold' : (isEven ? 'bg-zinc-200 text-zinc-600' : 'bg-white/10 text-zinc-300')) 
                                  : 'bg-red-500/20 text-red-300 font-bold'
                              }`}>
                                {isArabic ? `المخزون: ${product.quantity !== undefined ? product.quantity : 100}` : `Stock: ${product.quantity !== undefined ? product.quantity : 100}`}
                              </span>
                            </div>
                            <h3 
                              onClick={() => onSelectProduct(product)}
                              className={`text-[9px] xs:text-xs sm:text-base lg:text-lg font-serif font-semibold tracking-tight leading-snug cursor-pointer transition line-clamp-1 ${
                                isEven ? "text-zinc-950 hover:text-amber-805" : "text-white hover:text-amber-400"
                              }`}
                            >
                              {isArabic ? product.nameAr : product.nameEn}
                            </h3>
                            <p className={`hidden sm:block text-[11px] leading-relaxed font-sans line-clamp-2 ${
                              isEven ? "text-zinc-400" : "text-zinc-350"
                            }`}>
                              {isArabic ? product.descriptionAr : product.descriptionEn}
                            </p>
                          </div>

                          <div className={`flex items-center justify-between pt-1 sm:pt-2 border-t gap-0.5 sm:gap-2 ${
                            isEven ? "border-zinc-100" : "border-zinc-850"
                          }`}>
                            {(() => {
                              const priceInfo = getProductPrice(product);
                              return (
                                <div className="flex flex-col text-right animate-fade-in" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                  {priceInfo.hasDiscount && (
                                    <span className="text-zinc-450 line-through text-[5px] xs:text-[8px] sm:text-[10px] font-serif leading-none mb-0.5">
                                      {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                                    </span>
                                  )}
                                  <div className="flex items-baseline gap-0.5">
                                    <span className={`font-serif font-extrabold text-[8px] xs:text-sm sm:text-lg ${
                                      priceInfo.hasDiscount 
                                        ? (isEven ? "text-amber-805" : "text-amber-300") 
                                        : (isEven ? "text-zinc-950" : "text-amber-400")
                                    }`}>
                                      {priceInfo.current}
                                    </span>
                                    <span className={`text-[5px] xs:text-[8px] sm:text-[10px] font-sans ml-0.5 mr-0.5 ${
                                      isEven ? "text-zinc-500" : "text-zinc-400"
                                    }`}>{isArabic ? 'ج.م' : 'EGP'}</span>
                                  </div>
                                </div>
                              );
                            })()}
                            
                            <div className="flex items-center gap-0.5 sm:gap-1">
                              <button
                                onClick={() => onSelectProduct(product)}
                                className={`p-0.5 xs:p-1.5 sm:p-2.5 rounded-md sm:rounded-full transition cursor-pointer flex items-center justify-center shrink-0 ${
                                  isEven ? "bg-zinc-950 text-white hover:bg-amber-805" : "bg-amber-500 text-black hover:bg-amber-400 border-none"
                                }`}
                                title={isArabic ? "عرض التفاصيل" : "View Details"}
                              >
                                <Eye className="w-2.5 h-2.5 sm:w-[14px] sm:h-[14px]" />
                              </button>
                              <button
                                onClick={() => onQuickAddToCart(product)}
                                className={`p-0.5 xs:p-1.5 sm:p-2.5 rounded-md sm:rounded-full transition cursor-pointer flex items-center justify-center shrink-0 ${
                                  isEven ? "bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-200" : "bg-white/10 hover:bg-white hover:text-black text-white border border-white/15"
                                }`}
                                title={isArabic ? "إشارة سريعة" : "Quick Add"}
                              >
                                <ShoppingCart className="w-2.5 h-2.5 sm:w-[14px] sm:h-[14px]" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Side Thumbnail Image Clip */}
                        <div 
                          className="w-10 xs:w-16 sm:w-24 lg:w-32 aspect-[3/4] bg-zinc-50 rounded-md sm:rounded-2xl overflow-hidden shadow-xs cursor-pointer select-none shrink-0" 
                          onClick={() => onSelectProduct(product)}
                        >
                          <img
                            src={optimizeUnsplashUrl(product.image, 200, 65)}
                            alt={isArabic ? product.nameAr : product.nameEn}
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/item:scale-110"
                            onError={(e) => {
                              e.currentTarget.src = isEven 
                                ? "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=65&w=200" 
                                : "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=65&w=200";
                            }}
                          />
                        </div>

                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>

            {/* Scroll Down Control */}
            {sideProducts.length > 2 && (
              <button 
                onClick={scrollDown}
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-30 w-7 h-7 md:w-11 md:h-11 bg-amber-400 hover:bg-amber-500 hover:scale-105 active:scale-95 text-zinc-950 rounded-full shadow-lg border border-zinc-900/10 transition duration-300 cursor-pointer flex items-center justify-center"
                title={isArabic ? "تمرير لأسفل" : "Scroll Down"}
              >
                <ChevronDown className="w-4 h-4 md:w-6 md:h-6 stroke-[3]" />
              </button>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
