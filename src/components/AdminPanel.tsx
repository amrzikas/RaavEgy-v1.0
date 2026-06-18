import React, { useState, useEffect } from 'react';
import { 
  X, Lock, ShieldAlert, Sparkles, Plus, Edit, Trash2, CheckCircle, Clock, Truck, 
  FileText, Activity, ArrowLeft, Check, PlusCircle, ShoppingBag, Landmark, Database,
  Gift, Wallet, Award, CreditCard, ChevronRight, CheckSquare, PlusSquare, ArrowUpDown,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  auth 
} from '../firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  User
} from 'firebase/auth';
import { 
  getAdminSetupStatus, 
  initializeAdminAccount, 
  createProduct,
  updateProduct, 
  removeProduct, 
  updateOrderStatus,
  subscribeToShippingPlans,
  createShippingPlan,
  updateShippingPlan,
  removeShippingPlan,
  getLoyaltyConfig,
  saveLoyaltyConfig,
  getPaymentConfig,
  savePaymentConfig,
  subscribeToAllCustomerProfiles,
  subscribeToAllConversations,
  subscribeToConversationMessages,
  sendConversationMessage,
  getSettlements,
  saveSettlements,
  markOrdersAsSettled
} from '../dbService';
import { Product, Order, OrderStatus, ShippingPlan, LoyaltyConfig, PaymentConfig, WalletDetail, InstaPayDetail, SettlementPeriod } from '../types';
import { PRESET_COLORS } from '../utils';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  isArabic: boolean;
}

