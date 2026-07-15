import React, { useState, useEffect } from 'react';
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
  headerBgColor?: string;
  logoSize?: number;
  logoImage?: string;
  logoText?: string;
  logoTextColor?: string;
  logoTextFont?: string;
  isHeroMerged?: boolean;
  heroLayout?: 'single' | 'split' | 'grid' | 'slider';
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
  announcementLink,
  headerBgColor,
  logoSize,
  logoImage,
  logoText,
  logoTextColor,
  logoTextFont,
  isHeroMerged = false,
  heroLayout = 'split'
}: HeaderProps) {
  const [shopDropdownOpen, setShopDropdownOpen] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const isLightColor = (color?: string) => {
    if (!color) return false;
    const hex = color.replace('#', '');
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140;
    }
    if (hex.length === 6) {
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 140;
    }
    const lower = color.toLowerCase();
    if (lower === 'white' || lower === '#ffffff' || lower === 'transparent' || lower === 'rgba(0,0,0,0)') {
      return true;
    }
    return false;
  };

  const isMergedTransparent = isHeroMerged && !isScrolled;
  const isHeroDark = heroLayout === 'slider' || heroLayout === 'single';
  const isLight = isMergedTransparent 
    ? !isHeroDark 
    : isLightColor(headerBgColor);

  const textClass = isLight ? 'text-zinc-800 hover:text-zinc-950 hover:bg-black/5' : 'text-zinc-300 hover:text-white hover:bg-white/10';
  const iconClass = isLight ? 'text-zinc-700 hover:text-black hover:bg-black/5' : 'text-zinc-300 hover:text-white hover:bg-white/10';
  const logoSubtextClass = isLight ? 'text-zinc-650 font-bold' : 'text-zinc-400';
  
  const activeNavClass = isLight 
    ? 'text-black border-b-2 border-zinc-800 font-bold' 
    : 'text-white border-b-2 border-zinc-300 font-bold';
    
  const inactiveNavClass = isLight 
    ? 'text-zinc-700 hover:text-black px-2 py-1 transition' 
    : 'text-zinc-300 hover:text-white px-2 py-1 transition';

  const langBtnClass = isLight
    ? 'border border-zinc-300 text-zinc-700 hover:text-black hover:border-black rounded'
    : 'border border-white/10 text-zinc-300 hover:text-white hover:border-white/50 rounded';

  const searchInputClass = isLight
    ? 'bg-black/5 border border-black/10 text-xs px-3 py-1.5 rounded-full focus:outline-none focus:border-zinc-800 focus:bg-black/10 text-black mr-2 placeholder-zinc-500 font-sans'
    : 'bg-white/10 border border-white/20 text-xs px-3 py-1.5 rounded-full focus:outline-none focus:border-zinc-300 focus:bg-white/20 text-white mr-2 placeholder-zinc-300 font-sans';

  return (
    <header 
      id="app-header" 
      className={`transition-all duration-300 ${
        isHeroMerged
          ? `fixed top-0 left-0 right-0 z-40 ${isMergedTransparent ? 'border-b-0 bg-transparent text-white' : `border-b shadow-md ${isLight ? 'text-zinc-900 border-zinc-200/80 shadow-sm' : 'text-white border-[#2D2E2F]'}`}`
          : `sticky top-0 z-40 border-b ${isLight ? 'text-zinc-900 border-zinc-200/80 shadow-sm' : 'text-white border-[#2D2E2F]'}`
      }`}
      style={{
        backgroundColor: isMergedTransparent ? 'transparent' : (headerBgColor || '#1C1D1F'),
        borderColor: isMergedTransparent ? 'transparent' : (headerBgColor ? (isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)') : undefined)
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          
          {/* Logo & Hamburger menu combined on the left */}
          <div className="flex items-center gap-1 sm:gap-2 md:w-1/3 flex-initial h-16 md:h-20">
            {/* Hamburger Menu on the Left (Mobile only) */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`p-2 rounded-full transition cursor-pointer ${iconClass}`}
                title={isArabic ? "القائمة" : "Menu"}
              >
                <Menu size={20} strokeWidth={1.8} />
              </button>
            </div>

            {/* Logo container */}
            <div 
              onClick={() => {
                setActiveView('home');
                setSelectedCategory('all');
                setSearchQuery('');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer text-center select-none flex flex-col justify-center items-center h-full"
            >
              <div className="flex items-center justify-center h-full">
                {logoImage ? (
                  <img 
                    src={logoImage} 
                    alt="RAAV Couture Logo" 
                    className={`object-contain transition duration-500 hover:scale-105 rounded-lg md:rounded-xl h-11 md:h-16 lg:h-18 w-auto p-1.5 ${
                      !isLight ? 'bg-white shadow-sm' : ''
                    }`}
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-center transition duration-500 hover:scale-[1.05] group select-none py-1">
                    <span 
                      className={`${
                        logoTextFont && logoTextFont.toLowerCase().startsWith('font-') 
                          ? logoTextFont.toLowerCase() 
                          : logoTextFont 
                            ? '' 
                            : 'font-serif'
                      } tracking-[0.45em] font-extrabold uppercase leading-none pl-[0.45em]`}
                      style={{ 
                        fontSize: logoSize ? `${logoSize * 0.7}px` : '58px',
                        color: logoTextColor || (isLight ? '#000000' : '#E5E5E5'),
                        textShadow: isLight ? '0 1px 3px rgba(0,0,0,0.05)' : '0 2px 10px rgba(0,0,0,0.15)',
                        fontFamily: logoTextFont && !logoTextFont.toLowerCase().startsWith('font-') ? logoTextFont : undefined
                      }}
                    >
                      {logoText || 'RAAV'}
                    </span>
                  </div>
                )}
              </div>
              {activeView === 'shop' && selectedCategory !== 'all' && (
                <div className={`text-[9px] uppercase tracking-[0.15em] mt-0.5 font-sans font-semibold ${logoSubtextClass}`}>
                  {currentCategoryLabel()}
                </div>
              )}
            </div>
          </div>

          {/* Navigation links (Desktop only) */}
          <div className="hidden md:flex items-center gap-4 sm:gap-8 md:w-1/3 justify-center" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <button 
              onClick={() => {
                setActiveView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${
                activeView === 'home' ? activeNavClass : inactiveNavClass
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
                  activeView === 'shop' ? activeNavClass : inactiveNavClass
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
                                ? 'bg-zinc-100 text-zinc-900 font-bold' 
                                : 'text-zinc-650 hover:bg-zinc-50 hover:text-black font-semibold'
                            }`}
                            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                          >
                            <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                            {selectedCategory === cat.id && activeView === 'shop' && (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                            )}
                          </button>

                          {cat.id !== 'all' && subcats.length > 0 && (
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
                                        ? 'text-zinc-950 font-bold' 
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
              className={`hidden sm:inline-block text-xs font-semibold uppercase tracking-[0.2em] transition cursor-pointer px-2 py-1 ${inactiveNavClass}`}
            >
              {isArabic ? "من نحن" : "ABOUT US"}
            </button>
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
                    className={searchInputClass}
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
                className={`p-2 rounded-full transition cursor-pointer ${iconClass}`}
                title={isArabic ? "بحث" : "Search"}
              >
                <Search size={19} strokeWidth={1.8} />
              </button>
            </div>

            {/* Language Switch (hidden on mobile, moved to drawer) */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className={`hidden md:inline-block text-xs font-semibold tracking-wider px-2 py-1 cursor-pointer transition ${langBtnClass}`}
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
                  ? (isLight ? "text-zinc-800 bg-black/5 border border-black/10 shadow-sm" : "text-zinc-200 bg-white/10 border border-white/20")
                  : iconClass
              }`}
              style={isMergedTransparent ? undefined : { borderColor: '#000000', backgroundColor: '#ffffff' }}
              title={isArabic ? "حسابي الشخصي" : "My Account"}
            >
              <User size={19} strokeWidth={1.8} style={isMergedTransparent ? undefined : { borderColor: '#000000', fontSize: '18px' }} />
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
                    ? (isLight ? "text-zinc-800 bg-black/5 border border-black/10 shadow-sm" : "text-zinc-200 bg-white/10 border border-white/20")
                    : iconClass
                }`}
                style={isMergedTransparent ? undefined : { backgroundColor: '#ffffff' }}
                title={isArabic ? "لوحة الإدارة" : "Admin Dashboard"}
              >
                <Lock size={15} strokeWidth={1.8} style={isMergedTransparent ? undefined : { borderColor: '#000000', fontSize: '20px' }} />
              </button>
            )}

            {/* Admin Logout button (hidden on mobile, moved to drawer) */}
            {isAdminLoggedIn && (
              <button
                onClick={onLogoutAdmin}
                className={`hidden md:inline-block p-1.5 text-red-400 ${isLight ? 'hover:text-red-600 hover:bg-black/5' : 'hover:text-red-300 hover:bg-white/10'} rounded-full transition cursor-pointer`}
                title={isArabic ? "خروج المسؤول" : "Admin Logout"}
              >
                <ShieldAlert size={19} strokeWidth={1.8} style={isMergedTransparent ? undefined : { borderColor: '#000000' }} />
              </button>
            )}

            {/* Cart / Shopping Bag Icon */}
            <button
              onClick={onOpenCart}
              className={`relative p-2 rounded-full transition cursor-pointer ${iconClass}`}
              title={isArabic ? "سلة المشتريات" : "Shopping Bag"}
            >
              <ShoppingBag size={19} strokeWidth={1.8} />
              <span className="absolute -top-0.5 -right-0.5 bg-zinc-200 text-zinc-950 rounded-full text-[9px] w-4 h-4 flex items-center justify-center font-bold border border-zinc-400">
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
          <span className="font-bold text-zinc-900 bg-zinc-200/70 px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">{currentCategoryLabel()}</span>
          <button 
            onClick={() => setSelectedCategory('all')} 
            className="text-zinc-700 hover:underline font-semibold cursor-pointer"
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
                      src={logoImage || "/src/assets/images/raav_clean_circle_logo_1782164055293.jpg"} 
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
                      activeView === 'home' ? 'text-zinc-900 bg-zinc-100/80 px-3 rounded-lg' : 'text-zinc-700 hover:text-black'
                    }`}
                  >
                    <span>{isArabic ? "الصفحة الرئيسية" : "HOME"}</span>
                    <ChevronRight size={14} className={isArabic ? "rotate-180 text-zinc-900" : "text-zinc-400"} />
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
                                    ? 'bg-zinc-100 text-zinc-950 font-extrabold'
                                    : 'bg-zinc-50/50 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-950'
                                }`}
                                style={{ textAlign: isArabic ? 'right' : 'left' }}
                              >
                                <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                                {selectedCategory === cat.id && activeView === 'shop' ? (
                                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-800 animate-ping" />
                                ) : null}
                              </button>
                              
                              {cat.id !== 'all' && subcats.length > 0 && (
                                <button
                                  onClick={() => setExpandedMobileCategory(isExpanded ? null : cat.id)}
                                  className="px-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl text-zinc-650 transition cursor-pointer flex items-center justify-center border border-zinc-100/30"
                                >
                                  <ChevronDown size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180 text-zinc-800' : ''}`} />
                                </button>
                              )}
                            </div>

                            {/* Nesting subcategories list inside mobile menu drawer */}
                            {cat.id !== 'all' && subcats.length > 0 && isExpanded && (
                              <div className="pl-4 pr-1 py-1 gap-1 flex flex-col border-l-2 border-zinc-300 ml-3">
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
                                          ? 'text-zinc-950 font-extrabold bg-zinc-150'
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
                    className="w-full py-3 border-t border-zinc-100/60 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-650 hover:text-zinc-950 flex items-center justify-between mt-4"
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
                      className="flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition bg-zinc-200 text-zinc-950"
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
