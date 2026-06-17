import React, { useState } from 'react';
import { ShoppingBag, Lock, ShieldAlert, Sparkles, ChevronDown, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  activeView: 'home' | 'shop' | 'profile' | 'product-details';
  setActiveView: (view: 'home' | 'shop' | 'profile' | 'product-details') => void;
  isUserLoggedIn: boolean;
}

export default function Header({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isAdminLoggedIn,
  onLogoutAdmin,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  isArabic,
  setIsArabic,
  activeView,
  setActiveView,
  isUserLoggedIn
}: HeaderProps) {
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);

  const categories = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    { id: 'men', labelAr: 'رجالي', labelEn: 'Men' },
    { id: 'women', labelAr: 'حريمي', labelEn: 'Women' },
    { id: 'kids', labelAr: 'أطفالي', labelEn: 'Kids' },
    { id: 'accessories', labelAr: 'إكسسوارات', labelEn: 'Accessories' }
  ];

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    setShopDropdownOpen(false);
    setSearchQuery('');
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentCategoryLabel = () => {
    const cat = categories.find(c => c.id === selectedCategory);
    if (!cat) return '';
    return isArabic ? cat.labelAr : cat.labelEn;
  };

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white border-b border-zinc-100 text-zinc-900 transition-colors duration-300">
      {/* Premium Minimal Announcement Bar */}
      <div className="bg-zinc-950 font-sans text-[11px] tracking-[0.15em] text-white py-2 px-4 text-center uppercase flex items-center justify-center gap-2">
        <span className="font-semibold text-zinc-300">
          {isArabic 
            ? "توصيل سريع مجاني في مصر للطلبات الأكثر من ١٢٠٠ ج.م • كود الخصم: RAAV2026" 
            : "FREE EXPEDITED SHIPPING IN EGYPT ON ORDERS OVER 1200 EGP • CODE: RAAV2026"}
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Navigation links on the Left */}
          <div className="flex items-center space-x-1 sm:space-x-8 md:w-1/3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <button 
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${
                activeView === 'home' ? 'text-zinc-950 border-b-2 border-zinc-950 font-bold' : 'text-zinc-550 hover:text-black'
              }`}
            >
              {isArabic ? "الرئيسية" : "HOME"}
            </button>

            {/* SHOP Button / Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setActiveView('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onMouseEnter={() => setShopDropdownOpen(true)}
                className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${
                  activeView === 'shop' ? 'text-zinc-950 border-b-2 border-zinc-950 font-bold' : 'text-zinc-550 hover:text-black'
                }`}
              >
                <span>{isArabic ? "المتجر" : "SHOP"}</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${shopDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {shopDropdownOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    onMouseLeave={() => setShopDropdownOpen(false)}
                    className="absolute left-0 mt-2 w-48 bg-white border border-zinc-100 shadow-xl rounded-lg py-2 z-55"
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`w-full text-left px-4 py-2.5 text-xs tracking-wider uppercase transition cursor-pointer flex justify-between items-center ${
                          selectedCategory === cat.id 
                            ? 'bg-amber-50/50 text-amber-900 font-bold' 
                            : 'text-zinc-650 hover:bg-zinc-50 hover:text-black'
                        }`}
                        style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                      >
                        <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                        {selectedCategory === cat.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => {
                const footer = document.querySelector('footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-block text-xs font-semibold uppercase tracking-[0.2em] hover:text-amber-700 transition cursor-pointer px-2 py-1 text-zinc-550"
            >
              {isArabic ? "من نحن" : "ABOUT US"}
            </button>
          </div>

          {/* Logo in the Center */}
          <div className="flex justify-center md:w-1/3">
            <div 
              onClick={() => {
                setActiveView('home');
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer text-center select-none"
            >
              <h1 id="shop-logo" className="text-3xl md:text-4xl font-serif tracking-[0.22em] font-medium text-black">
                RAAV
              </h1>
              {activeView === 'shop' && selectedCategory !== 'all' && (
                <div className="text-[9px] uppercase tracking-[0.15em] text-amber-700 mt-0.5 font-sans font-semibold">
                  {currentCategoryLabel()}
                </div>
              )}
            </div>
          </div>

          {/* Controls on the Right */}
          <div className="flex items-center justify-end space-x-1 sm:space-x-4 md:w-1/3">
            
            {/* Search Input Toggle */}
            <div className="relative flex items-center">
              <AnimatePresence>
                {showSearchInput && (
                  <motion.input
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 140, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    type="text"
                    placeholder={isArabic ? "ابحث هنا..." : "Search..."}
                    className="bg-zinc-50 border border-zinc-200 text-xs px-3 py-1.5 rounded-full focus:outline-none focus:border-amber-600 focus:bg-white text-zinc-800 mr-2"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      if (activeView !== 'shop') {
                        setActiveView('shop');
                      }
                    }}
                    style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                    autoFocus
                  />
                )}
              </AnimatePresence>
              <button 
                onClick={() => setShowSearchInput(!showSearchInput)}
                className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-50 rounded-full transition cursor-pointer"
                title={isArabic ? "بحث" : "Search"}
              >
                <Search size={19} strokeWidth={1.8} />
              </button>
            </div>

            {/* Language Switch */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="text-xs font-semibold tracking-wider hover:text-amber-800 px-2 py-1 cursor-pointer transition border border-zinc-200 hover:border-zinc-300 rounded"
              title={isArabic ? "Switch to English" : "تغيير للعربية"}
            >
              {isArabic ? "EN" : "عربي"}
            </button>

            {/* Account Details trigger */}
            <button
              onClick={() => {
                setActiveView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`p-2 rounded-full transition cursor-pointer relative ${
                activeView === 'profile' || isUserLoggedIn
                  ? "text-zinc-950 bg-zinc-50 border border-zinc-200"
                  : "text-zinc-700 hover:text-black hover:bg-zinc-50"
              }`}
              title={isArabic ? "حسابي الشخصي" : "My Account"}
            >
              <User size={19} strokeWidth={1.8} />
              {isUserLoggedIn && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Admin Key Button */}
            <button 
              onClick={onOpenAdmin}
              className={`p-2 rounded-full transition cursor-pointer relative ${
                isAdminLoggedIn
                  ? "text-amber-750 bg-amber-50"
                  : "text-zinc-400 hover:text-amber-600 hover:bg-amber-50/50"
              }`}
              title={isAdminLoggedIn ? (isArabic ? "لوحة الإدارة" : "Admin Dashboard") : (isArabic ? "دخول المسؤول" : "Admin Sign-In")}
            >
              <Lock size={15} strokeWidth={1.8} />
            </button>

            {/* Admin Logout button */}
            {isAdminLoggedIn && (
              <button
                onClick={onLogoutAdmin}
                className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition cursor-pointer"
                title={isArabic ? "خروج المسؤول" : "Admin Logout"}
              >
                <ShieldAlert size={19} strokeWidth={1.8} />
              </button>
            )}

            {/* Cart / Shopping Bag Icon */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-zinc-700 hover:text-black hover:bg-zinc-50 rounded-full transition cursor-pointer"
              title={isArabic ? "سلة المشتريات" : "Shopping Bag"}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 bg-zinc-950 text-white rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            </button>

          </div>
        </div>
      </div>

      {/* Subcategory strip */}
      {activeView === 'shop' && selectedCategory !== 'all' && (
        <div className="bg-zinc-50 py-2 border-t border-zinc-100 flex items-center justify-center gap-3 text-xs text-zinc-500 font-sans">
          <span>{isArabic ? "تصفية الفئة:" : "Browsing category:"} </span>
          <span className="font-bold text-zinc-900 bg-amber-100/55 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">{currentCategoryLabel()}</span>
          <button 
            onClick={() => setSelectedCategory('all')} 
            className="text-amber-700 hover:underline font-semibold cursor-pointer"
          >
            {isArabic ? "إزالة التصفية (" + categories.find(c => c.id === 'all')?.labelAr + ")" : "Clear Filter (" + categories.find(c => c.id === 'all')?.labelEn + ")"}
          </button>
        </div>
      )}
    </header>
  );
}
