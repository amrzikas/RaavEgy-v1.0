import React, { useState } from 'react';
import { ShoppingBag, Lock, ShieldAlert, Sparkles, ChevronDown, Search, User, Menu, X, ChevronRight, Globe } from 'lucide-react';
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
              className="p-2 text-zinc-700 hover:text-black hover:bg-zinc-50 rounded-full transition cursor-pointer"
              title={isArabic ? "القائمة" : "Menu"}
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
          </div>

          {/* Navigation links on the Left (Desktop only) */}
          <div className="hidden md:flex items-center space-x-1 sm:space-x-8 md:w-1/3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
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
          <div className="flex justify-center md:w-1/3 flex-1 md:flex-initial">
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

            {/* Language Switch (hidden on mobile, moved to drawer) */}
            <button
              onClick={() => setIsArabic(!isArabic)}
              className="hidden md:inline-block text-xs font-semibold tracking-wider hover:text-amber-800 px-2 py-1 cursor-pointer transition border border-zinc-200 hover:border-zinc-300 rounded"
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

            {/* Admin Key Button (hidden on mobile, moved to drawer) */}
            <button 
              onClick={onOpenAdmin}
              className={`hidden md:inline-block p-2 rounded-full transition cursor-pointer relative ${
                isAdminLoggedIn
                  ? "text-amber-750 bg-amber-50"
                  : "text-zinc-400 hover:text-amber-600 hover:bg-amber-50/50"
              }`}
              title={isAdminLoggedIn ? (isArabic ? "لوحة الإدارة" : "Admin Dashboard") : (isArabic ? "دخول المسؤول" : "Admin Sign-In")}
            >
              <Lock size={15} strokeWidth={1.8} />
            </button>

            {/* Admin Logout button (hidden on mobile, moved to drawer) */}
            {isAdminLoggedIn && (
              <button
                onClick={onLogoutAdmin}
                className="hidden md:inline-block p-1.5 text-red-650 hover:text-red-755 hover:bg-red-50 rounded-full transition cursor-pointer"
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
              className={`fixed top-0 bottom-0 w-[290px] max-w-[85vw] bg-white z-55 shadow-2xl flex flex-col justify-between p-6 md:hidden ${
                isArabic ? 'right-0 border-l border-zinc-100' : 'left-0 border-r border-zinc-100'
              }`}
              style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-100 mb-6">
                  <h2 className="text-xl font-serif tracking-[0.2em] font-bold text-black select-none">
                    RAAV
                  </h2>
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
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => {
                            handleCategorySelect(cat.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center justify-between ${
                            selectedCategory === cat.id && activeView === 'shop'
                              ? 'bg-amber-100/40 text-amber-950 font-extrabold'
                              : 'bg-zinc-50/50 hover:bg-zinc-50 text-zinc-650 hover:text-zinc-950'
                          }`}
                        >
                          <span>{isArabic ? cat.labelAr : cat.labelEn}</span>
                          {selectedCategory === cat.id && activeView === 'shop' ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping" />
                          ) : (
                            <ChevronRight size={12} className={isArabic ? "rotate-180 text-zinc-400" : "text-zinc-400"} />
                          )}
                        </button>
                      ))}
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
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-zinc-100">
                  <button
                    onClick={() => {
                      onOpenAdmin();
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-1.5 font-bold px-3 py-1.5 rounded-lg transition ${
                      isAdminLoggedIn 
                        ? 'bg-amber-100 text-amber-950' 
                        : 'bg-zinc-50 text-zinc-500 hover:text-zinc-950 hover:bg-zinc-100'
                    }`}
                  >
                    <Lock size={12} />
                    <span>{isAdminLoggedIn ? (isArabic ? "لوحة الأدمن" : "Admin Panel") : (isArabic ? "الأدمن" : "Admin Mode")}</span>
                  </button>

                  {isAdminLoggedIn && (
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
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
