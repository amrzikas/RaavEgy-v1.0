import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Plus } from 'lucide-react';
import { Product, SectionBackdrop } from '../types';
import { getProductPrice } from '../utils';

interface CategoryScrollSlicesProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  onSelectCategory: (category: string) => void;
  onQuickAddToCart: (product: Product) => void;
  categoryImages?: {
    women?: string;
    men?: string;
    kids?: string;
    accessories?: string;
  };
  categoryTexts?: {
    women?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    men?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    kids?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    accessories?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
  };
  backdrop?: SectionBackdrop;
}

export default function CategoryScrollSlices({
  products,
  onSelectProduct,
  isArabic,
  onSelectCategory,
  onQuickAddToCart,
  categoryImages,
  categoryTexts,
  backdrop
}: CategoryScrollSlicesProps) {
  
  const categoryConfigs = [
    {
      id: 'women',
      labelAr: categoryTexts?.women?.titleAr || 'الأزياء النسائية الراقية',
      labelEn: categoryTexts?.women?.titleEn || "Premium Women's Atelier",
      descAr: categoryTexts?.women?.descAr || 'تصاميم تسحر العيون، فساتين وبليزر منسق خصيصًا ليناسب رونقك الفريد.',
      descEn: categoryTexts?.women?.descEn || 'Timeless luxury silhouettes, structured blazers, and elegant flowing textures.',
      bgColor: 'from-rose-900/35 via-zinc-800/40 to-orange-900/15',
      image: categoryImages?.women || "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'men',
      labelAr: categoryTexts?.men?.titleAr || 'المجموعات الرجالية العصرية',
      labelEn: categoryTexts?.men?.titleEn || "Modern Men's Curation",
      descAr: categoryTexts?.men?.descAr || 'قمصان من الكتان الطبيعي وهوديز عريضة مصممة لتجمع الراحة بالأناقة.',
      descEn: categoryTexts?.men?.descEn || 'Natural heavyweight linens, sleek street hoodies, and stretch leisure wear.',
      bgColor: 'from-amber-900/35 via-zinc-800/40 to-stone-900/30',
      image: categoryImages?.men || "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'kids',
      labelAr: categoryTexts?.kids?.titleAr || 'قصص الأطفال القطنية العضوية',
      labelEn: categoryTexts?.kids?.titleEn || "Organic Cotton Baby & Kids",
      descAr: categoryTexts?.kids?.descAr || 'ملابس قطنية بالكامل فائقة النعومة ومحفوظة بعناية لبشرة أطفالك الحساسة.',
      descEn: categoryTexts?.kids?.descEn || 'Playtime-resilient baby garments crafted from pure premium cotton fibers.',
      bgColor: 'from-sky-900/35 via-zinc-800/40 to-indigo-900/15',
      image: categoryImages?.kids || "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'accessories',
      labelAr: categoryTexts?.accessories?.titleAr || 'الإكسسوارات الفاخرة المنسقة',
      labelEn: categoryTexts?.accessories?.titleEn || "Signature Accessories & Watches",
      descAr: categoryTexts?.accessories?.descAr || 'تفاصيل بسيطة تصنع فارقًا كبيرًا! ساعات كلاسيكية ونظارات حماية ذكية.',
      descEn: categoryTexts?.accessories?.descEn || 'The defining edits: analog retro leather pieces and premium UV400 frames.',
      bgColor: 'from-zinc-800/35 via-zinc-800/40 to-amber-900/15',
      image: categoryImages?.accessories || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
    }
  ];

  const handleViewAll = (catId: string) => {
    onSelectCategory(catId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Create a scroll helper to manually advance or rewind the slider by 250px
  const scrollSlidersRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const scrollTrack = (catId: string, direction: 'left' | 'right') => {
    const el = scrollSlidersRefs.current[catId];
    if (el) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const isLightText = backdrop ? backdrop.textColor === 'light' : true; // Default is true because previous turn made it dark background with white text

  const customStyle: React.CSSProperties = backdrop ? {
    background: backdrop.type === 'solid'
      ? (backdrop.solidColor || '#353630')
      : `linear-gradient(${
          backdrop.gradientDirection === 'to-r' ? 'to right' :
          backdrop.gradientDirection === 'to-tr' ? 'to top right' :
          backdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
        }, ${backdrop.gradientFrom || '#353630'}, ${backdrop.gradientTo || '#21221e'})`
  } : {};

  return (
    <section 
      id="category-slices" 
      style={customStyle}
      className={`${backdrop ? '' : 'bg-[#353630]'} py-16 md:py-24 border-b border-[#2d2e28] overflow-hidden`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center md:text-right mb-12 sm:mb-16" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
          <div className="flex items-center gap-1.5 justify-start md:justify-start text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            <span className="text-amber-400">✦</span>
            <span className={isLightText ? 'text-zinc-300' : 'text-zinc-650'}>{isArabic ? "تصفح حسب الفئات" : "SHOP BY GENRE"}</span>
          </div>
          <h2 className={`text-3xl md:text-4xl font-serif font-light tracking-tight leading-tight ${isLightText ? 'text-white' : 'text-zinc-950'}`}>
            {isArabic ? "روائع الموضة حسب ذوقك" : "The Boutique Collections"}
          </h2>
        </div>

        {/* Categories Loop */}
        <div className="space-y-16 md:space-y-24">
          {(() => {
            let renderedIndex = 0;
            return categoryConfigs.map((config) => {
              // Get products for this specific category
              const categoryProducts = products.filter(p => p.category === config.id);
              if (categoryProducts.length === 0) return null;

              const isFirst = renderedIndex === 0;
              const isThird = renderedIndex === 2;
              renderedIndex++;

              let customStyle: React.CSSProperties | undefined = undefined;
              let leftShadowStyle: React.CSSProperties = {};
              let rightShadowStyle: React.CSSProperties = {};

              if (isFirst) {
                customStyle = { background: '#c9d9bc' };
                leftShadowStyle = { background: 'linear-gradient(to right, #93a783, transparent)' };
                rightShadowStyle = { background: 'linear-gradient(to left, #93a783, transparent)' };
              } else if (isThird) {
                customStyle = { background: '#c9dfdd' };
                leftShadowStyle = { background: 'linear-gradient(to right, #9ebbba, transparent)' };
                rightShadowStyle = { background: 'linear-gradient(to left, #9ebbba, transparent)' };
              } else {
                leftShadowStyle = { background: 'linear-gradient(to right, rgba(15, 15, 17, 0.95), transparent)' };
                rightShadowStyle = { background: 'linear-gradient(to left, rgba(15, 15, 17, 0.95), transparent)' };
              }

              return (
                <div 
                  key={config.id} 
                  className="bg-gradient-to-br from-zinc-800 via-zinc-850 to-zinc-900 border border-zinc-700/60 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-8 lg:p-10 shadow-xl relative overflow-hidden"
                  style={customStyle}
                >
                {/* Ambient glow backgrounds */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-zinc-500/5 rounded-full blur-3xl pointer-events-none" />

                <div 
                  className="grid grid-cols-12 gap-4 sm:gap-6 lg:gap-8 items-stretch relative z-10"
                  style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                >
                  
                  {/* 1. Styled Showcase Intro Card (5 cols on md+, 12 cols on mobile/tablet) */}
                  <div className="col-span-12 md:col-span-4 lg:col-span-5 flex animate-fade-in text-center">
                    <div className={`w-full bg-gradient-to-br ${config.bgColor} border border-zinc-700/40 p-4 xs:p-6 sm:p-10 rounded-2xl sm:rounded-[2.2rem] flex flex-col justify-between shadow-md relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:border-zinc-550 min-h-[220px] xs:min-h-[260px] sm:min-h-[440px] md:min-h-[500px] lg:min-h-[540px]`}>
                      
                      {/* Gorgeous subtle background image layer with hover scaling */}
                      {config.image && (
                        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-[2rem]">
                          <img 
                            src={config.image} 
                            alt="" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover opacity-[0.55] transition-transform duration-[1.2s] ease-out group-hover:scale-110 group-hover:opacity-[0.65]"
                          />
                          {/* Premium dark tint overlay to make the clear image and white text stand out beautifully */}
                          <div className="absolute inset-0 bg-zinc-950/45 group-hover:bg-zinc-950/55 transition-colors duration-500" />
                        </div>
                      )}
   
                      {/* Tiny decor circle */}
                      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none" />
   
                      <div className="space-y-2.5 sm:space-y-4 relative z-10 text-center flex flex-col items-center justify-center my-auto w-full px-2 sm:px-4">
                        <span className="text-[7.5px] xs:text-[9.5px] sm:text-[11.5px] font-bold bg-amber-600 text-white rounded-full px-3.5 py-1 font-sans uppercase tracking-[0.25em] inline-block shadow-md">
                          {isArabic ? "مجموعة خاصة" : "EXCLUSIVE LINE"}
                        </span>
                        <h3 className="text-sm xs:text-xl sm:text-3xl lg:text-4xl font-serif font-extrabold text-white tracking-tight leading-tight drop-shadow-md select-none">
                          {isArabic ? config.labelAr : config.labelEn}
                        </h3>
                        <p className="hidden xs:block text-zinc-100 text-[10px] sm:text-sm lg:text-base leading-relaxed font-sans font-medium drop-shadow-sm max-w-sm mx-auto select-none">
                          {isArabic ? config.descAr : config.descEn}
                        </p>
                      </div>
   
                      <div className="pt-3 sm:pt-6 relative z-10 flex flex-col sm:flex-row gap-3 items-center justify-center w-full">
                        <button
                          onClick={() => handleViewAll(config.id)}
                          className="px-3.5 py-1.5 xs:px-5 xs:py-2.5 sm:px-8 sm:py-4 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-lg sm:rounded-full text-[8px] xs:text-[10px] sm:text-xs tracking-[0.15em] transition uppercase shadow-md cursor-pointer text-center"
                        >
                          {isArabic ? "تصفح التشكيلة" : "BROWSE EDIT"}
                        </button>
                        
                        {/* Nav Arrows */}
                        <div className="hidden sm:flex items-center gap-1.5 self-center">
                          <button
                            onClick={() => scrollTrack(config.id, isArabic ? 'right' : 'left')}
                            className="p-2.5 bg-white/95 hover:bg-white text-zinc-900 rounded-full cursor-pointer hover:bg-zinc-50 transition"
                            title="Previous"
                          >
                            <ChevronLeft size={14} />
                          </button>
                          <button
                            onClick={() => scrollTrack(config.id, isArabic ? 'left' : 'right')}
                            className="p-2.5 bg-white/95 hover:bg-white text-zinc-900 rounded-full cursor-pointer hover:bg-zinc-50 transition"
                            title="Next"
                          >
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
   
                    </div>
                  </div>
   
                  {/* 2. Seamless Horizontal Scroll Track (7 cols on md+, 12 cols on mobile/tablet) */}
                  <div className="col-span-12 md:col-span-8 lg:col-span-7 flex items-center relative">
                    
                    {/* Subtle shadows indicating side scrolls matching the dynamic card background */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none z-10 hidden md:block" 
                      style={leftShadowStyle}
                    />
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-10 hidden md:block" 
                      style={rightShadowStyle}
                    />
   
                    <div
                      ref={(el) => {
                        scrollSlidersRefs.current[config.id] = el;
                      }}
                    className="w-full flex items-stretch gap-2.5 sm:gap-6 overflow-x-auto py-2 sm:py-4 px-1 sm:px-2 scrollbar-none snap-x snap-mandatory"
                    style={{ 
                      scrollbarWidth: 'none', 
                      msOverflowStyle: 'none' 
                    }}
                  >
                    
                    {categoryProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        whileHover={{ y: -4 }}
                        className="flex-none w-[100px] xs:w-[135px] sm:w-[265px] bg-white border border-zinc-150/30 rounded-xl sm:rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition duration-300 flex flex-col snap-start group select-none"
                      >
                        {/* Compact Luxury Image */}
                        <div 
                          onClick={() => onSelectProduct(product)}
                          className="relative aspect-[4/5] bg-zinc-50 overflow-hidden cursor-pointer"
                        >
                          <img
                            src={product.image}
                            alt={isArabic ? product.nameAr : product.nameEn}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            onError={(e) => {
                              e.currentTarget.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=600";
                            }}
                          />
 
                          {/* Quick details reveal glass overlays */}
                          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-1.5 xs:gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectProduct(product);
                              }}
                              className="p-1.5 xs:p-2.5 bg-white text-zinc-950 rounded-full hover:bg-amber-800 hover:text-white shadow-md transition"
                            >
                              <Eye className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5" />
                            </button>
                            {product.inStock && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onQuickAddToCart(product);
                                }}
                                className="p-1.5 xs:p-2.5 bg-zinc-950 text-white rounded-full hover:bg-white hover:text-zinc-950 shadow-md transition"
                              >
                                <Plus className="w-2.5 h-2.5 xs:w-3.5 xs:h-3.5" />
                              </button>
                            )}
                          </div>
 
                          {!product.inStock && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                              <span className="text-[7px] xs:text-[10px] tracking-wider text-red-700 bg-red-50 border border-red-100 py-0.5 px-1.5 sm:py-1.5 sm:px-3 rounded-full font-bold">
                                {isArabic ? "نفد" : "SOLD OUT"}
                              </span>
                            </div>
                          )}
                        </div>
 
                        {/* Title details bar */}
                        <div className="p-2 xs:p-3 sm:p-4 flex flex-col flex-1 justify-between gap-1 sm:gap-2" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                          <div>
                            <h4 
                              onClick={() => onSelectProduct(product)}
                              className="text-zinc-900 font-serif font-medium text-[9px] xs:text-xs sm:text-sm tracking-tight cursor-pointer hover:text-amber-700 transition line-clamp-1"
                            >
                              {isArabic ? product.nameAr : product.nameEn}
                            </h4>
                          </div>
 
                          <div className="flex flex-col xs:flex-row xs:items-center justify-between pt-1 xs:pt-2 border-t border-zinc-100 gap-1">
                            {(() => {
                              const priceInfo = getProductPrice(product);
                              return (
                                <div className="flex flex-col text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                  {priceInfo.hasDiscount && (
                                    <span className="text-zinc-400 line-through text-[6.5px] xs:text-[8px] sm:text-[9px] font-sans leading-none mb-1 inline-block">
                                      {priceInfo.original} {isArabic ? 'ج.م' : 'EGP'}
                                    </span>
                                  )}
                                  <div className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/25 text-amber-950 rounded-md py-0.5 px-1.5 sm:px-2.5 text-[8.5px] xs:text-[11px] sm:text-xs font-extrabold shadow-sm font-sans">
                                    <span className={priceInfo.hasDiscount ? "text-red-650" : "text-zinc-900"}>
                                      {priceInfo.current}
                                    </span>
                                    <span className="text-[6.5px] xs:text-[8px] sm:text-[9px] uppercase font-bold text-zinc-500/95">{isArabic ? 'ج.م' : 'EGP'}</span>
                                  </div>
                                </div>
                              );
                            })()}
 
                            {product.inStock ? (
                              <button
                                onClick={() => onSelectProduct(product)}
                                className="text-[8px] xs:text-[9px] sm:text-[10px] text-zinc-550 hover:text-amber-800 font-semibold uppercase tracking-wider font-sans underline underline-offset-4 self-start xs:self-auto"
                              >
                                {isArabic ? "تفاصيل" : "BUY"}
                              </button>
                            ) : (
                              <span className="text-[7px] xs:text-[9px] text-zinc-400 italic">
                                {isArabic ? "غير متاح" : "Out"}
                              </span>
                            )}
                          </div>
                        </div>
 
                      </motion.div>
                    ))}
 
                    {/* Final "Explore" Card inside each scroll track */}
                    <div className="flex-none w-[100px] xs:w-[135px] sm:w-[200px] flex items-center justify-center p-4 sm:p-6 bg-zinc-900/40 border border-dashed border-zinc-700/80 rounded-xl sm:rounded-3xl snap-end group/explore transition hover:bg-zinc-900/70">
                      <div className="text-center space-y-3 sm:space-y-4">
                        <div className="w-8 h-8 xs:w-10 xs:h-10 sm:w-14 sm:h-14 bg-amber-600 rounded-full flex items-center justify-center mx-auto shadow-md text-white transition-transform group-hover/explore:scale-110">
                          <ShoppingBag className="w-4 h-4 sm:w-6 sm:h-6" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-serif font-medium text-zinc-100 text-[10px] xs:text-xs sm:text-base">
                            {isArabic ? "المزيد؟" : "More pieces"}
                          </h4>
                          <p className="hidden xs:block text-[8px] sm:text-xs text-zinc-400 font-sans leading-tight">
                            {isArabic ? "تصفح هذه المجموعة بالكامل" : "See entire curated line"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewAll(config.id)}
                          className="px-3 py-1.5 sm:px-5 sm:py-2.5 bg-white hover:bg-zinc-100 text-zinc-950 font-bold rounded-lg sm:rounded-full text-[8px] xs:text-[10px] sm:text-xs tracking-wider uppercase transition inline-block cursor-pointer shadow-md"
                        >
                          {isArabic ? "تصفح" : "Browse"}
                        </button>
                      </div>
                    </div>
 
                  </div>
 
                </div>
 
              </div>
            </div>
          );
          });
          })()}
        </div>

      </div>
    </section>
  );
}
