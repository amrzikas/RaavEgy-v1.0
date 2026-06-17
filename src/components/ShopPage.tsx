import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { getProductPrice } from '../utils';
import { SlidersHorizontal, Search, ArrowUpDown, Eye, ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface ShopPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  initialCategory?: 'all' | 'men' | 'women' | 'kids' | 'accessories';
}

const AVAILABLE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '38', '40', '42', '44'];
const PREMIUM_COLORS = [
  { hex: '#000000', labelEn: 'Black', labelAr: 'أسود' },
  { hex: '#ffffff', labelEn: 'White', labelAr: 'أبيض' },
  { hex: '#1e3a8a', labelEn: 'Navy Blue', labelAr: 'أزرق داكن' },
  { hex: '#78350f', labelEn: 'Brown/Earth', labelAr: 'بني ترابي' },
  { hex: '#65a30d', labelEn: 'Sage/Olive', labelAr: 'زيتي ملائي' },
  { hex: '#f5f5dc', labelEn: 'Beige/Sand', labelAr: 'بيج رملي' },
  { hex: '#dc2626', labelEn: 'Royal Red', labelAr: 'أحمر ملكي' }
];

export default function ShopPage({ products, onSelectProduct, isArabic, initialCategory = 'all' }: ShopPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'men' | 'women' | 'kids' | 'accessories'>(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'newest'>('default');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedSize(null);
    setSelectedColor(null);
    setMinPrice(0);
    setMaxPrice(2500);
    setSortBy('default');
  };

  // Compute products listing
  const filteredProducts = useMemo(() => {
    return products
      .filter((prod) => {
        // Category Filter
        if (selectedCategory !== 'all' && prod.category !== selectedCategory) return false;

        // Search Filter
        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase();
          const matchesEn = prod.nameEn.toLowerCase().includes(q) || prod.descriptionEn.toLowerCase().includes(q);
          const matchesAr = prod.nameAr.toLowerCase().includes(q) || prod.descriptionAr.toLowerCase().includes(q);
          if (!matchesEn && !matchesAr) return false;
        }

        // Size Filter
        if (selectedSize && !prod.sizes.includes(selectedSize)) return false;

        // Color Filter (match approximate or near equal colors)
        if (selectedColor) {
          // Check if product offers this hex or color contains keyword
          const matchesHex = prod.colors.some(c => c.toLowerCase() === selectedColor.toLowerCase());
          if (!matchesHex) return false;
        }

        // Price Filter (Calculates dynamic prices)
        const activePrice = getProductPrice(prod).current;
        if (activePrice < minPrice || activePrice > maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        const activePriceA = getProductPrice(a).current;
        const activePriceB = getProductPrice(b).current;
        if (sortBy === 'price-low') return activePriceA - activePriceB;
        if (sortBy === 'price-high') return activePriceB - activePriceA;
        if (sortBy === 'newest') return b.createdAt - a.createdAt;
        return 0; // Default ordering
      });
  }, [products, selectedCategory, searchQuery, selectedSize, selectedColor, minPrice, maxPrice, sortBy]);

  return (
    <div className="bg-[#fbfcff] min-h-screen pt-24 pb-16 font-sans text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Banner Title */}
        <div className="mb-8 border-b border-zinc-100 pb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          <div>
            <h1 className="text-3xl font-serif font-medium tracking-tight text-zinc-950 flex items-center gap-2">
              <Sparkles className="text-amber-500 animate-pulse" size={24} />
              <span>{isArabic ? "المعرض الفاخر للطلبات" : "Premium Catalog"}</span>
            </h1>
            <p className="text-xs text-zinc-400 uppercase tracking-widest font-sans mt-1">
              {isArabic 
                ? "استكشف وصمّم خزانة ملابسك بأعلى معايير الحياكة المصرية والشحن السريع بلمسة واحدة" 
                : "Explore our collection hand-tailored with premium Egyptian cotton"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs border border-zinc-200 hover:border-black rounded-lg text-zinc-650 hover:text-black transition cursor-pointer bg-white"
            >
              {isArabic ? "بدء تصفية جديدة" : "Reset Filters"}
            </button>
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden px-4 py-2 text-xs bg-black text-white rounded-lg flex items-center gap-2 cursor-pointer"
            >
              <SlidersHorizontal size={14} />
              <span>{isArabic ? "الفلاتر والألوان" : "Filters"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* SIDEBAR FILTERS (Desktop) & Collapsible (Mobile) */}
          <div className={`lg:block ${showFiltersMobile ? 'block' : 'hidden'} lg:col-span-1 space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-xs h-fit`}>
            
            {/* Search Box */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "البحث بالاسم الكلمة" : "Search Outfit"}
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder={isArabic ? "مثال: لينن، فستان، كاب..." : "e.g. Linen, Dress, Hat..."}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2 px-4 text-xs focus:outline-none focus:border-black focus:bg-white text-zinc-900 transition-all pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                />
                <Search size={14} className="absolute left-3.5 top-3 text-zinc-400" />
              </div>
            </div>

            {/* Category Filter */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "التصنيف الرئيسي" : "Categories"}
              </h3>
              <div className="space-y-1.5">
                {(['all', 'men', 'women', 'kids', 'accessories'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex justify-between items-center ${
                      selectedCategory === cat
                        ? "bg-black text-white"
                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span>
                      {cat === 'all' && (isArabic ? 'كل الموديلات المعروضة' : 'Global Wardrobe')}
                      {cat === 'men' && (isArabic ? 'ملابس وأزياء رجالي' : 'Men\'s Wear')}
                      {cat === 'women' && (isArabic ? 'أزياء نسائية فاخرة' : 'Women\'s Apparel')}
                      {cat === 'kids' && (isArabic ? 'ملابس أطفال مريحة' : 'Organic Kids')}
                      {cat === 'accessories' && (isArabic ? 'ساعات وإكسسوارات مميزة' : 'Curated Accessories')}
                    </span>
                    {selectedCategory === cat && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Slider and text */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "سعر القطعة بالأقصى" : "Maximum Budget"}
              </h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="3000"
                  step="50"
                  className="w-full accent-black cursor-ew-resize bg-zinc-100 h-1.5 rounded-lg appearance-none"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                />
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-700 font-mono">
                  <span>{minPrice} ج.م</span>
                  <span>{maxPrice} ج.م</span>
                </div>
              </div>
            </div>

            {/* Size Selector */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "المقاس المطلوب" : "Clothing Size"}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_SIZES.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setSelectedSize(selectedSize === sz ? null : sz)}
                    className={`h-8 min-w-[32px] px-2 rounded-md font-semibold text-xs transition border cursor-pointer flex items-center justify-center font-mono ${
                      selectedSize === sz
                        ? "bg-black border-black text-white"
                        : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Interactive Dots */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "اللون المفضل" : "Color Choice"}
              </h3>
              <div className="flex flex-wrap gap-2">
                {PREMIUM_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    onClick={() => setSelectedColor(selectedColor === col.hex ? null : col.hex)}
                    className={`w-7 h-7 rounded-full border cursor-pointer relative transition hover:scale-105 flex items-center justify-center ${
                      selectedColor === col.hex
                        ? "ring-2 ring-black ring-offset-2 ring-offset-white"
                        : "border-zinc-200"
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={isArabic ? col.labelAr : col.labelEn}
                  >
                    {selectedColor === col.hex && (
                      <Check size={11} className={col.hex.toLowerCase() === '#ffffff' ? 'text-zinc-950' : 'text-white'} strokeWidth={3} />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isArabic ? "ترتيب المنتجات" : "Sort By"}
              </h3>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:border-black appearance-none cursor-pointer"
                >
                  <option value="default">{isArabic ? "التلقائي المعروض" : "Default Listing"}</option>
                  <option value="price-low">{isArabic ? "السعر: من الأقل للأعلى" : "Price: Low to High"}</option>
                  <option value="price-high">{isArabic ? "السعر: من الأعلى للأقل" : "Price: High to Low"}</option>
                  <option value="newest">{isArabic ? "الموديلات الأحدث وصولاً" : "New Arrivals"}</option>
                </select>
                <ArrowUpDown size={12} className={`absolute ${isArabic ? 'left-3' : 'right-3'} top-3 text-zinc-400 pointer-events-none`} />
              </div>
            </div>

          </div>

          {/* MAIN PRODUCT SHOWCASE GRID */}
          <div className="lg:col-span-3">
            
            {/* Products Counter Card */}
            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl px-6 py-4 mb-6 flex justify-between items-center text-xs font-medium text-zinc-650" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              <span>
                {isArabic 
                  ? `عُثر على ${filteredProducts.length} قطعة ملابس رائعة` 
                  : `Located ${filteredProducts.length} premium pieces`}
              </span>
              <span className="text-[10px] text-zinc-400 italic">
                {isArabic ? "* التغيير والمقاس متوفر دليفري" : "Doorstep sizing tests available"}
              </span>
            </div>

            {/* Products collection */}
            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center bg-white border border-zinc-100 rounded-3xl" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <AlertCircle className="mx-auto text-zinc-300 mb-4 animate-pulse" size={48} />
                <h3 className="text-lg font-serif font-bold text-zinc-950 mb-1">
                  {isArabic ? "عذراً، لم نعثر على نتائج!" : "No Matching Clothes"}
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed mb-6 font-light">
                  {isArabic 
                    ? "قمت بتحديد عدة فلاتر صارمة. يرجى تصفير الفلاتر للتسوق من تشكيلتنا الواسعة والجميلة." 
                    : "No clothes match the combination of your active filters. Try lowering criteria."}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 bg-black text-white hover:bg-zinc-900 rounded-full text-xs font-semibold tracking-wider transition cursor-pointer"
                >
                  {isArabic ? "تصفير جميع منقيات البحث" : "Clear All Settings"}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    layout
                    key={product.id}
                    onClick={() => onSelectProduct(product)}
                    className="group bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200/80 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                  >
                    {/* Relative Image Display */}
                    <div className="aspect-[4/5] bg-zinc-50 relative overflow-hidden">
                      <img
                        src={product.image}
                        alt={isArabic ? product.nameAr : product.nameEn}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-103"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Dark overlay & eye quick view indicator */}
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                        <span className="p-2.5 bg-white text-zinc-900 rounded-full shadow-md scale-75 group-hover:scale-100 transition duration-300">
                          <Eye size={16} strokeWidth={2.5} />
                        </span>
                      </div>

                      {/* Out of stock watermark */}
                      {!product.inStock && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <span className="px-3 py-1.5 bg-zinc-950 text-white font-sans text-[10px] font-bold uppercase rounded-lg tracking-widest shadow-sm">
                            {isArabic ? "نفذت الكمية" : "Sold Out"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Meta tags and pricing */}
                    <div className="p-4 flex-1 flex flex-col justify-between" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                      <div>
                        {/* Category meta label */}
                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-sans block mb-1">
                          {product.category === 'men' && (isArabic ? 'رجالي' : 'Men')}
                          {product.category === 'women' && (isArabic ? 'حريمي' : 'Women')}
                          {product.category === 'kids' && (isArabic ? 'أطفالي' : 'Kids')}
                          {product.category === 'accessories' && (isArabic ? 'إكسسوارات' : 'Accessories')}
                        </span>
                        
                        <h4 className="text-xs sm:text-sm font-medium text-zinc-900 leading-tight line-clamp-1 group-hover:text-black transition">
                          {isArabic ? product.nameAr : product.nameEn}
                        </h4>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-100/60 flex items-center justify-between text-xs font-bold text-zinc-900 font-serif">
                        <span>{product.price} ج.م</span>
                        {product.inStock && (
                          <span className="text-[10px] text-zinc-400 font-sans font-light">
                            {isArabic ? "معاينة مجاناً" : "Try-on free"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
