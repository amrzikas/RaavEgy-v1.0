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
  imagesColumn1?: string[];
  imagesColumn2?: string[];
  imagesColumn3?: string[];
  womenImage?: string;
  womenVideo?: string;
  menImage?: string;
  menVideo?: string;
  layout?: 'single' | 'split' | 'grid' | 'slider' | 'three_columns' | 'split_dynamic';
  onActionClick?: (link: string) => void;
  isMergedHeader?: boolean;
}

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1600",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=1200"
];

const DEFAULT_COL1 = [
  "https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=600"
];

const DEFAULT_COL2 = [
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1581044777550-4cfa60707c03?auto=format&fit=crop&q=80&w=600"
];

const DEFAULT_COL3 = [
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
  "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&q=80&w=600"
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
  imagesColumn1 = [],
  imagesColumn2 = [],
  imagesColumn3 = [],
  womenImage,
  womenVideo,
  menImage,
  menVideo,
  layout = 'split',
  onActionClick,
  isMergedHeader = false
}: MainHeroSectionProps) {
  if (!enabled) return null;

  const activeImages = images && images.filter(Boolean).length > 0 ? images.filter(Boolean) : DEFAULT_IMAGES;
  const col1Images = imagesColumn1 && imagesColumn1.filter(Boolean).length > 0 ? imagesColumn1.filter(Boolean) : DEFAULT_COL1;
  const col2Images = imagesColumn2 && imagesColumn2.filter(Boolean).length > 0 ? imagesColumn2.filter(Boolean) : DEFAULT_COL2;
  const col3Images = imagesColumn3 && imagesColumn3.filter(Boolean).length > 0 ? imagesColumn3.filter(Boolean) : DEFAULT_COL3;

  const [activeSlide, setActiveSlide] = useState(0);
  const [col1Slide, setCol1Slide] = useState(0);
  const [col2Slide, setCol2Slide] = useState(0);
  const [col3Slide, setCol3Slide] = useState(0);
  const [hoveredSide, setHoveredSide] = useState<'women' | 'men' | null>(null);

  // Auto-play for slider layout
  useEffect(() => {
    if (layout === 'slider' && activeImages.length > 1) {
      const timer = setInterval(() => {
        setActiveSlide((prev) => (prev + 1) % activeImages.length);
      }, 6000);
      return () => clearInterval(timer);
    }
  }, [layout, activeImages]);

  // Auto-play for three_columns layout (staggered timings)
  useEffect(() => {
    if (layout === 'three_columns') {
      const t1 = setInterval(() => {
        setCol1Slide((prev) => (prev + 1) % col1Images.length);
      }, 4000);
      const t2 = setInterval(() => {
        setCol2Slide((prev) => (prev + 1) % col2Images.length);
      }, 4600);
      const t3 = setInterval(() => {
        setCol3Slide((prev) => (prev + 1) % col3Images.length);
      }, 5200);

      return () => {
        clearInterval(t1);
        clearInterval(t2);
        clearInterval(t3);
      };
    }
  }, [layout, col1Images.length, col2Images.length, col3Images.length]);

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
          <AnimatePresence>
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

      {/* 5. THREE COLUMNS AMBIENT SLIDERS (FULL HEIGHT & WIDTH, ROUNDED-NONE, OVERLAID TEXT) */}
      {layout === 'three_columns' && (
        <div className={`relative w-full h-[100vh] min-h-[550px] sm:min-h-[650px] md:min-h-[800px] overflow-hidden flex items-center justify-center bg-zinc-950`}>
          
          {/* Background: 3 Rectangles Grid covering 100% space */}
          <div className="absolute inset-0 w-full h-full grid grid-cols-3 gap-1 md:gap-1.5 bg-zinc-950 rounded-none overflow-hidden select-none pointer-events-none">
            {/* Column 1 */}
            <div className="relative h-full w-full rounded-none overflow-hidden bg-zinc-950">
              <AnimatePresence>
                <motion.img
                  key={col1Slide}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  src={optimizeUnsplashUrl(col1Images[col1Slide], 600, 75)}
                  alt="Couture 1"
                  className="absolute inset-0 w-full h-full object-cover rounded-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
                {col1Images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCol1Slide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${col1Slide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Column 2 */}
            <div className="relative h-full w-full rounded-none overflow-hidden bg-zinc-950">
              <AnimatePresence>
                <motion.img
                  key={col2Slide}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  src={optimizeUnsplashUrl(col2Images[col2Slide], 600, 75)}
                  alt="Couture 2"
                  className="absolute inset-0 w-full h-full object-cover rounded-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
                {col2Images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCol2Slide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${col2Slide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>

            {/* Column 3 */}
            <div className="relative h-full w-full rounded-none overflow-hidden bg-zinc-950">
              <AnimatePresence>
                <motion.img
                  key={col3Slide}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.9 }}
                  src={optimizeUnsplashUrl(col3Images[col3Slide], 600, 75)}
                  alt="Couture 3"
                  className="absolute inset-0 w-full h-full object-cover rounded-none"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
              
              {/* Carousel Indicators */}
              <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-1.5 z-10 pointer-events-auto">
                {col3Images.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCol3Slide(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${col3Slide === idx ? 'w-5 bg-white' : 'w-1.5 bg-white/40'}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Ambient Overlay for text contrast */}
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-10" />

          {/* Floating Content Overlay */}
          {showTexts && (
            <div className="relative z-20 max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8 text-white h-full flex flex-col justify-center items-center pt-20">
              <div className="space-y-6 sm:space-y-8">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[10px] font-bold tracking-[0.2em] text-amber-200 uppercase font-sans mx-auto"
                >
                  ✦ {isArabic ? "دار تفصيل وتصميم راقٍ مخصص" : "BESPOKE COUTURE COLLECTIONS"}
                </motion.div>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.8 }}
                  className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-white leading-tight font-extralight drop-shadow-lg"
                >
                  {displayTitle}
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.8 }}
                  className="text-zinc-200 text-xs sm:text-sm md:text-base lg:text-lg max-w-2xl mx-auto font-sans font-light leading-relaxed drop-shadow-md"
                >
                  {displaySub}
                </motion.p>
                
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="pt-2"
                >
                  <button
                    onClick={handleBtnClick}
                    className="px-10 py-4 bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:scale-[1.02] rounded-full font-bold text-xs tracking-[0.2em] uppercase transition duration-300 shadow-xl cursor-pointer"
                  >
                    {displayBtnText}
                  </button>
                </motion.div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. SPLIT SCREEN DYNAMIC HOVER LAYOUT (FULL HEIGHT & WIDTH, NO ROUNDED EDGES) */}
      {layout === 'split_dynamic' && (
        <div className="relative w-full h-[100vh] min-h-[600px] overflow-hidden flex flex-col md:flex-row bg-zinc-950 rounded-none select-none">
          
          {/* WOMEN'S HALF (LEFT/RIGHT DEPENDING ON RTL/LTR) */}
          <div
            onMouseEnter={() => setHoveredSide('women')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={() => {
              if (onActionClick) {
                onActionClick('women');
              } else {
                const el = document.getElementById('collections-grid-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`relative h-1/2 md:h-full overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] border-b md:border-b-0 md:border-r border-zinc-900 cursor-pointer group ${
              hoveredSide === 'women'
                ? 'md:w-[58%] h-[55%] md:h-full'
                : hoveredSide === 'men'
                ? 'md:w-[42%] h-[45%] md:h-full'
                : 'md:w-1/2 h-1/2 md:h-full'
            }`}
          >
            {/* Background Content: Video looping without sound */}
            <div className="absolute inset-0 w-full h-full scale-105 group-hover:scale-100 transition-transform duration-[1200ms] ease-out">
              <video
                src={womenVideo || "https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-modeling-a-stylish-coat-40072-large.mp4"}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Elegant dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 group-hover:via-black/20 transition-all duration-500 pointer-events-none" />

            {/* Label, title & CTA */}
            <div className="absolute inset-0 p-6 sm:p-10 md:p-16 flex flex-col justify-end items-center text-center text-white z-10">
              <span className="text-[9px] tracking-[0.3em] font-extrabold text-amber-200 uppercase font-sans mb-2">
                ✦ {isArabic ? "الأزياء النسائية الراقية" : "WOMEN'S COUTURE"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-4 tracking-wide leading-tight">
                {isArabic ? "كولكشن النساء" : "Women's Collection"}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onActionClick) {
                    onActionClick('women');
                  } else {
                    const el = document.getElementById('collections-grid-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 py-3 bg-white text-zinc-950 hover:bg-amber-300 hover:text-zinc-950 font-bold text-[10px] tracking-[0.2em] uppercase rounded-full transition duration-300 shadow-lg transform group-hover:scale-105 cursor-pointer"
              >
                {isArabic ? "تسوقي الآن" : "SHOP WOMEN"}
              </button>
            </div>
          </div>

          {/* MEN'S HALF (RIGHT/LEFT DEPENDING ON RTL/LTR) */}
          <div
            onMouseEnter={() => setHoveredSide('men')}
            onMouseLeave={() => setHoveredSide(null)}
            onClick={() => {
              if (onActionClick) {
                onActionClick('men');
              } else {
                const el = document.getElementById('collections-grid-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className={`relative h-1/2 md:h-full overflow-hidden transition-all duration-[800ms] ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer group ${
              hoveredSide === 'men'
                ? 'md:w-[58%] h-[55%] md:h-full'
                : hoveredSide === 'women'
                ? 'md:w-[42%] h-[45%] md:h-full'
                : 'md:w-1/2 h-1/2 md:h-full'
            }`}
          >
            {/* Background Content: Image by default, transitions to Video on Hover */}
            <div className="absolute inset-0 w-full h-full scale-105 group-hover:scale-100 transition-all duration-[1200ms] ease-out">
              {hoveredSide === 'men' ? (
                <video
                  src={menVideo || "https://assets.mixkit.co/videos/preview/mixkit-confident-man-in-a-suit-34246-large.mp4"}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={menImage || "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200"}
                  alt="Men's Couture"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Elegant dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/30 group-hover:via-black/20 transition-all duration-500 pointer-events-none" />

            {/* Label, title & CTA */}
            <div className="absolute inset-0 p-6 sm:p-10 md:p-16 flex flex-col justify-end items-center text-center text-white z-10">
              <span className="text-[9px] tracking-[0.3em] font-extrabold text-amber-200 uppercase font-sans mb-2">
                ✦ {isArabic ? "الأناقة الرجالية الكلاسيكية" : "MEN'S COUTURE"}
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-serif font-light mb-4 tracking-wide leading-tight">
                {isArabic ? "كولكشن الرجال" : "Men's Collection"}
              </h2>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (onActionClick) {
                    onActionClick('men');
                  } else {
                    const el = document.getElementById('collections-grid-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="px-6 py-3 bg-white text-zinc-950 hover:bg-amber-300 hover:text-zinc-950 font-bold text-[10px] tracking-[0.2em] uppercase rounded-full transition duration-300 shadow-lg transform group-hover:scale-105 cursor-pointer"
              >
                {isArabic ? "تسوق الآن" : "SHOP MEN"}
              </button>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
