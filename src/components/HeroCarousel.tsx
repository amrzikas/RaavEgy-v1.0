import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeroCarouselProps {
  onBrowseCategory: (cat: string) => void;
  isArabic: boolean;
}

const HERO_SLIDES = [
  {
    id: 1,
    overlineAr: "— ربيع / صيف ٢٠٢٦",
    overlineEn: "— SPRING / SUMMER 2026",
    titleAr: "تعريف الأناقة اليومية.",
    titleEn: "Refining Everyday Elegance.",
    descAr: "اكتشف الجماليات المعاصرة مع مجموعتنا المنسقة حديثًا. مصممة للجرأة والجمال والبساطة.",
    descEn: "Discover the modern aesthetic with our newly curated collection. Designed for the bold, the beautiful, and the minimalist.",
    quoteAr: "التوازن المثالي بين دقة التصميم والأداء المعاصر لخزانة ملابس عصرية.",
    quoteEn: "The perfect balance of form and function for the modern wardrobe.",
    image: "https://img.kwcdn.com/product/fancy/9c18cbce-997c-4405-8b84-482cb677dd72.jpg?imageView2/2/w/800/q/70/format/avif?auto=format&fit=crop&q=80&w=1200", 
    cat: "women",
  },
  {
    id: 2,
    overlineAr: "— تشكيلة الأقطان الطبيعية",
    overlineEn: "— THE NATURAL LINENS",
    titleAr: "راحة ممتدة طوال اليوم.",
    titleEn: "Experience Timeless Calm.",
    descAr: "أقمشة كتانية وقطنية تتنفس في حرارة الصيف، منسوجة خصيصاً بنسب جودة رفيعة تلبي معايير الفخامة الهادئة.",
    descEn: "Pure organic fibers woven to allow airflow and extreme comfort under Cairo's golden sun rays.",
    quoteAr: "خامات ذات نسيج يعيد ابتكار مفهوم الرفاهية المباشرة بجودة تدوم.",
    quoteEn: "Elevated structures built specifically for people who cherish quiet luxury aesthetics.",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
    cat: "men",
  },
  {
    id: 3,
    overlineAr: "— إكسسوارات منسقة بعناية",
    overlineEn: "— LUXURY ACCENTS",
    titleAr: "اكتمال التفاصيل الدقيقة.",
    titleEn: "Composing Perfect Accents.",
    descAr: "ساعات كلاسيكية، حقائب ومنسوجات مكملة تصاحبك لتمنح حضورك بصمة من الفرادة والجاذبية.",
    descEn: "From elegant timepieces to minimalist leatherware, find the fine lines that complete your silhouette.",
    quoteAr: "لمسات أخيرة من الرقي والكمال تكسب كل مظهر شخصيته الفريدة.",
    quoteEn: "Premium accessories designed to integrate seamlessly into a premium custom closet.",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=1200",
    cat: "accessories",
  }
];

