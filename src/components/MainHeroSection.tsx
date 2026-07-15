import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { optimizeUnsplashUrl } from '../utils/imageOptimizer';

interface MainHeroSectionProps {
  isArabic: boolean;
  enabled?: boolean;
  showTexts?: boolean;
  titleAr?: string;
  titleEn?: string;
  subAr?: string;
  subEn?: string;
  btnTextAr?: string;
  btnTextEn?: string;
  btnLink?: string;
  images?: string[];
  layout?: 'single' | 'split' | 'grid' | 'slider';
  onActionClick?: (link: string) => void;
  isMergedHeader?: boolean;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200"
];

const isCustomImage = (url: string) => {
  if (!url) return false;
  return !DEFAULT_IMAGES.includes(url);
};

const isLogoImage = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('logo') || lower.includes('removebg') || lower.includes('50136550237');
};

export default function MainHeroSection({
  isArabic,
  enabled = true,
  showTexts = true,
  titleAr,
  titleEn,
  subAr,
  subEn,
  btnTextAr,
  btnTextEn,
  btnLink = 'all',
  images = [],
  layout = 'split',
  onActionClick,
  isMergedHeader = false
}: MainHeroSectionProps) {
  if (!enabled) return null;

  const activeImages = images && images.filter(Boolean).length > 0 ? images.filter(Boolean) : DEFAULT_IMAGES;
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-play for slider layout
  useEffect(() => {
    if (layout === 'slider' && activeImages.length > 1) {
      const timer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % activeImages.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [layout, activeImages]);

  const displayTitle = isArabic 
    ? (titleAr || "فخامة ترتقي بحضورك.") 
    : (titleEn || "Luxury Tailored to Your Presence.");
    
  const displaySub = isArabic 
    ? (subAr || "اكتشف روعة التفصيل الخاص والقطع الراقية المنتقاة بعناية فائقة لتناسب ذوقك الرفيع.") 
    : (subEn || "Explore our premium custom bespoke atelier and ready-to-wear lines curated meticulously for high-end fashion enthusiasts.");

  const displayBtnText = isArabic 
    ? (btnTextAr || "استكشف الكولكشن") 
    : (btnTextEn || "EXPLORE THE COLLECTION");

  const handleBtnClick = () => {
    if (onActionClick) {
      onActionClick(btnLink);
    } else {
      const el = document.getElementById('collections-grid-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Render different layouts dynamically based on user setting
  return (
    <div className="relative w-full bg-zinc-50 overflow-hidden border-b border-zinc-150">
      
      {/* 1. SPLIT ATELIER LAYOUT (Default & extremely popular) */}
      {layout === 'split' && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isMergedHeader 
            ? 'pt-36 pb-12 md:pt-44 md:pb-20 lg:pt-48' 
            : 'py-12 md:py-20'
        }`}>
          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center ${isArabic ? 'lg:rtl' : ''}`} style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            
            {/* Copy & CTA */}
            {showTexts && (
              <div className="lg:col-span-5 space-y-6 md:space-y-8 text-center lg:text-start" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-800 tracking-wider uppercase font-sans">
                  ✦ {isArabic ? "دار الأزياء والطلب المخصص" : "BESPOKE COUTURE ATELIER"}
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-zinc-900 leading-[1.1] font-light tracking-tight">
                  {isArabic ? (
                    <>
                      {displayTitle.split(' ').slice(0, -1).join(' ')} <span className="italic font-normal text-zinc-900 font-serif">{displayTitle.split(' ').slice(-1)}</span>
                    </>
                  ) : (
                    <>
                      {displayTitle.split(' ').slice(0, -2).join(' ')} <span className="italic font-normal text-zinc-900 font-serif">{displayTitle.split(' ').slice(-2).join(' ')}</span>
                    </>
                  )}
                </h1>

                <p className="text-zinc-600 text-sm md:text-base leading-relaxed font-sans font-light max-w-xl">
                  {displaySub}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleBtnClick}
                    className="px-10 py-4 bg-zinc-950 hover:bg-zinc-850 hover:scale-[1.02] text-white rounded-full font-bold text-xs tracking-[0.2em] uppercase transition duration-300 shadow-xl cursor-pointer"
                  >
                    {displayBtnText}
                  </button>
                </div>
              </div>
            )}

            {/* Collage Showcase */}
            <div className={`${showTexts ? 'lg:col-span-7' : 'lg:col-span-10 lg:col-start-2'} grid grid-cols-12 gap-4 relative items-center justify-center`}>
              <div className={`col-span-8 flex items-center justify-center ${isLogoImage(activeImages[0]) ? 'aspect-square' : 'aspect-[4/5] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white bg-white'}`}>
                <img 
                  src={optimizeUnsplashUrl(activeImages[0], 800, 75)} 
                  alt="Primary Editorial" 
                  className={`w-full h-full ${isLogoImage(activeImages[0]) ? 'object-contain max-h-[300px]' : isCustomImage(activeImages[0]) ? 'object-contain p-2' : 'object-cover'}`}
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="col-span-4 flex flex-col gap-4 justify-end pb-8">
                {activeImages[1] && (
                  <div className="aspect-square rounded-3xl overflow-hidden shadow-lg border-2 border-white hover:scale-[1.05] transition duration-500 bg-white flex items-center justify-center">
                    <img 
                      src={optimizeUnsplashUrl(activeImages[1], 400, 70)} 
                      alt="Secondary Editorial" 
                      className={`w-full h-full ${isCustomImage(activeImages[1]) ? 'object-contain p-2' : 'object-cover'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                {activeImages[2] && (
                  <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-lg border-2 border-white hover:scale-[1.05] transition duration-500 bg-white flex items-center justify-center">
                    <img 
                      src={optimizeUnsplashUrl(activeImages[2], 400, 70)} 
                      alt="Tertiary Editorial" 
                      className={`w-full h-full ${isCustomImage(activeImages[2]) ? 'object-contain p-2' : 'object-cover'}`}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </div>

              {/* Little ambient tag */}
              {showTexts && (
                <div className={`absolute -top-4 ${isArabic ? 'left-6' : 'right-6'} bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-zinc-100 text-[10px] font-mono text-zinc-500 uppercase tracking-widest`}>
                  ✨ {isArabic ? "تفصيل راقٍ يدوي" : "HANDCRAFTED"}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. FULL LUXURY SLIDER LAYOUT */}
      {layout === 'slider' && (
        <div className={`relative w-full h-[44vh] sm:h-[60vh] md:h-[75vh] min-h-[340px] sm:min-h-[450px] flex items-center justify-center ${
          isMergedHeader ? 'pt-16 md:pt-28' : ''
        }`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSlide}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute inset-0 w-full h-full"
            >
              {isCustomImage(activeImages[activeSlide % activeImages.length]) ? (
                <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {/* Blurred Backdrop */}
                  <img 
                    src={optimizeUnsplashUrl(activeImages[activeSlide % activeImages.length], 800, 30)} 
                    alt="Backdrop Blur" 
                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-45 scale-110 select-none pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                  {/* Contained Front Image */}
                  <img 
                    src={optimizeUnsplashUrl(activeImages[activeSlide % activeImages.length], 1200, 75)} 
                    alt="Bespoke Couture" 
                    className="relative max-h-full max-w-full object-contain p-4 z-10 select-none"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <>
                  <img 
                    src={optimizeUnsplashUrl(activeImages[activeSlide % activeImages.length], 1600, 75)} 
                    alt="Background Hero" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/60" />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Floating Content */}
          {showTexts && (
            <div className="relative z-10 max-w-4xl mx-auto text-center px-4 space-y-4 sm:space-y-6 md:space-y-8 text-white">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[9px] sm:text-[10px] font-bold tracking-[0.2em] text-zinc-300 uppercase font-sans mx-auto"
              >
                ⚜️ {isArabic ? "تشكيلة النخبة الحصرية" : "ROYAL ELITE COLLECTION"}
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif tracking-tight font-extralight text-white leading-snug sm:leading-tight"
              >
                {displayTitle}
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-zinc-200 text-[11px] xs:text-xs sm:text-sm md:text-lg font-sans max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md px-2"
              >
                {displaySub}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="pt-2 sm:pt-4"
              >
                <button
                  onClick={handleBtnClick}
                  className="px-8 py-3 sm:px-12 sm:py-4 bg-zinc-200 hover:bg-white text-zinc-950 font-bold text-[10px] sm:text-xs tracking-[0.2em] rounded-full uppercase transition duration-300 shadow-2xl hover:scale-105 cursor-pointer"
                >
                  {displayBtnText}
                </button>
              </motion.div>
            </div>
          )}

          {/* Dots Indicator */}
          {activeImages.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 z-10 flex justify-center gap-2">
              {activeImages.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1 rounded-full transition-all duration-300 ${activeSlide === idx ? 'w-8 bg-zinc-300' : 'w-2 bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. BENTO GRID COLLAGE LAYOUT */}
      {layout === 'grid' && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
          isMergedHeader 
            ? 'pt-36 pb-12 md:pt-44 md:pb-24' 
            : 'py-12 md:py-24'
        }`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
            
            {/* Left bento visual block */}
            <div className={showTexts ? 'lg:col-span-7 grid grid-cols-2 gap-4 items-center' : 'lg:col-span-10 lg:col-start-2 grid grid-cols-2 gap-4 items-center'}>
              <div className="space-y-4">
                <div className={`${isLogoImage(activeImages[0]) ? 'aspect-square' : 'aspect-[4/5] rounded-3xl overflow-hidden shadow-md bg-white'} flex items-center justify-center`}>
                  <img 
                    src={optimizeUnsplashUrl(activeImages[0], 600, 75)} 
                    alt="Bento 1" 
                    className={`w-full h-full ${isLogoImage(activeImages[0]) ? 'object-contain max-h-[220px]' : isCustomImage(activeImages[0]) ? 'object-contain p-2' : 'object-cover'}`} 
                    referrerPolicy="no-referrer" 
                  />
                </div>
                {activeImages[2] && (
                  <div className="aspect-[1/1] rounded-3xl overflow-hidden shadow-md bg-white flex items-center justify-center">
                    <img 
                      src={optimizeUnsplashUrl(activeImages[2], 500, 70)} 
                      alt="Bento 3" 
                      className={`w-full h-full ${isCustomImage(activeImages[2]) ? 'object-contain p-2' : 'object-cover'}`} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
              </div>
              <div className="space-y-4 pt-8">
                {activeImages[1] && (
                  <div className="aspect-[1/1] rounded-3xl overflow-hidden shadow-md bg-white flex items-center justify-center">
                    <img 
                      src={optimizeUnsplashUrl(activeImages[1], 500, 70)} 
                      alt="Bento 2" 
                      className={`w-full h-full ${isCustomImage(activeImages[1]) ? 'object-contain p-2' : 'object-cover'}`} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                )}
                {activeImages[3] || activeImages[0] ? (
                  <div className={`${isLogoImage(activeImages[3] || activeImages[0]) ? 'aspect-square' : 'aspect-[4/5] rounded-3xl overflow-hidden shadow-md bg-white'} flex items-center justify-center`}>
                    <img 
                      src={optimizeUnsplashUrl(activeImages[3] || activeImages[0], 600, 75)} 
                      alt="Bento 4" 
                      className={`w-full h-full ${isLogoImage(activeImages[3] || activeImages[0]) ? 'object-contain max-h-[220px]' : isCustomImage(activeImages[3] || activeImages[0]) ? 'object-contain p-2' : 'object-cover'}`} 
                      referrerPolicy="no-referrer" 
                    />
                  </div>
                ) : null}
              </div>
            </div>

            {/* Right text layout block */}
            {showTexts && (
              <div className="lg:col-span-5 space-y-6 md:space-y-8" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                <span className="text-[10px] tracking-[0.3em] font-extrabold text-zinc-800 uppercase font-sans">
                  ✦ {isArabic ? "الأناقة العصرية بمفهوم جديد" : "MODERN ARCHITECTURAL SILHOUETTES"}
                </span>
                
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-zinc-900 leading-tight">
                  {displayTitle}
                </h1>

                <p className="text-zinc-600 text-xs sm:text-sm md:text-base leading-relaxed font-sans font-light">
                  {displaySub}
                </p>

                <div className="pt-2">
                  <button
                    onClick={handleBtnClick}
                    className="px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full font-bold text-xs tracking-[0.2em] uppercase transition duration-300 shadow-md cursor-pointer"
                  >
                    {displayBtnText}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 4. SINGLE FULL-BLEED LUXURY BANNER */}
      {layout === 'single' && (
        <div className={`relative w-full aspect-[21/9] flex items-center overflow-hidden bg-zinc-950 ${
          isMergedHeader 
            ? 'min-h-[460px] md:min-h-[580px] lg:min-h-[640px]' 
            : 'min-h-[400px] md:min-h-[520px] lg:min-h-[580px]'
        }`}>
          <div className="absolute inset-0 w-full h-full">
            {isCustomImage(activeImages[0]) ? (
              <div className={`absolute inset-0 bg-zinc-950 flex items-center justify-center overflow-hidden ${
                isArabic ? 'md:justify-start md:pl-12' : 'md:justify-end md:pr-12'
              }`}>
                {/* Blurred Backdrop */}
                <img 
                  src={optimizeUnsplashUrl(activeImages[0], 800, 30)} 
                  alt="Backdrop Blur" 
                  className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-45 scale-110 select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                {/* Contained Front Image - Larger and clearer sizing */}
                <img 
                  src={optimizeUnsplashUrl(activeImages[0], 1200, 75)} 
                  alt="Single Banner Hero" 
                  className="relative max-h-[95%] max-w-[95%] md:max-h-[98%] md:max-w-[52%] lg:max-h-[100%] lg:max-w-[58%] object-contain z-10 select-none transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <>
                <img 
                  src={optimizeUnsplashUrl(activeImages[0], 1600, 75)} 
                  alt="Single Banner Hero" 
                  className={`w-full h-full object-cover object-center scale-[1.08] md:scale-[1.12] transition-all duration-700 ${isArabic ? 'md:object-left' : 'md:object-right'}`} 
                  referrerPolicy="no-referrer"
                />
              </>
            )}
          </div>

          {/* Seamless gradient overlay to blend text container and image */}
          <div className={`absolute inset-0 pointer-events-none z-10 ${
            isArabic 
              ? 'bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent md:bg-gradient-to-l md:from-zinc-950 md:via-zinc-950/70 md:to-transparent' 
              : 'bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent md:bg-gradient-to-r md:from-zinc-950 md:via-zinc-950/70 md:to-transparent'
          }`} />

          {showTexts && (
            <div className={`relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full ${
              isMergedHeader ? 'pt-32 pb-12 md:pt-40 md:pb-20' : 'py-12 md:py-20'
            }`}>
              <div 
                className={`max-w-xl space-y-6 text-white md:w-1/2 ${isArabic ? 'md:ml-auto md:mr-0' : 'md:mr-auto md:ml-0'}`} 
                style={{ textAlign: isArabic ? 'right' : 'left' }}
              >
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-300 uppercase">
                  {isArabic ? "موديلات الكوتور المتميزة" : "COUTURE PREMIUM SIGNATURE"}
                </span>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif leading-tight">
                  {displayTitle}
                </h1>
                <p className="text-zinc-200 text-xs sm:text-sm md:text-base leading-relaxed font-sans font-light">
                  {displaySub}
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleBtnClick}
                    className="px-8 py-3.5 bg-white hover:bg-zinc-200 text-zinc-950 hover:text-zinc-950 font-bold text-xs tracking-[0.15em] rounded-full uppercase transition duration-300 shadow-lg cursor-pointer"
                  >
                    {displayBtnText}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
