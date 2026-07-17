import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Eye, ShoppingCart, ArrowLeft, ArrowRight } from 'lucide-react';
import { Product, SectionBackdrop, Category } from '../types';
import { getProductPrice } from '../utils';
import { optimizeUnsplashUrl } from '../utils/imageOptimizer';

interface CategoryScrollSlicesProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  onSelectCategory: (category: string) => void;
  onQuickAddToCart: (product: Product) => void;
  categoriesList?: Category[];
  categoryImages?: {
    [key: string]: string | undefined;
  };
  categoryTexts?: {
    [key: string]: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; } | undefined;
  };
  backdrop?: SectionBackdrop;
  categoryBackdrops?: {
    [key: string]: SectionBackdrop | undefined;
  };
}

// Helper component for individual product cards within Category Scroll Slices
interface CategoryProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onQuickAddToCart: (product: Product) => void;
  isArabic: boolean;
}

const CategoryProductCard: React.FC<CategoryProductCardProps> = ({
  product,
  onSelectProduct,
  onQuickAddToCart,
  isArabic
}) => {
  const priceInfo = getProductPrice(product);
  
  // Collect all unique images
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

  const activeImage = allImages[hoverIndex] || product.image;

  return (
    <div 
      className="flex-none w-[165px] xs:w-[205px] sm:w-[255px] snap-start flex flex-col bg-zinc-950/45 border border-zinc-850/40 rounded-2xl overflow-hidden group/prod cursor-pointer"
      onClick={() => onSelectProduct(product)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image box with sold out banner */}
      <div className="relative aspect-[3/4] bg-zinc-900 overflow-hidden shrink-0">
        <img
          src={optimizeUnsplashUrl(activeImage, 320, 65)}
          alt={isArabic ? product.nameAr : product.nameEn}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover/prod:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=65&w=320";
          }}
        />
        
        {/* Hover image pagination indicators */}
        {allImages.length > 1 && isHovered && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 backdrop-blur-md py-1 px-2 rounded-full">
            {allImages.map((_, idx) => (
              <span
                key={idx}
                className={`h-1 rounded-full transition-all duration-300 ${
                  hoverIndex === idx ? 'w-2.5 bg-white' : 'w-1 bg-white/40'
                }`}
              />
            ))}
          </div>
        )}
        
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center">
            <span className="text-[7px] xs:text-[10px] tracking-wider text-red-100 bg-red-900/90 border border-red-800 py-1 px-2.5 rounded-full font-bold uppercase">
              {isArabic ? "نفد" : "SOLD OUT"}
            </span>
          </div>
        )}

        {priceInfo.hasDiscount && product.inStock && (
          <div className="absolute top-2 right-2 bg-red-655 text-white text-[8px] xs:text-[9.5px] px-2 py-0.5 rounded-md font-bold uppercase select-none">
            {isArabic ? "خصم" : "Sale"}
          </div>
        )}
      </div>

      {/* Info Panel */}
      <div className="p-3 sm:p-4 flex flex-col flex-1 justify-between gap-2.5 text-right sm:text-right bg-[#000000]" style={{ textAlign: isArabic ? 'right' : 'left' }}>
        <div>
          <h4 className="text-[13px] sm:text-[14px] font-bold text-white hover:text-amber-400 transition leading-snug break-words mb-1">
            {isArabic ? product.nameAr : product.nameEn}
          </h4>
          
          {/* Distinguishing Feature under product name */}
          {(isArabic ? product.distinguishingFeatureAr : product.distinguishingFeatureEn) && (
            <div className="inline-block text-[9px] font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded mb-1.5 uppercase tracking-wider">
              {isArabic ? product.distinguishingFeatureAr : product.distinguishingFeatureEn}
            </div>
          )}

          <div className="flex items-center justify-between gap-1.5 mt-0.5 flex-wrap">
            <p className="text-[8px] xs:text-[9.5px] text-zinc-455 font-mono tracking-wider uppercase">
              {isArabic ? (product.subcategoryAr || "تصميم راقٍ") : (product.subcategoryEn || "COUTURE")}
            </p>
          </div>
        </div>

        <div className="pt-2.5 border-t border-zinc-900 flex items-center justify-between gap-1">
          {/* Price label */}
          <div className="flex flex-col text-left font-sans">
            {priceInfo.hasDiscount && (
              <span className="text-zinc-500 line-through text-[8px] xs:text-[9.5px] leading-none mb-0.5">
                {priceInfo.original}
              </span>
            )}
            <div className="flex items-center gap-0.5">
              <span className={`text-[10.5px] xs:text-xs sm:text-sm font-bold ${priceInfo.hasDiscount ? 'text-red-400' : 'text-white'}`}>
                {priceInfo.current}
              </span>
              <span className="text-[11.5px] text-[#ffffff] font-bold uppercase">{isArabic ? 'ج' : 'EGP'}</span>
            </div>
          </div>

          {/* Buy button */}
          {product.inStock ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onQuickAddToCart(product);
              }}
              className="w-[28px] h-[28px] sm:w-[32px] sm:h-[32px] bg-amber-500 hover:bg-amber-450 text-zinc-950 rounded-full flex items-center justify-center transition border border-amber-450 cursor-pointer shadow-xs scale-95 group-hover/prod:scale-100 hover:scale-105 active:scale-95 shrink-0"
              title={isArabic ? "إضافة سريعة للسلة" : "Quick Purchase"}
            >
              <ShoppingCart size={13} strokeWidth={2.5} />
            </button>
          ) : (
            <span className="text-[8px] xs:text-[9.5px] text-zinc-500 italic font-mono uppercase bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-900">
              {isArabic ? "نفد" : "Out"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function CategoryScrollSlices({
  products,
  onSelectProduct,
  isArabic,
  onSelectCategory,
  onQuickAddToCart,
  categoriesList,
  categoryImages,
  categoryTexts,
  backdrop,
  categoryBackdrops
}: CategoryScrollSlicesProps) {

  const fallbackDescs: Record<string, { ar: string; en: string }> = {
    women: { ar: 'قطع أنيقة وحصرية مصممة لتناسب المرأة الواثقة والعصرية.', en: 'Exclusive elegant statements designed for the confident modern woman.' },
    men: { ar: 'تصاميم رسمية وغير رسمية توفر الراحة والأناقة لكل يوم.', en: 'Sharp lines and effortless styles optimized for casual and formal wear.' },
    kids: { ar: 'ملابس صغار ناعمة ومحاكة بحرفية عالية لتوفر أجمل طلّة وأكبر راحة.', en: 'Premium fabrics tailored meticulously to provide safety, longevity, and absolute style.' },
    accessories: { ar: 'لمسات نهائية تكمل مظهرك الفخم وتجعله متكاملاً.', en: 'Impeccable accents and leather elements meant to elevate your daily style statement.' }
  };

  const categories = (categoriesList && categoriesList.length > 0)
    ? categoriesList.map(c => ({
        id: c.id,
        fallbackTitleAr: c.nameAr,
        fallbackTitleEn: c.nameEn,
        fallbackDescAr: fallbackDescs[c.id]?.ar || (isArabic ? 'تصميم مذهل بجودة وخامات فاخرة استثنائية.' : 'Fabulous designs with exceptional quality fabrics.'),
        fallbackDescEn: fallbackDescs[c.id]?.en || (isArabic ? 'تصميم مذهل بجودة وخامات فاخرة استثنائية.' : 'Fabulous designs with exceptional quality fabrics.')
      }))
    : [];

  const handleCategoryHeaderClick = (catId: string) => {
    onSelectCategory(catId);
    const catalog = document.getElementById('catalog-shelf');
    if (catalog) {
      catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const isLightTextMain = backdrop ? backdrop.textColor === 'light' : true;

  const sectionStyle: React.CSSProperties = backdrop ? {
    background: backdrop.type === 'solid'
      ? (backdrop.solidColor || '#232420')
      : `linear-gradient(${
          backdrop.gradientDirection === 'to-r' ? 'to right' :
          backdrop.gradientDirection === 'to-tr' ? 'to top right' :
          backdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
        }, ${backdrop.gradientFrom || '#232420'}, ${backdrop.gradientTo || '#2a2b25'})`
  } : {};

  return (
    <section 
      id="category-scroll-slices" 
      style={sectionStyle}
      className={`${backdrop ? '' : 'bg-gradient-to-b from-[#232420] to-[#2a2b25]'} py-12 sm:py-20 md:py-24 border-b border-[#2d2e28] text-white select-none`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Editorial Title */}
        <div className="flex flex-col mb-10 sm:mb-16 text-center max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 justify-center py-1 px-3 bg-[#ffffff] border border-[#000000] rounded-full text-[#050505] text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
            <Sparkles size={12} className="animate-pulse text-[#050505]" />
            <span>{isArabic ? "تصفح عبر الأقسام" : "EXPLORE BY PORTFOLIO SLICES"}</span>
          </span>
          <h2 className={`text-2xl xs:text-3.5xl md:text-5xl font-serif font-light tracking-tight leading-tight ${isLightTextMain ? 'text-white' : 'text-zinc-950'}`}>
            {isArabic ? "تسوّق حسب الفئات" : "Shop by Category Slices"}
          </h2>
          <p className={`text-xs sm:text-sm leading-relaxed ${isLightTextMain ? 'text-zinc-350' : 'text-zinc-650'}`}>
            {isArabic 
              ? "مجموعات فاخرة ومنسقة تم تقسيمها بعناية من أجل تجربة تنقل استثنائية." 
              : "Bespoke custom categories compiled seamlessly to bring premium craftsmanship to your fingertips."}
          </p>
        </div>

        {/* Categories Loop */}
        <div className="space-y-12 sm:space-y-20 md:space-y-28">
          {(() => {
            let renderedCount = 0;
            return categories.map((cat) => {
              const catProducts = products.filter(p => p.category === cat.id).slice(0, 10);
              if (catProducts.length === 0) return null;

              const customText = categoryTexts?.[cat.id];
              const title = isArabic 
                ? (customText?.titleAr || cat.fallbackTitleAr) 
                : (customText?.titleEn || cat.fallbackTitleEn);
              const desc = isArabic 
                ? (customText?.descAr || cat.fallbackDescAr) 
                : (customText?.descEn || cat.fallbackDescEn);

              const catBackdrop = categoryBackdrops?.[cat.id];
              const isLightTextCat = catBackdrop ? catBackdrop.textColor === 'light' : true;
              
              const baseBackStyle: React.CSSProperties = catBackdrop ? {
                background: catBackdrop.type === 'solid'
                  ? (catBackdrop.solidColor || '#141512')
                  : `linear-gradient(${
                      catBackdrop.gradientDirection === 'to-r' ? 'to right' :
                      catBackdrop.gradientDirection === 'to-tr' ? 'to top right' :
                      catBackdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
                    }, ${catBackdrop.gradientFrom || '#141512'}, ${catBackdrop.gradientTo || '#1e1f1a'})`
              } : {
                background: 'linear-gradient(to bottom, #141512, #1d1e1a)'
              };

              const currentRenderIndex = renderedCount;
              renderedCount++;

              const cardBackStyle: React.CSSProperties = currentRenderIndex === 1
                ? { ...baseBackStyle, backgroundColor: '#ffffff', background: '#ffffff' }
                : baseBackStyle;

              const scrollCategoryLeft = () => {
                const scroller = document.getElementById(`scroller-${cat.id}`);
                if (scroller) {
                  scroller.scrollBy({ left: -300, behavior: 'smooth' });
                }
              };

              const scrollCategoryRight = () => {
                const scroller = document.getElementById(`scroller-${cat.id}`);
                if (scroller) {
                  scroller.scrollBy({ left: 300, behavior: 'smooth' });
                }
              };

              const catImage = categoryImages?.[cat.id] || (
                cat.id === 'women' ? "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=1000" :
                cat.id === 'men' ? "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800" :
                cat.id === 'kids' ? "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=800" :
                "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800"
              );

              return (
                <div 
                  key={cat.id} 
                  style={cardBackStyle}
                  className="rounded-3xl sm:rounded-[2.5rem] border border-zinc-800/10 p-4 xs:p-6 sm:p-10 lg:p-12 overflow-hidden shadow-inner flex flex-col lg:flex-row gap-6 md:gap-10 items-stretch relative"
                >
                {/* Background ambient accent color */}
                <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />

                {/* Left Column: Category Editorial Card */}
                <div 
                  onClick={() => handleCategoryHeaderClick(cat.id)}
                  className="w-full lg:w-[44%] relative overflow-hidden rounded-2xl md:rounded-[2.25rem] border border-amber-500/20 hover:border-amber-400 bg-zinc-950 shadow-[0_10px_40px_rgba(0,0,0,0.6)] hover:shadow-[0_15px_50px_rgba(245,158,11,0.22)] flex flex-col justify-between shrink-0 p-8 sm:p-12 cursor-pointer group/cat min-h-[400px] lg:min-h-[570px] transition-all duration-500 scale-100 hover:scale-[1.025]" 
                  style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                >
                  {/* Category Background Image */}
                  <div className="absolute inset-0 z-0">
                    <img 
                      src={optimizeUnsplashUrl(catImage, 700, 75)} 
                      alt={title} 
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover/cat:scale-[1.10] filter brightness-[0.95] contrast-[1.02]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src = cat.id === 'women' ? "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=1000" :
                                              cat.id === 'men' ? "https://images.unsplash.com/photo-1488161628813-04466f872be2?auto=format&fit=crop&q=80&w=1000" :
                                              cat.id === 'kids' ? "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?auto=format&fit=crop&q=80&w=1000" :
                                              "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=1000";
                      }}
                    />
                    {/* Dark contrast gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/45 to-zinc-950/15" />
                  </div>

                  {/* Top content */}
                  <div className="relative z-10 space-y-3 sm:space-y-4 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest tracking-[0.25em]">{isArabic ? "حياكة فاخرة" : "FINE ARTISTRY"}</span>
                    <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold tracking-tight text-white leading-tight">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed font-sans text-zinc-200/90 max-w-sm">
                      {desc}
                    </p>
                  </div>

                  {/* Bottom interactions */}
                  <div className="relative z-10 mt-8 flex flex-wrap items-center justify-between gap-4">
                    <span
                      className="text-xs font-bold uppercase tracking-wider text-amber-400 group-hover/cat:text-amber-300 underline underline-offset-4 decoration-2 transition cursor-pointer"
                    >
                      {isArabic ? "تصفح القسم بالكامل" : "View Entire Section"}
                    </span>

                    {/* Scroller controls */}
                    <div className="hidden sm:flex items-center gap-2.5" dir="ltr" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={scrollCategoryLeft} 
                        className="w-9 h-9 rounded-full border border-white/25 bg-zinc-950/60 hover:bg-amber-400 hover:text-black hover:border-amber-400 transition flex items-center justify-center text-white cursor-pointer"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <button 
                        onClick={scrollCategoryRight} 
                        className="w-9 h-9 rounded-full border border-white/25 bg-zinc-950/60 hover:bg-amber-400 hover:text-black hover:border-amber-400 transition flex items-center justify-center text-white cursor-pointer"
                      >
                        <ArrowRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right Column: Horizontal Scroll Slices of Products */}
                <div className="w-full lg:w-[56%] relative flex items-center min-w-0">
                  <div 
                    id={`scroller-${cat.id}`}
                    className="w-full flex gap-3 xs:gap-4 sm:gap-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-none scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                  >
                    {catProducts.map((product) => (
                      <CategoryProductCard
                        key={product.id}
                        product={product}
                        onSelectProduct={onSelectProduct}
                        onQuickAddToCart={onQuickAddToCart}
                        isArabic={isArabic}
                      />
                    ))}
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