export default function HeroCarousel({
  onBrowseCategory,
  isArabic
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 8500);
    return () => clearInterval(timer);
  }, []);

  const handleNext = () => {
    setCurrentIndex((currentIndex + 1) % HERO_SLIDES.length);
  };

  const handlePrev = () => {
    setCurrentIndex((currentIndex - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  };

  const currentSlide = HERO_SLIDES[currentIndex];

  // Helper to split and italicize words nicely if En
  const renderTitle = (text: string, isEn: boolean) => {
    if (!isEn) {
      // In Arabic, let's make the second word italicized for luxury look and feel
      const words = text.split(' ');
      if (words.length >= 2) {
        return (
          <>
            {words[0]}{' '}
            <span className="font-serif italic text-amber-800 font-normal">{words[1]}</span>{' '}
            {words.slice(2).join(' ')}
          </>
        );
      }
      return text;
    }

    // In English, replace "Everyday", "Timeless", or "Perfect" with serif italics
    const words = text.split(' ');
    return (
      <>
        {words.map((word, idx) => {
          const isTarget = word.toLowerCase().replace(/[^a-z]/g, '') === 'everyday' || 
                         word.toLowerCase().replace(/[^a-z]/g, '') === 'timeless' ||
                         word.toLowerCase().replace(/[^a-z]/g, '') === 'perfect';
          if (isTarget) {
            return (
              <span key={idx} className="font-serif italic font-normal text-amber-800/90 mr-2 lg:mr-3">
                {word}{' '}
              </span>
            );
          }
          return <span key={idx}>{word} </span>;
        })}
      </>
    );
  };

  return (
    <div id="hero-slider-stage" className="relative bg-[#ffffff] overflow-hidden w-full py-8 md:py-16 border-b border-zinc-100 select-none">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.6 }}
            className={`grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center`}
            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
          >
            
            {/* Left/Main Column - Editorial Copy */}
            <div className="md:col-span-5 space-y-6 md:space-y-8 flex flex-col justify-center" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              
              {/* Spaced Elegant Subtitle */}
              <div className="text-[10px] md:text-xs font-semibold tracking-[0.25em] text-zinc-400 uppercase font-sans">
                {isArabic ? currentSlide.overlineAr : currentSlide.overlineEn}
              </div>

              {/* Title Section (with Serifying) */}
              <h1 className="text-5xl sm:text-6xl md:text-6xl lg:text-7xl font-light tracking-tight leading-[1.08] text-zinc-950 font-serif">
                {renderTitle(isArabic ? currentSlide.titleAr : currentSlide.titleEn, !isArabic)}
              </h1>

              {/* Body Description */}
              <p className="text-zinc-500 text-xs sm:text-sm md:text-[15px]/relaxed font-sans font-light max-w-md">
                {isArabic ? currentSlide.descAr : currentSlide.descEn}
              </p>

              {/* Action Buttons styled precisely like the screenshot */}
              <div className="pt-2 flex flex-wrap gap-4 items-center" style={{ justifyContent: isArabic ? 'flex-start' : 'flex-start' }}>
                <button
                  onClick={() => onBrowseCategory('all')}
                  className="px-8 py-4 bg-black hover:bg-zinc-900 text-white hover:text-amber-100 rounded-full font-semibold text-xs tracking-[0.15em] uppercase transition shadow-md flex items-center gap-2 cursor-pointer font-sans"
                >
                  <span>{isArabic ? "تسوق التشكيلة" : "SHOP COLLECTION"}</span>
                  <span className="text-sm">→</span>
                </button>
                
                <button
                  onClick={() => onBrowseCategory(currentSlide.cat)}
                  className="px-8 py-4 bg-transparent hover:bg-zinc-50 border border-zinc-200 text-zinc-800 hover:text-black hover:border-zinc-400 rounded-full font-semibold text-xs tracking-[0.15em] uppercase transition cursor-pointer font-sans"
                >
                  {isArabic ? "استكشف التشكيلة المنسقة" : "EXPLORE LOOKBOOK"}
                </button>
              </div>

            </div>

            {/* Right Column - Scenic Rounded Image and Overlapping Balloon Card */}
            <div className="md:col-span-7 relative flex justify-center items-center mt-6 md:mt-0">
              
              {/* Round Corner Frame precisely like the screenshot */}
              <div className="relative w-full max-w-lg aspect-[5/4] sm:aspect-[4/3] rounded-[2.2rem] md:rounded-[3rem] overflow-hidden shadow-2xl">
                <img
                  src={currentSlide.image}
                  alt={isArabic ? currentSlide.titleAr : currentSlide.titleEn}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                
                {/* Micro-light gradient to ensure clean overlay contrast */}
                <div className="absolute inset-0 bg-gradient-to-tr from-black/10 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Overlapping Editor's Pick Card exactly matching the visual placement */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className={`absolute bottom-[-24px] ${isArabic ? 'right-4 sm:right-12' : 'left-4 sm:left-12'} w-[240px] sm:w-[280px] bg-white/95 backdrop-blur-md p-5 sm:p-6 rounded-2xl shadow-xl border border-zinc-100 z-10 flex flex-col space-y-2`}
                style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
              >
                <div className="text-[9px] font-bold tracking-[0.2em] text-zinc-400 uppercase font-sans">
                  {isArabic ? "اختيارات المحرر" : "EDITOR'S PICK"}
                </div>
                <div className="font-serif italic text-zinc-800 text-[12px] sm:text-[13px] leading-relaxed">
                  "{isArabic ? currentSlide.quoteAr : currentSlide.quoteEn}"
                </div>
              </motion.div>

            </div>

          </motion.div>
        </AnimatePresence>

        {/* Manual Slides Dot navigation and side control steps */}
        <div className="mt-14 flex items-center justify-between border-t border-zinc-100 pt-6">
          <div className="flex gap-2.5">
            {HERO_SLIDES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx 
                    ? "w-10 bg-zinc-950" 
                    : "w-2.5 bg-zinc-200 hover:bg-zinc-350"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrev}
              className="p-2 border border-zinc-200 hover:border-zinc-400 rounded-full text-zinc-600 hover:text-zinc-900 transition bg-white shadow-sm cursor-pointer"
              title={isArabic ? "السابق" : "Previous Slide"}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={handleNext}
              className="p-2 border border-zinc-200 hover:border-zinc-400 rounded-full text-zinc-600 hover:text-zinc-900 transition bg-white shadow-sm cursor-pointer"
              title={isArabic ? "التالي" : "Next Slide"}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
