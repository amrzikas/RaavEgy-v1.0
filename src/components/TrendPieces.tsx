import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Product } from '../types';
import { getProductPrice } from '../utils';

interface TrendPiecesProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  onQuickAddToCart: (product: Product) => void;
}

export default function TrendPieces({
  products,
  onSelectProduct,
  isArabic,
  onQuickAddToCart
}: TrendPiecesProps) {
  // Select designated trending items or fall back
  const getTrendProducts = () => {
    if (products.length === 0) return [];
    
    // 1. Gather products designated as trending by the administrator
    const designatedTrends = products.filter(p => p.isTrend === true);
    if (designatedTrends.length > 0) {
      return designatedTrends.slice(0, 3);
    }
    
    // Fallback if none are designated:
    const womenItem = products.find(p => p.category === 'women' && p.inStock) || products[0];
    const accItem = products.find(p => p.category === 'accessories' && p.inStock && p.id !== womenItem?.id) || products[1];
    const menItem = products.find(p => p.category === 'men' && p.inStock && p.id !== womenItem?.id && p.id !== accItem?.id) || products[2];

    const finalItems = [womenItem, accItem, menItem].filter(Boolean) as Product[];
    return finalItems.slice(0, 3);
  };

  const trendItems = getTrendProducts();

  if (trendItems.length === 0) return null;

  return (
    <section id="trend-pieces-section" className="bg-zinc-50/50 py-16 md:py-24 border-b border-zinc-100 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 sm:mb-16 gap-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 rounded-full text-amber-900 text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
              <Sparkles size={11} className="text-amber-800" />
              <span>{isArabic ? "موضة الموسم العصري" : "SEASON'S HOTTEST TRENDS"}</span>
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
              {isArabic ? "قطع الموضة الأكثر تأثيراً" : "The Trend Pieces"}
            </h2>
            <p className="text-xs text-zinc-400 mt-2 max-w-lg font-sans leading-relaxed">
              {isArabic 
                ? "مختارات حصرية صُممت لتلائم طابع الحياة الراقية وتتميز بتفاصيل تمنحك إطلالة فريدة." 
                : "A boundary-pushing curation reflecting future street style and structural elegance."}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2 text-zinc-350 text-[11px] font-mono tracking-widest uppercase">
            <span>RAAV // COUTURE</span>
          </div>
        </div>

        {/* Avant-Garde Asymmetric Collage/Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          
          {/* Trend Item 1: Massive Hero Split Portrait (Columns 1-7) */}
          {trendItems[0] && (
            <div className="lg:col-span-7 flex flex-col justify-between">
              <motion.div
                whileHover="hover"
                initial="initial"
                className="relative h-[480px] sm:h-[550px] lg:h-[620px] rounded-[2.5rem] overflow-hidden bg-zinc-900 group shadow-xl flex flex-col justify-end"
              >
                {/* Image layer */}
                <motion.img
                  src={trendItems[0].image}
                  alt={isArabic ? trendItems[0].nameAr : trendItems[0].nameEn}
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover origin-center opacity-90 transition-transform duration-1000 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000";
                  }}
                />
                
                {/* Premium Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10 transition-opacity duration-300 group-hover:bg-gradient-to-t group-hover:from-black/90 group-hover:via-black/50" />

                {/* Aesthetic Top Left Numbering */}
                <div className="absolute top-8 left-8 text-white/10 font-serif text-[4.5rem] font-black leading-none pointer-events-none select-none">
                  01
                </div>

                {/* Arabic/English Sticker */}
                <div className="absolute top-8 right-8 bg-amber-550/90 text-white backdrop-blur-md border border-amber-500/30 font-semibold px-4 py-1.5 rounded-full text-[10px] tracking-widest uppercase font-sans">
                  {isArabic ? "قطعة مميزة" : "MUST-HAVE"}
                </div>

                {/* Text Content Overlay card (floating and stylish) */}
                <div className="relative z-10 p-8 sm:p-10 text-white flex flex-col items-start gap-4">
                  <div className="space-y-2 text-left" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <h3 className="text-2xl sm:text-3xl font-serif font-medium text-white tracking-tight leading-tight group-hover:text-amber-350 transition">
                      {isArabic ? trendItems[0].nameAr : trendItems[0].nameEn}
                    </h3>
                    <p className="text-zinc-300 text-xs sm:text-sm max-w-xl font-sans font-light leading-relaxed">
                      {isArabic ? trendItems[0].descriptionAr : trendItems[0].descriptionEn}
                    </p>
                  </div>

                  {(() => {
                    const priceInfo = getProductPrice(trendItems[0]);
                    return (
                      <div className="w-full pt-4 border-t border-white/15 flex items-center justify-between gap-4">
                        <div className="flex flex-col text-left" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                          {priceInfo.hasDiscount && (
                            <span className="text-zinc-400 line-through text-[11px] font-serif leading-none mb-1">
                              {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                            </span>
                          )}
                          <div className="flex items-baseline gap-1.5">
                            <span className={priceInfo.hasDiscount ? "text-2xl font-serif font-black text-amber-400" : "text-2xl font-serif font-medium text-white"}>
                              {priceInfo.current}
                            </span>
                            <span className="text-xs text-zinc-350 font-sans">{isArabic ? 'ج.م' : 'EGP'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onSelectProduct(trendItems[0])}
                            className="px-5 py-2.5 bg-white hover:bg-amber-100 text-zinc-950 rounded-full text-xs font-semibold tracking-wider transition cursor-pointer font-sans shadow"
                          >
                            {isArabic ? "اكتشف الموديل" : "EXPLORE NOW"}
                          </button>
                          <button
                            onClick={() => onQuickAddToCart(trendItems[0])}
                            className="p-2.5 bg-white/10 hover:bg-white hover:text-black text-white rounded-full transition cursor-pointer border border-white/20"
                            title={isArabic ? "إضافة سريعة للسلة" : "Quick Add"}
                          >
                            <ShoppingCart size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </motion.div>
            </div>
          )}

          {/* Trend Items 2 and 3: Stacked side layouts (Columns 8-12) */}
          <div className="lg:col-span-5 flex flex-col gap-6 justify-between">
            
            {/* Box 2 (Light Minimalist Contrast) */}
            {trendItems[1] && (
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-zinc-150/40 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between shadow-md h-[225px] sm:h-[280px] lg:h-[295px] relative overflow-hidden group"
              >
                {/* Large aesthetic number behind */}
                <div className="absolute right-6 top-4 text-zinc-100/70 font-serif text-[4rem] sm:text-[5.5rem] font-bold leading-none pointer-events-none select-none">
                  02
                </div>

                <div className="flex gap-4 sm:gap-6 h-full items-stretch relative z-10" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                  
                  {/* Info Column */}
                  <div className="flex-1 flex flex-col justify-between py-1 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-bold text-amber-800 tracking-wider uppercase block">
                        {isArabic ? "التنسيق المثالي" : "TREND ELEMENT"}
                      </span>
                      <h3 
                        onClick={() => onSelectProduct(trendItems[1])}
                        className="text-lg sm:text-xl font-serif font-medium text-zinc-950 tracking-tight leading-tight cursor-pointer hover:text-amber-800 transition line-clamp-1"
                      >
                        {isArabic ? trendItems[1].nameAr : trendItems[1].nameEn}
                      </h3>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-sans line-clamp-2">
                        {isArabic ? trendItems[1].descriptionAr : trendItems[1].descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-100 gap-2">
                      {(() => {
                        const priceInfo = getProductPrice(trendItems[1]);
                        return (
                          <div className="flex flex-col text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {priceInfo.hasDiscount && (
                              <span className="text-zinc-400 line-through text-[10px] sm:text-xs font-serif leading-none mb-1">
                                {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                              </span>
                            )}
                            <div>
                              <span className={priceInfo.hasDiscount ? "text-red-650 font-serif font-bold text-lg" : "text-zinc-950 font-serif font-bold text-lg"}>
                                {priceInfo.current}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-sans ml-1 mr-1">{isArabic ? 'ج.م' : 'EGP'}</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <button
                        onClick={() => onSelectProduct(trendItems[1])}
                        className="p-2 bg-zinc-950 hover:bg-amber-800 text-white rounded-full transition cursor-pointer"
                        title={isArabic ? "عرض التفاصيل" : "View Details"}
                      >
                        {isArabic ? <span className="px-2 text-xs">{ "تفاصيل" }</span> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Clip Image on side */}
                  <div className="w-24 sm:w-32 lg:w-36 aspect-[3/4] bg-zinc-50 rounded-2xl overflow-hidden shadow-xs cursor-pointer" onClick={() => onSelectProduct(trendItems[1])}>
                    <img
                      src={trendItems[1].image}
                      alt={isArabic ? trendItems[1].nameAr : trendItems[1].nameEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                  </div>

                </div>
              </motion.div>
            )}

            {/* Box 3 (Deep Minimalist Contrast) */}
            {trendItems[2] && (
              <motion.div
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
                className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between shadow-lg h-[225px] sm:h-[280px] lg:h-[295px] relative overflow-hidden group text-white"
              >
                {/* Large aesthetic number behind */}
                <div className="absolute right-6 top-4 text-zinc-900/50 font-serif text-[4rem] sm:text-[5.5rem] font-bold leading-none pointer-events-none select-none">
                  03
                </div>

                <div className="flex gap-4 sm:gap-6 h-full items-stretch relative z-10" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                  
                  {/* Info Column */}
                  <div className="flex-1 flex flex-col justify-between py-1 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <div className="space-y-1">
                      <span className="text-[10px] font-sans font-bold text-amber-500 tracking-wider uppercase block">
                        {isArabic ? "مظهر الشارع المعاصر" : "STREET CONTRAST"}
                      </span>
                      <h3 
                        onClick={() => onSelectProduct(trendItems[2])}
                        className="text-lg sm:text-xl font-serif font-medium text-white tracking-tight leading-tight cursor-pointer hover:text-amber-400 transition line-clamp-1"
                      >
                        {isArabic ? trendItems[2].nameAr : trendItems[2].nameEn}
                      </h3>
                      <p className="text-zinc-400 text-[11px] leading-relaxed font-sans line-clamp-2">
                        {isArabic ? trendItems[2].descriptionAr : trendItems[2].descriptionEn}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800 gap-2">
                      {(() => {
                        const priceInfo = getProductPrice(trendItems[2]);
                        return (
                          <div className="flex flex-col text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                            {priceInfo.hasDiscount && (
                              <span className="text-zinc-500 line-through text-[10px] sm:text-xs font-serif leading-none mb-1">
                                {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                              </span>
                            )}
                            <div>
                              <span className={priceInfo.hasDiscount ? "text-amber-300 font-serif font-extrabold text-lg" : "text-amber-400 font-serif font-bold text-lg"}>
                                {priceInfo.current}
                              </span>
                              <span className="text-[10px] text-zinc-400 font-sans ml-1 mr-1">{isArabic ? 'ج.م' : 'EGP'}</span>
                            </div>
                          </div>
                        );
                      })()}
                      
                      <button
                        onClick={() => onSelectProduct(trendItems[2])}
                        className="p-2 bg-amber-600 hover:bg-amber-700 text-white rounded-full transition cursor-pointer border-none"
                        title={isArabic ? "عرض التفاصيل" : "View Details"}
                      >
                        {isArabic ? <span className="px-2 text-xs">{ "تفاصيل" }</span> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Thumbnail Clip Image on side */}
                  <div className="w-24 sm:w-32 lg:w-36 aspect-[3/4] bg-zinc-900 rounded-2xl overflow-hidden cursor-pointer" onClick={() => onSelectProduct(trendItems[2])}>
                    <img
                      src={trendItems[2].image}
                      alt={isArabic ? trendItems[2].nameAr : trendItems[2].nameEn}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=600";
                      }}
                    />
                  </div>

                </div>
              </motion.div>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
