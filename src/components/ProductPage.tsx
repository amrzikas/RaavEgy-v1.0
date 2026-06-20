import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { getProductPrice } from '../utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  ShoppingBag, 
  ArrowLeft, 
  Heart, 
  ShieldCheck, 
  RefreshCcw, 
  Truck, 
  Star, 
  Send, 
  MessageSquare, 
  User 
} from 'lucide-react';
import { motion } from 'motion/react';
import { addReview, subscribeToProductReviews, toggleProductFavorite, subscribeToUserProfile } from '../dbService';

interface ProductPageProps {
  product: Product;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onBack: () => void;
  onAddToCart: (product: Product, size: string, color: string, quantity: number) => void;
  isArabic: boolean;
  currentUser?: any;
  onGoToAuth?: () => void;
  onSelectCategory?: (category: string) => void;
}

export default function ProductPage({ 
  product, 
  products = [], 
  onSelectProduct, 
  onBack, 
  onAddToCart, 
  isArabic, 
  currentUser, 
  onGoToAuth,
  onSelectCategory
}: ProductPageProps) {
  const [activeImgUrl, setActiveImgUrl] = useState<string>(product.image);
  const [selectedSize, setSelectedSize] = useState<string>(product.sizes[0] || 'M');
  const [selectedColor, setSelectedColor] = useState<string>(product.colors[0] || '#ffffff');
  const [isColorVisualizerEnabled, setIsColorVisualizerEnabled] = useState<boolean>(true);
  const [quantity, setQuantity] = useState<number>(1);
  const [addedNotify, setAddedNotify] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // Sync on product change
  useEffect(() => {
    setActiveImgUrl(product.image);
    setSelectedSize(product.sizes[0] || 'M');
    setSelectedColor(product.colors[0] || '#ffffff');
  }, [product]);

  // Sync real-time favorite status from database
  useEffect(() => {
    if (!currentUser) {
      setIsFavorite(false);
      return;
    }
    const unsubscribe = subscribeToUserProfile(currentUser.uid, (uData) => {
      if (uData && uData.favorites) {
        setIsFavorite(uData.favorites.some((f: any) => f.productId === product.id));
      } else {
        setIsFavorite(false);
      }
    });
    return () => unsubscribe();
  }, [currentUser, product.id]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      if (onGoToAuth) {
        onGoToAuth();
      }
      return;
    }
    try {
      await toggleProductFavorite(currentUser.uid, product.id);
    } catch (e) {
      console.error("Error toggling favorite:", e);
    }
  };

  const { current, original, hasDiscount } = getProductPrice(product);

  const relatedProducts = React.useMemo(() => {
    let list = (products || []).filter((p) => p.id !== product.id && p.category === product.category);
    if (list.length < 4) {
      const extra = (products || []).filter((p) => p.id !== product.id && p.category !== product.category);
      list = [...list, ...extra];
    }
    return list.slice(0, 4);
  }, [products, product]);

  // Reviews states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [userRating, setUserRating] = useState<number>(5);
  const [userComment, setUserComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState<boolean>(false);

  // Subscribe to real-time reviews for this product
  useEffect(() => {
    const unsubscribe = subscribeToProductReviews(product.id, (loadedReviews) => {
      setReviews(loadedReviews);
    });
    return () => unsubscribe();
  }, [product.id]);

  const handleAddToCart = () => {
    onAddToCart(product, selectedSize, selectedColor, quantity);
    setAddedNotify(true);
    setTimeout(() => {
      setAddedNotify(false);
    }, 1500);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setReviewError(isArabic ? 'يجب عليك تسجيل الدخول أولاً لإضافة تقييم!' : 'You must log in first to leave a review!');
      return;
    }
    if (!userComment.trim()) {
      setReviewError(isArabic ? 'الرجاء كتابة تعليق مناسب!' : 'Please enter a valid review comment!');
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      await addReview({
        productId: product.id,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || (isArabic ? 'مشتري راف' : 'RAAV Patron'),
        userEmail: currentUser.email || '',
        rating: userRating,
        comment: userComment.trim()
      });
      setReviewSuccess(true);
      setUserComment('');
      setUserRating(5);
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      setReviewError(isArabic ? 'لقد حدث خطأ أثناء إرسال التقييم. الرجاء المحاولة مجدداً.' : 'Could not submit your review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-[#fbfcff] min-h-screen pt-24 pb-20 font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back navigation & breadcrumbs */}
        <div className="mb-8 flex items-center justify-between" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:text-black transition cursor-pointer"
          >
            {isArabic ? (
              <>
                <ChevronRight size={14} />
                <span>العودة للمعرض</span>
              </>
            ) : (
              <>
                <ChevronLeft size={14} />
                <span>Back to Catalog</span>
              </>
            )}
          </button>
          
          <div className="hidden sm:flex items-center gap-2 text-[10px] uppercase font-bold text-zinc-400 tracking-wider font-mono">
            <button
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory('all');
                } else {
                  onBack();
                }
              }}
              className="hover:text-amber-500 hover:underline transition duration-200 cursor-pointer"
            >
              RAAV
            </button>
            <span>/</span>
            <button
              onClick={() => {
                if (onSelectCategory) {
                  onSelectCategory(product.category);
                } else {
                  onBack();
                }
              }}
              className="hover:text-amber-500 hover:underline transition duration-200 cursor-pointer"
            >
              {product.category === 'men' && (isArabic ? 'رجالي' : 'MEN')}
              {product.category === 'women' && (isArabic ? 'حريمي' : 'WOMEN')}
              {product.category === 'kids' && (isArabic ? 'أطفالي' : 'KIDS')}
              {product.category === 'accessories' && (isArabic ? 'إكسسوارات' : 'ACCESSORIES')}
            </button>
            <span>/</span>
            <span className="text-zinc-650 truncate max-w-[150px]">
              {isArabic ? product.nameAr : product.nameEn}
            </span>
          </div>
        </div>

        {/* Product Details Section Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Column: Stunning Premium Imagery (5 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-white rounded-[2rem] overflow-hidden border border-zinc-100 shadow-sm aspect-[4/5] relative group">
              <img
                src={activeImgUrl || product.image}
                alt={isArabic ? product.nameAr : product.nameEn}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-103"
              />
              {/* Dynamic Color Overlay Visualizer Filter */}
              {isColorVisualizerEnabled && selectedColor && selectedColor.toLowerCase() !== '#ffffff' && (
                <div 
                  className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-20 transition-all duration-500 rounded-[2rem]"
                  style={{ backgroundColor: selectedColor }}
                />
              )}
              {/* Toggle Filter Badge */}
              {product.colors && product.colors.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsColorVisualizerEnabled(!isColorVisualizerEnabled)}
                  className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md hover:bg-white rounded-full px-4 py-2 text-[10px] font-bold text-zinc-900 border border-zinc-200/60 shadow-md flex items-center gap-2 transition cursor-pointer z-10 select-none uppercase tracking-wide group-hover:scale-101 duration-300"
                >
                  <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${isColorVisualizerEnabled ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)] animate-pulse' : 'bg-zinc-400'}`} />
                  <span>
                    {isArabic 
                      ? `${isColorVisualizerEnabled ? 'إلغاء معاينة اللون 🎨' : 'معاينة اللون الذكية 🎨'}` 
                      : `${isColorVisualizerEnabled ? 'Disable Color Tint 🎨' : 'Enable Smart Preview 🎨'}`
                    }
                  </span>
                </button>
              )}
              {/* Category water label */}
              <span className="absolute top-6 right-6 bg-white/95 backdrop-blur-md rounded-full px-4 py-1.5 text-[9px] font-bold tracking-[0.2em] text-zinc-950 uppercase border border-zinc-150 shadow-sm">
                {product.category === 'men' && (isArabic ? 'رجالي' : 'Men')}
                {product.category === 'women' && (isArabic ? 'حريمي' : 'Women')}
                {product.category === 'kids' && (isArabic ? 'أطفالي' : 'Kids')}
                {product.category === 'accessories' && (isArabic ? 'إكسسوارات' : 'Accessories')}
              </span>
            </div>

            {/* Multiple Images Thumbnails Gallery Row */}
            {product.images && product.images.filter(Boolean).length > 0 && (
              <div className="grid grid-cols-5 gap-1.5 sm:gap-3 mt-4">
                {/* Always include root product.image as an option */}
                {[product.image, ...product.images.filter(img => img !== product.image)].filter(Boolean).slice(0, 5).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgUrl(img)}
                    className={`aspect-[4/5] bg-zinc-50 rounded-2xl overflow-hidden border-2 transition duration-200 cursor-pointer relative ${
                      activeImgUrl === img ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-zinc-250/50 hover:border-zinc-400'
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Interaction Controls (6 cols) */}
          <div className="lg:col-span-6 space-y-6 bg-white p-6 sm:p-10 rounded-[2rem] border border-zinc-100 shadow-xs text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            
            {/* Header elements */}
            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-medium text-zinc-950 leading-tight">
                {isArabic ? product.nameAr : product.nameEn}
              </h1>
              
              <div className="flex items-center gap-3 justify-start flex-wrap">
                {hasDiscount && (
                  <span className="text-zinc-400 line-through text-base sm:text-lg font-serif">
                    {original * quantity} ج.م
                  </span>
                )}
                <span className={`text-2xl sm:text-3xl font-serif font-black ${hasDiscount ? 'text-red-650' : 'text-zinc-950'}`}>
                  {current * quantity} ج.م
                </span>
                {hasDiscount && (
                  <span className="inline-block bg-red-50 text-red-600 text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold uppercase select-none font-sans">
                    {isArabic ? 'خصم متاح 🏷️' : 'Sale 🏷️'}
                  </span>
                )}
                {quantity > 1 && (
                  <span className="text-xs text-zinc-450 font-sans">
                    ({current} {isArabic ? "للقطعة الواحدة" : "per piece"})
                  </span>
                )}
              </div>
            </div>

            {/* Description Text */}
            <div className="border-t border-zinc-100 pt-4">
              <p className="text-sm leading-relaxed text-zinc-600 font-light text-justify">
                {isArabic ? product.descriptionAr : product.descriptionEn}
              </p>
            </div>

            {/* Size Selector */}
            {product.sizes.length > 0 && (
              <div className="border-t border-zinc-100 pt-5">
                <div className="flex justify-between items-center mb-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block">
                    {isArabic ? "المقاس المناسب لك" : "Select Size"}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-450 hover:underline cursor-pointer">
                    {isArabic ? "دليل المقاسات" : "Size Guide"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setSelectedSize(sz)}
                      className={`h-11 min-w-[48px] px-3.5 rounded-xl font-bold text-xs transition border cursor-pointer flex items-center justify-center font-mono ${
                        selectedSize === sz
                          ? "bg-black border-black text-white"
                          : "bg-white border-zinc-200 text-zinc-700 hover:border-zinc-400"
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color circles */}
            {product.colors.length > 0 && (
              <div className="border-t border-zinc-100 pt-5">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
                  {isArabic ? "الألوان المتوفرة بالقطعة" : "Select Color"}
                </span>
                <div className="flex gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`w-9 h-9 rounded-full relative flex items-center justify-center border cursor-pointer transition ${
                        selectedColor === color 
                          ? "ring-2 ring-black ring-offset-2 ring-offset-white scale-103" 
                          : "border-zinc-200 hover:scale-103"
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {selectedColor === color && (
                        <Check size={14} className={color.toLowerCase() === '#ffffff' ? 'text-zinc-950' : 'text-white'} strokeWidth={3} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity select */}
            <div className="border-t border-zinc-100 pt-5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-2.5">
                {isArabic ? "الكمية المطلوبة" : "Choose Quantity"}
              </span>
              <div className="flex items-center gap-2 justify-start">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-750 font-bold rounded-lg flex items-center justify-center cursor-pointer text-sm font-mono"
                >
                  -
                </button>
                <span className="w-12 text-center text-sm font-bold text-zinc-900 font-mono">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 text-zinc-750 font-bold rounded-lg flex items-center justify-center cursor-pointer text-sm font-mono"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTA action buttons */}
            <div className="border-t border-zinc-100 pt-6 space-y-3">
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  disabled={!product.inStock || addedNotify}
                  onClick={handleAddToCart}
                  className={`flex-1 py-4 rounded-full font-bold text-xs tracking-wider uppercase transition flex items-center justify-center gap-2 shadow-sm cursor-pointer ${
                    !product.inStock
                      ? "bg-zinc-150 text-zinc-400 cursor-not-allowed"
                      : addedNotify
                        ? "bg-emerald-600 text-white"
                        : "bg-black hover:bg-zinc-900 text-white"
                  }`}
                >
                  {addedNotify ? (
                    <>
                      <Check size={15} strokeWidth={2.5} />
                      <span>{isArabic ? "تمت الإضافة للسلة!" : "Added to Cart!"}</span>
                    </>
                  ) : product.inStock ? (
                    <>
                      <ShoppingBag size={15} strokeWidth={2.5} />
                      <span>{isArabic ? "إضافة إلى حقيبة المشتروات" : "Add to Shopping Basket"}</span>
                    </>
                  ) : (
                    <span>{isArabic ? "نفذت الكمية حالياً" : "Out of stock"}</span>
                  )}
                </motion.button>

                <button
                  onClick={handleToggleFavorite}
                  className={`w-12 h-12 rounded-full border flex items-center justify-center cursor-pointer transition ${
                    isFavorite 
                      ? "bg-rose-50 border-rose-200 text-rose-500 scale-103" 
                      : "bg-white border-zinc-200 text-zinc-400 hover:text-red-500 hover:bg-zinc-50"
                  }`}
                >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} strokeWidth={2.5} />
                </button>
              </div>

              {/* Secure badges and trust banners */}
              <div className="grid grid-cols-3 gap-1.5 sm:gap-3 pt-5 border-t border-zinc-100 text-center font-sans">
                <div className="p-2 sm:p-3 bg-zinc-50 rounded-xl space-y-1">
                  <Truck size={16} className="mx-auto text-amber-600" />
                  <p className="text-[10px] font-bold text-zinc-900">{isArabic ? "معاينة وقياس" : "Sizing tests"}</p>
                  <p className="text-[9px] text-zinc-400">{isArabic ? "مجاناً بموقعك" : "At your doorstep"}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                  <RefreshCcw size={16} className="mx-auto text-zinc-600" />
                  <p className="text-[10px] font-bold text-zinc-900">{isArabic ? "١٤ يوم استرجاع" : "14 Days Returns"}</p>
                  <p className="text-[9px] text-zinc-400">{isArabic ? "بدون معوقات" : "Hassle-free"}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl space-y-1">
                  <ShieldCheck size={16} className="mx-auto text-emerald-600" />
                  <p className="text-[10px] font-bold text-zinc-900">{isArabic ? "قطن مصري ١٠٠٪" : "100% Egyptian"}</p>
                  <p className="text-[9px] text-zinc-400">{isArabic ? "حياكة فاخرة" : "Premium stitches"}</p>
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Reviews & Feedback Section */}
        <div className="mt-16 border-t border-zinc-100 pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Reviews Summary Dashboard (5 cols) */}
            <div className="lg:col-span-5 bg-white p-6 sm:p-8 rounded-[2rem] border border-zinc-100 shadow-xs space-y-6">
              <h3 className="text-xl font-serif font-medium text-zinc-900 flex items-center gap-2">
                <MessageSquare size={18} className="text-zinc-600" />
                <span>{isArabic ? "آراء وتقييمات العملاء" : "Customer Reviews"}</span>
              </h3>

              {reviews.length > 0 ? (
                (() => {
                  const avgRating = (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1);
                  const starsBreakdown = [5, 4, 3, 2, 1].map(num => {
                    const count = reviews.filter(r => r.rating === num).length;
                    const pct = Math.round((count / reviews.length) * 100);
                    return { num, count, pct };
                  });

                  return (
                    <div className="space-y-6">
                      <div className="flex items-baseline gap-4">
                        <span className="text-5xl font-mono font-bold text-zinc-950">{avgRating}</span>
                        <div className="space-y-1">
                          <div className="flex gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                size={15} 
                                fill={star <= Math.round(Number(avgRating)) ? "currentColor" : "none"} 
                                strokeWidth={2.5} 
                              />
                            ))}
                          </div>
                          <p className="text-xs text-zinc-400 font-sans">
                            {isArabic 
                              ? `بناءً على ${reviews.length} تقييم حقيقي` 
                              : `Based on ${reviews.length} genuine reviews`
                            }
                          </p>
                        </div>
                      </div>

                      {/* Distribution Bars */}
                      <div className="space-y-2.5 pt-2">
                        {starsBreakdown.map(({ num, pct }) => (
                          <div key={num} className="flex items-center gap-3 text-xs">
                            <span className="w-12 text-zinc-400 font-mono text-right">{num} {isArabic ? "نجوم" : "stars"}</span>
                            <div className="flex-1 h-2 bg-zinc-100 rounded-full overflow-hidden w-full">
                              <div className="h-full bg-zinc-900 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="w-8 text-zinc-400 font-mono text-left">{pct}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="py-2.5 space-y-2">
                  <p className="text-sm text-zinc-550 leading-relaxed">
                    {isArabic 
                      ? "لا توجد أي تقييمات لهذا الموديل حتى الآن. كن أول من يشاركنا رأيه الفاخر!" 
                      : "No feedback has been recorded for this piece yet. Be the first to grace us with your thoughts!"}
                  </p>
                  <div className="flex gap-0.5 text-zinc-200">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} fill="none" strokeWidth={2} />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Review / Auth Prompt */}
              <div className="border-t border-zinc-100 pt-6">
                {currentUser ? (
                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <h4 className="text-sm font-semibold text-zinc-805">
                      {isArabic ? "شاركنا تقييمك الشخصي" : "Write a Luxury Review"}
                    </h4>

                    {/* Star Rating input */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] uppercase font-bold text-zinc-450 tracking-wider block">
                        {isArabic ? "اختر عدد النجوم" : "Select Stars"}
                      </span>
                      <div className="flex gap-1 justify-start">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setUserRating(star)}
                            className="text-amber-500 hover:scale-110 transition cursor-pointer"
                          >
                            <Star 
                              size={24} 
                              fill={star <= userRating ? "currentColor" : "none"} 
                              strokeWidth={2} 
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Field */}
                    <div className="space-y-1.5">
                      <label htmlFor="userComment" className="text-[10px] uppercase font-bold text-zinc-450 tracking-wider block">
                        {isArabic ? "تعليقك وملاحظاتك عن الخامة والمقاس" : "Your detailed review comments"}
                      </label>
                      <textarea
                        id="userComment"
                        rows={4}
                        maxLength={1005}
                        value={userComment}
                        onChange={(e) => setUserComment(e.target.value)}
                        placeholder={isArabic ? "اكتب رأيك هنا بكل وضوح..." : "Share comments on fit, custom styling, fabric..."}
                        className="w-full text-sm p-4 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:border-zinc-800 focus:bg-white text-zinc-800 outline-none transition"
                      />
                    </div>

                    {reviewError && (
                      <p className="text-xs font-semibold text-rose-500 bg-rose-50 p-2.5 rounded-lg flex items-center gap-1.5">
                        <span>●</span> {reviewError}
                      </p>
                    )}

                    {reviewSuccess && (
                      <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg flex items-center gap-1.5">
                        <Check size={14} />
                        <span>{isArabic ? "تم حفظ تقييمك الفخم بنجاح، شكراً لك!" : "Your luxury review has been posted!"}</span>
                      </p>
                    )}

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      type="submit"
                      disabled={submittingReview}
                      className="w-full py-3.5 bg-zinc-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <span>{isArabic ? "جاري الإرسال..." : "Publishing..."}</span>
                      ) : (
                        <>
                          <Send size={13} />
                          <span>{isArabic ? "نشر التقييم" : "Publish Feedback"}</span>
                        </>
                      )}
                    </motion.button>
                  </form>
                ) : (
                  <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-200/60 text-center space-y-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mx-auto text-zinc-400">
                      <User size={18} />
                    </div>
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-zinc-800">
                        {isArabic ? "تسجيل الدخول مطلوب" : "Login Required"}
                      </p>
                      <p className="text-[11px] leading-relaxed text-zinc-500 max-w-xs mx-auto text-center" style={{ textAlign: 'center' }}>
                        {isArabic 
                          ? "قم بتسجيل الدخول إلى حسابك أولاً لتتمكن من كتابة تقييم وإبداء رأيك بالمنتج"
                          : "Please access your secure profile first to register comments or star ratings on RAAV styles"}
                      </p>
                    </div>
                    {onGoToAuth && (
                      <button
                        type="button"
                        onClick={onGoToAuth}
                        className="w-full py-2.5 bg-black hover:bg-zinc-900 text-white font-bold text-[11px] uppercase tracking-wider rounded-xl transition cursor-pointer shadow-sm font-sans"
                      >
                        {isArabic ? "تسجيل دخول / إنشاء حساب" : "Log In or Register"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Reviews Section Mini Ad Banner */}
              <div className="mt-6 pt-6 border-t border-zinc-100 bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10 space-y-2" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                <div className="flex justify-start">
                  <span className="text-[8px] font-black uppercase text-amber-700 bg-amber-500/20 px-2 py-0.5 rounded">
                    {isArabic ? "ضمان راف الأصيل" : "RAAV GENUINE SHIELD"}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900 leading-snug">
                  {isArabic ? "قطن مصري طويل التيلة ١٠٠٪" : "100% Long-Staple Egyptian Cotton"}
                </h4>
                <p className="text-[10px] text-zinc-550 font-light leading-relaxed">
                  {isArabic 
                    ? "نحن نضمن أن كافة ملابسنا منسوجة يدوياً من أفخم محاصيل القطن العضوي في شرق الدلتا ومعقمة بالكامل لسلامة بشرتك." 
                    : "Every centimeter of thread is hand-pulled, certified organic, and steam-cleansed to withstand generations."}
                </p>
              </div>

            </div>

            {/* Reviews List (7 cols) */}
            <div className="lg:col-span-7 space-y-4 max-h-[600px] overflow-y-auto pr-2">
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 border-b border-zinc-100 pb-3">
                {isArabic 
                  ? `${reviews.length} تقييمات مكتوبة` 
                  : `${reviews.length} Verifiable Client Reviews`
                }
              </h3>

              {reviews.length > 0 ? (
                <div className="space-y-4 divide-y divide-zinc-100">
                  {reviews.map((rev) => {
                    const reviewInitials = rev.userName.slice(0, 1).toUpperCase();
                    const reviewDate = new Date(rev.createdAt).toLocaleDateString(
                      isArabic ? 'ar-EG' : 'en-US', 
                      { year: 'numeric', month: 'long', day: 'numeric' }
                    );

                    return (
                      <div key={rev.id} className="pt-4 first:pt-0 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-700 font-serif text-sm">
                              {reviewInitials}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-800">{rev.userName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{reviewDate}</p>
                            </div>
                          </div>
                          
                          <div className="flex gap-0.5 text-amber-500">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                size={12} 
                                fill={s <= rev.rating ? "currentColor" : "none"} 
                                strokeWidth={2.5} 
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-sm leading-relaxed text-zinc-600 font-light pl-1 pt-1">
                          {rev.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 bg-zinc-50/50 rounded-[1.5rem] border border-dashed border-zinc-200">
                  <p className="text-xs text-zinc-400">
                    {isArabic 
                      ? "رأيك الفخم يهمنا، كن أول من يكتب مراجعته للموديل!" 
                      : "We align to luxury. Inspire others by being the first to leave a review."}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Related Products Section ("قد يعجبك أيضاً") */}
        <div className="mt-16 border-t border-zinc-100 pt-16">
          <div className="flex justify-between items-center mb-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <h3 className="text-xl font-serif font-medium text-zinc-900 flex items-center gap-2">
              <span className="text-amber-500 font-bold font-sans">✦</span>
              <span>{isArabic ? "منتجات قد تعجبك أيضاً" : "You May Also Like"}</span>
            </h3>
            <span className="text-xs text-zinc-400 uppercase tracking-widest font-mono">
              {isArabic ? "تشكيلة مختارة لك" : "Curated recommendations"}
            </span>
          </div>

          {relatedProducts.length === 0 ? (
            <p className="text-xs text-zinc-400 text-center py-6">
              {isArabic ? "لا توجد منتجات مشابهة حالياً." : "No related products at the moment."}
            </p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((relProduct) => (
                <div
                  key={relProduct.id}
                  onClick={() => {
                    onSelectProduct(relProduct);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="group bg-white rounded-2xl overflow-hidden border border-zinc-100 hover:border-zinc-200 hover:shadow-xs transition duration-300 cursor-pointer flex flex-col h-full relative"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                >
                  <div className="aspect-[4/5] bg-zinc-50 overflow-hidden relative">
                    <img
                      src={relProduct.image}
                      alt={isArabic ? relProduct.nameAr : relProduct.nameEn}
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-102"
                      referrerPolicy="no-referrer"
                    />
                    {!relProduct.inStock && (
                      <div className="absolute inset-0 bg-white/70 backdrop-blur-3xs flex items-center justify-center">
                        <span className="px-2.5 py-1 bg-zinc-950 text-white font-sans text-[8px] font-bold uppercase rounded tracking-widest shadow-xs">
                          {isArabic ? "نفذت" : "Sold Out"}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block mb-0.5">
                        {relProduct.category === 'men' && (isArabic ? 'رجالي' : 'Men')}
                        {relProduct.category === 'women' && (isArabic ? 'حريمي' : 'Women')}
                        {relProduct.category === 'kids' && (isArabic ? 'أطفالي' : 'Kids')}
                        {relProduct.category === 'accessories' && (isArabic ? 'إكسسوارات' : 'Accessories')}
                      </span>
                      <h4 className="text-xs font-medium text-zinc-900 leading-snug line-clamp-1 group-hover:text-black transition">
                        {isArabic ? relProduct.nameAr : relProduct.nameEn}
                      </h4>
                    </div>
                    <div className="mt-2 text-xs font-bold text-zinc-900 font-serif">
                      {relProduct.price} ج.م
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Elegant Fashion Member Ad inside Product Detail Page */}
        <div className="mt-12 relative rounded-[2rem] overflow-hidden bg-zinc-950 border border-zinc-900 text-white min-h-[140px] flex flex-col md:flex-row items-center justify-between p-6 md:p-8" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
          <div className="absolute inset-0 bg-cover bg-center opacity-10" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=800')" }} />
          <div className="relative z-10 space-y-2 max-w-xl">
            <span className="text-[8px] font-bold tracking-[0.15em] bg-amber-400/20 text-amber-400 px-2 py-0.5 rounded border border-amber-400/30 inline-block font-sans uppercase">
              {isArabic ? "عضوية راف المتميزة" : "RAAV PRIVÉ MEMBERSHIP"}
            </span>
            <h3 className="text-md md:text-lg font-serif font-medium leading-snug">
              {isArabic ? "انضم لنادي النخبة واحصل على قياس كوتور سنوي مجاني" : "Secure Annual Artisanal Fittings & Styling Advising"}
            </h3>
            <p className="text-[10px] text-zinc-400 font-light max-w-lg leading-relaxed">
              {isArabic 
                ? "خصائص النخبة تشمل استرداد نقدي 5%، وأخصائي تصميم أزياء لكل المناسبات، وطلب معاينة أي موديل هاتفياً." 
                : "Unlock complimentary physical adjustments, seasonal catalog previews, and a personal fashion concierge thread."}
            </p>
          </div>
          <div className="relative z-10 mt-4 md:mt-0 select-none">
            <button className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold rounded-full transition shadow-md cursor-pointer">
              {isArabic ? "انضم مجاناً الآن" : "Apply for Member Card"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
