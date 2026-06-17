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

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cart, setCart] = useState<OrderItem[]>(() => {
    const saved = localStorage.getItem('raav_egy_cart');
    return saved ? JSON.parse(saved) : [];
  });

  // View Navigation State (home | shop | profile | product-details)
  const [activeView, setActiveView] = useState<'home' | 'shop' | 'profile' | 'product-details'>('home');
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
    <div className="bg-[#fcfcfc] min-h-screen text-zinc-800 selection:bg-zinc-950 selection:text-white antialiased font-sans transition-colors duration-300">
      
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

            {/* The Collections Section - ALWAYS BELOW HERO SECTION */}
            <TheCollections
              onSelectCategory={(cat) => {
                setSelectedCategory(cat);
                setActiveView('shop');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              isArabic={isArabic}
            />

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
  );
}
