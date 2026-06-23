import React from 'react';
import { motion } from 'motion/react';
import { SectionBackdrop } from '../types';

interface TheCollectionsProps {
  onSelectCategory: (cat: 'all' | 'men' | 'women' | 'kids' | 'accessories') => void;
  isArabic: boolean;
  backdrop?: SectionBackdrop;
  layout?: 'split' | 'bento' | 'symmetric' | 'slider';
  order?: ('women' | 'men' | 'kids' | 'accessories')[];
  categoryImages?: {
    women?: string;
    men?: string;
    kids?: string;
    accessories?: string;
  };
}

export default function TheCollections({ 
  onSelectCategory, 
  isArabic, 
  backdrop,
  layout = 'split',
  order,
  categoryImages
}: TheCollectionsProps) {
  
  const handleCategoryClick = (cat: 'all' | 'men' | 'women' | 'kids' | 'accessories') => {
    onSelectCategory(cat);
    const catalogSection = document.getElementById('catalog-shelf');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLightText = backdrop ? backdrop.textColor === 'light' : true; // Default to dark background with white text

  const customStyle: React.CSSProperties = backdrop ? {
    background: backdrop.type === 'solid'
      ? (backdrop.solidColor || '#1b1c19')
      : `linear-gradient(${
          backdrop.gradientDirection === 'to-r' ? 'to right' :
          backdrop.gradientDirection === 'to-tr' ? 'to top right' :
          backdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
        }, ${backdrop.gradientFrom || '#1b1c19'}, ${backdrop.gradientTo || '#252622'})`
  } : {};

  // Standard collection static details
  const cardsConfig = {
    women: {
      id: 'women' as const,
      labelAr: 'حريمي',
      labelEn: 'Women',
      defaultImg: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000",
      tagEn: "SEASON 2026",
      tagAr: "موسم ٢٠٢٦"
    },
    men: {
      id: 'men' as const,
      labelAr: 'رجالي',
      labelEn: 'Men',
      defaultImg: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
      tagEn: "URBAN ESSENTIALS",
      tagAr: "أساسيات عصرية"
    },
    kids: {
      id: 'kids' as const,
      labelAr: 'أطفالي',
      labelEn: 'Kids',
      defaultImg: "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=800",
      tagEn: "JUNIOR CHIC",
      tagAr: "موضة الصغار"
    },
    accessories: {
      id: 'accessories' as const,
      labelAr: 'إكسسوارات',
      labelEn: 'Accessories',
      defaultImg: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800",
      tagEn: "LUXE FINISHERS",
      tagAr: "إكسسوارات فاخرة"
    }
  };

  // Re-order active list according to collectionsOrder config
  const activeOrder = order && order.length > 0 
    ? order.filter(item => ['women', 'men', 'kids', 'accessories'].includes(item))
    : (['women', 'men', 'kids', 'accessories'] as const);

  // Fallback check to make sure all 4 items are present
  const missingItems = ['women', 'men', 'kids', 'accessories'].filter(
    (item) => !activeOrder.includes(item as any)
  ) as ('women' | 'men' | 'kids' | 'accessories')[];
  
  const finalizedCategories = [...activeOrder, ...missingItems] as ('women' | 'men' | 'kids' | 'accessories')[];

  return (
    <section 
      style={customStyle}
      className={`${
        backdrop ? '' : 'bg-gradient-to-b from-[#1b1c19] to-[#252622]'
      } py-12 md:py-20 border-b border-[#2d2e28] font-sans select-none`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8 md:mb-12" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <div className={`flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold tracking-[0.25em] ${isLightText ? 'text-zinc-400' : 'text-zinc-550'} uppercase mb-1`}>
              <span className="text-amber-400">✦</span>
              <span>{isArabic ? "مجموعات منسقة وبصمات فريدة" : "CURATED STYLES"}</span>
            </div>
            <h2 className={`text-3xl md:text-4xl font-serif font-medium ${isLightText ? 'text-white' : 'text-zinc-950'} tracking-tight leading-tight`}>
              {isArabic ? "التشكيلات الفريدة" : "The Collections"}
            </h2>
          </div>

          <div>
            <button
              onClick={() => handleCategoryClick('all')}
              className={`group flex items-center gap-3 text-xs font-semibold tracking-[0.2em] ${isLightText ? 'text-zinc-400 hover:text-amber-400' : 'text-zinc-650 hover:text-amber-650'} transition uppercase cursor-pointer`}
            >
              <span>{isArabic ? "عرض الكل" : "VIEW ALL"}</span>
              <span className={`text-lg transition-transform duration-300 group-hover:${isArabic ? '-translate-x-1.5' : 'translate-x-1.5'}`}>
                {isArabic ? "←—" : "—→"}
              </span>
            </button>
          </div>
        </div>

        {/* ----------------------------------------------------- */}
        {/* Render Layout: SPLIT VIEW (Classic asymmetrical stack) */}
        {/* ----------------------------------------------------- */}
        {layout === 'split' && (
          <div className="grid grid-cols-12 gap-2 sm:gap-4 md:gap-6 items-stretch">
            {/* Left Big Card (1st sorted item) */}
            {(() => {
              const key = finalizedCategories[0];
              const cfg = cardsConfig[key];
              const customImg = categoryImages?.[key];
              return (
                <div className="col-span-7 h-[180px] sm:h-[400px] md:h-[500px] lg:h-[580px]">
                  <motion.div
                    whileHover={{ scale: 0.995 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleCategoryClick(cfg.id)}
                    className="relative w-full h-full rounded-2xl sm:rounded-[2.2rem] md:rounded-[3rem] overflow-hidden shadow-lg cursor-pointer group"
                  >
                    <img
                      src={customImg || cfg.defaultImg}
                      alt={cfg.labelEn}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent transition-opacity duration-300 group-hover:bg-black/30" />
                    <div className="absolute bottom-3 left-3 sm:bottom-10 sm:left-10 text-white space-y-0.5 sm:space-y-2 select-none" style={{ textAlign: 'left' }}>
                      <div className="text-[6px] sm:text-[10px] font-bold tracking-[0.25em] text-zinc-300/90 uppercase font-sans">
                        {isArabic ? cfg.tagAr : cfg.tagEn}
                      </div>
                      <h3 className="text-sm sm:text-4xl md:text-5xl font-serif text-white font-medium leading-none mb-1">
                        {isArabic ? cfg.labelAr : cfg.labelEn}
                      </h3>
                      <div className="inline-block text-[7px] sm:text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-white uppercase border-b border-white/80 pb-0.5 mt-0.5 transition-all duration-300 group-hover:border-white">
                        {isArabic ? "اكتشف المجموعة" : "DISCOVER MORE"}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })()}

            {/* Right Stack of 3 customized categories horizontally sliced */}
            <div className="col-span-5 flex flex-col gap-1.5 sm:gap-4 md:gap-6 h-[180px] sm:h-[400px] md:h-[500px] lg:h-[580px]">
              {finalizedCategories.slice(1, 4).map((key) => {
                const cfg = cardsConfig[key];
                const customImg = categoryImages?.[key];
                return (
                  <div key={cfg.id} className="flex-1 min-h-0">
                    <motion.div
                      whileHover={{ scale: 0.99 }}
                      transition={{ duration: 0.3 }}
                      onClick={() => handleCategoryClick(cfg.id)}
                      className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-md cursor-pointer group"
                    >
                      <img
                        src={customImg || cfg.defaultImg}
                        alt={cfg.labelEn}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />
                      <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-8 text-white select-none" style={{ textAlign: 'left' }}>
                        <span className="hidden sm:block text-[8px] font-bold text-amber-400 tracking-wider mb-0.5">{isArabic ? cfg.tagAr : cfg.tagEn}</span>
                        <h3 className="text-[10px] xs:text-[13px] sm:text-2xl md:text-3xl font-serif text-white font-medium">
                          {isArabic ? cfg.labelAr : cfg.labelEn}
                        </h3>
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* Render Layout: BENTO GRID (Organic luxury asymmetrical) */}
        {/* ----------------------------------------------------- */}
        {layout === 'bento' && (
          <div className="grid grid-cols-12 gap-2 sm:gap-4 md:gap-6 items-stretch">
            {finalizedCategories.map((key, index) => {
              const cfg = cardsConfig[key];
              const customImg = categoryImages?.[key];
              
              // Alternating bento spans: 
              // Item 1: Col-8 (or 12 on mobile)
              // Item 2: Col-4 (or 12 on mobile)
              // Item 3: Col-4 (or 12 on mobile)
              // Item 4: Col-8 (or 12 on mobile)
              const colSpanClass = index === 0 || index === 3 
                ? "col-span-12 md:col-span-8 h-[160px] sm:h-[260px] md:h-[340px]" 
                : "col-span-12 md:col-span-4 h-[160px] sm:h-[260px] md:h-[340px]";

              return (
                <div key={cfg.id} className={colSpanClass}>
                  <motion.div
                    whileHover={{ scale: 0.995 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleCategoryClick(cfg.id)}
                    className="relative w-full h-full rounded-2xl md:rounded-[2rem] overflow-hidden shadow-md cursor-pointer group"
                  >
                    <img
                      src={customImg || cfg.defaultImg}
                      alt={cfg.labelEn}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-300 group-hover:bg-black/25" />
                    <div className="absolute bottom-3 left-3 sm:bottom-8 sm:left-8 text-white select-none" style={{ textAlign: 'left' }}>
                      <span className="text-[7px] sm:text-[9px] font-bold text-amber-400 tracking-widest uppercase block mb-1">
                        {isArabic ? cfg.tagAr : cfg.tagEn}
                      </span>
                      <h3 className="text-sm sm:text-2xl md:text-3xl font-serif text-white font-medium">
                        {isArabic ? cfg.labelAr : cfg.labelEn}
                      </h3>
                      <div className="inline-block text-[6px] sm:text-[9.5px] font-medium tracking-wide text-zinc-300 uppercase border-b border-white/40 pb-0.5 mt-1 transition-all duration-300 group-hover:text-white group-hover:border-white">
                        {isArabic ? "اكتشف المجموعة" : "EXPLORE ITEMS"}
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* Render Layout: SYMMETRICAL GRID (Clean and streamlined) */}
        {/* ----------------------------------------------------- */}
        {layout === 'symmetric' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 items-stretch">
            {finalizedCategories.map((key) => {
              const cfg = cardsConfig[key];
              const customImg = categoryImages?.[key];
              return (
                <div key={cfg.id} className="h-[180px] sm:h-[320px] md:h-[420px] lg:h-[480px]">
                  <motion.div
                    whileHover={{ scale: 0.99 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleCategoryClick(cfg.id)}
                    className="relative w-full h-full rounded-2xl overflow-hidden shadow-inner cursor-pointer group border border-zinc-850/20"
                  >
                    <img
                      src={customImg || cfg.defaultImg}
                      alt={cfg.labelEn}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 text-white select-none" style={{ textAlign: 'left' }}>
                      <span className="text-[6px] sm:text-[8px] font-bold text-amber-500 tracking-[0.15em] uppercase block">
                        {isArabic ? cfg.tagAr : cfg.tagEn}
                      </span>
                      <h3 className="text-xs sm:text-xl md:text-2xl font-serif font-semibold mt-0.5">
                        {isArabic ? cfg.labelAr : cfg.labelEn}
                      </h3>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

        {/* ----------------------------------------------------- */}
        {/* Render Layout: COMPACT SLIDER (Luxurious item carousel) */}
        {/* ----------------------------------------------------- */}
        {layout === 'slider' && (
          <div 
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth scrollbar-thin scrollbar-thumb-zinc-700/60"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {finalizedCategories.map((key) => {
              const cfg = cardsConfig[key];
              const customImg = categoryImages?.[key];
              return (
                <div 
                  key={cfg.id} 
                  className="flex-none w-[70vw] xs:w-[50vw] sm:w-[40vw] md:w-[28vw] snap-start h-[190px] sm:h-[300px] md:h-[380px] lg:h-[440px]"
                >
                  <motion.div
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.3 }}
                    onClick={() => handleCategoryClick(cfg.id)}
                    className="relative w-full h-full rounded-2xl md:rounded-3xl overflow-hidden shadow-lg cursor-pointer group border border-zinc-800/10"
                  >
                    <img
                      src={customImg || cfg.defaultImg}
                      alt={cfg.labelEn}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-3 sm:bottom-6 sm:left-6 text-white select-none text-left" style={{ textAlign: 'left' }}>
                      <span className="text-[6px] sm:text-[8px] font-bold text-amber-400 tracking-wider block uppercase">
                        {isArabic ? cfg.tagAr : cfg.tagEn}
                      </span>
                      <h3 className="text-xs sm:text-lg md:text-xl font-serif font-bold mt-0.5">
                        {isArabic ? cfg.labelAr : cfg.labelEn}
                      </h3>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
