import React from 'react';
import { motion } from 'motion/react';

interface TheCollectionsProps {
  onSelectCategory: (cat: 'all' | 'men' | 'women' | 'kids' | 'accessories') => void;
  isArabic: boolean;
}

export default function TheCollections({ onSelectCategory, isArabic }: TheCollectionsProps) {
  const handleCategoryClick = (cat: 'all' | 'men' | 'women' | 'kids' | 'accessories') => {
    onSelectCategory(cat);
    const catalogSection = document.getElementById('catalog-shelf');
    if (catalogSection) {
      catalogSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="bg-white py-12 md:py-20 border-b border-zinc-150/80 font-sans select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex items-end justify-between mb-8 md:mb-12" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase mb-1">
              <span>✦</span>
              <span>{isArabic ? "مجموعات منسقة" : "CURATED STYLES"}</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-medium text-zinc-950 tracking-tight leading-tight">
              {isArabic ? "التشكيلات الفريدة" : "The Collections"}
            </h2>
          </div>

          <div>
            <button
              onClick={() => handleCategoryClick('all')}
              className="group flex items-center gap-3 text-xs font-semibold tracking-[0.2em] text-zinc-500 hover:text-black transition uppercase cursor-pointer"
            >
              <span>{isArabic ? "عرض الكل" : "VIEW ALL"}</span>
              <span className="text-lg transition-transform duration-300 group-hover:translate-x-1.5">—→</span>
            </button>
          </div>
        </div>

        {/* Categories Grid Setup */}
        <div className="grid grid-cols-12 gap-2 sm:gap-4 md:gap-6 items-stretch">
          
          {/* LEFT: Massive high-fashion editorial Women image card (takes 7 columns) */}
          <div className="col-span-7 h-[180px] sm:h-[400px] md:h-[500px] lg:h-[580px]">
            <motion.div
              whileHover={{ scale: 0.99 }}
              transition={{ duration: 0.4 }}
              onClick={() => handleCategoryClick('women')}
              className="relative w-full h-full rounded-2xl sm:rounded-[2.2rem] md:rounded-[3rem] overflow-hidden shadow-lg cursor-pointer group"
            >
              <img
                src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000"
                alt="Women Collection"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              {/* Overlay with radial and soft linear dark gradient on bottom left */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent transition-opacity duration-300 group-hover:bg-black/25" />

              <div className="absolute bottom-3 left-3 sm:bottom-10 sm:left-10 text-white space-y-0.5 sm:space-y-2 select-none" style={{ textAlign: 'left' }}>
                <div className="text-[6px] sm:text-[10px] font-bold tracking-[0.25em] text-zinc-300/90 uppercase font-sans">
                  SEASON 2026
                </div>
                <h3 className="text-sm sm:text-4xl md:text-5xl font-serif text-white font-medium leading-none mb-1">
                  Women
                </h3>
                <div className="inline-block text-[7px] sm:text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-white uppercase border-b border-white/80 pb-0.5 mt-0.5 transition-all duration-300 group-hover:border-white">
                  {isArabic ? "اكتشف المزيد" : "DISCOVER MORE"}
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Stack of 3 customized categories horizontally sliced (takes 5 columns) */}
          <div className="col-span-5 flex flex-col gap-1.5 sm:gap-4 md:gap-6 h-[180px] sm:h-[400px] md:h-[500px] lg:h-[580px]">
            
            {/* 1. Men Card (Deep blue sky concept) */}
            <div className="flex-1 min-h-0">
              <motion.div
                whileHover={{ scale: 0.99 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleCategoryClick('men')}
                className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-md cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800"
                  alt="Men Collection"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
                <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-8 text-white select-none">
                  <h3 className="text-[10px] xs:text-[12px] sm:text-2.5xl sm:text-3xl font-serif text-white font-medium">
                    Men
                  </h3>
                </div>
              </motion.div>
            </div>

            {/* 2. Kids Card (Sunset fields concept) */}
            <div className="flex-1 min-h-0">
              <motion.div
                whileHover={{ scale: 0.99 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleCategoryClick('kids')}
                className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-md cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=800"
                  alt="Kids Collection"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
                <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-8 text-white select-none">
                  <h3 className="text-[10px] xs:text-[12px] sm:text-2.5xl sm:text-3xl font-serif text-white font-medium">
                    Kids
                  </h3>
                </div>
              </motion.div>
            </div>

            {/* 3. Acc (Accessories) Card (Minimalist island concept) */}
            <div className="flex-1 min-h-0">
              <motion.div
                whileHover={{ scale: 0.99 }}
                transition={{ duration: 0.4 }}
                onClick={() => handleCategoryClick('accessories')}
                className="relative w-full h-full rounded-xl sm:rounded-2xl md:rounded-3xl overflow-hidden shadow-md cursor-pointer group"
              >
                <img
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
                  alt="Accessories Collection"
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/55 to-transparent" />
                <div className="absolute bottom-2 left-2 sm:bottom-6 sm:left-8 text-white select-none">
                  <h3 className="text-[10px] xs:text-[12px] sm:text-2.5xl sm:text-3xl font-serif text-white font-medium">
                    Acc
                  </h3>
                </div>
              </motion.div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
