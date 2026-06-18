/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Header from './components/Header.tsx';
import HeroCarousel from './components/HeroCarousel.tsx';
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
import { Product, OrderItem, Order } from './types';
import { getProductPrice } from './utils';
import { 
  seedProductsIfNeeded, 
  subscribeToProducts, 
  subscribeToOrders,
  getAdminSetupStatus
} from './dbService';
import { initialProducts } from './initialProducts';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { Sparkles, Phone, MapPin, Mail, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('raav_egy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // View Navigation State (home | shop | profile | product-details)
  const [activeView, setActiveView] = useState<'home' | 'shop' | 'profile' | 'product-details'>('home');
  const [profileTab, setProfileTab] = useState<'addresses' | 'orders' | 'favorites' | 'custom'>('orders');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters & Toggles
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  
  // Auth state
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [isArabic, setIsArabic] = useState(true);

  // Sync cart to localStorage
  useEffect(() => {
    localStorage.setItem('raav_egy_cart', JSON.stringify(cart));
  }, [cart]);

  // Read data on launch
  useEffect(() => {
    // 1. Subscribe to real-time Products catalog (available to anyone)
    const unsubscribeProducts = subscribeToProducts((prodList) => {
      // Merge database items with any missing seed initial products
      const mergedList = [...prodList];
      initialProducts.forEach((initProd) => {
        const alreadyExists = prodList.some(p => p.nameEn.toLowerCase() === initProd.nameEn.toLowerCase());
        if (!alreadyExists) {
          mergedList.push({
            id: `seed-${initProd.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
            createdAt: Date.now(),
            ...initProd
          } as Product);
        }
      });
      // Sort so that newer items or custom added ones still maintain a premium layout
      setProducts(mergedList);
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
      }
    });

    return () => {
      unsubscribeProducts();
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

  return (
    <div className="relative min-h-screen text-zinc-800 selection:bg-zinc-950 selection:text-white antialiased font-sans transition-all duration-500 bg-stone-50 overflow-hidden">
      
      {/* High-fashion flowing mesh backdrop with intertwined dark and light soft gradients */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Dark Onyx/Slate top-left soft glow */}
        <div className="absolute top-[-20%] left-[-20%] w-[65%] h-[65%] rounded-full bg-gradient-to-br from-zinc-950/25 via-stone-200/35 to-transparent blur-[110px] opacity-75" />
        
        {/* Soft Gold/Champagne warm light representing premium artisanal luxury */}
        <div className="absolute top-[15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-gradient-to-tr from-amber-100/15 via-white to-stone-50 blur-[130px] opacity-70" />
        
        {/* Intertwined charcoal-stone glow in middle left */}
        <div className="absolute top-[40%] left-[-25%] w-[55%] h-[55%] rounded-full bg-gradient-to-r from-zinc-900/10 via-amber-50/30 to-transparent blur-[140px]" />

        {/* Deep Slate/Carbon bottom-right soft ambient depth */}
        <div className="absolute bottom-[-15%] right-[-15%] w-[65%] h-[65%] rounded-full bg-gradient-to-tl from-zinc-950/20 via-stone-100/50 to-amber-100/10 blur-[150px]" />
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
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isArabic={isArabic}
          setIsArabic={setIsArabic}
          activeView={activeView}
          setActiveView={setActiveView}
          isUserLoggedIn={!!currentUser}
        />

        {/* Main Page Layout */}
        <main className="pb-16" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          {activeView === 'home' && (
            <div>
              {/* Only display Hero slides if search query is empty */}
              {!searchQuery && (
                <HeroCarousel
                  isArabic={isArabic}
                  onBrowseCategory={(cat) => {
                    setSelectedCategory(cat);
                    setActiveView('shop');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              )}

              {/* INTERTWINED PREMIUM AD 1: Below Hero Carousel */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10 md:my-14 font-sans focus:outline-none relative">
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                  className="relative overflow-hidden rounded-[2rem] border border-amber-900/10 shadow-xl bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/90 text-white min-h-[160px] md:min-h-[200px] flex items-center"
                >
                  {/* Subtle luxurious ambient lights */}
                  <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute bottom-[-50%] left-[-10%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute top-[-30%] right-[15%] w-[180px] h-[180px] bg-white/5 rounded-full blur-[60px] pointer-events-none" />

                  <div className="relative w-full px-6 py-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    
                    {/* Message section */}
                    <div className="space-y-2 max-w-xl text-right md:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                      <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.25em]">
                        <Sparkles size={11} className="text-amber-400 animate-pulse" />
                        <span>{isArabic ? "خدمة التفصيل اليدوي الفاخرة" : "LUXURY HANDMADE SERVICES"}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-white leading-snug">
                        {isArabic 
                          ? "هل تبحثين عن تفصيل وتصميم مخصص تماماً؟" 
                          : "Looking for a Completely Customized Tailored Design?"}
                      </h3>
                      <p className="text-xs text-zinc-300 font-light leading-relaxed">
                        {isArabic 
                          ? "نحن نحول خيالك إلى قطع ملابس هاند ميد فريدة مصممة خصيصاً بمقاساتك الدقيقة وخامات مختارة لترضي ذوقك. ابدئي طلبك المخصص الآن وتواصلي معنا مباشرة."
                          : "We transform your sartorial thoughts into unique, hand-tailored clothing made to your exact body measurements and fine fabrics. Start your custom order details and chat now."}
                      </p>
                    </div>

                    {/* Action button */}
                    <div className="shrink-0 self-start md:self-center">
                      <button
                        onClick={() => {
                          setActiveView('profile');
                          window.scrollTo({ top: 300, behavior: 'smooth' });
                        }}
                        className="group relative inline-flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-bold px-6 py-3.5 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                      >
                        <span className="relative z-10 flex items-center gap-1.5 font-bold">
                          {isArabic ? "طلبي المخصص الآن" : "MY CUSTOM COUTURE NOW"}
                          <span className="text-sm transition-transform duration-300 group-hover:translate-x-1">—→</span>
                        </span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              </section>

              {/* The Collections Section - ALWAYS BELOW HERO SECTION */}
              <TheCollections
                onSelectCategory={(cat) => {
                  setSelectedCategory(cat);
                  setActiveView('shop');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isArabic={isArabic}
              />

              {/* INTERTWINED PREMIUM AD 2: Below The Collections Section */}
              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-10 md:my-14 font-sans focus:outline-none relative">
                <motion.div 
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  className="relative overflow-hidden rounded-[2rem] border border-zinc-200/80 shadow-lg bg-gradient-to-r from-stone-100 via-amber-50/40 to-stone-50 text-zinc-900 min-h-[160px] md:min-h-[200px] flex items-center"
                >
                  {/* Subtle artistic light visual accents */}
                  <div className="absolute top-0 left-0 w-[45%] h-full bg-gradient-to-r from-zinc-200/30 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute top-[-40%] left-[-10%] w-[320px] h-[320px] bg-zinc-900/5 rounded-full blur-[90px] pointer-events-none" />
                  <div className="absolute bottom-[-30%] right-[10%] w-[220px] h-[220px] bg-amber-200/10 rounded-full blur-[70px] pointer-events-none" />

                  <div className="relative w-full px-6 py-8 md:px-12 flex flex-col md:flex-row md:items-center justify-between gap-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    
                    {/* Info details */}
                    <div className="space-y-2.5 max-w-xl text-right md:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                      <div className="inline-flex items-center gap-1.5 bg-zinc-950 text-amber-300 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.25em]">
                        <span>✦</span>
                        <span>{isArabic ? "عرض الصيف الحصري والمميز" : "EXCLUSIVE SUMMER SEASON"}</span>
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-serif font-semibold tracking-tight text-zinc-900 leading-snug">
                        {isArabic 
                          ? "استمتعي بخصم ١٥٪ على تشكيلات الموسم الفريدة" 
                          : "Enjoy 15% Off Curated Collection Masterpieces"}
                      </h3>
                      <p className="text-xs text-zinc-650 font-light leading-relaxed">
                        {isArabic 
                          ? "أدخلي كود الخصم الحصري عند إتمام الطلب لتجربة الأزياء الرائجة لهذا الموسم. نوفر خدمة تجربة القطع للمطابقة والمعاينة عند تسليم المندوب."
                          : "Apply our premier discount code at checkout to acquire highly coveted styles. Direct shipping in Egypt with fully comfortable home trials."}
                      </p>
                    </div>

                    {/* Coupon / Redeem widget */}
                    <div className="shrink-0 flex items-center gap-3.5 self-start md:self-center">
                      <div className="border border-dashed border-zinc-400 bg-white/90 rounded-xl px-5 py-3 text-center shadow-sm">
                        <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">{isArabic ? "كوبون الخصم" : "PROMO CODE"}</span>
                        <span className="font-mono text-sm md:text-base font-bold text-zinc-950 tracking-widest select-all">RAAV15</span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedCategory('all');
                          setActiveView('shop');
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group bg-zinc-950 text-white font-bold px-5 py-3.5 rounded-xl text-xs tracking-widest uppercase transition-all duration-300 hover:bg-zinc-800 hover:shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                      >
                        <span>{isArabic ? "تسوق الآن" : "SHOP COLL"}</span>
                      </button>
                    </div>

                  </div>
                </motion.div>
              </section>

              {/* Trend Pieces Section */}
              <TrendPieces
                products={activeProducts}
                onSelectProduct={(p) => {
                  setSelectedProduct(p);
                  setActiveView('product-details');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                isArabic={isArabic}
                onQuickAddToCart={handleQuickAddToCart}
              />

              {/* Category Scroll Slices Section */}
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
              />

              {/* SPECIAL CUSTOM ORDERS FORM SECTION */}
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
              />
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
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-[#0b0e14] text-[#8a92a6] py-16 text-xs leading-relaxed" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="text-white font-serif text-lg tracking-[0.1em] font-medium uppercase">
              RAAV EGY
            </h4>
            <p className="text-xs text-[#8a92a6] leading-relaxed max-w-sm font-sans font-light">
              {isArabic 
                ? "ننسج الأناقة في كل لحظة. أزياء راقية ومبتكرة مصممة خصيصاً للنساء، الرجال، والأطفال."
                : "Crafting elegance for every moment. High-fashion apparel for women, men, and children."}
            </p>
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
                    alert(isArabic 
                      ? "يسعدنا دائماً تواصلك معنا عبر الهاتف: 01012345678 أو الإيميل: support@raavegy.com"
                      : "Contact our customer helpdesk anytime at: +201012345678 or support@raavegy.com");
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
                    alert(isArabic 
                      ? "نوفر خدمة الشحن السريع في جميع أنحاء جمهورية مصر العربية مع إمكانية تجربة القياس والمعاينة قبل الدفع للمندوب لراحة مطلقة."
                      : "We provide high priority shipping all across Egypt. Doorstep previews and trial fittings are fully supported prior to cash submission.");
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
                    alert(isArabic 
                      ? "جميع مقاسات راف تتبع المعايير القياسية بدقة متناهية. تواصل مع الدعم الفني لمزيد من المساعدة في اختيار المقاس المناسب لك."
                      : "RAAV garments follow standard sizing guidelines carefully. Our support coordinators are glad to size match you prior to dispatch.");
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
                    alert(isArabic 
                      ? "الأسئلة الشائعة: هل نقبل الدفع عند الاستلام؟ نعم بكل سرور. هل يمكنني الاستبدال؟ نعم، نوفر استبدال مرن في خلال 14 يوماً."
                      : "FAQ: Cash on delivery is accepted. Standard and custom size alterations can be accommodated on receipt within 14 days.");
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
              onClick={() => alert(isArabic ? "سياسة الخصوصية لـ RAAV EGY: بياناتك محمية تماماً ولا نشاركها مع أي جهة خارجية." : "Privacy Policy: Your details are fully encrypted and never distributed to third parties.")} 
              className="hover:text-white transition"
            >
              {isArabic ? "سياسة الخصوصية" : "PRIVACY POLICY"}
            </button>
            <button 
              type="button"
              onClick={() => alert(isArabic ? "شروط الخدمة: تلتزم راف إيجي بتقديم منتجات مطابقة للصور ومقاسات منضبطة." : "Terms of Service: Beautiful design lines delivered exactly as showcased.")} 
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
        />
      )}

      {/* SECURE ADMINISTRATIVE DASHBOARD */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        orders={orders}
        isArabic={isArabic}
      />

      </div>
    </div>
  );
}
