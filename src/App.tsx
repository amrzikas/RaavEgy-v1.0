/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import HeroCarousel from './components/HeroCarousel.tsx';
import MainHeroSection from './components/MainHeroSection.tsx';
import ProductCard from './components/ProductCard.tsx';
import ProductDetailsModal from './components/ProductDetailsModal.tsx';
import CartSlider from './components/CartSlider.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import TheCollections from './components/TheCollections.tsx';
import TrendPieces from './components/TrendPieces.tsx';
import CategoryScrollSlices from './components/CategoryScrollSlices.tsx';
import ShopPage from './components/ShopPage.tsx';
import ProductPage from './components/ProductPage.tsx';
import CustomerAuth from './components/CustomerAuth.tsx';
import CustomerProfile from './components/CustomerProfile.tsx';
import CustomCoutureForm from './components/CustomCoutureForm.tsx';
import { 
  ContactUsPage, 
  ShippingReturnsPage, 
  SizeGuidePage, 
  FaqPage, 
  PrivacyPolicyPage, 
  TermsOfServicePage 
} from './components/SupportPages.tsx';
import { Product, OrderItem, Order, SupportPagesContent, HomepageContent, Category } from './types';
import { getProductPrice } from './utils';
import { 
  seedProductsIfNeeded, 
  subscribeToProducts, 
  subscribeToOrders,
  getAdminSetupStatus,
  getHomepageContent,
  getSupportPagesContent,
  subscribeToCategories
} from './dbService';
import { initialProducts } from './initialProducts';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Sparkles, Phone, MapPin, Mail, ShoppingBag, Facebook, Instagram, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('raav_egy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // View Navigation State (home | shop | profile | product-details | customer sub-pages)
  const [activeView, setActiveView] = useState<
    'home' | 'shop' | 'profile' | 'product-details' | 
    'contact-us' | 'shipping-returns' | 'size-guide' | 'faq' | 'privacy-policy' | 'terms-of-service'
  >('home');
  const [profileTab, setProfileTab] = useState<'addresses' | 'orders' | 'favorites' | 'custom'>('orders');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters & Toggles
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isArabic, setIsArabic] = useState(false);

  // Sync HTML direction and language attributes dynamically
  useEffect(() => {
    const html = document.documentElement;
    html.lang = isArabic ? 'ar' : 'en';
    html.dir = isArabic ? 'rtl' : 'ltr';
  }, [isArabic]);

  // Dynamic Content States
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [supportContent, setSupportContent] = useState<SupportPagesContent | null>(null);

  const refreshContentData = () => {
    getHomepageContent().then(setHomepageContent).catch(() => {});
    getSupportPagesContent().then(setSupportContent).catch(() => {});
  };

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('raav_egy_cart', JSON.stringify(cart));
  }, [cart]);

  // Read data on launch
  useEffect(() => {
    // Fetch dynamic content from Firestore
    refreshContentData();

    // 1. Subscribe to real-time Products catalog (available to anyone)
    const unsubscribeProducts = subscribeToProducts((prodList) => {
      // Rely 100% on database products
      setProducts(prodList);
    });

    // 1b. Subscribe to real-time Categories
    const unsubscribeCategories = subscribeToCategories((cats) => {
      setCategoriesList(cats);
    });

    // 2. Listen to Auth State
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Retrieve setup to verify if they are indeed the configuring admin
        try {
          const adminSetup = await getAdminSetupStatus();
          if (adminSetup.isInitialized && adminSetup.adminUid === user.uid) {
            setIsAdminLoggedIn(true);
          } else {
            setIsAdminLoggedIn(false);
          }
        } catch (error) {
          console.error("Error setting admin authentication state:", error);
          setIsAdminLoggedIn(false);
        }
      } else {
        setIsAdminLoggedIn(false);
        setCart([]);
        localStorage.removeItem('raav_egy_cart');
      }
    });

    return () => {
      unsubscribeProducts();
      unsubscribeCategories();
      unsubscribeAuth();
    };
  }, []);

  // Admin-only data actions (Order tracking & catalog setup)
  useEffect(() => {
    let unsubscribeOrders: () => void = () => {};

    if (isAdminLoggedIn) {
      // Seed collection with initial items if empty (requires admin auth for write)
      seedProductsIfNeeded();

      // Subscribe to real-time Orders
      unsubscribeOrders = subscribeToOrders((orderList) => {
        setOrders(orderList);
      });
    } else {
      setOrders([]);
    }

    return () => {
      unsubscribeOrders();
    };
  }, [isAdminLoggedIn]);

  // Cart operations
  const handleAddToCart = (product: Product, size: string, color: string, quantity: number) => {
    setCart((currentCart) => {
      // Match item by id AND matching size AND matching color
      const existingIdx = currentCart.findIndex(
        (item) => 
          item.productId === product.id && 
          item.selectedSize === size && 
          item.selectedColor === color
      );

      if (existingIdx > -1) {
        const nextCart = [...currentCart];
        nextCart[existingIdx].quantity += quantity;
        return nextCart;
      }

      const priceInfo = getProductPrice(product);
      const newItem: OrderItem = {
        productId: product.id,
        nameAr: product.nameAr,
        nameEn: product.nameEn,
        price: priceInfo.current,
        image: product.image,
        quantity,
        selectedSize: size,
        selectedColor: color
      };
      return [...currentCart, newItem];
    });
  };

  const handleQuickAddToCart = (product: Product) => {
    // Quick Add defaults: first size, first color, quantity 1
    const size = product.sizes[0] || 'M';
    const color = product.colors[0] || '#ffffff';
    handleAddToCart(product, size, color, 1);
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (productId: string, size: string, color: string, qty: number) => {
    setCart((prev) => 
      prev.map((item) => 
        item.productId === productId && item.selectedSize === size && item.selectedColor === color
          ? { ...item, quantity: qty }
          : item
      )
    );
  };

  const handleRemoveCartItem = (productId: string, size: string, color: string) => {
    setCart((prev) => 
      prev.filter(
        (item) => 
          !(item.productId === productId && item.selectedSize === size && item.selectedColor === color)
      )
    );
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleLogoutAdmin = async () => {
    try {
      await signOut(auth);
      setIsAdminLoggedIn(false);
      setIsAdminOpen(false);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'all' || prod.category === selectedCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      prod.nameAr.includes(searchQuery) || 
      prod.nameEn.toLowerCase().includes(searchLower) ||
      prod.descriptionAr.includes(searchQuery) ||
      prod.descriptionEn.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  const activeProducts = products.filter(p => p.isActive !== false);

  const cartTotalItemsCount = cart.reduce((count, item) => count + item.quantity, 0);

  const handleBannerClick = (link?: string) => {
    if (!link) return;
    if (link.includes('shop') || link.startsWith('#')) {
      setSelectedCategory('all');
      setActiveView('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (link.includes('custom') || link.includes('profile')) {
      setActiveView('profile');
      window.scrollTo({ top: 300, behavior: 'smooth' });
    } else {
      setSelectedCategory('all');
      setActiveView('shop');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getAdBannerBg = (color?: string) => {
    if (!color || color === '#18181b' || color === '#1b1c19' || color === 'transparent') {
      return 'rgba(255, 255, 255, 0.02)'; // extremely clean premium semi-transparent overlay
    }
    return color;
  };

  const ad1 = homepageContent?.adBanner1 || {
    badgeAr: "خدمة التفصيل اليدوي الفاخرة",
    badgeEn: "LUXURY HANDMADE SERVICES",
    titleAr: "هل تبحثين عن تفصيل وتصميم مخصص تماماً؟",
    titleEn: "Looking for a Completely Customized Tailored Design?",
    descAr: "نحن نحول خيالك إلى قطع ملابس هاند ميد فريدة مصممة خصيصاً بمقاساتك الدقيقة وخامات مختارة لترضي ذوقك. ابدئي طلبك المخصص الآن وتواصلي معنا مباشرة.",
    descEn: "We transform your sartorial thoughts into unique, hand-tailored clothing made to your exact body measurements and fine fabrics. Start your custom order details and chat now.",
    buttonTextAr: "طلبي المخصص الآن",
    buttonTextEn: "MY CUSTOM COUTURE NOW",
    buttonLink: "custom-couture",
    bannerImage: "",
    backgroundColor: "transparent",
    textColor: "#ffffff",
    badgeBgColor: "rgba(245, 158, 11, 0.15)",
    badgeTextColor: "#fbbf24",
    buttonBgColor: "#fbbf24",
    buttonTextColor: "#09090b"
  };

  const ad2 = homepageContent?.adBanner2 || {
    badgeAr: "عرض الصيف الحصري والمميز",
    badgeEn: "EXCLUSIVE SUMMER SEASON",
    titleAr: "استمتعي بخصم ١٥٪ على تشكيلات الموسم الفريدة",
    titleEn: "Enjoy 15% Off Curated Collection Masterpieces",
    descAr: "أدخلي كود الخصم الحصري عند إتمام الطلب لتجربة الأزياء الرائجة لهذا الموسم. نوفر خدمة تجربة القطع للمطابقة والمعاينة عند تسليم المندوب.",
    descEn: "Apply our premier discount code at checkout to acquire highly coveted styles. Direct shipping in Egypt with fully comfortable home trials.",
    buttonTextAr: "تسوق الآن",
    buttonTextEn: "SHOP COLL",
    buttonLink: "#shop",
    bannerImage: "",
    backgroundColor: "transparent",
    textColor: "#ffffff",
    badgeBgColor: "rgba(245, 158, 11, 0.10)",
    badgeTextColor: "#fef3c7",
    buttonBgColor: "#09090b",
    buttonTextColor: "#ffffff"
  };

  return (
    <div className="relative min-h-screen text-zinc-800 selection:bg-zinc-900 selection:text-white antialiased font-sans transition-all duration-500 bg-gradient-to-b from-[#2E2F32] via-[#1C1D1F] to-[#0D0E0F] overflow-hidden">
      
      {/* High-fashion flowing mesh backdrop with intertwined dark and light soft gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Rich dark slate top-left soft glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-[#202123]/35 via-[#2E2F32]/25 to-transparent blur-[110px] opacity-75" />
        
        {/* Soft Silver/Platinum warm light representing premium artisanal luxury */}
        <div className="absolute top-[15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-zinc-100/10 via-white/5 to-[#3A3B3D]/15 blur-[130px] opacity-70" />
        
        {/* Intertwined steel-stone glow in middle left */}
        <div className="absolute top-[40%] left-[-25%] w-[55%] h-[55%] rounded-full bg-gradient-to-r from-[#1A1B1C]/20 via-[#2E2F32]/15 to-transparent blur-[140px]" />

        {/* Deep Slate/Carbon bottom-right soft ambient depth */}
        <div className="absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] rounded-full bg-gradient-to-tl from-[#0A0A0B]/40 via-[#222324]/25 to-transparent blur-[150px]" />
      </div>

      {/* Actual app content layout layer */}
      <div className="relative z-10">
        {/* Header Bar */}
        <Header
          cartCount={cartTotalItemsCount}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenAdmin={() => setIsAdminOpen(true)}
          isAdminLoggedIn={isAdminLoggedIn}
          onLogoutAdmin={handleLogoutAdmin}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          selectedSubcategory={selectedSubcategory}
          setSelectedSubcategory={setSelectedSubcategory}
          products={activeProducts}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isArabic={isArabic}
          setIsArabic={setIsArabic}
          activeView={activeView}
          setActiveView={setActiveView}
          isUserLoggedIn={!!currentUser}
          customAnnouncement={isArabic ? homepageContent?.announcementAr : homepageContent?.announcementEn}
          announcementImage={homepageContent?.announcementImage}
          announcementLink={homepageContent?.announcementLink}
          headerBgColor={homepageContent?.headerBgColor}
          logoSize={homepageContent?.logoSize}
          logoImage={homepageContent?.logoImage || 'https://ik.imagekit.io/uut0qzgwd/Raav/Gemini_Generated_Image_ewb4soewb4soewb4-removebg-preview.png'}
          logoText={homepageContent?.logoText}
          logoTextColor={homepageContent?.logoTextColor}
          logoTextFont={homepageContent?.logoTextFont}
          isHeroMerged={activeView === 'home' && !searchQuery && homepageContent?.heroSectionEnabled !== false}
          heroLayout={homepageContent?.heroSectionLayout || 'split'}
        />

        {/* Main Page Layout */}
        <main className="pb-16" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          {activeView === 'home' && (
            <div>
              {/* Only display Hero slides if search query is empty */}
              {!searchQuery && (
                <>
                  {homepageContent?.heroSectionEnabled !== false && (
                    <MainHeroSection
                      isArabic={isArabic}
                      enabled={true}
                      showTexts={homepageContent?.heroSectionShowTexts !== false}
                      titleAr={homepageContent?.heroSectionTitleAr}
                      titleEn={homepageContent?.heroSectionTitleEn}
                      subAr={homepageContent?.heroSectionSubAr}
                      subEn={homepageContent?.heroSectionSubEn}
                      btnTextAr={homepageContent?.heroSectionBtnTextAr}
                      btnTextEn={homepageContent?.heroSectionBtnTextEn}
                      btnLink={homepageContent?.heroSectionBtnLink}
                      images={homepageContent?.heroSectionImages}
                      layout={homepageContent?.heroSectionLayout || 'split'}
                      isMergedHeader={activeView === 'home' && !searchQuery && homepageContent?.heroSectionEnabled !== false}
                      onActionClick={(link) => {
                        if (link === 'custom' || link?.includes('custom')) {
                          const formEl = document.getElementById('custom-couture-form-section');
                          if (formEl) {
                            formEl.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            setSelectedCategory('all');
                            setActiveView('shop');
                          }
                        } else {
                          setSelectedCategory(link || 'all');
                          setActiveView('shop');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                    />
                  )}
                  {homepageContent?.heroCarouselEnabled !== false && (
                    <HeroCarousel
                      isArabic={isArabic}
                      isCompactRibbon={true}
                      onBrowseCategory={(cat) => {
                        setSelectedCategory(cat);
                        setActiveView('shop');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      customSlides={homepageContent?.heroSlides}
                    />
                  )}
                </>
              )}

              {/* The Collections Section - ALWAYS BELOW HERO SECTION */}
              {homepageContent?.collectionsSectionEnabled !== false && (
                <TheCollections
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isArabic={isArabic}
                  backdrop={homepageContent?.sectionBackgrounds?.theCollections}
                  layout={homepageContent?.collectionsLayout || 'slider'}
                  order={homepageContent?.collectionsOrder}
                  categoryImages={homepageContent?.categoryImages}
                  categoriesList={categoriesList}
                />
              )}

              {/* Trend Pieces Section */}
              {homepageContent?.trendSectionEnabled !== false && (
                <TrendPieces
                  products={activeProducts}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    setActiveView('product-details');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isArabic={isArabic}
                  onQuickAddToCart={handleQuickAddToCart}
                  backdrop={homepageContent?.sectionBackgrounds?.trendPieces}
                />
              )}

              {/* Category Scroll Slices Section */}
              {homepageContent?.categorySlicesSectionEnabled !== false && (
                <CategoryScrollSlices
                  products={activeProducts}
                  onSelectProduct={(p) => {
                    setSelectedProduct(p);
                    setActiveView('product-details');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  isArabic={isArabic}
                  onSelectCategory={(cat) => {
                    setSelectedCategory(cat);
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  onQuickAddToCart={handleQuickAddToCart}
                  categoryImages={homepageContent?.categoryImages}
                  categoryTexts={homepageContent?.categoryTexts}
                  backdrop={homepageContent?.sectionBackgrounds?.categoryScrollSlices}
                  categoryBackdrops={homepageContent?.categoryBackdrops}
                  categoriesList={categoriesList}
                />
              )}

              {/* SPECIAL CUSTOM ORDERS FORM SECTION */}
              {homepageContent?.customCoutureSectionEnabled !== false && (
                <CustomCoutureForm
                  isArabic={isArabic}
                  currentUser={currentUser}
                  onOpenAuth={() => {
                    setProfileTab('custom');
                    setActiveView('profile');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  onGoToProfileCustom={() => {
                    setProfileTab('custom');
                    setActiveView('profile');
                    window.scrollTo({ top: 300, behavior: 'smooth' });
                  }}
                  backdrop={homepageContent?.sectionBackgrounds?.customCoutureForm}
                />
              )}
            </div>
          )}

        {activeView === 'shop' && (
          <ShopPage
            products={activeProducts}
            onSelectProduct={(p) => {
              setSelectedProduct(p);
              setActiveView('product-details');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isArabic={isArabic}
            initialCategory={selectedCategory as any}
            initialSubcategory={selectedSubcategory}
            categoriesList={categoriesList}
          />
        )}

        {activeView === 'product-details' && (
          selectedProduct ? (
            <ProductPage
              product={selectedProduct}
              products={activeProducts}
              onSelectProduct={(p) => {
                setSelectedProduct(p);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onBack={() => {
                setActiveView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onAddToCart={handleAddToCart}
              isArabic={isArabic}
              currentUser={currentUser}
              onGoToAuth={() => {
                setActiveView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveView('shop');
                const productsSec = document.getElementById('shop-top-anchor') || document.getElementById('root');
                if (productsSec) {
                  productsSec.scrollIntoView({ behavior: 'smooth' });
                } else {
                  window.scrollTo({ top: 400, behavior: 'smooth' });
                }
              }}
              categoriesList={categoriesList}
            />
          ) : (
            <div className="py-20 text-center font-serif text-lg">
              {isArabic ? "لم نجد تفاصيل هذا الموديل!" : "Details for this outfit are unavailable!"}
            </div>
          )
        )}

        {activeView === 'profile' && (
          currentUser ? (
            <CustomerProfile
              uid={currentUser.uid}
              onLogout={() => {
                setCurrentUser(null);
                setCart([]);
                localStorage.removeItem('raav_egy_cart');
                setActiveView('home');
              }}
              isArabic={isArabic}
              onBrowseShop={() => {
                setActiveView('shop');
              }}
              initialTab={profileTab}
            />
          ) : (
            <CustomerAuth
              onSuccess={(uid) => {
                setActiveView('profile');
              }}
              isArabic={isArabic}
            />
          )
        )}

        {activeView === 'contact-us' && (
          <ContactUsPage 
            isArabic={isArabic} 
            onBackToHome={() => {
              setActiveView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }} 
            content={supportContent?.contact_us}
          />
        )}

        {activeView === 'shipping-returns' && (
          <ShippingReturnsPage isArabic={isArabic} content={supportContent?.shipping_returns} />
        )}

        {activeView === 'size-guide' && (
          <SizeGuidePage isArabic={isArabic} content={supportContent?.size_guide} />
        )}

        {activeView === 'faq' && (
          <FaqPage isArabic={isArabic} content={supportContent?.faq} />
        )}

        {activeView === 'privacy-policy' && (
          <PrivacyPolicyPage isArabic={isArabic} content={supportContent?.privacy_policy} />
        )}

        {activeView === 'terms-of-service' && (
          <TermsOfServicePage isArabic={isArabic} content={supportContent?.terms_of_service} />
        )}
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-[#0b0e14] text-[#8a92a6] py-16 text-xs leading-relaxed" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Col 1: Brand details & Social Media Links */}
          <div className="space-y-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="text-white font-serif text-lg tracking-[0.1em] font-medium uppercase">
              RAAV EGY
            </h4>
            <p className="text-xs text-[#8a92a6] leading-relaxed max-w-sm font-sans font-light">
              {isArabic 
                ? "ننسج الأناقة في كل لحظة. أزياء راقية ومبتكرة مصممة خصيصاً للنساء، الرجال، والأطفال."
                : "Crafting elegance for every moment. High-fashion apparel for women, men, and children."}
            </p>
            
            {/* Social Media Links with customized logos */}
            <div className={`pt-2 flex items-center gap-3 ${isArabic ? 'justify-start' : 'justify-start'}`}>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#1b2336] bg-[#0c101b] flex items-center justify-center text-[#8a92a6] hover:text-white hover:bg-blue-600 hover:border-blue-600 transition-all duration-300"
                title="Facebook"
              >
                <Facebook size={14} />
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#1b2336] bg-[#0c101b] flex items-center justify-center text-[#8a92a6] hover:text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:to-purple-600 hover:border-transparent transition-all duration-300"
                title="Instagram"
              >
                <Instagram size={14} />
              </a>
              <a 
                href="https://tiktok.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full border border-[#1b2336] bg-[#0c101b] flex items-center justify-center text-[#8a92a6] hover:text-white hover:bg-zinc-800 hover:border-zinc-800 transition-all duration-300 gap-0.5"
                title="TikTok"
              >
                <Video size={11} />
                <span className="text-[8px] font-serif font-black tracking-tighter leading-none select-none">TT</span>
              </a>
            </div>
          </div>

          {/* Col 2: Shop Category Redirection Links */}
          <div className="space-y-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.1em] font-medium">
              {isArabic ? "تسوق" : "SHOP"}
            </h4>
            <ul className="space-y-3 font-sans font-light">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('women');
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "مجموعة النساء" : "Women's Collection"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('men');
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "مجموعة الرجال" : "Men's Collection"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('kids');
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "مجموعة الأطفال" : "Kids' Collection"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('accessories');
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "الإكسسوارات" : "Accessories"}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Support */}
          <div className="space-y-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.1em] font-medium">
              {isArabic ? "الدعم" : "SUPPORT"}
            </h4>
            <ul className="space-y-3 font-sans font-light">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('contact-us');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "اتصل بنا" : "Contact Us"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('shipping-returns');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "الشحن والاسترجاع" : "Shipping & Returns"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('size-guide');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "دليل المقاسات" : "Size Guide"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setActiveView('faq');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "الأسئلة الشائعة" : "FAQ"}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminOpen(true);
                  }}
                  className="hover:text-amber-400 transition-colors duration-200 cursor-pointer text-[#8a92a6]"
                >
                  {isArabic ? "دخول الموظفين" : "Staff Login"}
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Join the club / Newsletter */}
          <div className="space-y-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="text-white font-serif text-xs uppercase tracking-[0.1em] font-medium">
              {isArabic ? "انضم إلى نادينا" : "JOIN THE CLUB"}
            </h4>
            <p className="text-xs text-[#8a92a6] font-sans font-light leading-relaxed">
              {isArabic 
                ? "اشترك لتصلك آخر الصيحات والمجموعات الحصرية الموسمية وعروض الأعضاء الخاصة أولاً بأول."
                : "Subscribe to receive updates, access to exclusive deals, and more."}
            </p>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const emailInput = form.elements.namedItem('email') as HTMLInputElement;
                if (emailInput && emailInput.value.trim()) {
                  alert(isArabic 
                    ? `شكراً لانضمامك! تم تسجيل الإيميل بنجاح: ${emailInput.value}` 
                    : `Welcome to the club! Registered under: ${emailInput.value}`);
                  emailInput.value = '';
                }
              }}
              className="pt-2"
            >
              <div className="border-b border-[#2d3748] focus-within:border-white transition-colors duration-300 pb-1.5 flex items-center justify-between gap-4">
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={isArabic ? "بريدك الإلكتروني" : "Your email"}
                  className="bg-transparent text-white placeholder-[#4e5564] text-xs w-full focus:outline-none border-none outline-none py-1"
                  style={{ textAlign: 'inherit' }}
                />
                <button
                  type="submit"
                  className="text-white text-xs uppercase tracking-[0.15em] font-bold hover:opacity-80 transition cursor-pointer select-none shrink-0"
                >
                  {isArabic ? "انضمام" : "JOIN"}
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Micro subfooter spacer line */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-[#1b2336] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] tracking-[0.15em] text-[#555d6e] uppercase text-center sm:text-right font-medium">
            © {new Date().getFullYear()} RAAV EGY. ALL RIGHTS RESERVED.
          </p>
          <div className="flex gap-6 text-[9px] tracking-[0.15em] text-[#555d6e] uppercase">
            <button 
              type="button"
              onClick={() => {
                setActiveView('privacy-policy');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="hover:text-white transition"
            >
              {isArabic ? "سياسة الخصوصية" : "PRIVACY POLICY"}
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveView('terms-of-service');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} 
              className="hover:text-white transition"
            >
              {isArabic ? "شروط الخدمة" : "TERMS OF SERVICE"}
            </button>
          </div>
        </div>
      </footer>

      {/* CART DRAWER SLIDE-OVER */}
      <CartSlider
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        isArabic={isArabic}
      />

      {/* CLOTHES DETAILS PANEL MODAL */}
      {activeProductDetail && (
        <ProductDetailsModal
          product={activeProductDetail}
          onClose={() => setActiveProductDetail(null)}
          onAddToCart={handleAddToCart}
          isArabic={isArabic}
          categoriesList={categoriesList}
        />
      )}

      {/* SECURE ADMINISTRATIVE DASHBOARD */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        orders={orders}
        isArabic={isArabic}
        onContentUpdate={refreshContentData}
        categories={categoriesList}
      />

      </div>
    </div>
  );
}