const SAMPLE_CLOTHES_IMAGES = [
  { id: 'suit', labelAr: 'بدلة رجالي كلاسيك', labelEn: 'Classic Suit Men', url: 'https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=600' },
  { id: 'dress', labelAr: 'فستان صيفي منقوش', labelEn: 'Patterned Dress Women', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?auto=format&fit=crop&q=80&w=600' },
  { id: 'kids', labelAr: 'ملابس أطفال قطنية', labelEn: 'Cotton Kids Set', url: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80&w=600' },
  { id: 'shoes', labelAr: 'حذاء جلدي فاخر', labelEn: 'Luxury Leather Shoes', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&q=80&w=600' },
  { id: 'bag', labelAr: 'حقيبة كلاسيكية راقية', labelEn: 'Classic Elegant Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&q=80&w=600' },
  { id: 'jacket', labelAr: 'جاكيت جينز عصري', labelEn: 'Modern Denim Jacket', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600' }
];

export default function AdminPanel({
  isOpen,
  onClose,
  products,
  orders,
  isArabic
}: AdminPanelProps) {
  // Authentication states
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isSetupInitialized, setIsSetupInitialized] = useState<boolean | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sub-navigation tabs: 'stats' | 'products' | 'orders' | 'shipping' | 'loyalty' | 'payments' | 'conversations' | 'accounts'
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'shipping' | 'loyalty' | 'payments' | 'conversations' | 'accounts'>('stats');

  // Products manager state variables
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    descriptionAr: '',
    descriptionEn: '',
    price: 350,
    discountPrice: '' as string | number,
    discountStart: '',
    discountEnd: '',
    category: 'men' as 'men' | 'women' | 'kids' | 'accessories',
    image: SAMPLE_CLOTHES_IMAGES[0].url,
    images: [SAMPLE_CLOTHES_IMAGES[0].url, '', '', '', ''] as string[],
    sizesStr: 'M, L, XL', // Comma separated sizes
    colorsStr: '#111111, #E5D3B3, #2B5B84', // Comma separated colors hex
    inStock: true,
    isActive: true,
    isTrend: false,
    quantity: 100,
    shippingPlanId: ''
  });

  // Shipping, Loyalty, and Payments master states
  const [shippingPlans, setShippingPlans] = useState<ShippingPlan[]>([]);
  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyConfig>({ pointsPerEgp: 0.1, egpValuePerPoint: 0.5, isActive: true });
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    cashOnDeliveryActive: true,
    walletsActive: true,
    wallets: [],
    instaPayActive: true,
    instaPay: { username: '', phone: '', qrCode: '' }
  });
  const [customers, setCustomers] = useState<any[]>([]);

  // Special Custom Orders & Conversations state
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('');
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [adminReplyDraft, setAdminReplyDraft] = useState('');

  // Sub-forms & states for Shipping management
  const [showShippingForm, setShowShippingForm] = useState(false);
  const [editingShipping, setEditingShipping] = useState<ShippingPlan | null>(null);
  const [shippingFormData, setShippingFormData] = useState({
    companyNameAr: '',
    companyNameEn: '',
    price: 50,
    deliveryTimeAr: '٢ - ٤ أيام',
    deliveryTimeEn: '2 - 4 Days',
    isActive: true
  });

  // Financial settlements and reconciliation states
  const [settlements, setSettlements] = useState<SettlementPeriod[]>([]);
  const [settlementFromDate, setSettlementFromDate] = useState('');
  const [settlementToDate, setSettlementToDate] = useState('');

  // Fetch configs and set active Firestore live listeners
  useEffect(() => {
    let unsubPlans: (() => void) | undefined;
    let unsubCust: (() => void) | undefined;
    let unsubConversations: (() => void) | undefined;

    if (adminUser && isOpen) {
      getAdminSetupStatus().then((status) => {
        if (status && status.isInitialized && status.adminUid === adminUser.uid) {
          unsubPlans = subscribeToShippingPlans((plans) => {
            setShippingPlans(plans);
          });
          unsubCust = subscribeToAllCustomerProfiles((list) => {
            setCustomers(list);
          });
          unsubConversations = subscribeToAllConversations((convs) => {
            setConversations(convs);
          });
        }
      }).catch((err) => {
        console.error("Admin check failed", err);
      });

      getLoyaltyConfig().then(c => setLoyaltyConfig(c)).catch(() => {});
      getPaymentConfig().then(p => setPaymentConfig(p)).catch(() => {});
      getSettlements().then(s => setSettlements(s)).catch(() => {});
    }

    return () => {
      if (unsubPlans) unsubPlans();
      if (unsubCust) unsubCust();
      if (unsubConversations) unsubConversations();
    };
  }, [adminUser, isOpen]);

  // Handle active message listener
  useEffect(() => {
    let unsubMessages: (() => void) | undefined;
    if (selectedConversationId && isOpen && adminUser) {
      unsubMessages = subscribeToConversationMessages(selectedConversationId, (msgs) => {
        setConversationMessages(msgs);
      });
    } else {
      setConversationMessages([]);
    }
    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, [selectedConversationId, isOpen, adminUser]);

  // Orders search filter state
  const [orderFilter, setOrderFilter] = useState<'all' | OrderStatus>('all');
  const [orderQuery, setOrderQuery] = useState('');

  // Track if we need to load setup status
  useEffect(() => {
    if (isOpen) {
      checkSetupStatus();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setAdminUser(user);
        setErrorMsg(null);
      });
      return unsubscribe;
    }
  }, [isOpen]);

  const checkSetupStatus = async () => {
    const status = await getAdminSetupStatus();
    setIsSetupInitialized(status.isInitialized);
  };

  if (!isOpen) return null;

  // Sign up First Time admin
  const handleRegisterSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.length < 5 || passwordInput.length < 6) {
      setErrorMsg(isArabic ? "برجاء توفير بريد صحيح وكلمة مرور من ٦ خانات على الأقل" : "Provide a valid email and 6+ character password!");
      return;
    }

    setAuthLoading(true);
    setErrorMsg(null);
    try {
      let uid = '';
      let user: User | null = null;
      
      try {
        // 1. Try to create firebase auth user
        const userCred = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        uid = userCred.user.uid;
        user = userCred.user;
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Address pre-existing email issue: Verify credentials by signing in to set up
          try {
            const userCred = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
            uid = userCred.user.uid;
            user = userCred.user;
          } catch (loginErr: any) {
            if (loginErr.code === 'auth/wrong-password' || loginErr.code === 'auth/invalid-credential') {
              throw new Error(isArabic 
                ? "هذا البريد مسجل بالفعل في المتجر، ولكن كلمة المرور التي أدخلتها غير صحيحة لتأكيد هويتك." 
                : "This email is already in use. The password you provided is incorrect to verify your ownership.");
            } else {
              throw loginErr;
            }
          }
        } else {
          throw authErr;
        }
      }

      // 2. Register setup configuration record in Firestore
      await initializeAdminAccount(uid, emailInput);
      setIsSetupInitialized(true);
      setAdminUser(user);
      
      // Cleanup
      setEmailInput('');
      setPasswordInput('');
    } catch (err: any) {
      console.error(err);
      let friendlyError = err.message || "Registration failed!";
      if (err.code === 'auth/invalid-email') {
        friendlyError = isArabic ? "صيغة البريد الإلكتروني غير صالحة." : "Invalid email format.";
      } else if (err.code === 'auth/weak-password') {
        friendlyError = isArabic ? "كلمة المرور ضعيفة للغاية. يرجى اختيار كلمة مرور من ٦ أحرف على الأقل." : "Weak password. Please choose at least 6 characters.";
      }
      setErrorMsg(friendlyError);
    } finally {
      setAuthLoading(false);
    }
  };

  // Login Administrator
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setErrorMsg(null);
    try {
      // Check first if setup details are valid
      const status = await getAdminSetupStatus();
      if (!status.isInitialized) {
        setIsSetupInitialized(false);
        setAuthLoading(false);
        return;
      }

      const userCred = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      
      // Confirm they are actually the admin UID saved in the database config Doc
      if (userCred.user.uid !== status.adminUid) {
        await signOut(auth);
        setErrorMsg(isArabic ? "مرفوض! هذا الحساب ليس حساب المسؤول المسجل في النظام." : "Access Denied! You are not the configured Super Admin.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(isArabic ? "فشل تسجيل الدخول. تأكد من البيانات والشبكة." : "Authentication failed. Check your data.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAdminUser(null);
    setEmailInput('');
    setPasswordInput('');
  };

  // Setup Product action form
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      nameAr: '',
      nameEn: '',
      descriptionAr: '',
      descriptionEn: '',
      price: 650,
      discountPrice: '',
      discountStart: '',
      discountEnd: '',
      category: 'men',
      image: SAMPLE_CLOTHES_IMAGES[0].url,
      images: [SAMPLE_CLOTHES_IMAGES[0].url, '', '', '', ''],
      sizesStr: 'M, L, XL',
      colorsStr: '#111111, #4A5D4E, #8C2222',
      inStock: true,
      isActive: true,
      isTrend: false,
      quantity: 100,
      shippingPlanId: ''
    });
    setShowProductForm(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormData({
      nameAr: prod.nameAr,
      nameEn: prod.nameEn,
      descriptionAr: prod.descriptionAr,
      descriptionEn: prod.descriptionEn,
      price: prod.price,
      discountPrice: prod.discountPrice !== undefined ? prod.discountPrice : '',
      discountStart: prod.discountStart || '',
      discountEnd: prod.discountEnd || '',
      category: prod.category,
      image: prod.image,
      images: prod.images && prod.images.length > 0 
        ? [...prod.images, '', '', '', ''].slice(0, 5) 
        : [prod.image, '', '', '', ''],
      sizesStr: prod.sizes.join(', '),
      colorsStr: prod.colors.join(', '),
      inStock: prod.inStock,
      isActive: prod.isActive !== undefined ? prod.isActive : true,
      isTrend: prod.isTrend || false,
      quantity: prod.quantity !== undefined ? prod.quantity : 100,
      shippingPlanId: prod.shippingPlanId || ''
    });
    setShowProductForm(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const sizes = formData.sizesStr.split(',').map(s => s.trim()).filter(Boolean);
    const colors = formData.colorsStr.split(',').map(c => c.trim()).filter(Boolean);

    // Filter out any blank slots
    const finalImages = formData.images.map(img => img.trim()).filter(Boolean);
    const mainImage = finalImages[0] || formData.image || SAMPLE_CLOTHES_IMAGES[0].url;

    const productPayload: any = {
      nameAr: formData.nameAr.trim(),
      nameEn: formData.nameEn.trim(),
      descriptionAr: formData.descriptionAr.trim(),
      descriptionEn: formData.descriptionEn.trim(),
      price: Number(formData.price),
      category: formData.category,
      image: mainImage,
      images: finalImages.length > 0 ? finalImages : [mainImage],
      sizes,
      colors,
      inStock: formData.inStock,
      isActive: formData.isActive,
      isTrend: formData.isTrend,
      quantity: Number(formData.quantity || 0),
      shippingPlanId: formData.shippingPlanId || ''
    };

    if (formData.discountPrice !== '') {
      productPayload.discountPrice = Number(formData.discountPrice);
      if (formData.discountStart) productPayload.discountStart = formData.discountStart;
      if (formData.discountEnd) productPayload.discountEnd = formData.discountEnd;
    } else {
      productPayload.discountPrice = null;
      productPayload.discountStart = null;
      productPayload.discountEnd = null;
    }

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productPayload);
        alert(isArabic ? "تم تحديث المنتج بنجاح!" : "Product updated successfully!");
      } else {
        await createProduct(productPayload);
        alert(isArabic ? "تم حفظ المنتج الجديد بنجاح!" : "Product launched successfully!");
      }
      setShowProductForm(false);
      setEditingProduct(null);
    } catch (err) {
      console.error(err);
      alert("Error saving item to Firestore!");
    }
  };

  const handleTogglePresetColor = (hex: string) => {
    const currentColors = formData.colorsStr.split(',')
      .map(c => c.trim().toLowerCase())
      .filter(Boolean);
    const lowerHex = hex.toLowerCase();
    
    // Check if color is already in string
    const matchIndex = currentColors.indexOf(lowerHex);
    if (matchIndex > -1) {
      currentColors.splice(matchIndex, 1);
    } else {
      currentColors.push(lowerHex);
    }
    setFormData({ ...formData, colorsStr: currentColors.join(', ') });
  };

  const handleImageFileChange = (index: number, file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const nextImages = [...formData.images];
      nextImages[index] = base64String;
      
      if (index === 0) {
        setFormData({ ...formData, images: nextImages, image: base64String });
      } else {
        setFormData({ ...formData, images: nextImages });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteProduct = async (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذا المنتج نهائياً من الـ Collection؟" : "Are you sure you want to permanently delete this product?")) {
      try {
        await removeProduct(id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleToggleStockLocal = async (prod: Product) => {
    try {
      await updateProduct(prod.id, { inStock: !prod.inStock });
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeOrderStatus = async (orderId: string, current: OrderStatus, direction: 'next' | 'cancel') => {
    let nextStatus: OrderStatus = current;
    if (direction === 'cancel') {
      nextStatus = 'cancelled';
    } else {
      switch (current) {
        case 'pending': nextStatus = 'preparing'; break;
        case 'preparing': nextStatus = 'shipped'; break;
        case 'shipped': nextStatus = 'delivered'; break;
        default: break;
      }
    }

    try {
      await updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.error(err);
    }
  };

  // === SHIPPING PLAN ACTIONS ===
  const handleSaveShippingPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        companyNameAr: shippingFormData.companyNameAr.trim(),
        companyNameEn: shippingFormData.companyNameEn.trim(),
        price: Number(shippingFormData.price),
        deliveryTimeAr: shippingFormData.deliveryTimeAr.trim(),
        deliveryTimeEn: shippingFormData.deliveryTimeEn.trim(),
        isActive: shippingFormData.isActive
      };
      if (editingShipping) {
        await updateShippingPlan(editingShipping.id, payload);
        alert(isArabic ? "تم تحديث خطة الشحن!" : "Shipping plan updated!");
      } else {
        await createShippingPlan(payload);
        alert(isArabic ? "تم حفظ خطة الشحن الجديدة!" : "New shipping plan created!");
      }
      setShowShippingForm(false);
      setEditingShipping(null);
      setShippingFormData({
        companyNameAr: '',
        companyNameEn: '',
        price: 50,
        deliveryTimeAr: '٢ - ٤ أيام',
        deliveryTimeEn: '2 - 4 Days',
        isActive: true
      });
    } catch (err) {
      console.error(err);
      alert("Error saving shipping plan!");
    }
  };

  const handleEditShippingPlan = (plan: ShippingPlan) => {
    setEditingShipping(plan);
    setShippingFormData({
      companyNameAr: plan.companyNameAr,
      companyNameEn: plan.companyNameEn,
      price: plan.price,
      deliveryTimeAr: plan.deliveryTimeAr,
      deliveryTimeEn: plan.deliveryTimeEn,
      isActive: plan.isActive
    });
    setShowShippingForm(true);
  };

  const handleDeleteShippingPlan = async (id: string) => {
    if (confirm(isArabic ? "هل أنت متأكد من حذف هذه الخطة؟" : "Confirm delete shipping plan?")) {
      await removeShippingPlan(id);
    }
  };

  // === LOYALTY SYSTEM ACTIONS ===
  const handleSaveLoyaltySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveLoyaltyConfig(loyaltyConfig);
      alert(isArabic ? "تم حفظ إعدادات نقاط الولاء للعملاء بنجاح!" : "Customer loyalty points rules saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving loyalty configs!");
    }
  };

  // === PAYMENT METHODS ACTIONS ===
  const handleSavePaymentSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await savePaymentConfig(paymentConfig);
      alert(isArabic ? "تم تحديث طرق الدفع المتاحة وتفاصيل الحسابات بنجاح!" : "Payment methods and wallet credentials stored safely!");
    } catch(err) {
      console.error(err);
      alert("Error saving payment systems settings");
    }
  };

  const handleAddWalletOption = () => {
    const newId = 'wallet_' + Date.now();
    setPaymentConfig({
      ...paymentConfig,
      wallets: [
        ...paymentConfig.wallets,
        { id: newId, nameAr: 'محفظة كاش جديدة', nameEn: 'New Wallet Cash', phone: '', qrCode: '' }
      ]
    });
  };

  const handleRemoveWalletOption = (id: string) => {
    setPaymentConfig({
      ...paymentConfig,
      wallets: paymentConfig.wallets.filter(w => w.id !== id)
    });
  };

  const handleUpdateWalletOption = (id: string, field: keyof WalletDetail, val: string) => {
    setPaymentConfig({
      ...paymentConfig,
      wallets: paymentConfig.wallets.map(w => w.id === id ? { ...w, [field]: val } : w)
    });
  };

  // Compute stats details
  const filteredOrders = orders.filter(ord => {
    const matchesFilter = orderFilter === 'all' || ord.status === orderFilter;
    const matchesQuery = ord.customerName.toLowerCase().includes(orderQuery.toLowerCase()) || 
                         ord.customerPhone.includes(orderQuery);
    return matchesFilter && matchesQuery;
  });

  const totalSales = orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrdersCount = orders.filter(o => ['pending', 'preparing', 'shipped'].includes(o.status)).length;
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-white overflow-hidden flex flex-col font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      
      {/* Top Header Navbar */}
      <div className="bg-zinc-900 px-6 py-4 border-b border-zinc-800 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Database className="text-amber-400" size={22} />
          <h2 className="text-base sm:text-lg font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>RAAV EGY</span>
            <span className="text-xs bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
              {isArabic ? "منطقة المسؤول" : "Admin Panel"}
            </span>
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 px-3 bg-zinc-805 hover:bg-zinc-800 border border-zinc-850 hover:text-white rounded-lg transition duration-200 cursor-pointer text-xs flex items-center gap-1"
        >
          <X size={15} />
          <span>{isArabic ? "خروج من لوحة التحكم" : "Close Panel"}</span>
        </button>
      </div>

      {/* RENDER LOGIN / SETUP FOR ONLY UNAUTHENTICATED USERS */}
      {!adminUser ? (
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-6 bg-radial from-zinc-900 to-zinc-950">
          <div className="max-w-md w-full bg-zinc-900/40 border border-zinc-800 p-8 rounded-3xl shadow-2xl relative overflow-hidden backdrop-blur-md">
            
            {/* Ambient decorative glowing radial style */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="text-center mb-8">
              <div className="mx-auto w-12 h-12 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl flex items-center justify-center mb-4">
                <Lock size={22} className="animate-pulse" />
              </div>

              {isSetupInitialized === false ? (
                <>
                  <h3 className="text-xl font-black text-zinc-100 mb-1">
                    {isArabic ? "تسجيل المسؤول لأول مرة" : "Register Super Admin Account"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {isArabic 
                      ? "قم بإنشاء حساب المسؤول الرئيسي للمتجر وإدارته. يتم ذلك مرة واحدة فقط ومحمي تماماً!" 
                      : "Initialize the master shop account. Done once only. Highly secure."}
                  </p>
                </>
              ) : (
                <>
                  <h3 className="text-xl font-black text-zinc-100 mb-1">
                    {isArabic ? "تسجيل دخول المسؤول" : "Administrator Portal"}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {isArabic 
                      ? "أدخل البريد وكلمة المرور للمتابعة إلى الإحصائيات وبوابات إدارة الملابس والطلبات." 
                      : "Provide authorized owner credentials to access stats, orders, and clothing lists."}
                  </p>
                </>
              )}
            </div>

            {errorMsg && (
              <div className="mb-4 p-3.5 bg-red-950/40 border border-red-900/50 rounded-xl text-xs text-red-400 text-center flex items-center justify-center gap-1.5 leading-snug">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={isSetupInitialized === false ? handleRegisterSetup : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  {isArabic ? "البريد الإلكتروني للادمن" : "Admin Email Address"}
                </label>
                <input
                  type="email"
                  required
                  placeholder="admin@raavegy.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 text-left font-mono"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                  {isArabic ? "كلمة المرور السرية" : "Admin Secure Password"}
                </label>
                <input
                  type="password"
                  required
                  placeholder="******"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 text-left font-mono"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-extrabold text-sm rounded-xl transition duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10 cursor-pointer"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock size={14} />
                    <span>
                      {isSetupInitialized === false 
                        ? (isArabic ? 'إنشاء حساب المسؤول وتأكيد النظام' : 'Setup Master Admin Now') 
                        : (isArabic ? 'تسجيل دخول لوحة التحكم' : 'Authenticate Entry')}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Hint marker */}
            <div className="mt-6 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500">
              <Sparkles size={11} className="text-amber-400" />
              <span>
                {isArabic 
                  ? "لوحة التحكم تتبع أعلى معايير أمان قواعد Firebase Firestore" 
                  : "Protected with real-time Firebase Auth state parameters."}
              </span>
            </div>

          </div>
        </div>
      ) : (
        /* RENDER PRIMARY ADMIN PANEL CONTENT */
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950">
          
          {/* Sub menu Navigation Sidebar */}
          <div className="w-full md:w-64 bg-zinc-900/60 md:border-r md:border-l md:border-zinc-800 flex md:flex-col overflow-x-auto md:overflow-y-auto shrink-0 p-3 md:p-4 gap-1.5 border-b border-zinc-900">
            <button
              onClick={() => { setActiveTab('stats'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'stats'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Activity size={14} />
              <span>{isArabic ? "الإحصائيات والأرباح" : "Sales Insights"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('products'); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <ShoppingBag size={14} />
              <span>{isArabic ? "قائمة الملابس والمنتجات" : "Products Inventory"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'orders'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <FileText size={14} />
              <span>{isArabic ? "إدارة الطلبات الواردة" : "Manage Client Orders"}</span>
              {pendingOrdersCount > 0 && (
                <span className="bg-red-650 text-white rounded-full text-[9px] px-1.5 py-0.5 font-bold font-mono">
                  {pendingOrdersCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('shipping'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'shipping'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Truck size={14} />
              <span>{isArabic ? "شركات ومصاريف الشحن" : "Shipping Logistics"}</span>
              {shippingPlans.length > 0 && (
                <span className="bg-zinc-800 text-amber-400 rounded-full text-[9px] px-1.5 py-0.5 font-bold font-mono">
                  {shippingPlans.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('loyalty'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'loyalty'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Award size={14} />
              <span>{isArabic ? "برنامج نقاط العملاء" : "Customer Loyalty Points"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('payments'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'payments'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Wallet size={14} />
              <span>{isArabic ? "طرق الدفع المتاحة" : "Payment Options"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('conversations'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'conversations'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Sparkles size={14} />
              <span>{isArabic ? "طلبات مخصصة ورسائل" : "Special Orders & Chat"}</span>
              {conversations.length > 0 && (
                <span className="bg-zinc-800 text-amber-400 rounded-full text-[9px] px-1.5 py-0.5 font-bold font-mono">
                  {conversations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('accounts'); setShowProductForm(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'accounts'
                  ? "bg-amber-400 text-black shadow-md"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Landmark size={14} />
              <span>{isArabic ? "الحسابات والتسويات" : "Financial Accounts"}</span>
            </button>

            <div className="hidden md:block mt-auto pt-4 border-t border-zinc-800 text-center">
              <p className="text-[10px] text-zinc-500 font-mono mb-2">
                ADMIN: {adminUser.email}
              </p>
              <button
                onClick={handleLogout}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-400 border border-red-900/30 font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                {isArabic ? "تسجيل الخروج والعودة" : "Logout Admin"}
              </button>
            </div>
          </div>

          {/* MAIN WORKING AREA TABLE */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            
            {/* STATS & METRICS TAB */}
            {activeTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {isArabic ? "لوحة المراقبة ونمو المبيعات" : "Business Health Metrics"}
                  </h3>
                  <span className="text-xs text-zinc-500 font-mono">
                    RAAV EGYPT CLOTHIERS INC ©
                  </span>
                </div>

                {/* KPI Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Total Sales */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        {isArabic ? "مجموع المبيعات المكتملة" : "Settled Cash Intake"}
                      </p>
                      <h4 className="text-2xl font-black text-emerald-400 font-mono">
                        {totalSales} <span className="text-xs font-sans text-zinc-400">ج.م</span>
                      </h4>
                    </div>
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <Landmark size={20} />
                    </div>
                  </div>

                  {/* Active Orders */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        {isArabic ? "طلبات جارية التجهيز" : "Active Delivery Queue"}
                      </p>
                      <h4 className="text-2xl font-black text-amber-400 font-mono">
                        {activeOrdersCount}
                      </h4>
                    </div>
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                      <Truck size={20} className="animate-bounce" />
                    </div>
                  </div>

                  {/* Total Orders Log */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        {isArabic ? "إجمالي الفواتير والطلبات" : "Total Orders Logged"}
                      </p>
                      <h4 className="text-2xl font-black text-sky-400 font-mono">
                        {orders.length}
                      </h4>
                    </div>
                    <div className="p-3 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl">
                      <FileText size={20} />
                    </div>
                  </div>

                  {/* Active Products count */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mb-1">
                        {isArabic ? "عدد القطع في المعرض" : "Catalog Styles"}
                      </p>
                      <h4 className="text-2xl font-black text-purple-400 font-mono">
                        {products.length}
                      </h4>
                    </div>
                    <div className="p-3 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-xl">
                      <ShoppingBag size={20} />
                    </div>
                  </div>
                </div>

                {/* Simulated SVG Graph of sales breakdown */}
                <div className="bg-zinc-900/60 border border-zinc-800 p-6 rounded-3xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-5">
                    {isArabic ? "توزيع الطلبات حسب حالات التحضير" : "Distribution Status Board"}
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {['pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map((st) => {
                      const count = orders.filter(o => o.status === st).length;
                      const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                      
                      let colorClass = "bg-zinc-800";
                      let textClass = "text-zinc-400";
                      let name = st;
                      if (st === 'pending') { colorClass = "bg-amber-500"; textClass = "text-amber-400"; name = isArabic ? "معلق" : "Pending"; }
                      if (st === 'preparing') { colorClass = "bg-indigo-500"; textClass = "text-indigo-400"; name = isArabic ? "تحضير" : "Preparing"; }
                      if (st === 'shipped') { colorClass = "bg-blue-500"; textClass = "text-blue-400"; name = isArabic ? "مشحون" : "Shipped"; }
                      if (st === 'delivered') { colorClass = "bg-emerald-500"; textClass = "text-emerald-400"; name = isArabic ? "مكتمل" : "Delivered"; }
                      if (st === 'cancelled') { colorClass = "bg-red-600"; textClass = "text-red-450"; name = isArabic ? "ملغي" : "Cancelled"; }

                      return (
                        <div key={st} className="bg-zinc-950 p-4 border border-zinc-900 rounded-2xl flex flex-col items-center justify-center">
                          <span className={`text-xs font-bold ${textClass} mb-1`}>{name}</span>
                          <span className="text-xl font-black font-mono mb-2">{count}</span>
                          <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                            <div className={`h-full ${colorClass}`} style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Quick Instruction Notice */}
                <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl text-xs space-y-1">
                  <h4 className="text-amber-400 font-bold flex items-center gap-1.5">
                    <Sparkles size={14} />
                    <span>{isArabic ? "تعليمات إدارة المتجر المصري الخاص بك" : "Control Hub Quick Guide"}</span>
                  </h4>
                  <p className="text-zinc-400 leading-relaxed font-sans">
                    {isArabic 
                      ? "يمكنك الانتقال لتبويب الملابس لإضافة فساتين، بناطيل، أو قمصان جديدة والمقاسات بالكامل. في تبويب الطلبات ستظهر كل عملية شراء يقوم بها عميل دليفري، انقر على زر التحضير أو الشحن لتحديث الفاتورة فوراً!"
                      : "Go to Products list to create styles/sizes/stock. In the Orders Queue, review pending requests. Click and update states to progress deliveries through the fulfillment loop!"}
                  </p>
                </div>
              </div>
            )}


            {/* PRODUCTS DIRECTORY INVENTORY TAB */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                
                {/* Form Overlay Modal or View */}
                {showProductForm ? (
                  <form onSubmit={handleSaveProduct} className="bg-zinc-90 w-full max-w-2xl mx-auto border border-zinc-800 p-6 sm:p-8 rounded-3xl space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-805">
                      <h4 className="text-base font-black text-amber-400">
                        {editingProduct 
                          ? (isArabic ? 'تعديل قطعة الملابس المحددة' : 'Modify Style Details') 
                          : (isArabic ? 'إضافة موديل ملابس جديد للمتجر' : 'Upload New Design Piece')}
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowProductForm(false)}
                        className="text-zinc-400 hover:text-white cursor-pointer px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs"
                      >
                        {isArabic ? 'إلغاء' : 'Back'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Name Arabic */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">اسم المنتج بالعربية *</label>
                        <input
                          type="text" required placeholder="مثال: قميص الكتان الكلاسيك"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.nameAr}
                          onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                        />
                      </div>

                      {/* Name English */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Product Title (English) *</label>
                        <input
                          type="text" required placeholder="e.g. Classic Linen Casual Dress"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-left text-white"
                          value={formData.nameEn}
                          onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                        />
                      </div>

                      {/* Price EGP */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "السعر الأساسي بالجنيه المصري *" : "Base Price (EGP) *"}</label>
                        <input
                          type="number" required min={0}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        />
                      </div>

                      {/* Discount Price */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "سعر الخصم بالجنيه المصري (اختياري)" : "Discount Price (EGP - Optional)"}</label>
                        <input
                          type="number" min={0} placeholder={isArabic ? "لا يوجد خصم حالياً" : "No discount applied"}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={formData.discountPrice}
                          onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value === '' ? '' : Number(e.target.value) })}
                        />
                      </div>

                      {/* Discount Dates (only shown if discount price is specified) */}
                      {formData.discountPrice !== '' && (
                        <>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "تاريخ بدء الخصم (اختياري)" : "Discount Start Date (Optional)"}</label>
                            <input
                              type="date"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono text-left"
                              value={formData.discountStart}
                              onChange={(e) => setFormData({ ...formData, discountStart: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "تاريخ انتهاء الخصم (اختياري)" : "Discount End Date (Optional)"}</label>
                            <input
                              type="date"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono text-left"
                              value={formData.discountEnd}
                              onChange={(e) => setFormData({ ...formData, discountEnd: e.target.value })}
                            />
                          </div>
                        </>
                      )}

                      {/* Category Selection */}
                      <div className={formData.discountPrice !== '' ? 'sm:col-span-1' : ''}>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">الفئة المستهدفة *</label>
                        <select
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        >
                          <option value="men">{isArabic ? "ملابس رجالي" : "Men's Clothing"}</option>
                          <option value="women">{isArabic ? "ملابس حريمي" : "Women's Clothing"}</option>
                          <option value="kids">{isArabic ? "ملابس أطفالي" : "Kids' Wear"}</option>
                          <option value="accessories">{isArabic ? "إكسسوارات" : "Bag/Jewelry Accs"}</option>
                        </select>
                      </div>

                      {/* Stock Quantity */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          {isArabic ? "الكمية المتوفرة في المخزن *" : "Stock Quantity Available *"}
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                        />
                      </div>

                      {/* Shipping Plan dropdown Selection */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          {isArabic ? "خطة الشحن للمنتج" : "Product Shipping Plan"}
                        </label>
                        <select
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.shippingPlanId}
                          onChange={(e) => setFormData({ ...formData, shippingPlanId: e.target.value })}
                        >
                          <option value="">{isArabic ? "الشحن العام الافتراضي كخيار بديل" : "Default flat-rate shipping"}</option>
                          {shippingPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {isArabic 
                                ? `${plan.companyNameAr} (${plan.price} ج.م - ${plan.deliveryTimeAr})` 
                                : `${plan.companyNameEn} (${plan.price} EGP - ${plan.deliveryTimeEn})`
                              }
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Description Ar */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">الوصف بالتفصيل (عربي) *</label>
                        <textarea
                          rows={2.5} required placeholder="الخامات الفاخرة، جودة التطريز، فصول الاستخدام..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.descriptionAr}
                          onChange={(e) => setFormData({ ...formData, descriptionAr: e.target.value })}
                        />
                      </div>

                      {/* Description En */}
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">Detailed Description (English) *</label>
                        <textarea
                          rows={2.5} required placeholder="Material composition details, fit profile, wash notes..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.descriptionEn}
                          onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                        />
                      </div>

                      {/* Sizes inputs comma-separated */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">المقاسات المتوفرة (مفصولة بفاصلة) *</label>
                        <input
                          type="text" required placeholder="M, L, XL, XXL"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={formData.sizesStr}
                          onChange={(e) => setFormData({ ...formData, sizesStr: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">{isArabic ? "اكتب المقاسات مفصولة بفواصل" : "Write sizes with commas"}</p>
                      </div>

                      {/* Colors inputs comma-separated hex codes */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">أكواد الوان الموديل (HEX) *</label>
                        <input
                          type="text" required placeholder="#111111, #8C2222, #ffffff"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-left text-white"
                          value={formData.colorsStr}
                          onChange={(e) => setFormData({ ...formData, colorsStr: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">{isArabic ? "ألوان بتنسيق Hex مفصولة بفواصل" : "Codes in HEX color formats with commas"}</p>
                      </div>

                      {/* PRESETS COLORS SELECTION PALETTE */}
                      <div className="sm:col-span-2 bg-zinc-900 border border-zinc-800/60 p-4 rounded-2xl">
                        <h5 className="text-xs font-extrabold text-zinc-300 mb-2.5 flex items-center gap-1.5">
                          <Sparkles size={11} className="text-amber-400" />
                          <span>{isArabic ? "اضغط لاختيار الألوان بسهولة من القائمة الجاهزة:" : "Tap to pick from predefined color presets:"}</span>
                        </h5>
                        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-2">
                          {PRESET_COLORS.map((preset) => {
                            const currentColors = formData.colorsStr.split(',').map(c => c.trim().toLowerCase());
                            const isSelected = currentColors.includes(preset.hex.toLowerCase());
                            return (
                              <button
                                key={preset.hex}
                                type="button"
                                onClick={() => handleTogglePresetColor(preset.hex)}
                                className={`p-2 border rounded-xl text-[10px] flex gap-1.5 items-center bg-zinc-950 hover:bg-zinc-900 transition-all cursor-pointer ${
                                  isSelected 
                                    ? "border-amber-400 text-amber-300 ring-1 ring-amber-400" 
                                    : "border-zinc-800 text-zinc-400"
                                }`}
                              >
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-black/30 shrink-0 block shadow-sm"
                                  style={{ backgroundColor: preset.hex }}
                                />
                                <span className="line-clamp-1">{isArabic ? preset.labelAr : preset.labelEn}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* MULTIPLE IMAGES (UP TO 5 IMAGES UPLOAD OR LINK) */}
                      <div className="sm:col-span-2 bg-zinc-900 border border-zinc-800/60 p-4 rounded-2xl space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-zinc-800">
                          <h5 className="text-xs font-extrabold text-zinc-350">
                            {isArabic ? "صور الموديل (الحد الأقصى ٥ صور)" : "Product Media (Up to 5 images)"}
                          </h5>
                          <span className="text-[10px] text-zinc-500">
                            {isArabic ? "أول صورة ستكون الصورة الأساسية للمنتج" : "Slot 1 will represent primary thumbnail image"}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                          {Array.from({ length: 5 }).map((_, idx) => {
                            const val = formData.images[idx] || '';
                            const isBase64 = val.startsWith('data:image/');
                            return (
                              <div key={idx} className="bg-zinc-950 border border-zinc-800 p-3 rounded-xl space-y-2 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-zinc-400 font-mono">#{idx + 1}</span>
                                    {val && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const nextImages = [...formData.images];
                                          nextImages[idx] = '';
                                          if (idx === 0) {
                                            setFormData({ ...formData, images: nextImages, image: '' });
                                          } else {
                                            setFormData({ ...formData, images: nextImages });
                                          }
                                        }}
                                        className="text-[9px] text-red-400 hover:text-red-300 transition"
                                      >
                                        {isArabic ? "حذف" : "Clear"}
                                      </button>
                                    )}
                                  </div>

                                  {/* Preview box */}
                                  <div className="w-full h-16 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden flex items-center justify-center relative">
                                    {val ? (
                                      <img src={val} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                                    ) : (
                                      <span className="text-[9px] text-zinc-650 italic">{isArabic ? "فارغ" : "Empty"}</span>
                                    )}
                                  </div>
                                </div>

                                <div className="space-y-1 mt-1">
                                  {/* URL Input */}
                                  <input
                                    type="text"
                                    placeholder={isArabic ? "رابط الصورة" : "Image URL"}
                                    className="w-full bg-zinc-900 border border-zinc-800 text-[9px] p-1 text-white rounded outline-none"
                                    value={isBase64 ? '(صورة مرفوعة)' : val}
                                    disabled={isBase64}
                                    onChange={(e) => {
                                      const nextImages = [...formData.images];
                                      nextImages[idx] = e.target.value;
                                      if (idx === 0) {
                                        setFormData({ ...formData, images: nextImages, image: e.target.value });
                                      } else {
                                        setFormData({ ...formData, images: nextImages });
                                      }
                                    }}
                                  />

                                  {/* Local File Input */}
                                  <label className="block bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[9px] text-center p-1 font-bold text-zinc-300 rounded cursor-pointer transition">
                                    <span>{isArabic ? "رفع ملف" : "Choose file"}</span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files ? e.target.files[0] : null;
                                        handleImageFileChange(idx, file);
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Display / Active / Trend Pieces Toggles Grid */}
                      <div className="sm:col-span-2 bg-zinc-950 border border-zinc-800/40 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Display inside Store Website */}
                        <div className="flex items-center gap-2 border border-zinc-850 bg-zinc-900/40 p-3 rounded-xl">
                          <input
                            type="checkbox" id="form-active"
                            className="w-4 h-4 accent-amber-400 rounded cursor-pointer shrink-0"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          />
                          <label htmlFor="form-active" className="text-xs text-zinc-200 cursor-pointer select-none">
                            <span className="block font-semibold">{isArabic ? "عرض المنتج بالموقع" : "Display in Store Page"}</span>
                            <span className="block text-[9px] text-zinc-450 mt-0.5">{isArabic ? "نشط ومتاح للتصفح بالموقع" : "Active & visible to catalog customers"}</span>
                          </label>
                        </div>

                        {/* Trend pieces section spotlight toggle */}
                        <div className="flex items-center gap-2 border border-zinc-850 bg-zinc-900/40 p-3 rounded-xl">
                          <input
                            type="checkbox" id="form-trend"
                            className="w-4 h-4 accent-amber-400 rounded cursor-pointer shrink-0"
                            checked={formData.isTrend}
                            onChange={(e) => setFormData({ ...formData, isTrend: e.target.checked })}
                          />
                          <label htmlFor="form-trend" className="text-xs text-zinc-200 cursor-pointer select-none">
                            <span className="block font-semibold">{isArabic ? "قسم الموضة الدارجة" : "Trend Pieces Highlight"}</span>
                            <span className="block text-[9px] text-zinc-450 mt-0.5">{isArabic ? "عرضه في قسم The Trend Pieces" : "Spotlight inside trend lines row"}</span>
                          </label>
                        </div>

                        {/* in Stock checkbox */}
                        <div className="flex items-center gap-2 border border-zinc-850 bg-zinc-900/40 p-3 rounded-xl">
                          <input
                            type="checkbox" id="form-instock"
                            className="w-4 h-4 accent-amber-400 rounded cursor-pointer shrink-0"
                            checked={formData.inStock}
                            onChange={(e) => setFormData({ ...formData, inStock: e.target.checked })}
                          />
                          <label htmlFor="form-instock" className="text-xs text-zinc-200 cursor-pointer select-none">
                            <span className="block font-semibold">{isArabic ? "متوفر بالمخزن" : "In Stock Status"}</span>
                            <span className="block text-[9px] text-zinc-450 mt-0.5">{isArabic ? "متاح للشراء والطلب المباشر" : "Mark as ready to order"}</span>
                          </label>
                        </div>
                      </div>

                    </div>

                    <div className="pt-4 border-t border-zinc-805 flex justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setShowProductForm(false)}
                        className="px-5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs font-mono transition cursor-pointer"
                      >
                        {isArabic ? "إلغاء التغييرات" : "Cancel Changes"}
                      </button>
                      <button
                        type="submit"
                        className="px-6 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-black rounded-lg text-xs shadow-lg cursor-pointer"
                      >
                        {isArabic ? "حفظ وتعديل البيانات" : "Save Product Details"}
                      </button>
                    </div>

                  </form>
                ) : (
                  /* INVENTORY LIST RENDER */
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-zinc-90 w-full p-4 border border-zinc-800 rounded-2xl gap-4">
                      <div>
                        <h4 className="text-base font-black text-white">{isArabic ? "المستودع الرئيسي للملابس" : "Design Items Directory"}</h4>
                        <p className="text-[10px] text-zinc-400">{isArabic ? "إضافة تصاميم، تعديل أسعار أو مراجعة مخزون الموديلات والمقاسات" : "Create clothes styles, edit pricing rates or administer stock states."}</p>
                      </div>
                      <button
                        onClick={handleOpenAddProduct}
                        className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg transition"
                      >
                        <PlusCircle size={15} />
                        <span>{isArabic ? "إضافة ملابس جديدة" : "Add Design Piece"}</span>
                      </button>
                    </div>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-md">
                      <div className="overflow-x-auto">
                        <table className="w-full text-zinc-300 text-sm">
                          <thead className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-right">
                            <tr>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "صورة" : "Image"}</th>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "الاسم" : "Title Details"}</th>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "الفئة" : "Category"}</th>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "السعر" : "Price"}</th>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "سعة التواجد" : "Availability Status"}</th>
                              <th className="px-4 py-3.5 text-xs uppercase tracking-wider">{isArabic ? "إجراءات" : "Admin Commands"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-805/70">
                            {products.map((prod) => (
                              <tr key={prod.id} className="hover:bg-zinc-850/30 transition">
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <img src={prod.image} className="w-10 h-12 object-cover rounded-md border border-zinc-850 bg-black" alt="" />
                                </td>
                                <td className="px-4 py-3 max-w-xs">
                                  <div className="font-bold text-zinc-150">{isArabic ? prod.nameAr : prod.nameEn}</div>
                                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">{prod.sizes.join(' | ')}</div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <span className="text-[10px] font-bold uppercase py-0.5 px-2.5 rounded-full bg-zinc-800 text-amber-300 font-mono border border-zinc-750">
                                    {prod.category}
                                  </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap font-mono text-amber-400 font-extrabold">
                                  {prod.price} ج.م
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap">
                                  <button
                                    onClick={() => handleToggleStockLocal(prod)}
                                    className={`text-[10px] uppercase font-bold py-1 px-3 rounded-full cursor-pointer transition border ${
                                      prod.inStock
                                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                                        : "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                    }`}
                                  >
                                    {prod.inStock 
                                      ? (isArabic ? 'متوفر بالمخزن' : 'In Stock') 
                                      : (isArabic ? 'منفد / غير متاح' : 'Out of Stock')}
                                  </button>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap gap-2">
                                  <div className="flex gap-1.5 justify-start">
                                    <button
                                      onClick={() => handleOpenEditProduct(prod)}
                                      className="p-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded border border-zinc-800 cursor-pointer"
                                      title={isArabic ? "تعديل معلومات المنتج" : "Edit Item"}
                                    >
                                      <Edit size={13} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteProduct(prod.id)}
                                      className="p-1.5 bg-red-950/20 hover:bg-red-950/50 text-red-400 rounded border border-red-900/40 cursor-pointer"
                                      title={isArabic ? "حذف نهائياً" : "Remove Item"}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            )}


            {/* ORDERS QUEUE MANAGER TAB */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                
                {/* Search orders controls */}
                <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex flex-col sm:flex-row gap-3 justify-between items-center">
                  <div className="flex flex-wrap gap-1 md:gap-2">
                    {['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setOrderFilter(val as any)}
                        className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wide transition uppercase cursor-pointer ${
                          orderFilter === val
                            ? "bg-amber-400 text-black shadow-md font-black"
                            : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800"
                        }`}
                      >
                        {val === 'all' && (isArabic ? "جميع الفواتير" : "All Orders")}
                        {val === 'pending' && (isArabic ? "معلق" : "Pending")}
                        {val === 'preparing' && (isArabic ? "تحضير بمصر" : "Preparing")}
                        {val === 'shipped' && (isArabic ? "شحن للمندوب" : "Shipped")}
                        {val === 'delivered' && (isArabic ? "مسلَم مكتمل" : "Delivered")}
                        {val === 'cancelled' && (isArabic ? "ملغي" : "Cancelled")}
                      </button>
                    ))}
                  </div>

                  <input
                    type="text"
                    placeholder={isArabic ? "ابحث برقم العميل أو الاسم..." : "Search client name or tel..."}
                    className="bg-zinc-950 border border-zinc-800 text-xs px-4 py-2 rounded-xl text-zinc-250 focus:outline-none w-full sm:w-64 max-w-sm"
                    value={orderQuery}
                    onChange={(e) => setOrderQuery(e.target.value)}
                  />
                </div>

                {filteredOrders.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-800/80 p-12 text-center rounded-2xl text-zinc-500">
                    <FileText size={48} className="mx-auto text-zinc-650 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold">{isArabic ? "لا توجد أي طلبات مطابقة للفلتر المحدد" : "No client orders located matching this state."}</p>
                    <p className="text-xs text-zinc-500 mt-1">{isArabic ? "انتظر حتى يقوم الزوار بوضع فساتين وملابس في حقيبتهم وتأكيد الشحن!" : "New online shopping orders will list instantly in real-time."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredOrders.map((ord) => (
                      <div key={ord.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-lg p-5 sm:p-6 space-y-4">
                        
                        {/* Order Header info block */}
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-zinc-805 pb-4 gap-2 text-right">
                          <div>
                            <div className="text-amber-400 font-bold font-mono text-xs sm:text-sm">
                              ORDER Ref: #{ord.id}
                            </div>
                            <div className="text-zinc-500 text-[10px] font-mono mt-0.5">
                              {new Date(ord.createdAt).toLocaleString(isArabic ? 'ar-EG' : 'en-US')}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 items-center justify-start">
                            {/* Color-coded order state bag */}
                            <span className={`text-[10px] font-bold uppercase px-3 py-1 rounded-full border ${
                              ord.status === 'pending' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                              ord.status === 'preparing' ? 'bg-indigo-505/15 border-indigo-500/30 text-indigo-400' :
                              ord.status === 'shipped' ? 'bg-sky-505/15 border-sky-500/30 text-sky-400' :
                              ord.status === 'delivered' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                              'bg-red-500/15 border-red-500/30 text-red-400'
                            }`}>
                              {ord.status === 'pending' && (isArabic ? "معلق (انتظار)" : "Pending Confirmation")}
                              {ord.status === 'preparing' && (isArabic ? "تحت التعبئة والتحضير" : "Preparing Package")}
                              {ord.status === 'shipped' && (isArabic ? "مع المندوب للتوصيل" : "Shipped with Dispatcher")}
                              {ord.status === 'delivered' && (isArabic ? "تم التسليم بنجاح" : "Delivered / Handed")}
                              {ord.status === 'cancelled' && (isArabic ? "ملغي" : "Cancelled Order")}
                            </span>

                            {/* Total price received */}
                            <span className="text-zinc-200 font-black font-mono text-sm sm:text-base">
                              {ord.total} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Order client shipping details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <div className="space-y-1 bg-zinc-950 p-4 border border-zinc-805/40 rounded-2xl">
                            <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[9px] mb-2">{isArabic ? "بيانات العميل والشحن:" : "Delivery Credentials:"}</h5>
                            <div><span className="text-zinc-500">{isArabic ? "الاسم:" : "Name:"}</span> <strong className="text-zinc-200 font-semibold">{ord.customerName}</strong></div>
                            <div><span className="text-zinc-500">{isArabic ? "الهاتف للتوصيل:" : "Mobile phone:"}</span> <strong className="text-zinc-200 font-mono text-left inline-block" style={{ direction: 'ltr' }}>{ord.customerPhone}</strong></div>
                            <div><span className="text-zinc-500">{isArabic ? "المحافظة:" : "Governorate:"}</span> <strong className="text-amber-400">{ord.customerCity}</strong></div>
                            <div><span className="text-zinc-500">{isArabic ? "العنوان بالتفصيل:" : "Home address:"}</span> <strong className="text-zinc-200 leading-snug">{ord.customerAddress}</strong></div>
                            {ord.customerNotes && (
                              <div className="text-amber-500 font-semibold pt-1 border-t border-zinc-900 mt-1.5 text-[11px]">
                                {isArabic ? "ملاحظة التوصيل:" : "Client Notes:"} {ord.customerNotes}
                              </div>
                            )}
                          </div>

                          {/* Order items clothes parameters */}
                          <div className="space-y-2 bg-zinc-950 p-4 border border-zinc-805/40 rounded-2xl flex flex-col justify-between">
                            <div>
                              <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[9px] mb-2">{isArabic ? "القطع المطلوبة وفلتر المقاس:" : "Product Components List:"}</h5>
                              <div className="divide-y divide-zinc-900 space-y-1.5 max-h-48 overflow-y-auto">
                                {ord.items.map((it, i) => (
                                  <div key={i} className="flex gap-3 pt-1.5 first:pt-0">
                                    <img src={it.image} className="w-8 h-10 object-cover rounded border border-zinc-800 shrink-0" alt="" />
                                    <div>
                                      <div className="font-bold text-zinc-200 text-xs line-clamp-1">{isArabic ? it.nameAr : it.nameEn}</div>
                                      <div className="text-[10px] text-zinc-400 font-mono">
                                        Qty: {it.quantity} | Size: {it.selectedSize} |
                                        <span className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-700 ml-1.5 mr-1" style={{ backgroundColor: it.selectedColor }} />
                                      </div>
                                    </div>
                                    <div className="ml-auto text-amber-500 font-mono font-bold text-xs">
                                      {it.price * it.quantity} ج.م
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Progress states handlers buttons */}
                        {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-805/60 justify-end" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            <button
                              onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'cancel')}
                              className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-semibold rounded-xl cursor-pointer transition shadow-md"
                            >
                              {isArabic ? "إلغاء الطلب" : "Cancel Request"}
                            </button>

                            {ord.status === 'pending' && (
                              <button
                                onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'next')}
                                className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1 shadow-md"
                              >
                                <Clock size={13} />
                                <span>{isArabic ? "بدء التحضير والتعبئة بمصر" : "Begin Package Preparing"}</span>
                              </button>
                            )}

                            {ord.status === 'preparing' && (
                              <button
                                onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'next')}
                                className="px-5 py-2 bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1 shadow-md"
                              >
                                <Truck size={13} />
                                <span>{isArabic ? "تسليم الشحنة لمندوب التوصيل" : "Dispatch to Courier"}</span>
                              </button>
                            )}

                            {ord.status === 'shipped' && (
                              <button
                                onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'next')}
                                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1 shadow-md"
                              >
                                <CheckCircle size={13} />
                                <span>{isArabic ? "تفويض كطلب مستلم مكتمل" : "Complete - Delivered!"}</span>
                              </button>
                            )}
                          </div>
                        )}

                      </div>
                    ))}
                  </div>
                )}

              </div>
            )}

            {/* SHIPPING & LOGISTICS MANAGER TAB */}
            {activeTab === 'shipping' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {isArabic ? "شركات وخطط تسعير الشحن" : "Shipping Companies & Plans"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isArabic ? "حدد أسعار وشركات الشحن المتاحة وربطها بالمنتجات أثناء تصنيع المنتجات" : "Determine custom shipping prices, companies, and times for client delivery"}
                    </p>
                  </div>

                  {!showShippingForm && (
                    <button
                      onClick={() => {
                        setEditingShipping(null);
                        setShippingFormData({
                          companyNameAr: '',
                          companyNameEn: '',
                          price: 50,
                          deliveryTimeAr: '٢ - ٤ أيام',
                          deliveryTimeEn: '2 - 4 Days',
                          isActive: true
                        });
                        setShowShippingForm(true);
                      }}
                      className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-black text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-2 shadow"
                    >
                      <PlusCircle size={14} />
                      <span>{isArabic ? "إضافة خطة شحن جديدة" : "Create New Shipping Plan"}</span>
                    </button>
                  )}
                </div>

                {/* Create/Edit Shipping Form */}
                {showShippingForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl space-y-4"
                  >
                    <h4 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                      <Truck size={16} />
                      <span>{editingShipping ? (isArabic ? "تعديل خطة الشحن" : "Modify Shipping Rates") : (isArabic ? "إضافة شركة شحن جديدة" : "Add Shipping Carrier")}</span>
                    </h4>

                    <form onSubmit={handleSaveShippingPlan} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">اسم شركة الشحن (عربي) *</label>
                        <input
                          type="text" required placeholder="مثال: أرامكس، البريد المصري، شحن سريع"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={shippingFormData.companyNameAr}
                          onChange={(e) => setShippingFormData({ ...shippingFormData, companyNameAr: e.target.value })}
                        />
                      </div>
                      <div className="text-left" style={{ direction: 'ltr', textAlign: 'left' }}>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1 text-left">Carrier Name (English) *</label>
                        <input
                          type="text" required placeholder="e.g. Aramex, Egypt Post, Standard Courier"
                          className="w-full bg-zinc-950 border border-zinc-805 rounded-lg p-2.5 text-xs text-white text-left"
                          value={shippingFormData.companyNameEn}
                          onChange={(e) => setShippingFormData({ ...shippingFormData, companyNameEn: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">تكلفة الشحن (بالجنيه المصري) *</label>
                        <input
                          type="number" min={0} required placeholder="50"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={shippingFormData.price}
                          onChange={(e) => setShippingFormData({ ...shippingFormData, price: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">وقت التوصيل التقريبي (عربي) *</label>
                        <input
                          type="text" required placeholder="مثال: ٢ - ٤ أيام عمل"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={shippingFormData.deliveryTimeAr}
                          onChange={(e) => setShippingFormData({ ...shippingFormData, deliveryTimeAr: e.target.value })}
                        />
                      </div>
                      <div className="text-left" style={{ direction: 'ltr', textAlign: 'left' }}>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1 text-left">Estimated Delivery Time (English) *</label>
                        <input
                          type="text" required placeholder="e.g. 2 - 4 Working Days"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white text-left"
                          value={shippingFormData.deliveryTimeEn}
                          onChange={(e) => setShippingFormData({ ...shippingFormData, deliveryTimeEn: e.target.value })}
                        />
                      </div>

                      <div className="md:col-span-2 flex items-center justify-between border-t border-zinc-800 pt-4 mt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-zinc-350">
                          <input
                            type="checkbox"
                            className="rounded border-zinc-800 bg-zinc-950 text-amber-400 focus:ring-0"
                            checked={shippingFormData.isActive}
                            onChange={(e) => setShippingFormData({ ...shippingFormData, isActive: e.target.checked })}
                          />
                          <span>{isArabic ? "تفعيل هذه الخطة للعملاء حالاً" : "Activate this template plan now"}</span>
                        </label>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setShowShippingForm(false); setEditingShipping(null); }}
                            className="px-4 py-2 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-xs transition duration-200 cursor-pointer text-white"
                          >
                            {isArabic ? "إلغاء الأمر" : "Cancel"}
                          </button>
                          <button
                            type="submit"
                            className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl text-xs transition duration-200 cursor-pointer"
                          >
                            {isArabic ? "حفظ وتثبيت الخطة" : "Commit Rate Plan"}
                          </button>
                        </div>
                      </div>
                    </form>
                  </motion.div>
                )}

                {/* Dynamic List */}
                {shippingPlans.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-850 p-12 text-center rounded-2xl text-zinc-500">
                    <Truck size={48} className="mx-auto text-zinc-650 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold">{isArabic ? "لم تقم بإضافة أي شركات أو خطط شحن بعد" : "No custom shipping logistical companies created yet"}</p>
                    <p className="text-xs text-zinc-500 mt-1">{isArabic ? "سيتم الشحن تلقائياً بالمبلغ الافتراضي إذا لم يكن هناك خطط مضافة." : "Flat default shipping rates apply until plans are active."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {shippingPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className={`p-5 rounded-2xl border bg-zinc-900 flex flex-col justify-between transition-all ${
                          plan.isActive ? 'border-zinc-800' : 'border-red-950/40 opacity-70'
                        }`}
                      >
                        <div className="space-y-2 text-right">
                          <div className="flex justify-between items-start">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                              plan.isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                              {plan.isActive ? (isArabic ? 'نشط' : 'Active') : (isArabic ? 'موقف' : 'Inactive')}
                            </span>
                            <span className="text-lg font-mono font-black text-amber-400">
                              {plan.price} ج.م
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-zinc-150">
                            {isArabic ? plan.companyNameAr : plan.companyNameEn}
                          </h4>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 font-mono justify-end">
                            <span>{isArabic ? plan.deliveryTimeAr : plan.deliveryTimeEn}</span>
                            <Clock size={12} className="text-zinc-500" />
                          </p>
                        </div>

                        <div className="flex gap-2 mt-4 pt-3 border-t border-zinc-800/85">
                          <button
                            onClick={() => handleEditShippingPlan(plan)}
                            className="p-1 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-800 text-zinc-300 hover:text-white rounded-lg transition duration-200 cursor-pointer text-xs"
                          >
                            {isArabic ? "تعديل" : "Edit"}
                          </button>
                          <button
                            onClick={() => handleDeleteShippingPlan(plan.id)}
                            className="p-1 px-3 bg-red-950/20 hover:bg-red-950/30 border border-red-950/30 text-red-400 rounded-lg transition duration-200 cursor-pointer text-xs"
                          >
                            {isArabic ? "حذف" : "Remove"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CUSTOMER LOYALTY PROGRAM TAB */}
            {activeTab === 'loyalty' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {isArabic ? "برنامج نقاط العملاء ومكافآت الولاء" : "Customer Loyalty Points Rewards"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isArabic ? "اضبط قواعد تجميع النقاط واعرض رصيد العملاء والتعامل الفوري مع بروفايل العميل" : "Manage rules for earning/redeeming points, and track customers accumulated rewards balances"}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Settings section */}
                  <div className="bg-zinc-905 bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 lg:col-span-1">
                    <h4 className="text-sm font-black text-amber-400 flex items-center gap-1.5 border-b border-zinc-800 pb-3 justify-end">
                      <span>{isArabic ? "قواعد برنامج النقاط" : "Loyalty System Parameters"}</span>
                      <Award size={15} />
                    </h4>

                    <form onSubmit={handleSaveLoyaltySettings} className="space-y-4 text-right">
                      <div className="flex items-center justify-between">
                        <input
                          type="checkbox"
                          className="rounded border-zinc-850 bg-zinc-950 text-amber-400 focus:ring-0 cursor-pointer"
                          checked={loyaltyConfig.isActive}
                          onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, isActive: e.target.checked })}
                        />
                        <span className="text-xs font-bold text-zinc-300">{isArabic ? "تفعيل برنامج النقاط للعملاء:" : "Enable Loyalty Points:"}</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">النقاط المكتسبة لكل ١ جنيه مصري إنفاق *</label>
                        <input
                          type="number" step="any" min={0} required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={loyaltyConfig.pointsPerEgp}
                          onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, pointsPerEgp: Number(e.target.value) })}
                        />
                        <span className="text-[10px] text-zinc-550 font-mono mt-0.5 block text-zinc-400">
                          e.g. 0.1 means 1 Point for every 10 EGP spent.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">قيمة النقطة الواحدة عند الاستبدال (بالجنيه) *</label>
                        <input
                          type="number" step="any" min={0} required
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                          value={loyaltyConfig.egpValuePerPoint}
                          onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, egpValuePerPoint: Number(e.target.value) })}
                        />
                        <span className="text-[10px] text-zinc-550 font-mono mt-0.5 block text-zinc-400">
                          e.g. 0.5 means each 1.0 point redeems 0.5 EGP discount.
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">تعليمات النقاط للعملاء (عربي)</label>
                        <textarea
                          rows={2}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={loyaltyConfig.instructionsAr || ''}
                          onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, instructionsAr: e.target.value })}
                        />
                      </div>

                      <div className="text-left" style={{ direction: 'ltr', textAlign: 'left' }}>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1 text-left">Instructions for Customer (English)</label>
                        <textarea
                          rows={2}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white text-left"
                          value={loyaltyConfig.instructionsEn || ''}
                          onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, instructionsEn: e.target.value })}
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-black font-black rounded-xl text-xs transition duration-200 cursor-pointer shadow-md"
                      >
                        {isArabic ? "حفظ وتحديث القواعد" : "Save Loyalty Rules"}
                      </button>
                    </form>
                  </div>

                  {/* Customers Points ledger */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 lg:col-span-2">
                    <h4 className="text-sm font-black text-white flex items-center justify-between border-b border-zinc-800 pb-3">
                      <span>{isArabic ? "قائمة أرصدة العملاء المشتركين" : "Customer Reward Ledger"}</span>
                      <Award size={15} className="text-amber-400" />
                    </h4>

                    {customers.length === 0 ? (
                      <div className="p-8 text-center text-zinc-500">
                        {isArabic ? "لا يوجد حسابات عملاء مسجلة بعد." : "No registered user profiles found."}
                      </div>
                    ) : (
                      <div className="overflow-x-auto text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                        <table className="w-full text-right text-xs">
                          <thead>
                            <tr className="border-b border-zinc-800 text-zinc-500 text-right">
                              <th className="py-2.5 font-bold text-right">{isArabic ? "العميل" : "Client"}</th>
                              <th className="py-2.5 font-bold font-mono text-right">{isArabic ? "الهاتف" : "Phone"}</th>
                              <th className="py-2.5 font-bold font-mono text-center">{isArabic ? "النقاط" : "Points"}</th>
                              <th className="py-2.5 font-bold text-center">{isArabic ? "الخصم المستحق" : "Discount"}</th>
                              <th className="py-2.5 font-bold text-center">{isArabic ? "تعديل رصيد النقاط" : "Direct Adjustment"}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-800 text-zinc-350">
                            {customers.map((c) => {
                              const pointsValue = ((c.points || 0) * loyaltyConfig.egpValuePerPoint).toFixed(1);
                              return (
                                <tr key={c.id} className="hover:bg-zinc-850/20 text-right">
                                  <td className="py-3 text-right">
                                    <div className="font-semibold text-zinc-200">{c.name || (isArabic ? 'عميل راف' : 'RAAV Buyer')}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono select-all block">{c.email || c.id.slice(0, 8)}</div>
                                  </td>
                                  <td className="py-3 font-mono text-right">{c.phone || '-'}</td>
                                  <td className="py-3 text-center font-mono font-black text-amber-400 text-sm">{c.points || 0}</td>
                                  <td className="py-3 text-center font-mono font-bold text-emerald-400">{pointsValue} EGP</td>
                                  <td className="py-3 text-center">
                                    <div className="flex gap-1.5 justify-center">
                                      <button
                                        onClick={async () => {
                                          const amt = prompt(isArabic ? "أدخل كمية النقاط المراد إضافتها لهذا العميل:" : "Enter points to ADD to this profile:", "20");
                                          if (amt) {
                                            const n = Number(amt);
                                            if (!isNaN(n)) {
                                              const { addCustomerPoints } = await import('../dbService');
                                              await addCustomerPoints(c.id, n);
                                              alert(isArabic ? "تم إضافة النقاط بنجاح!" : "Points logged added!");
                                            }
                                          }
                                        }}
                                        className="text-[10px] bg-zinc-800 text-amber-400 px-2 py-1 rounded hover:bg-zinc-700 hover:text-white transition cursor-pointer"
                                      >
                                        + {isArabic ? "إضافة" : "Add"}
                                      </button>
                                      <button
                                        onClick={async () => {
                                          const amt = prompt(isArabic ? "أدخل كمية النقاط المراد خصمها من رصيد العميل:" : "Enter points to DEDUCT from this profile:", "20");
                                          if (amt) {
                                            const n = Number(amt);
                                            if (!isNaN(n)) {
                                              const { deductCustomerPoints } = await import('../dbService');
                                              await deductCustomerPoints(c.id, n);
                                              alert(isArabic ? "تم الخصم بنجاح!" : "Points deducted successfully!");
                                            }
                                          }
                                        }}
                                        className="text-[10px] bg-red-950/20 text-red-400 px-2 py-1 rounded hover:bg-red-950/40 transition cursor-pointer"
                                      >
                                        - {isArabic ? "خصم" : "Deduct"}
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT METHODS SETUP TAB */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {isArabic ? "طرق وأنظمة سداد الدفع المتاحة" : "Store Checkout Payment Methods"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isArabic ? "حدد طرق السداد المسموح بها مع ضبط بيانات الاستقبال للمحافظ الإلكترونية، InstaPay وعرض الـ QR Code" : "Configure electronic mobile wallet numbers, InstaPay transfer addresses, and QR codes"}
                  </p>
                </div>

                <form onSubmit={handleSavePaymentSettings} className="space-y-6 text-right">
                  {/* Cash on delivery toggle */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-white flex items-center justify-between border-b border-zinc-800 pb-3">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-850 bg-zinc-950 text-amber-400 focus:ring-0 cursor-pointer"
                        checked={paymentConfig.cashOnDeliveryActive}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, cashOnDeliveryActive: e.target.checked })}
                      />
                      <span className="flex items-center gap-1.5 justify-end">
                        <span>{isArabic ? "الدفع النقدي عند الاستلام (COD)" : "Cash On Delivery (COD)"}</span>
                        <Truck size={15} className="text-zinc-550" />
                      </span>
                    </h4>
                    <p className="text-xs text-zinc-400">
                      {isArabic ? "تفعيل هذا الخيار يسمح للعميل بالدفع نقداً للمندوب عند استلام الملابس بباب المنزل." : "Activating COD allows customers to pay cash directly to courier at doorsteps."}
                    </p>
                  </div>

                  {/* InstaPay config */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-white flex items-center justify-between border-b border-zinc-800 pb-3">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-850 bg-zinc-950 text-amber-400 focus:ring-0 cursor-pointer"
                        checked={paymentConfig.instaPayActive}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, instaPayActive: e.target.checked })}
                      />
                      <span className="flex items-center gap-1.5 justify-end">
                        <span>{isArabic ? "سداد تحويل فوري مع - انستا باي (InstaPay)" : "InstaPay Online Transfers"}</span>
                        <Landmark size={15} className="text-green-500" />
                      </span>
                    </h4>

                    {paymentConfig.instaPayActive && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">عنوان الدفع في انستا باي (InstaPay Address) *</label>
                          <input
                            type="text" required placeholder="example@instapay"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                            value={paymentConfig.instaPay.username}
                            onChange={(e) => setPaymentConfig({
                              ...paymentConfig,
                              instaPay: { ...paymentConfig.instaPay, username: e.target.value }
                            })}
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">رقم الهاتف المرتبط بانستا باي *</label>
                          <input
                            type="text" required placeholder="01012345678"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                            value={paymentConfig.instaPay.phone}
                            onChange={(e) => setPaymentConfig({
                              ...paymentConfig,
                              instaPay: { ...paymentConfig.instaPay, phone: e.target.value }
                            })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">رابط أو صورة الكود QR Code للتحويل الفوري (Link/URL)</label>
                          <input
                            type="text" placeholder="https://..."
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                            value={paymentConfig.instaPay.qrCode || ''}
                            onChange={(e) => setPaymentConfig({
                              ...paymentConfig,
                              instaPay: { ...paymentConfig.instaPay, qrCode: e.target.value }
                            })}
                          />
                          <p className="text-[10px] text-zinc-500 mt-1">
                            {isArabic 
                              ? "ضع رابط صورة الـ QR لعلامتك التجارية لتبسيط عملية الدفع للعميل أثناء تأكيد الطلب سلكياً من الهاتف." 
                              : "Input URL of your InstaPay QR Code image for clean, immediate user verification."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Electronic wallets (المحافظ الإلكترونية) */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4">
                    <h4 className="text-sm font-black text-white flex items-center justify-between border-b border-zinc-805 pb-3">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-850 bg-zinc-950 text-amber-400 focus:ring-0 cursor-pointer"
                        checked={paymentConfig.walletsActive}
                        onChange={(e) => setPaymentConfig({ ...paymentConfig, walletsActive: e.target.checked })}
                      />
                      <span className="flex items-center gap-1.5 justify-end">
                        <span>{isArabic ? "الدفع المحافظ الإلكترونية المتعددة (فودافون كاش، اتصالات، الخ)" : "Mobile Wallets (Vodafone Cash, Orange, etc)"}</span>
                        <Wallet size={15} className="text-amber-500" />
                      </span>
                    </h4>

                    {paymentConfig.walletsActive && (
                      <div className="space-y-4">
                        <p className="text-xs text-zinc-400">
                          {isArabic ? "يمكنك إضافة أكثر من محفظة إلكترونية لاستقبل أموال العملاء مع تحديد الاسم ورقم التليفون وصورة QR Code مخصصة لكل محفظة." : "Add multiple electronic wallets with distinct names, phone numbers, and optional QR Codes."}
                        </p>

                        <div className="space-y-3">
                          {paymentConfig.wallets.map((w, idx) => (
                            <div key={w.id || idx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-2xl relative space-y-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleRemoveWalletOption(w.id)}
                                className="absolute top-4 left-4 text-xs text-red-500 hover:text-red-400 transition cursor-pointer"
                              >
                                {isArabic ? "إزالة المحفظة" : "Remove"}
                              </button>

                              <h5 className="font-bold text-xs text-amber-400">
                                {isArabic ? `محفظة رقم #${idx + 1}` : `Wallet Mobile #${idx + 1}`}
                              </h5>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-right">
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">اسم المحفظة (عربي) *</label>
                                  <input
                                    type="text" required placeholder="مثال: فودافون كاش، محفظة الأهلي"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                                    value={w.nameAr}
                                    onChange={(e) => handleUpdateWalletOption(w.id, 'nameAr', e.target.value)}
                                  />
                                </div>
                                <div className="text-left" style={{ direction: 'ltr', textAlign: 'left' }}>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1 text-left">Wallet Name (English) *</label>
                                  <input
                                    type="text" required placeholder="e.g. Vodafone Cash, CIB Smart Wallet"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white text-left"
                                    value={w.nameEn}
                                    onChange={(e) => handleUpdateWalletOption(w.id, 'nameEn', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">رقم تليفون التحويل لرافع المحفظة *</label>
                                  <input
                                    type="text" required placeholder="e.g. 010xxxxxxxx"
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                                    value={w.phone}
                                    onChange={(e) => handleUpdateWalletOption(w.id, 'phone', e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">رابط صورة QR Code لتسهيل الدفع (اختياري)</label>
                                  <input
                                    type="text" placeholder="https://..."
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                                    value={w.qrCode || ''}
                                    onChange={(e) => handleUpdateWalletOption(w.id, 'qrCode', e.target.value)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={handleAddWalletOption}
                          className="px-4 py-2 border border-dashed border-zinc-800 hover:border-amber-400 text-zinc-350 hover:text-white rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                        >
                          <PlusCircle size={13} />
                          <span>{isArabic ? "إضافة محفظة إلكترونية أخرى" : "Add Another Mobile Wallet"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Submission actions */}
                  <div className="flex justify-end pt-4 border-t border-zinc-805">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black rounded-xl text-xs sm:text-sm transition duration-200 cursor-pointer shadow-md flex items-center gap-2"
                    >
                      <CheckCircle size={15} />
                      <span>{isArabic ? "حفظ كافة طرق وإعدادات الدفع" : "Save All Payments Configs"}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* SPECIAL CUSTOM ORDERS & CONVERSATIONS TAB */}
            {activeTab === 'conversations' && (
              <div className="space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h3 className="text-xl font-black text-white tracking-tight text-right sm:text-right">
                      {isArabic ? "طلبات التفصيل الخاصة والمشاورات" : "Custom Special Orders & Consulting"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1 text-right sm:text-right">
                      {isArabic 
                        ? "استقبل المحادثات المباشرة مع العملاء واضبط الأسعار وحالة الطلب لخدمات التفصيل والفساتين اليدوية الخاصة." 
                        : "Engage in direct bespoke counseling, configure pricing models, and progress individual couture states."}
                    </p>
                  </div>
                </div>

                {conversations.length === 0 ? (
                  <div className="bg-zinc-900 border border-zinc-850 p-12 text-center rounded-2xl text-zinc-500">
                    <Sparkles size={48} className="mx-auto text-zinc-650 mb-3 animate-pulse" />
                    <p className="text-sm font-semibold">{isArabic ? "لا توجد أي طلبات تفصيل مخصصة حتى الآن" : "No custom couture requests lodged yet"}</p>
                    <p className="text-xs text-zinc-500 mt-1">{isArabic ? "ستظهر رسائل وتفاصيل طلبات العملاء المخصصة هنا حال تقديمها من الموقع." : "Customer bespoke inquiries will initialize streams here on submission."}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Conversations Sidebar List */}
                    <div className="lg:col-span-4 bg-zinc-900 border border-zinc-800 rounded-3xl p-4 space-y-3 max-h-[600px] overflow-y-auto">
                      <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest pb-2 border-b border-zinc-800 text-right">
                        {isArabic ? "قائمة طلبات التفصيل الواردة" : "Bespoke Channels"}
                      </h4>
                      <div className="space-y-2">
                        {conversations.map((conv) => {
                          const isSelected = conv.id === selectedConversationId;
                          const linkedOrder = orders.find(o => o.id === conv.orderId || o.linkedConversationId === conv.id);
                          return (
                            <button
                              key={conv.id}
                              onClick={() => setSelectedConversationId(conv.id)}
                              className={`w-full text-right p-3.5 rounded-2xl border transition duration-150 cursor-pointer ${
                                isSelected 
                                  ? "bg-amber-400 border-amber-400 text-black shadow" 
                                  : "bg-zinc-950 border-zinc-850 hover:border-zinc-700 text-white"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                                  isSelected ? "bg-black/15 text-black" : "bg-amber-500/10 text-amber-400"
                                }`}>
                                  {linkedOrder ? (isArabic ? "طلب مخصص" : "Bespoke") : (isArabic ? "مشاورة" : "Consult")}
                                </span>
                                <span className={`text-[10px] font-mono ${isSelected ? "text-zinc-800" : "text-zinc-500"}`}>
                                  {new Date(conv.updatedAt || conv.createdAt || Date.now()).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                                </span>
                              </div>
                              <h5 className="font-extrabold text-sm mt-1.5 truncate">
                                {conv.customerName || (isArabic ? "عميل راف" : "RAAV Buyer")}
                              </h5>
                              <p className={`text-[11px] mt-1 line-clamp-1 ${isSelected ? "text-zinc-800" : "text-zinc-400"}`}>
                                {conv.topic || (isArabic ? "بلا عنوان" : "No topic details")}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Active Conversation details and chat */}
                    <div className="lg:col-span-8 space-y-4">
                      {(() => {
                        const currentConv = conversations.find(c => c.id === selectedConversationId);
                        if (!currentConv) {
                          return (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-500">
                              {isArabic ? "اختر طلباً مخصصاً من القائمة الجانبية للبدء بالمراقبة والمحادثة" : "Select a bespoke customer inquiry to access live workspace"}
                            </div>
                          );
                        }

                        const linkedOrder = orders.find(o => o.id === currentConv.orderId || o.linkedConversationId === currentConv.id);

                        return (
                          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden flex flex-col min-h-[500px]">
                            
                            {/* Chat Header and Actions segment */}
                            <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
                              <div>
                                <h4 className="font-extrabold text-white text-base">
                                  {currentConv.customerName}
                                </h4>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {isArabic ? "الموضوع: " : "Topic: "} <strong className="text-amber-400 font-bold">{currentConv.topic}</strong>
                                </p>
                              </div>

                              {/* Operations on linked special order */}
                              {linkedOrder && (
                                <div className="flex flex-wrap gap-2 items-center">
                                  <div className="text-xs font-mono text-zinc-400 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-805">
                                    {isArabic ? "السعر:" : "Price:"} {linkedOrder.agreedPrice || linkedOrder.total || 0} ج.م
                                  </div>
                                  <button
                                    onClick={async () => {
                                      const priceStr = prompt(isArabic ? "أدخل السعر المتفق عليه لهذا التفصيل المخصص (ج.م):" : "Enter Agreed Price for this Custom Couture (EGP):", String(linkedOrder.agreedPrice || linkedOrder.total || 3000));
                                      if (priceStr !== null) {
                                        const price = Number(priceStr);
                                        if (!isNaN(price)) {
                                          const { doc, updateDoc } = await import('firebase/firestore');
                                          const { db: firestoreDB } = await import('../firebase');
                                          await updateDoc(doc(firestoreDB, 'orders', linkedOrder.id), { agreedPrice: price, total: price });
                                          alert(isArabic ? "تم تحديث السعر بنجاح!" : "Agreed price updated successfully!");
                                        }
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-amber-400 font-bold text-xs rounded-xl cursor-pointer transition"
                                  >
                                    {isArabic ? "تعديل السعر" : "Adjust Price"}
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const states: OrderStatus[] = ['pending', 'preparing', 'shipped', 'delivered', 'cancelled'];
                                      const currentIdx = states.indexOf(linkedOrder.status);
                                      if (currentIdx !== -1) {
                                        const nextIdx = (currentIdx + 1) % states.length;
                                        await updateOrderStatus(linkedOrder.id, states[nextIdx]);
                                      }
                                    }}
                                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-black text-xs rounded-xl cursor-pointer transition flex items-center gap-1.5"
                                  >
                                    <span>{isArabic ? "حالة الحركة:" : "State:"} {linkedOrder.status}</span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Linked order parameters specification shelf */}
                            {linkedOrder && (
                              <div className="bg-zinc-950 p-4 border-b border-zinc-800 text-xs text-zinc-350 space-y-2 text-right">
                                <h5 className="font-extrabold text-[10px] uppercase tracking-wider text-zinc-500 mb-1">{isArabic ? "تفاصيل الطلب الخاص ومواصفات قطعة الملابس:" : "Bespoke Piece Specifications Shelf:"}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div><span className="text-zinc-500">{isArabic ? "الخامة المطلوبة:" : "Material:"}</span> <strong className="text-zinc-200">{linkedOrder.customMaterial}</strong></div>
                                  <div><span className="text-zinc-500">{isArabic ? "اللون المحدد:" : "Color tones:"}</span> <strong className="text-zinc-200">{linkedOrder.customColor}</strong></div>
                                  <div><span className="text-zinc-500">{isArabic ? "الميزانية المخصصة:" : "Budget limit:"}</span> <strong className="text-amber-400 font-mono">{linkedOrder.customBudget} ج.م</strong></div>
                                </div>
                                <div className="border-t border-zinc-900 pt-2 mt-2">
                                  <span className="text-zinc-500">{isArabic ? "الهاتف الشاحن:" : "Buyer Phone:"}</span> <strong className="text-zinc-200 select-all">{linkedOrder.customerPhone}</strong>
                                  <span className="mx-2 text-zinc-750">|</span>
                                  <span className="text-zinc-500">{isArabic ? "المحافظة الموجهة:" : "City Destination:"}</span> <strong className="text-zinc-200">{linkedOrder.customerCity}</strong>
                                </div>
                                <div>
                                  <span className="text-zinc-500">{isArabic ? "الرسالة التفصيلية والمقاسات:" : "Size description:"}</span>
                                  <p className="mt-1 text-[11px] leading-relaxed bg-zinc-904/50 bg-zinc-900 p-2.5 rounded-lg border border-zinc-800 text-zinc-300 select-text whitespace-pre-wrap">{linkedOrder.customDescription}</p>
                                </div>
                              </div>
                            )}

                            {/* Chat Messages Stream */}
                            <div className="flex-1 max-h-[350px] overflow-y-auto p-5 space-y-4 bg-zinc-950 text-right">
                              {conversationMessages.length === 0 ? (
                                <div className="text-center text-zinc-600 text-sm py-12">
                                  {isArabic ? "بدء الدردشة مع العميل الآن..." : "Begin conversation with patron now..."}
                                </div>
                              ) : (
                                conversationMessages.map((msg) => {
                                  const isAdmin = msg.senderRole === "admin";
                                  return (
                                    <div key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-md text-right ${
                                        isAdmin 
                                          ? "bg-amber-400 text-black font-medium" 
                                          : "bg-zinc-900 text-zinc-100 border border-zinc-800"
                                      }`}>
                                        <div className={`text-[9px] uppercase tracking-wider font-extrabold mb-1.5 ${isAdmin ? "text-zinc-800" : "text-amber-500"}`}>
                                          {msg.senderName}
                                        </div>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                        <span className={`block text-[8px] mt-2 ${isAdmin ? "text-zinc-700 font-mono" : "text-zinc-500 font-mono"}`}>
                                          {new Date(msg.createdAt || Date.now()).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>

                            {/* Reply input form */}
                            <form 
                              onSubmit={async (e) => {
                                e.preventDefault();
                                if (!adminReplyDraft.trim()) return;
                                try {
                                  await sendConversationMessage(currentConv.id, {
                                    senderId: adminUser.uid,
                                    senderRole: 'admin',
                                    senderName: isArabic ? 'إدارة راف RAAV' : 'RAAV Studio Admin',
                                    text: adminReplyDraft.trim()
                                  });
                                  setAdminReplyDraft('');
                                } catch (err) {
                                  console.error(err);
                                }
                              }} 
                              className="p-4 bg-zinc-900 border-t border-zinc-805 flex gap-2 text-right"
                            >
                              <input
                                type="text"
                                placeholder={isArabic ? "اكتب ردك وملاحظاتك الرسمية للعميل..." : "Reply to bespoke inquiry guidelines..."}
                                className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:outline-none rounded-xl px-4 py-2.5 text-xs text-white text-right"
                                value={adminReplyDraft}
                                onChange={(e) => setAdminReplyDraft(e.target.value)}
                              />
                              <button
                                type="submit"
                                disabled={!adminReplyDraft.trim()}
                                className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:bg-zinc-800 disabled:text-zinc-550 text-black text-xs font-black transition duration-150 cursor-pointer shadow flex items-center gap-1"
                              >
                                <Send size={12} />
                                <span>{isArabic ? "إرسال" : "Send"}</span>
                              </button>
                            </form>

                          </div>
                        );
                      })()}
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* FINANCIAL ACCOUNTS & RECONCILIATIONS TAB */}
            {activeTab === 'accounts' && (
              <div className="space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="text-right w-full">
                    <h3 className="text-xl font-black text-white tracking-tight">
                      {isArabic ? "الحسابات والتسويات المالية" : "Financial Accounts & Settlements"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isArabic 
                        ? "إدارة المقبوضات النقدية مع شركة الشحن وتسوية الفترات، ومتابعة رصيد ومبيعات المحافظ الإلكترونية وإنستاباي." 
                        : "Track collected shipping cash, settle fiscal periods, and manage electronic wallets & InstaPay reserves."}
                    </p>
                  </div>
                </div>

                {/* Grid row 1: Wallets & InstaPay Reserves */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* InstaPay reserve card */}
                  {paymentConfig.instaPayActive && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 text-right">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                            InstaPay
                          </span>
                          <h4 className="font-extrabold text-white text-base mt-1">
                            {isArabic ? "حساب إنستا باي" : "InstaPay Address"}
                          </h4>
                          <p className="text-xs font-mono text-zinc-400">{paymentConfig.instaPay.username}</p>
                          <p className="text-[11px] text-zinc-500 font-mono">{paymentConfig.instaPay.phone}</p>
                        </div>
                        <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-805">
                          <Landmark size={20} className="text-indigo-400" />
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-zinc-800 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-zinc-400">{isArabic ? "إجمالي مبيعات إنستا باي المحصلة:" : "Total Sales Collected:"}</span>
                          <span className="font-bold text-white font-mono">
                            {orders
                              .filter(o => o.status === 'delivered' && o.paymentMethod === 'InstaPay Transfer')
                              .reduce((sum, o) => sum + (o.agreedPrice || o.total || 0), 0)
                              .toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                          </span>
                        </div>

                        <div className="space-y-1.5 pt-1 text-right">
                          <label className="text-[11px] text-zinc-400 block font-medium">
                            {isArabic ? "الرصيد الفعلي المتوفر بالبنك حالياً:" : "Current Available Balance:"}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              placeholder="0"
                              value={paymentConfig.instaPay.availableBalance ?? ''}
                              onChange={(e) => {
                                const newBalance = parseFloat(e.target.value) || 0;
                                setPaymentConfig({
                                  ...paymentConfig,
                                  instaPay: {
                                    ...paymentConfig.instaPay,
                                    availableBalance: newBalance
                                  }
                                });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono text-center"
                            />
                            <button
                              onClick={async () => {
                                try {
                                  await savePaymentConfig(paymentConfig);
                                  alert(isArabic ? "تم تحديث رصيد إنستا باي بنجاح!" : "InstaPay balance updated successfully!");
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1 active:scale-95 shrink-0"
                            >
                              <Check size={12} />
                              <span className="hidden sm:inline">{isArabic ? "حفظ" : "Save"}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Dyn Wallets loop */}
                  {paymentConfig.walletsActive && paymentConfig.wallets.map((wallet) => {
                    const totalWalletSales = orders
                      .filter(o => {
                        if (o.status !== 'delivered') return false;
                        const pMethod = o.paymentMethod || '';
                        return pMethod.includes(wallet.nameAr) || pMethod.includes(wallet.nameEn) || (wallet.id === 'vf-cash' && pMethod.toLowerCase().includes('vodafone'));
                      })
                      .reduce((sum, o) => sum + (o.agreedPrice || o.total || 0), 0);

                    return (
                      <div key={wallet.id} className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1 text-right">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                              E-Wallet
                            </span>
                            <h4 className="font-extrabold text-white text-base mt-1 text-right">
                              {isArabic ? wallet.nameAr : wallet.nameEn}
                            </h4>
                            <p className="text-xs font-mono text-zinc-400 text-right">{wallet.phone}</p>
                          </div>
                          <div className="bg-zinc-950 p-2.5 rounded-2xl border border-zinc-805">
                            <Wallet size={20} className="text-emerald-400" />
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-zinc-800 space-y-4">
                          <div className="flex justify-between items-center text-xs text-right">
                            <span className="text-zinc-400">{isArabic ? "إجمالي مبيعات المحفظة المحصلة:" : "Total Sales Collected:"}</span>
                            <span className="font-bold text-white font-mono">
                              {totalWalletSales.toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                            </span>
                          </div>

                          <div className="space-y-1.5 pt-1 text-right">
                            <label className="text-[11px] text-zinc-400 block font-medium">
                              {isArabic ? "الرصيد الفعلي المتوفر في المحفظة:" : "Current Available Balance:"}
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="0"
                                value={wallet.availableBalance ?? ''}
                                onChange={(e) => {
                                  const newBalance = parseFloat(e.target.value) || 0;
                                  const updatedWallets = paymentConfig.wallets.map(w => 
                                    w.id === wallet.id ? { ...w, availableBalance: newBalance } : w
                                  );
                                  setPaymentConfig({
                                    ...paymentConfig,
                                    wallets: updatedWallets
                                  });
                                }}
                                className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:outline-none rounded-xl px-3 py-1.5 text-xs text-white font-bold font-mono text-center"
                              />
                              <button
                                onClick={async () => {
                                  try {
                                    await savePaymentConfig(paymentConfig);
                                    alert(isArabic ? `تم تحديث رصيد ${wallet.nameAr} بنجاح!` : `Balance for ${wallet.nameEn} saved!`);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl cursor-pointer transition flex items-center gap-1 active:scale-95 shrink-0"
                              >
                                <Check size={12} />
                                <span className="hidden sm:inline">{isArabic ? "حفظ" : "Save"}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Section 2: COD & SHIPPING COMPANY SETTLEMENTS */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-6">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-zinc-800">
                    <div className="text-right">
                      <h4 className="font-extrabold text-white text-base">
                        {isArabic ? "تسويات شركة الشحن (الدفع عند الاستلام)" : "Shipping Company CODs & Settlements"}
                      </h4>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {isArabic 
                          ? "استعرض الطلبات التي تم تسليمها وتوقف تحصيلات شركة الشحن، وفلتر بالتواريخ لتسوية الحسابات وإغلاق دورة توريد معينة." 
                          : "Review delivered cash-on-delivery files, isolate target durations, and close settled accounts."}
                      </p>
                    </div>

                    {/* Date filter inputs */}
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-400">{isArabic ? "من:" : "From:"}</span>
                        <input
                          type="date"
                          value={settlementFromDate}
                          onChange={(e) => setSettlementFromDate(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-400 select-none"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-zinc-400">{isArabic ? "إلى:" : "To:"}</span>
                        <input
                          type="date"
                          value={settlementToDate}
                          onChange={(e) => setSettlementToDate(e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white text-center focus:outline-none focus:border-amber-400 select-none"
                        />
                      </div>
                      
                      {(settlementFromDate || settlementToDate) && (
                        <button
                          onClick={() => {
                            setSettlementFromDate('');
                            setSettlementToDate('');
                          }}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] uppercase font-bold rounded-lg cursor-pointer transition duration-150"
                        >
                          {isArabic ? "إعادة تعيين" : "Reset"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Calculations & active settlements tools */}
                  {(() => {
                    // Filter Cash on Delivery standard/custom orders that are 'delivered'
                    const codOrders = orders.filter(o => {
                      if (o.status !== 'delivered') return false;
                      
                      // Check method is COD
                      const method = (o.paymentMethod || '').toLowerCase();
                      const isCOD = method.includes('cod') || method.includes('cash') || method === '' || method.includes('الاستلام');
                      if (!isCOD) return false;

                      // Date filtering
                      if (settlementFromDate) {
                        const fromLimit = new Date(settlementFromDate).setHours(0, 0, 0, 0);
                        if (o.createdAt < fromLimit) return false;
                      }
                      if (settlementToDate) {
                        const toLimit = new Date(settlementToDate).setHours(23, 59, 59, 999);
                        if (o.createdAt > toLimit) return false;
                      }

                      return true;
                    });

                    // Split into unsettled (not yet in closed period) and settled
                    const unsettledCODs = codOrders.filter(o => !o.settled);
                    const settledCODs = codOrders.filter(o => o.settled);

                    const unsettledTotalSum = unsettledCODs.reduce((sum, o) => sum + (o.agreedPrice || o.total || 0), 0);
                    const settledTotalSum = settledCODs.reduce((sum, o) => sum + (o.agreedPrice || o.total || 0), 0);

                    const handleClosePeriod = async () => {
                      if (unsettledCODs.length === 0) {
                        alert(isArabic ? "لا توجد أي طلبات غير مسواة لإغلاقها الآن!" : "No unsettled orders available in this filter to lock down.");
                        return;
                      }

                      const periodNotes = prompt(
                        isArabic 
                          ? `سيتم إغلاق وتسوية عدد (${unsettledCODs.length}) طلبات محصلة بإجمالي مبلغ: ${unsettledTotalSum} ج.م.\nيرجى كتابة اسم أو وصف لهذه الدفعة الاستلامية (مثال: توريد الأسبوع الأول من يونيو):` 
                          : `You are closing settlement for (${unsettledCODs.length}) orders with sum ${unsettledTotalSum} EGP.\nEnter a reference title or date label for this closure (e.g. Early June Settlement Batch):`
                      );

                      if (periodNotes === null) return; // user cancelled

                      const settleId = 'settle_' + Date.now();
                      const timestamps = unsettledCODs.map(o => o.createdAt);
                      const minTimestamp = Math.min(...timestamps);
                      const maxTimestamp = Math.max(...timestamps);

                      const newPeriod: SettlementPeriod = {
                        id: settleId,
                        startDate: minTimestamp,
                        endDate: maxTimestamp,
                        totalAmount: unsettledTotalSum,
                        createdAt: Date.now(),
                        orderIds: unsettledCODs.map(o => o.id),
                        notes: periodNotes.trim() || (isArabic ? `تسوية بتاريخ ${new Date().toLocaleDateString('ar-EG')}` : `Settlement on ${new Date().toLocaleDateString()}`)
                      };

                      try {
                        // 1. Mark orders as settled in Firestore
                        await markOrdersAsSettled(newPeriod.orderIds, settleId);
                        
                        // 2. Save settlements array in Firestore settings
                        const updatedPeriods = [...settlements, newPeriod];
                        await saveSettlements(updatedPeriods);
                        
                        // 3. Update local state
                        setSettlements(updatedPeriods);
                        
                        // Update order properties in local orders list so it updates instant
                        unsettledCODs.forEach(o => {
                          o.settled = true;
                          o.settledInPeriodId = settleId;
                        });

                        alert(isArabic ? "تم تسوية وإغلاق فترة التوريد بنجاح وبدء فترة مبيعات جديدة!" : "Settlement period sealed securely! Fresh fiscal term seeded.");
                      } catch (err) {
                        console.error(err);
                        alert(isArabic ? "حدث خطأ أثناء حفظ التسوية!" : "Error sealing settlement packet.");
                      }
                    };

                    return (
                      <div className="space-y-6 text-right">
                        {/* Summary Bento Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-zinc-950/60 p-4 border border-zinc-805 rounded-2xl flex flex-col justify-between text-right">
                            <span className="text-[11px] text-zinc-400 font-bold block">
                              {isArabic ? "مستحقات التوريد الحالية (غير مسواة):" : "Current Pending Collection:"}
                            </span>
                            <div className="flex justify-between items-baseline mt-2">
                              <span className="text-2xl font-black text-amber-400 font-mono">
                                {unsettledTotalSum.toLocaleString()} ج.م
                              </span>
                              <span className="text-[11px] text-zinc-500 font-bold">
                                {unsettledCODs.length} {isArabic ? "طلبات" : "orders"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">
                              {isArabic ? "المبالغ التي حصلتها شركة الشحن من العميل ولم توردها بعد." : "Delivered cash on hand with couriers awaiting trade closure."}
                            </p>
                          </div>

                          <div className="bg-zinc-950/60 p-4 border border-zinc-805 rounded-2xl flex flex-col justify-between text-right">
                            <span className="text-[11px] text-zinc-400 font-bold block">
                              {isArabic ? "مجموع التسويات المغلقة السابقة:" : "Historial Closed / Settled:"}
                            </span>
                            <div className="flex justify-between items-baseline mt-2">
                              <span className="text-2xl font-black text-emerald-400 font-mono">
                                {settlements.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()} ج.م
                              </span>
                              <span className="text-[11px] text-zinc-500 font-bold">
                                {settlements.length} {isArabic ? "دورات وتوريدات" : "settlement cycles"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2">
                              {isArabic ? "المبالغ التي تم توريدها بالفعل وإغلاق فتراتها التم تم تحصيلها." : "Previously transferred sums locked and filed in ledger."}
                            </p>
                          </div>

                          {/* Action Button Box */}
                          <div className="bg-amber-400 text-black p-4 rounded-2xl flex flex-col justify-between text-right">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">
                                {isArabic ? "أقفل الفترة الحالية بالتوريد" : "Settle Period Ledger"}
                              </span>
                              <p className="text-[11px] leading-tight font-bold mt-1">
                                {isArabic 
                                  ? `تقفيل وتجميد مبلغ ${unsettledTotalSum.toLocaleString()} ج.م من شركة الشحن وتسهيل بدء التوريد القادم.` 
                                  : `Freeze pending ${unsettledTotalSum.toLocaleString()} EGP, marking orders as completely paid.`}
                              </p>
                            </div>
                            <button
                              onClick={handleClosePeriod}
                              disabled={unsettledCODs.length === 0}
                              className="mt-3.5 w-full py-2 bg-black hover:bg-zinc-900 border border-black text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 shadow-md active:scale-95"
                            >
                              {isArabic ? "إغلاق وتسوية الدفعة الحالية" : "Lock & Settle Current Unsettled"}
                            </button>
                          </div>
                        </div>

                        {/* Unsettled orders table section */}
                        <div className="space-y-3">
                          <h5 className="font-extrabold text-sm text-white flex items-center gap-1.5 text-right">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                            {isArabic 
                              ? `التوريد الحالي: الطلبات المتبقية لشركات الشحن (${unsettledCODs.length})` 
                              : `Unsettled Delivered Files (${unsettledCODs.length})`}
                          </h5>

                          {unsettledCODs.length === 0 ? (
                            <div className="text-zinc-650 bg-zinc-950 p-6 rounded-2xl border border-zinc-850 text-center text-xs">
                              {isArabic ? "لا توجد أي طلبات تم تسليمها وغير مسواة في هذه الفترة الفلترية" : "No open delivered cash orders listed under these filter dates."}
                            </div>
                          ) : (
                            <div className="bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden">
                              <div className="overflow-x-auto">
                                <table className="w-full text-right text-xs text-zinc-300">
                                  <thead>
                                    <tr className="bg-zinc-900 border-b border-zinc-805 text-zinc-400 text-[10px] uppercase font-black tracking-wider">
                                      <th className="p-3.5">{isArabic ? "رقم الطلب" : "Order ID"}</th>
                                      <th className="p-3.5">{isArabic ? "العميل والمدينة" : "Patron & Locality"}</th>
                                      <th className="p-3.5">{isArabic ? "تاريخ التوصيل" : "Delivered Date"}</th>
                                      <th className="p-3.5">{isArabic ? "طريقة الدفع" : "Pay Mode"}</th>
                                      <th className="p-3.5 text-left p-3.5">{isArabic ? "القيمة الاجمالية" : "Grand Total"}</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-zinc-900">
                                    {unsettledCODs.map((ord) => (
                                      <tr key={ord.id} className="hover:bg-zinc-900/40 transition">
                                        <td className="p-3.5 font-mono text-zinc-400">
                                          #{ord.id.substring(0, 7)}
                                        </td>
                                        <td className="p-3.5 font-bold">
                                          <div>{ord.customerName}</div>
                                          <div className="text-[10px] text-zinc-500 font-medium font-mono">{ord.customerCity}</div>
                                        </td>
                                        <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                                          {new Date(ord.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                                        </td>
                                        <td className="p-3.5">
                                          <span className="text-[10px] px-2 py-0.5 rounded-lg bg-orange-400/10 text-orange-400 font-bold">
                                            {isArabic ? "الدفع عند الاستلام (COD)" : "COD"}
                                          </span>
                                        </td>
                                        <td className="p-3.5 text-left font-black text-amber-400 font-mono">
                                          {(ord.agreedPrice || ord.total || 0).toLocaleString()} ج.م
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Previously closed periods */}
                        <div className="pt-4 border-t border-zinc-800 space-y-3">
                          <h5 className="font-extrabold text-sm text-zinc-400 text-right">
                            {isArabic ? "سجل دورات وتوريدات شركات الشحن المغلقة السابقة" : "History of Settled Shipping Cycles"}
                          </h5>

                          {settlements.length === 0 ? (
                            <div className="text-zinc-600 p-4 border border-dashed border-zinc-800 rounded-2xl text-center text-xs">
                              {isArabic ? "لا توجد أي تسويات مغلقة سابقة في الأرشيف المالي." : "No archived settlement cycles found."}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {settlements.map((settle) => (
                                <div key={settle.id} className="bg-zinc-950 border border-zinc-855 p-4 rounded-2xl space-y-3 relative text-right">
                                  <div className="flex justify-between items-start">
                                    <div className="text-right">
                                      <h6 className="font-black text-white text-xs">
                                        {settle.notes}
                                      </h6>
                                      <span className="text-[9px] text-zinc-500 font-mono">
                                        ID: {settle.id.substring(0, 10)}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-zinc-400 font-bold bg-zinc-900 px-2 py-0.5 rounded-lg font-mono border border-zinc-805">
                                      {new Date(settle.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-805/40 text-zinc-400">
                                    <div className="text-right">
                                      <span className="text-zinc-500 block">{isArabic ? "تاريخ البداية:" : "Start Date:"}</span>
                                      <span className="font-bold text-white font-mono">{new Date(settle.startDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-zinc-500 block">{isArabic ? "تاريخ النهاية:" : "End Date:"}</span>
                                      <span className="font-bold text-white font-mono">{new Date(settle.endDate).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US')}</span>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-xs pt-1">
                                    <span className="text-zinc-500 font-bold">{settle.orderIds.length} {isArabic ? "طلب مالي" : "orders"}</span>
                                    <span className="font-extrabold text-emerald-400 font-mono">
                                      {settle.totalAmount.toLocaleString()} ج.م
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    );
                  })()}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
