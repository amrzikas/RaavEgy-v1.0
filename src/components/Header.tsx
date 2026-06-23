import React, { useState } from 'react';
import { ShoppingBag, Lock, ShieldAlert, Sparkles, ChevronDown, Search, User, Menu, X, ChevronRight, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product } from '../types';

interface HeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  onLogoutAdmin: () => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  selectedSubcategory?: string | null;
  setSelectedSubcategory?: (subcategory: string | null) => void;
  products?: Product[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isArabic: boolean;
  setIsArabic: (val: boolean) => void;
  activeView: 'home' | 'shop' | 'profile' | 'product-details' | 'contact-us' | 'shipping-returns' | 'size-guide' | 'faq' | 'privacy-policy' | 'terms-of-service';
  setActiveView: (view: any) => void;
  isUserLoggedIn: boolean;
  customAnnouncement?: string;
  announcementImage?: string;
  announcementLink?: string;
}

export default function Header({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isAdminLoggedIn,
  onLogoutAdmin,
  selectedCategory,
  setSelectedCategory,
  selectedSubcategory,
  setSelectedSubcategory,
  products = [],
  searchQuery,
  setSearchQuery,
  isArabic,
  setIsArabic,
  activeView,
  setActiveView,
  isUserLoggedIn,
  customAnnouncement,
  announcementImage,
  announcementLink
}: HeaderProps) {
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Expanded category inside mobile viewport
  const [expandedMobileCategory, setExpandedMobileCategory] = useState<string | null>(null);

  const categories = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    { id: 'men', labelAr: 'رجالي', labelEn: 'Men' },
    { id: 'women', labelAr: 'حريمي', labelEn: 'Women' },
    { id: 'kids', labelAr: 'أطفالي', labelEn: 'Kids' },
    { id: 'accessories', labelAr: 'إكسسوارات', labelEn: 'Accessories' }
  ];

  // Helper to discover subcategories under a specific category in real-time
  const getSubcategoriesForCategory = (catId: string) => {
    const list: { ar: string; en: string }[] = [];
    const seen = new Set<string>();

    products.forEach((prod) => {
      if (catId !== 'all' && prod.category !== catId) return;
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
  };

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(catId);
    if (setSelectedSubcategory) {
      setSelectedSubcategory(null);
    }
    setShopDropdownOpen(false);
    setSearchQuery('');
    setActiveView('shop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubcategorySelect = (catId: string, subName: string) => {
    setSelectedCategory(catId);
    if (setSelectedSubcategory) {
      setSelectedSubcategory(subName);
    }
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
    <header id="app-header" className="sticky top-0 z-40 bg-[#353630] border-b border-[#2d2e28] text-white transition-colors duration-300">
      {/* Premium Minimal Announcement Bar / Custom Banner */}
      {announcementImage ? (
        <a 
          href={announcementLink || "#"} 
          target={announcementLink ? "_blank" : undefined}
          rel="noopener noreferrer"
          className="block w-full h-[40px] xs:h-[48px] md:h-[56px] overflow-hidden relative group"
        >
          <img 
            src={announcementImage} 
            alt="Ad Banner" 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          {customAnnouncement && (
            <div className="absolute inset-0 bg-black/35 flex items-center justify-center px-4">
              <span className="font-semibold text-white tracking-[0.15em] text-[10px] xs:text-[11.5px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {customAnnouncement}
              </span>
            </div>
          )}
        </a>
      ) : (
        <div className="bg-zinc-950 font-sans text-[11px] tracking-[0.15em] text-white py-2 px-4 text-center uppercase flex items-center justify-center gap-2">
          <span className="font-semibold text-zinc-300">
            {customAnnouncement || (isArabic 
              ? "توصيل سريع مجاني في مصر للطلبات الأكثر من ١٢٠٠ ج.م • كود الخصم: RAAV2026" 
              : "FREE EXPEDITED SHIPPING IN EGYPT ON ORDERS OVER 1200 EGP • CODE: RAAV2026")}
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Hamburger Menu on the Left (Mobile only) */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              title={isArabic ? "القائمة" : "Menu"}
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
          </div>

          {/* Navigation links (Desktop only) */}
          <div className="hidden md:flex items-center gap-4 sm:gap-8 md:w-1/3 justify-start" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <button 
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${
                activeView === 'home' ? 'text-white border-b-2 border-amber-400 font-bold' : 'text-zinc-300 hover:text-white'
              }`}
            >
              {isArabic ? "الرئيسية" : "HOME"}
            </button>

            {/* SHOP Button / Dropdown */}
            <div 
              className="relative"
              onMouseEnter={() => setShopDropdownOpen(true)}
              onMouseLeave={() => setShopDropdownOpen(false)}
            >
              <button 
                onClick={() => {
                  setActiveView('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${
                  activeView === 'shop' ? 'text-white border-b-2 border-amber-400 font-bold' : 'text-zinc-300 hover:text-white'
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
                    className="absolute left-0 mt-2 w-56 bg-white border border-zinc-150 shadow-xl rounded-lg py-2 z-55 text-zinc-900 overflow-hidden"
                  >
                    {categories.map((cat) => {
                      const subcats = getSubcategoriesForCategory(cat.id);
                      return (
                        <div key={cat.id} className="border-b border-zinc-50 last:border-0 pb-1 last:pb-0">
                          <button
                            onClick={() => handleCategorySelect(cat.id)}
                            className={`w-full text-left px-4 py-2 text-xs tracking-wider uppercase transition cursor-pointer flex justify-between items-center ${
                              selectedCategory === cat.id && activeView === 'shop'
                                ? 'bg-amber-50/55 text-amber-900 font-bold' 
                                : 'text-zinc-650 hover:bg-zinc-50 hover:text-black font-semibold'
                            }`}
                            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                          >
                            <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                            {selectedCategory === cat.id && activeView === 'shop' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-650" />
                            )}
                          </button>

                          {subcats.length > 0 && (
                            <div className="pl-6 pr-3 py-1 flex flex-col gap-1 bg-zinc-50/50">
                              {subcats.map((sub) => {
                                const label = isArabic ? sub.ar : sub.en;
                                const isSelected = selectedCategory === cat.id && (selectedSubcategory === sub.en || selectedSubcategory === sub.ar);
                                return (
                                  <button
                                    key={sub.en}
                                    onClick={() => handleSubcategorySelect(cat.id, sub.en)}
                                    className={`text-left w-full py-1 text-[10px] uppercase font-medium transition cursor-pointer ${
                                      isSelected 
                                        ? 'text-amber-900 font-bold' 
                                        : 'text-zinc-500 hover:text-black'
                                    }`}
                                    style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
                                  >
                                    — {label}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => {
                const footer = document.querySelector('footer');
                if (footer) footer.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-block text-xs font-semibold uppercase tracking-[0.2em] hover:text-white transition cursor-pointer px-2 py-1 text-zinc-305"
            >
              {isArabic ? "من نحن" : "ABOUT US"}
            </button>
          </div>

          {/* Logo in the Center */}
          <div className="flex justify-center md:w-1/3 flex-1 md:flex-initial">
            <div 
              onClick={() => {
                setActiveView('home');
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer text-center select-none flex flex-col justify-center items-center"
            >
              <div className="flex items-center justify-center">
                <img 
                  src="/src/assets/images/raav_brand_logo_1782163038345.jpg" 
                  alt="RAAV Couture Logo" 
                  className="h-[72px] md:h-[84px] object-contain transition duration-500 hover:scale-105 mix-blend-screen"
                  style={{ mixBlendMode: 'screen' }}
                  referrerPolicy="no-referrer"
                />
              </div>
              {activeView === 'shop' && selectedCategory !== 'all' && (
                <div className="text-[9px] uppercase tracking-[0.15em] text-amber-400 mt-0.5 font-sans font-semibold">
                  {currentCategoryLabel()}
                </div>
              )}
            </div>
          </div>

          {/* Controls on the End */}
          <div className="flex items-center gap-2 sm:gap-4 md:w-1/3 justify-end">
            
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
                    className="bg-white/10 border border-white/20 text-xs px-3 py-1.5 rounded-full focus:outline-none focus:border-amber-450 focus:bg-white/20 text-white mr-2 placeholder-zinc-300"
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
                className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
                title={isArabic ? "بحث" : "Search"}
              >
                <Search size={19} strokeWidth={1.8} />
              </button>
            </div>

            {/* Language Switch (hidden on mobile, moved to drawer) */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="hidden md:inline-block text-xs font-semibold tracking-wider hover:text-white hover:border-white/50 px-2 py-1 cursor-pointer transition border border-white/10 text-zinc-300 rounded"
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
                  ? "text-amber-400 bg-white/10 border border-white/20"
                  : "text-zinc-300 hover:text-white hover:bg-white/10"
              }`}
              title={isArabic ? "حسابي الشخصي" : "My Account"}
            >
              <User size={19} strokeWidth={1.8} />
              {isUserLoggedIn && (
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Admin Key Button (hidden on mobile, moved to drawer) */}
            {isAdminLoggedIn && (
              <button 
                onClick={onOpenAdmin}
                className={`hidden md:inline-block p-2 rounded-full transition cursor-pointer relative ${
                  isAdminLoggedIn
                    ? "text-amber-400 bg-white/10 border border-white/20"
                    : "text-zinc-305 hover:text-amber-400 hover:bg-white/10"
                }`}
                title={isArabic ? "لوحة الإدارة" : "Admin Dashboard"}
              >
                <Lock size={15} strokeWidth={1.8} />
              </button>
            )}

            {/* Admin Logout button (hidden on mobile, moved to drawer) */}
            {isAdminLoggedIn && (
              <button
                onClick={onLogoutAdmin}
                className="hidden md:inline-block p-1.5 text-red-400 hover:text-red-300 hover:bg-white/10 rounded-full transition cursor-pointer"
                title={isArabic ? "خروج المسؤول" : "Admin Logout"}
              >
                <ShieldAlert size={19} strokeWidth={1.8} />
              </button>
            )}

            {/* Cart / Shopping Bag Icon */}
            <button
              onClick={onOpenCart}
              className="relative p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              title={isArabic ? "سلة المشتريات" : "Shopping Bag"}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 bg-amber-400 text-zinc-950 rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold">
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

      {/* Premium Sliding Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs z-50 md:hidden"
            />

            {/* Drawer Body (slides from opposite depending on RTL/LTR) */}
            <motion.div
              initial={{ x: isArabic ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: isArabic ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed top-0 bottom-0 w-[290px] max-w-[85vw] bg-white text-zinc-900 z-55 shadow-2xl flex flex-col justify-between p-6 md:hidden ${
                isArabic ? 'right-0 border-l border-zinc-100' : 'left-0 border-r border-zinc-100'
              }`}
              style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                  <div className="flex items-center gap-2 select-none">
                    <img 
                      src="/src/assets/images/raav_clean_circle_logo_1782164055293.jpg" 
                      alt="RAAV Couture" 
                      className="h-7 w-7 object-cover rounded-full border border-zinc-200"
                      referrerPolicy="no-referrer"
                    />
                    <h2 className="text-lg font-serif tracking-[0.15em] font-bold text-black">
                      RAAV
                    </h2>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-650 hover:text-black transition cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Navigation Links */}
                <div className="space-y-4">
                  {/* Home Link */}
                  <button
                    onClick={() => {
                      setActiveView('home');
                      setMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full py-2 text-sm font-bold uppercase tracking-[0.15em] transition flex items-center justify-between ${
                      activeView === 'home' ? 'text-amber-900 bg-amber-50/40 px-3 rounded-lg' : 'text-zinc-700 hover:text-black'
                    }`}
                  >
                    <span>{isArabic ? "الصفحة الرئيسية" : "HOME"}</span>
                    <ChevronRight size={14} className={isArabic ? "rotate-180 text-amber-900" : "text-zinc-400"} />
                  </button>

                  {/* Shop Section / Accordion Header */}
                  <div className="border-t border-zinc-100/60 pt-4 mt-2">
                    <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block mb-3 px-1">
                      {isArabic ? "تصفح الفئات" : "SHOP CATEGORIES"}
                    </span>
                    
                    <div className="space-y-2">
                      {categories.map((cat) => {
                        const subcats = getSubcategoriesForCategory(cat.id);
                        const isExpanded = expandedMobileCategory === cat.id;

                        return (
                          <div key={cat.id} className="space-y-1">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  handleCategorySelect(cat.id);
                                  setMobileMenuOpen(false);
                                }}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-between ${
                                  selectedCategory === cat.id && activeView === 'shop'
                                    ? 'bg-amber-100/40 text-amber-950 font-extrabold'
                                    : 'bg-zinc-50/50 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-950'
                                }`}
                                style={{ textAlign: isArabic ? 'right' : 'left' }}
                              >
                                <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                                {selectedCategory === cat.id && activeView === 'shop' ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                                ) : null}
                              </button>
                              
                              {subcats.length > 0 && (
                                <button
                                  onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                                  className="px-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-650 transition cursor-pointer flex items-center justify-center border border-zinc-100/30"
                                >
                                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-amber-800' : ''}`} />
                                </button>
                              )}
                            </div>

                            {/* Nesting subcategories list inside mobile menu drawer */}
                            {subcats.length > 0 && isExpanded && (
                              <div className="pl-4 pr-1 py-1 gap-1 flex flex-col border-l-2 border-amber-100 ml-3">
                                {subcats.map((sub) => {
                                  const label = isArabic ? sub.ar : sub.en;
                                  const isSelected = selectedCategory === cat.id && (selectedSubcategory === sub.en || selectedSubcategory === sub.ar);
                                  return (
                                    <button
                                      key={sub.en}
                                      onClick={() => {
                                        handleSubcategorySelect(cat.id, sub.en);
                                        setMobileMenuOpen(false);
                                      }}
                                      className={`text-left w-full py-2 px-3 rounded-lg text-[11px] font-semibold uppercase tracking-wider transition flex items-center justify-between ${
                                        isSelected
                                          ? 'text-amber-900 font-extrabold bg-amber-50/40'
                                          : 'text-zinc-500 hover:text-zinc-950 hover:bg-zinc-50'
                                      }`}
                                      style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
                                    >
                                      <span>{label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* About Us Link */}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setTimeout(() => {
                        const footer = document.querySelector('footer');
                        if (footer) footer.scrollIntoView({ behavior: 'smooth' });
                      }, 250);
                    }}
                    className="w-full py-3 border-t border-zinc-100/60 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-650 hover:text-amber-750 flex items-center justify-between mt-4"
                  >
                    <span>{isArabic ? "من نحن وقصتنا" : "ABOUT US & HERITAGE"}</span>
                    <Globe size={13} className="text-zinc-400" />
                  </button>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="border-t border-zinc-150 pt-5 mt-auto space-y-4">
                {/* User Status / Account Page Trigger */}
                <button
                  onClick={() => {
                    setActiveView('profile');
                    setMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full flex items-center justify-between p-2.5 bg-zinc-50 hover:bg-zinc-100 transition rounded-xl text-xs text-zinc-700 font-bold cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <User size={15} />
                    <span>{isArabic ? "حسابي الشخصي" : "MY PROFILE"}</span>
                  </div>
                  {isUserLoggedIn && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  )}
                </button>

                {/* Language Switch block */}
                <div className="flex items-center justify-between gap-3 text-xs bg-zinc-50/60 p-2.5 rounded-xl border border-zinc-100">
                  <span className="text-zinc-400 font-medium">{isArabic ? "لغة العرض" : "Layout Language"}</span>
                  <button
                    onClick={() => {
                      setIsArabic(!isArabic);
                      setMobileMenuOpen(false);
                    }}
                    className="px-3 py-1 bg-white border border-zinc-200 hover:border-black rounded-lg text-xs font-bold text-zinc-950 transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe size={13} />
                    <span>{isArabic ? "English" : "العربية"}</span>
                  </button>
                </div>

                {/* Admin Area */}
                {isAdminLoggedIn && (
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100">
                    <button
                      onClick={() => {
                        onOpenAdmin();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition bg-amber-100 text-amber-950"
                    >
                      <Lock size={12} />
                      <span>{isArabic ? "لوحة الأدمن" : "Admin Panel"}</span>
                    </button>

                    <button
                      onClick={() => {
                        onLogoutAdmin();
                        setMobileMenuOpen(false);
                      }}
                      className="text-red-650 hover:text-red-755 font-bold px-2 py-1 flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert size={14} />
                      <span>{isArabic ? "خروج" : "Logout"}</span>
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
