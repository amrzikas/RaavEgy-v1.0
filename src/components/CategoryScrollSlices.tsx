import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Plus } from 'lucide-react';
import { Product } from '../types';
import { getProductPrice } from '../utils';

interface CategoryScrollSlicesProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  onSelectCategory: (category: string) => void;
  onQuickAddToCart: (product: Product) => void;
}

export default function CategoryScrollSlices({
  products,
  onSelectProduct,
  isArabic,
  onSelectCategory,
  onQuickAddToCart
}: CategoryScrollSlicesProps) {
  
  const categoryConfigs = [
    {
      id: 'women',
      labelAr: 'الأزياء النسائية الراقية',
      labelEn: "Premium Women's Atelier",
      descAr: 'تصاميم تسحر العيون، فساتين وبليزر منسق خصيصًا ليناسب رونقك الفريد.',
      descEn: 'Timeless luxury silhouettes, structured blazers, and elegant flowing textures.',
      bgColor: 'from-rose-50/70 to-orange-50/30',
      image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'men',
      labelAr: 'المجموعات الرجالية العصرية',
      labelEn: "Modern Men's Curation",
      descAr: 'قمصان من الكتان الطبيعي وهوديز عريضة مصممة لتجمع الراحة بالأناقة.',
      descEn: 'Natural heavyweight linens, sleek street hoodies, and stretch leisure wear.',
      bgColor: 'from-amber-50/60 to-zinc-50',
      image: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'kids',
      labelAr: 'قصص الأطفال القطنية العضوية',
      labelEn: "Organic Cotton Baby & Kids",
      descAr: 'ملابس قطنية بالكامل فائقة النعومة ومحفوظة بعناية لبشرة أطفالك الحساسة.',
      descEn: 'Playtime-resilient baby garments crafted from pure premium cotton fibers.',
      bgColor: 'from-sky-50/60 to-indigo-50/20',
      image: "https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=800"
    },
    {
      id: 'accessories',
      labelAr: 'الإكسسوارات الفاخرة المنسقة',
      labelEn: "Signature Accessories & Watches",
      descAr: 'تفاصيل بسيطة تصنع فارقًا كبيرًا! ساعات كلاسيكية ونظارات حماية ذكية.',
      descEn: 'The defining edits: analog retro leather pieces and premium UV400 frames.',
      bgColor: 'from-zinc-100/70 to-amber-50/30',
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
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

  return (
    <section id="category-slices" className="bg-white py-16 md:py-24 border-b border-zinc-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Title */}
        <div className="text-center md:text-right mb-12 sm:mb-16" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
          <div className="flex items-center gap-1.5 justify-start md:justify-start text-[10px] font-bold tracking-[0.2em] text-zinc-400 uppercase mb-2">
            <span>✦</span>
            <span>{isArabic ? "تصفح حسب الفئات" : "SHOP BY GENRE"}</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
            {isArabic ? "روائع الموضة حسب ذوقك" : "The Boutique Collections"}
          </h2>
        </div>

        {/* Categories Loop */}
        <div className="space-y-16 md:space-y-24">
          {categoryConfigs.map((config) => {
            // Get products for this specific category
            const categoryProducts = products.filter(p => p.category === config.id);
            if (categoryProducts.length === 0) return null;

            return (
              <div 
                key={config.id} 
                className="grid grid-cols-12 gap-2 sm:gap-6 lg:gap-8 items-stretch"
                style={{ direction: isArabic ? 'rtl' : 'ltr' }}
              >
                
                {/* 1. Styled Showcase Intro Card (4 cols on all screen sizes) */}
                <div className="col-span-4 flex">
                  <div className={`w-full bg-gradient-to-br ${config.bgColor} border border-zinc-150/50 p-2.5 xs:p-4 sm:p-8 rounded-2xl sm:rounded-[2rem] flex flex-col justify-between shadow-xs relative overflow-hidden group`}>
                    
                    {/* Gorgeous subtle background image layer with hover scaling */}
                    {config.image && (
                      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden rounded-2xl sm:rounded-[2rem]">
                        <img 
                          src={config.image} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-[0.25] mix-blend-multiply transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                        />
                        {/* Smooth ambient gradient masking */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white/40" />
                      </div>
                    )}
 
                    {/* Tiny decor circle */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-white/20 blur-xl pointer-events-none" />
 
                    <div className="space-y-1.5 sm:space-y-3 relative z-10 text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                      <span className="text-[6px] xs:text-[8px] sm:text-[10px] font-bold bg-white/95 text-amber-950 border border-zinc-100/55 rounded-full px-1.5 py-0.5 sm:px-3 sm:py-1 font-sans uppercase tracking-widest inline-block shadow-xs">
                        {isArabic ? "مجموعة خاصة" : "EXCLUSIVE LINE"}
                      </span>
                      <h3 className="text-[10px] xs:text-sm sm:text-2xl lg:text-3xl font-serif font-bold text-zinc-950 tracking-tight leading-tight drop-shadow-xs">
                        {isArabic ? config.labelAr : config.labelEn}
                      </h3>
                      <p className="hidden xs:block text-zinc-800 text-[8px] sm:text-xs lg:text-sm leading-relaxed font-sans font-medium">
                        {isArabic ? config.descAr : config.descEn}
                      </p>
                    </div>
 
                    <div className="pt-2 sm:pt-6 relative z-10 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <button
                        onClick={() => handleViewAll(config.id)}
                        className="px-1.5 py-1 xs:px-3 xs:py-1.5 sm:px-6 sm:py-3 bg-zinc-950 hover:bg-zinc-900 text-white rounded-lg sm:rounded-full text-[7px] xs:text-[9px] sm:text-xs font-semibold tracking-wider transition uppercase shadow-sm cursor-pointer text-center"
                      >
                        {isArabic ? "كل الموديلات" : "BROWSE EDIT"}
                      </button>
                      
                      {/* Nav Arrows */}
                      <div className="hidden sm:flex items-center gap-1.5 self-center">
                        <button
                          onClick={() => scrollTrack(config.id, isArabic ? 'right' : 'left')}
                          className="p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-full cursor-pointer hover:bg-zinc-50 transition"
                          title="Previous"
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          onClick={() => scrollTrack(config.id, isArabic ? 'left' : 'right')}
                          className="p-2.5 bg-white border border-zinc-200 hover:border-zinc-300 text-zinc-700 rounded-full cursor-pointer hover:bg-zinc-50 transition"
                          title="Next"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
 
                  </div>
                </div>
 
                {/* 2. Seamless Horizontal Scroll Track (8 cols on all screen sizes) */}
                <div className="col-span-8 flex items-center relative">
                  
                  {/* Subtle shadows indicating side scrolls */}
                  <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none z-10 hidden md:block" />
                  <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none z-10 hidden md:block" />
 
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
                                    <span className="text-zinc-400 line-through text-[7px] xs:text-[8px] sm:text-[9px] font-serif leading-none mb-0.5">
                                      {priceInfo.original}
                                    </span>
                                  )}
                                  <div>
                                    <span className={priceInfo.hasDiscount ? "text-red-650 font-bold text-[9px] xs:text-xs sm:text-sm font-serif" : "text-zinc-900 font-bold text-[9px] xs:text-xs sm:text-sm font-serif"}>
                                      {priceInfo.current}
                                    </span>
                                    <span className="text-[6px] xs:text-[8px] text-zinc-500 font-sans ml-0.5 mr-0.5">{isArabic ? 'ج.م' : 'EGP'}</span>
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
                    <div className="flex-none w-[80px] xs:w-[110px] sm:w-[200px] flex items-center justify-center p-2.5 xs:p-4 sm:p-6 bg-zinc-50 border border-dashed border-zinc-300 rounded-xl sm:rounded-3xl snap-end">
                      <div className="text-center space-y-2 sm:space-y-4">
                        <div className="w-6 h-6 xs:w-8 xs:h-8 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs border border-zinc-100 text-amber-800">
                          <ShoppingBag className="w-3.5 h-3.5 sm:w-[18px] sm:h-[18px]" />
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <h4 className="font-serif font-medium text-zinc-950 text-[9px] xs:text-xs sm:text-sm">
                            {isArabic ? "المزيد؟" : "More pieces"}
                          </h4>
                          <p className="hidden xs:block text-[8px] sm:text-[11px] text-zinc-400 font-sans leading-tight">
                            {isArabic ? "تصفح هذه المجموعة بالكامل" : "See entire curated line"}
                          </p>
                        </div>
                        <button
                          onClick={() => handleViewAll(config.id)}
                          className="px-2 py-1 sm:px-4 sm:py-2 bg-zinc-900 hover:bg-amber-800 text-white rounded-md sm:rounded-full text-[7px] xs:text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase transition inline-block cursor-pointer"
                        >
                          {isArabic ? "تصفح" : "Browse"}
                        </button>
                      </div>
                    </div>
 
                  </div>
 
                </div>
 
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
