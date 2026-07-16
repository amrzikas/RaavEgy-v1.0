import React, { useState } from 'react';
import { X, Check, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category } from '../types';
import { getProductPrice } from '../utils';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  isArabic: boolean;
  categoriesList?: Category[];
}

export default function ProductDetailsModal({
  product,
  onClose,
  onAddToCart,
  isArabic,
  categoriesList = []
}: ProductDetailsModalProps) {
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
  const [activeImgUrl, setActiveImgUrl] = useState<string>(product?.image || '');
  const [selectedSize, setSelectedSize] = useState<string>(product?.sizes?.[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product?.colors?.[0] || '#ffffff');
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToCartNotify, setAddedToCartNotify] = useState(false);

  React.useEffect(() => {
    if (product) {
      setActiveImgUrl(product.image);
      setSelectedSize(product.sizes[0] || 'M');
      setSelectedColor(product.colors[0] || '#ffffff');
      setQuantity(1);
    }
  }, [product]);

  if (!product) return null;

  const { current, original, hasDiscount } = getProductPrice(product);

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedToCartNotify(true);
    setTimeout(() => {
      setAddedToCartNotify(false);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 font-sans">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs"
        />

        {/* Modal Structure */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative bg-white border border-zinc-100 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl z-10 flex flex-col md:flex-row text-zinc-900 text-right"
          style={{ direction: isArabic ? 'rtl' : 'ltr' }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 ${isArabic ? 'left-4' : 'right-4'} z-20 p-2 bg-white text-zinc-700 hover:text-black hover:bg-zinc-50 rounded-full border border-zinc-200 shadow-sm transition cursor-pointer`}
          >
            <X size={17} />
          </button>

          {/* Left Column: Big high quality image */}
          <div className="w-full md:w-1/2 flex flex-col items-stretch bg-zinc-50 relative">
            <div className="aspect-square md:flex-1 relative overflow-hidden">
              <img
                src={activeImgUrl || product.image}
                alt={isArabic ? product.nameAr : product.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              
              {/* Tag Overlay */}
              <span className="absolute top-4 right-4 bg-white/95 backdrop-blur-md text-zinc-900 border border-zinc-100 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest font-sans shadow-sm">
                {getCategoryName(product.category)}
              </span>
            </div>

            {/* Micro Thumbnail row if multi images exist */}
            {product.images && product.images.filter(Boolean).length > 0 && (
              <div className="p-3 bg-zinc-100/40 border-t border-zinc-200/40 grid grid-cols-5 gap-2 shrink-0">
                {[product.image, ...product.images.filter(img => img !== product.image)].filter(Boolean).slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgUrl(img)}
                    className={`aspect-square bg-white rounded-lg overflow-hidden border-2 transition cursor-pointer relative ${
                      activeImgUrl === img ? 'border-amber-400 ring-1 ring-amber-400' : 'border-zinc-200 hover:border-zinc-300'
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Details Area */}
          <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between h-full bg-zinc-50/20">
            <div>
              {/* Product title */}
              <h2 className="text-xl sm:text-2xl font-serif font-medium text-zinc-900 tracking-tight leading-tight mb-2">
                {isArabic ? product.nameAr : product.nameEn}
              </h2>

              {/* Price Tag */}
              <div className="flex items-center gap-2 mb-5 justify-start flex-wrap">
                {hasDiscount && (
                  <span className="text-zinc-400 line-through text-base font-serif">
                    {original * quantity}
                  </span>
                )}
                <span className={`text-2xl font-serif font-black ${hasDiscount ? 'text-red-650' : 'text-zinc-950'}`}>
                  {current * quantity}
                </span>
                <span className="text-xs text-zinc-500 font-sans">
                  {isArabic ? 'جنيه جزيل' : 'EGP' /* standard tag */}
                </span>
                {hasDiscount && (
                  <span className="inline-block bg-red-50 text-red-650 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase select-none font-sans">
                    {isArabic ? 'خصم متاح' : 'Sale'}
                  </span>
                )}
                {quantity > 1 && (
                  <span className="text-xs text-zinc-400 font-mono ml-2">
                    ({current} {isArabic ? 'للحبة' : 'each'})
                  </span>
                )}
              </div>

              {/* Product description split sections */}
              <div className="space-y-4 mb-6">
                <div className="border-b border-zinc-100 pb-3">
                  <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider mb-1.5 flex items-center gap-1.5 justify-start">
                    <span>{isArabic ? "وصف المنتج" : "About Product"}</span>
                  </h4>
                  <p className="text-zinc-650 text-xs sm:text-sm leading-relaxed font-sans font-light text-justify">
                    {isArabic ? product.descriptionAr : product.descriptionEn}
                  </p>
                </div>

                {/* Bullet details (additional specs) */}
                {((isArabic ? product.detailsAr : product.detailsEn)) ? (
                  <div className="border-b border-zinc-100 pb-3">
                    <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-start">
                      <span>{isArabic ? "تفاصيل ومواصفات المنتج" : "Product Specifications"}</span>
                    </h4>
                    <ul className="space-y-1 text-zinc-650 text-xs sm:text-sm text-justify font-sans list-none pr-0 pl-0">
                      {(isArabic ? product.detailsAr : product.detailsEn)
                        ?.split('\n')
                        .map(line => line.trim())
                        .filter(Boolean)
                        .map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-1.5 leading-relaxed">
                            <span className="text-amber-500 mt-1 select-none">✦</span>
                            <span className="font-light">{bullet}</span>
                          </li>
                        ))
                      }
                    </ul>
                  </div>
                ) : null}

                {/* Care instructions */}
                {((isArabic ? product.careAr : product.careEn)) ? (
                  <div className="border-b border-zinc-100 pb-3">
                    <h4 className="text-xs font-extrabold text-zinc-900 uppercase tracking-wider mb-2 flex items-center gap-1.5 justify-start">
                      <span>{isArabic ? "إرشادات العناية والاهتمام" : "Care Instructions"}</span>
                    </h4>
                    <div className="flex gap-2 items-start text-zinc-650 text-xs sm:text-sm bg-amber-50/30 p-3 rounded-xl border border-amber-100/30 text-justify">
                      <span className="text-sm">✨</span>
                      <p className="font-light leading-relaxed">
                        {isArabic ? product.careAr : product.careEn}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Premium Size selection */}
              {product.sizes.length > 0 && (
                <div className="mb-5 text-left">
                  <h4 className={`text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? "المقاس المتاح" : "Select Size"}
                  </h4>
                  <div className={`flex flex-wrap gap-2 ${isArabic ? 'justify-start' : 'justify-start'}`}>
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`min-w-[42px] h-[40px] px-3 font-semibold rounded-lg text-xs leading-none transition border cursor-pointer flex items-center justify-center font-mono ${
                          selectedSize === size
                            ? "bg-black border-black text-white font-extrabold"
                            : "bg-white border-zinc-205 text-zinc-600 hover:border-zinc-400 hover:bg-zinc-50"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive color circles */}
              {product.colors.length > 0 && (
                <div className="mb-6 text-left">
                  <h4 className={`text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                    {isArabic ? "اللون المتاح" : "Colors"}
                  </h4>
                  <div className="flex gap-2">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-9 h-9 rounded-full relative flex items-center justify-center border cursor-pointer transition ${
                          selectedColor === color 
                            ? "ring-2 ring-black ring-offset-2 ring-offset-white scale-105" 
                            : "border-zinc-200 hover:scale-105"
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      >
                        {selectedColor === color && (
                          <Check size={14} className={color.toLowerCase() === '#ffffff' ? 'text-zinc-950' : 'text-white'} strokeWidth={3} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity selectors */}
              <div className="mb-6">
                <h4 className={`text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                  {isArabic ? "الكمية المطلوبة" : "Quantity"}
                </h4>
                <div className={`flex items-center gap-1.5 ${isArabic ? 'justify-start' : 'justify-start'}`}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer font-mono text-sm"
                  >
                    -
                  </button>
                  <span className="w-12 text-center text-sm font-bold font-mono text-zinc-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-9 h-9 bg-zinc-50 hover:bg-zinc-100 rounded-lg border border-zinc-200 text-zinc-600 font-bold flex items-center justify-center cursor-pointer font-mono text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Bottom Actions Area */}
            <div className="mt-4 pt-5 border-t border-zinc-100 flex flex-col gap-3">
              {product.inStock ? (
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleAddToCart}
                  disabled={addedToCartNotify}
                  className={`w-full py-4 rounded-full font-bold flex items-center justify-center gap-2 shadow-sm transition cursor-pointer font-sans text-xs tracking-wider uppercase ${
                    addedToCartNotify
                      ? "bg-emerald-600 text-white"
                      : "bg-black hover:bg-zinc-900 text-white"
                  }`}
                >
                  {addedToCartNotify ? (
                    <>
                      <Check size={16} strokeWidth={2.5} />
                      <span>{isArabic ? "تمت إضافتها للسلة!" : "Added to Cart!"}</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={15} strokeWidth={2.5} />
                      <span>{isArabic ? "إضافة إلى سلة المشتريات" : "Add to Shopping Basket"}</span>
                    </>
                  )}
                </motion.button>
              ) : (
                <button
                  disabled
                  className="w-full py-4 rounded-full bg-zinc-100 text-zinc-400 font-bold font-sans text-xs tracking-wider uppercase"
                >
                  {isArabic ? "غير متوفر بالوقت الحالي" : "Currently Unavailable"}
                </button>
              )}

              {/* Delivery security reassurance */}
              <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-450 font-sans font-light">
                <span className="w-1 h-1 rounded-full bg-amber-600 animate-ping" />
                <span>
                  {isArabic 
                    ? "الدفع نقدًا عند الاستلام بعد معاينة جودة الملابس والمقاس المناسب!" 
                    : "Cash on Delivery. Sizing trials & returns allowed at the doorstep!"}
                </span>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
