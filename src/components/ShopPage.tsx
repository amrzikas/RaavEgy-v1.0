import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { getProductPrice } from '../utils';
import { SlidersHorizontal, Search, ArrowUpDown, Eye, ArrowLeft, Check, Sparkles, AlertCircle, X } from 'lucide-react';
import { motion } from 'motion/react';

interface ShopPageProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  isArabic: boolean;
  initialCategory?: string;
  initialSubcategory?: string | null;
  categoriesList?: Category[];
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

export default function ShopPage({ 
  products, 
  onSelectProduct, 
  isArabic, 
  initialCategory = 'all', 
  initialSubcategory = null,
  categoriesList = []
}: ShopPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);

  const getCategoryName = (catId: string) => {
    const cat = categoriesList.find(c => c.id === catId);
    if (cat) {
      return isArabic ? cat.nameAr : cat.nameEn;
    }
    if (catId === 'men') return isArabic ? 'رجالي' : 'Men';
    if (catId === 'women') return isArabic ? 'حريمي' : 'Women';
    if (catId === 'kids') return isArabic ? 'أطفالي' : 'Kids';
    if (catId === 'accessories') return isArabic ? 'إكسسوارات' : 'Accessories';
    return catId;
  };

  const categoriesToRender = useMemo(() => {
    const list = [{ id: 'all', nameAr: 'كل الموديلات المعروضة', nameEn: 'Global Wardrobe' }];
    const rawCats = categoriesList && categoriesList.length > 0 ? categoriesList : [
      { id: 'men', nameAr: 'ملابس وأزياء رجالي', nameEn: 'Men\'s Wear', subcategories: [] },
      { id: 'women', nameAr: 'أزياء نسائية فاخرة', nameEn: 'Women\'s Apparel', subcategories: [] },
      { id: 'kids', nameAr: 'ملابس أطفال مريحة', nameEn: 'Organic Kids', subcategories: [] },
      { id: 'accessories', nameAr: 'ساعات وإكسسوارات مميزة', nameEn: 'Curated Accessories', subcategories: [] }
    ];
    rawCats.forEach(c => {
      list.push({
        id: c.id,
        nameAr: c.nameAr,
        nameEn: c.nameEn
      });
    });
    return list;
  }, [categoriesList]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(initialSubcategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [maxPrice, setMaxPrice] = useState<number>(2500);
  const [minPrice, setMinPrice] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'default' | 'price-low' | 'price-high' | 'newest'>('default');
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Sync initial category from outside (e.g. Header menu clicks)
  React.useEffect(() => {
    setSelectedCategory(initialCategory);
    setSelectedSubcategory(initialSubcategory);
  }, [initialCategory, initialSubcategory]);

  // Compute unique subcategories for the current selected category
  const availableSubcategories = useMemo(() => {
    const list: { ar: string; en: string }[] = [];
    const seen = new Set<string>();

    products.forEach((prod) => {
      if (selectedCategory !== 'all' && prod.category !== selectedCategory) return;
      
      const subAr = prod.subcategoryAr?.trim();
      const subEn = prod.subcategoryEn?.trim();

      if (subAr || subEn) {
        const key = `${subAr || ''}|||${subEn || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ ar: subAr || subEn || '', en: subEn || subAr || '' });
        }
      }
    });

    return list;
  }, [products, selectedCategory]);

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory(null);
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

        // Subcategory Filter
        if (selectedSubcategory) {
          const subAr = prod.subcategoryAr?.toLowerCase().trim();
          const subEn = prod.subcategoryEn?.toLowerCase().trim();
          const filterLower = selectedSubcategory.toLowerCase();
          if (subAr !== filterLower && subEn !== filterLower) return false;
        }

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
  }, [products, selectedCategory, selectedSubcategory, searchQuery, selectedSize, selectedColor, minPrice, maxPrice, sortBy]);

  return (
    <div id="shop-top-anchor" className="bg-[#fbfcff] min-h-screen pt-24 pb-16 font-sans text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
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

        {/* Elegant Wide Top Promotion Banner Ad */}
        <div className="mb-8 relative rounded-[2rem] overflow-hidden bg-zinc-950 border border-zinc-800 text-white min-h-[160px] md:min-h-[180px] flex flex-col justify-center p-6 md:p-8 shadow-md" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
          {/* Abstract decorative graphic elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 max-w-xs sm:max-w-sm md:max-w-md lg:max-w-[55%] xl:max-w-[60%] space-y-2">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-amber-400 font-sans border border-amber-400/40 px-2.5 py-1 rounded-full bg-amber-400/5 inline-block">
              {isArabic ? "عرض حصري محدود" : "LIMITED LUXURY EXCLUSIVE"}
            </span>
            
            <h2 className="text-lg md:text-xl font-serif font-medium tracking-tight">
              {isArabic ? "شحن مجاني وخدمة قياس منزلي مجانية بالكامل" : "Free Hometry & Express Shipping"}
            </h2>
            
            <p className="text-[10px] md:text-xs text-zinc-400 font-light leading-relaxed">
              {isArabic 
                ? "اطلب الآن قطعتين أو أكثر ونقوم بتوصيلها مع مندوب متخصص ليقوم بقياس الموديل معك في المنزل قبل إتمام الدفع." 
                : "Order any 2 pieces and our dedicated stylist delivers them alongside professional measuring tape to verify size perfection."}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <span className="text-[10px] bg-white text-zinc-950 font-bold px-3 py-1.5 rounded-lg font-mono">
                {isArabic ? "كود: FREECOUTURE" : "CODE: FREECOUTURE"}
              </span>
              <span className="text-[9px] text-zinc-400">
                {isArabic ? "* متاح لتوريدات القاهرة والجيزة" : "* Active within Cairo & Giza boundaries"}
              </span>
            </div>
          </div>

          {/* Absolutely positioned banner design model image */}
          <div className={`hidden lg:block absolute bottom-0 h-[92%] w-44 select-none pointer-events-none ${isArabic ? 'left-8 lg:left-12' : 'right-8 lg:right-12'}`}>
            <img 
              src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&q=80&w=400" 
              alt="RAAV couture collection"
              className="w-full h-full object-cover rounded-t-3xl object-top border-t border-x border-zinc-800"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Mobile Overlay */}
          {showFiltersMobile && (
            <div 
              className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs z-49 lg:hidden transition-opacity" 
              onClick={() => setShowFiltersMobile(false)}
            />
          )}

          {/* SIDEBAR FILTERS (Desktop & Mobile Drawer) */}
          <div className={`
            lg:block lg:col-span-1 lg:static lg:bg-white lg:p-6 lg:rounded-2xl lg:border lg:border-zinc-100 lg:shadow-xs lg:h-fit lg:w-auto
            ${showFiltersMobile 
              ? 'fixed inset-y-0 right-0 w-[85vw] max-w-[340px] bg-white p-6 z-50 overflow-y-auto shadow-2xl border-l border-zinc-100 space-y-6 block' 
              : 'hidden'
            }
          `}>
            
            {/* Mobile filter header with close button */}
            <div className="lg:hidden flex items-center justify-between pb-4 border-b border-zinc-150 mb-4">
              <span className="text-sm font-bold uppercase tracking-wider text-zinc-900">
                {isArabic ? "تصفية الموديلات" : "Filter Clothing"}
              </span>
              <button 
                onClick={() => setShowFiltersMobile(false)}
                className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-650 hover:text-black transition cursor-pointer"
              >
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
            
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
                {categoriesToRender.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategory(cat.id);
                    }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer flex justify-between items-center ${
                      selectedCategory === cat.id
                        ? "bg-black text-white"
                        : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100"
                    }`}
                  >
                    <span>
                      {isArabic ? cat.nameAr : cat.nameEn}
                    </span>
                    {selectedCategory === cat.id && <Check size={12} strokeWidth={3} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Subcategories */}
            {availableSubcategories.length > 0 && (
              <div style={{ textAlign: isArabic ? 'right' : 'left' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  {isArabic ? "الفئة الفرعية" : "Subcategories"}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setSelectedSubcategory(null)}
                    className={`px-3 py-1.5 rounded-full text-[10.5px] font-semibold transition cursor-pointer border ${
                      selectedSubcategory === null
                        ? "bg-amber-100/40 text-amber-950 border-amber-300 font-extrabold"
                        : "bg-zinc-50 hover:bg-zinc-100 text-zinc-650 border-zinc-200"
                    }`}
                  >
                    {isArabic ? "الكل" : "All"}
                  </button>
                  {availableSubcategories.map((sub) => {
                    const label = isArabic ? sub.ar : sub.en;
                    const isSelected = selectedSubcategory === sub.en || selectedSubcategory === sub.ar;
                    return (
                      <button
                        key={sub.en}
                        onClick={() => setSelectedSubcategory(isSelected ? null : sub.en)}
                        className={`px-3 py-1.5 rounded-full text-[10.5px] font-semibold transition cursor-pointer border ${
                          isSelected
                            ? "bg-amber-100/40 text-amber-950 border-amber-300 font-extrabold"
                            : "bg-zinc-50 hover:bg-zinc-100 text-zinc-650 border-zinc-200"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

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
                  <span>{minPrice} {isArabic ? "ج.م" : "EGP"}</span>
                  <span>{maxPrice} {isArabic ? "ج.م" : "EGP"}</span>
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

            {/* Elegant Sidebar Banner Ad */}
            <div className="pt-6 border-t border-zinc-100 space-y-3" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              <div className="flex justify-between items-center bg-amber-500/10 px-2 py-1 rounded-md w-fit">
                <span className="text-[9px] font-black uppercase tracking-widest text-[#b45309]">
                  {isArabic ? "برعاية راف كوتور" : "Sponsored by RAAV Couture"}
                </span>
              </div>
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] group border border-zinc-100 shadow-xs">
                <img 
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=400" 
                  alt="RAAV bespoke tailoring"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent flex flex-col justify-end p-4 text-white">
                  <h4 className="font-serif text-sm font-bold tracking-tight leading-snug">
                    {isArabic ? "تصميم وتفصيل حسب قياسك الخاص" : "Artesanal Bespoke Tailoring"}
                  </h4>
                  <p className="text-[10px] text-zinc-300 font-light mt-1 max-w-xs leading-relaxed">
                    {isArabic 
                      ? "احصل على قطع مفصلة يدويًا خصيصًا لجسدك بأرقى الأقمشة الإيطالية والمصرية." 
                      : "Fitted securely to your physical profile by our skilled local tailors in Cairo."}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-amber-400">
                    <span>{isArabic ? "احجز موعد قياس مجاني" : "Book Custom Appointment"}</span>
                    <span className="text-sm select-none">→</span>
                  </div>
                </div>
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
                {filteredProducts.flatMap((product, idx) => {
                  const productCard = (
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
                          {/* Category meta label & Stock Indicator */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest font-sans block">
                              {getCategoryName(product.category)}
                            </span>
                          </div>
                          
                          <h4 className="text-[10px] sm:text-xs font-medium text-zinc-900 leading-tight group-hover:text-black transition break-words">
                            {isArabic ? product.nameAr : product.nameEn}
                          </h4>
                        </div>

                        <div className="mt-3 pt-2 border-t border-zinc-100/60 flex items-center justify-between text-xs font-bold text-zinc-900 font-serif">
                          <span>{product.price} {isArabic ? "ج.م" : "EGP"}</span>
                          {product.inStock && (
                            <span className="text-[10px] text-zinc-400 font-sans font-light">
                              {isArabic ? "معاينة مجاناً" : "Try-on free"}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );

                  // If idx is exactly 2, let's insert a beautiful fashion editorial card right after it!
                  if (idx === 2) {
                    const adCard = (
                      <div 
                        key="in-grid-fashion-ad"
                        className="bg-zinc-950 text-white rounded-2xl overflow-hidden p-5 flex flex-col justify-between border border-zinc-850 shadow-sm aspect-[4/5] relative group"
                        style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
                      >
                        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 mix-blend-luminosity group-hover:opacity-35 transition duration-500 rounded-2xl animate-pulse" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400')" }} />
                        
                        <div className="relative z-10 flex justify-between items-start">
                          <span className="text-[8px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded-sm tracking-widest uppercase">
                            {isArabic ? "إعلان مميز" : "ADVERT"}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-mono tracking-widest">
                            RAAV ARCHIVES
                          </span>
                        </div>

                        <div className="relative z-10 space-y-1">
                          <h4 className="font-serif text-xs sm:text-sm font-bold tracking-tight leading-snug">
                            {isArabic ? "الأناقة تكمن في نقاء التفاصيل" : "The Purism of Egyptian Linen"}
                          </h4>
                          <p className="text-[9px] sm:text-[10px] text-zinc-450 leading-normal font-light">
                            {isArabic 
                              ? "خيوط عضوية مستدامة، نسيج خفيف يسمح لبشرتك بالتنفس." 
                              : "Each piece travels from ecological lint harvesting to specialized steam-pressing in Cairo."}
                          </p>
                        </div>

                        <div className="relative z-10 pt-2 border-t border-zinc-900/80 flex justify-between items-center text-[10px] font-bold text-amber-400">
                          <span>{isArabic ? "اكتشف قصة علامتنا" : "Discover Our Ethos"}</span>
                          <span>→</span>
                        </div>
                      </div>
                    );
                    return [productCard, adCard];
                  }

                  return [productCard];
                })}
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
