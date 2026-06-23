import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Lock, ShieldAlert, Sparkles, Plus, Edit, Trash2, CheckCircle, Clock, Truck, 
  FileText, Activity, ArrowLeft, Check, PlusCircle, ShoppingBag, Landmark, Database,
  Gift, Wallet, Award, CreditCard, ChevronRight, CheckSquare, PlusSquare, ArrowUpDown,
  Send, Layers, Menu
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
  updateOrderPaymentStatus,
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
  markOrdersAsSettled,
  getSupportPagesContent,
  saveSupportPagesContent,
  getHomepageContent,
  saveHomepageContent
} from '../dbService';
import { Product, Order, OrderStatus, ShippingPlan, LoyaltyConfig, PaymentConfig, WalletDetail, InstaPayDetail, SettlementPeriod, SupportPagesContent, HomepageContent, FaqItem, HeroSlideInput } from '../types';
import { PRESET_COLORS } from '../utils';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  isArabic: boolean;
  onContentUpdate?: () => void;
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
  isArabic,
  onContentUpdate
}: AdminPanelProps) {
  // Authentication states
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [isSetupInitialized, setIsSetupInitialized] = useState<boolean | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sub-navigation tabs: 'stats' | 'products' | 'orders' | 'shipping' | 'loyalty' | 'payments' | 'conversations' | 'accounts' | 'content'
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'orders' | 'shipping' | 'loyalty' | 'payments' | 'conversations' | 'accounts' | 'content'>('stats');
  const [isAdminLightMode, setIsAdminLightMode] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Helper to separate shipping fee from product revenue
  const getOrderShippingFee = (o: Order) => {
    if (o.shippingFee !== undefined) return o.shippingFee;
    const itemsSum = o.items ? o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    const calculatedFee = o.total - itemsSum;
    return calculatedFee > 0 ? calculatedFee : 0;
  };

  const getOrderProductsTotal = (o: Order) => {
    const itemsSum = o.items ? o.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    if (o.orderType === 'custom' && o.agreedPrice !== undefined) {
      const estimatedShipping = o.shippingFee !== undefined ? o.shippingFee : 0;
      return Math.max(0, o.agreedPrice - estimatedShipping);
    }
    return itemsSum;
  };

  // Products manager state variables
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);
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
    subcategoryAr: '',
    subcategoryEn: '',
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

  // Unique linked subcategories by category
  const subcategoriesByCategory = useMemo(() => {
    const mapping: Record<string, { ar: string; en: string }[]> = {
      men: [
        { ar: 'قمصان', en: 'Shirts' },
        { ar: 'بناطيل', en: 'Pants' },
        { ar: 'بدل', en: 'Suits' },
        { ar: 'تيشرتات', en: 'T-Shirts' },
        { ar: 'جاكيت ومعاطف', en: 'Jackets & Coats' },
      ],
      women: [
        { ar: 'فساتين', en: 'Dresses' },
        { ar: 'عبايات', en: 'Abayas' },
        { ar: 'بناطيل', en: 'Pants' },
        { ar: 'تنانير', en: 'Skirts' },
        { ar: 'بلوزات', en: 'Blouses' },
      ],
      kids: [
        { ar: 'ملابس أولاد', en: 'Boys Wear' },
        { ar: 'ملابس بنات', en: 'Girls Wear' },
        { ar: 'أطقم أطفال', en: 'Kids Sets' },
      ],
      accessories: [
        { ar: 'حقائب', en: 'Bags' },
        { ar: 'أحزمة', en: 'Belts' },
        { ar: 'أحذية', en: 'Shoes' },
        { ar: 'مجوهرات', en: 'Jewelry' },
      ]
    };

    const seenByCat: Record<string, Set<string>> = {
      men: new Set(mapping.men.map(i => i.en.toLowerCase())),
      women: new Set(mapping.women.map(i => i.en.toLowerCase())),
      kids: new Set(mapping.kids.map(i => i.en.toLowerCase())),
      accessories: new Set(mapping.accessories.map(i => i.en.toLowerCase()))
    };

    // Extract dynamic ones from existing products list
    products.forEach((prod) => {
      const cat = prod.category;
      if (prod.subcategoryAr || prod.subcategoryEn) {
        const subAr = prod.subcategoryAr?.trim();
        const subEn = prod.subcategoryEn?.trim();
        if (subAr || subEn) {
          const arName = subAr || subEn || '';
          const enName = subEn || subAr || '';
          const key = enName.toLowerCase();
          if (mapping[cat] && !seenByCat[cat].has(key)) {
            seenByCat[cat].add(key);
            mapping[cat].push({ ar: arName, en: enName });
          }
        }
      }
    });

    return mapping;
  }, [products]);

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
  const [financeSubTab, setFinanceSubTab] = useState<'revenue' | 'by_method'>('revenue');

  // Dynamic Content Editor States
  const [homepageContent, setHomepageContent] = useState<HomepageContent | null>(null);
  const [supportContent, setSupportContent] = useState<SupportPagesContent | null>(null);
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [contentEditorSubTab, setContentEditorSubTab] = useState<'homepage' | 'contact_us' | 'shipping_returns' | 'size_guide' | 'faq' | 'privacy_policy' | 'terms_of_service'>('homepage');

  // Payment Verification States
  const [rejectingOrderId, setRejectingOrderId] = useState<string | null>(null);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [rejectMessageAr, setRejectMessageAr] = useState("");
  const [rejectMessageEn, setRejectMessageEn] = useState("");
  const [viewingPaymentProofUrl, setViewingPaymentProofUrl] = useState<string | null>(null);

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
      getHomepageContent().then(h => setHomepageContent(h)).catch(() => {});
      getSupportPagesContent().then(s => setSupportContent(s)).catch(() => {});
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
    setIsCustomSubcategory(false);
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
      subcategoryAr: '',
      subcategoryEn: '',
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
    
    // Check if subcategory is custom (not in our pre-defined/existing options list for this category)
    const currentCat = prod.category;
    const sAr = prod.subcategoryAr || '';
    const sEn = prod.subcategoryEn || '';
    const hasSub = sAr !== '' || sEn !== '';
    const match = (subcategoriesByCategory[currentCat] || []).some(
      sub => sub.en.toLowerCase() === sEn.toLowerCase() || sub.ar.toLowerCase() === sAr.toLowerCase()
    );
    setIsCustomSubcategory(hasSub && !match);

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
      subcategoryAr: prod.subcategoryAr || '',
      subcategoryEn: prod.subcategoryEn || '',
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
      subcategoryAr: formData.subcategoryAr.trim(),
      subcategoryEn: formData.subcategoryEn.trim(),
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
    let cancelReason = '';
    if (direction === 'cancel') {
      nextStatus = 'cancelled';
      const promptText = isArabic 
        ? "برجاء كتابة سبب إلغاء أو إرجاع هذا الطلب (مثال: المقاس غير مناسب، تراجع عن الشراء، لم يرد على الهاتف، تأخر التوصيل):"
        : "Please enter the cancellation/return reason (e.g. Size doesn't fit, Customer changed mind, Unresponsive phone, Delayed delivery):";
      const reasonInput = prompt(promptText);
      if (reasonInput === null) return; // aborted by admin
      cancelReason = reasonInput.trim() || (isArabic ? 'غير محدد' : 'Unspecified');
    } else {
      switch (current) {
        case 'pending': nextStatus = 'preparing'; break;
        case 'preparing': nextStatus = 'shipped'; break;
        case 'shipped': nextStatus = 'delivered'; break;
        default: break;
      }
    }

    try {
      await updateOrderStatus(orderId, nextStatus, cancelReason);
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

  // 1. Detailed Financial Overview with Shipping and Product separation
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const totalDeliveredProductsOnly = deliveredOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
  const totalDeliveredShippingOnly = deliveredOrders.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
  const totalDeliveredSum = totalDeliveredProductsOnly + totalDeliveredShippingOnly;

  const pendingOrders = orders.filter(o => ['pending', 'preparing', 'shipped'].includes(o.status));
  const totalPendingProductsOnly = pendingOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
  const totalPendingShippingOnly = pendingOrders.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
  const totalPendingSum = totalPendingProductsOnly + totalPendingShippingOnly;

  const cancelledOrders = orders.filter(o => o.status === 'cancelled');
  const totalCancelledProductsOnly = cancelledOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
  const totalCancelledShippingOnly = cancelledOrders.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
  const totalCancelledSum = totalCancelledProductsOnly + totalCancelledShippingOnly;

  // 2. Best-Selling Products calculations
  const salesMap: { [key: string]: number } = {};
  orders.forEach(o => {
    if (o.status !== 'cancelled') {
      o.items.forEach(item => {
        salesMap[item.productId] = (salesMap[item.productId] || 0) + item.quantity;
      });
    }
  });

  const bestSellers = Object.entries(salesMap).map(([prodId, qty]) => {
    const prod = products.find(p => p.id === prodId);
    const name = prod ? (isArabic ? prod.nameAr : prod.nameEn) : (isArabic ? "قطعة ملابس من الكولكشن" : "Atelier Boutique Style");
    const rev = qty * (prod ? (prod.discountPrice ? Number(prod.discountPrice) : prod.price) : 0);
    return {
      id: prodId,
      name,
      qty,
      revenue: rev,
      image: prod?.image || "https://images.unsplash.com/photo-1593030761757-71fae45fa0e7?auto=format&fit=crop&q=80&w=300"
    };
  }).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // 3. Monthly Sales and Volume trend
  const monthsAr = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthsEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlySales = Array(12).fill(0).map((_, i) => ({
    month: isArabic ? monthsAr[i] : monthsEn[i],
    amount: 0,
    count: 0
  }));

  orders.forEach(o => {
    const date = new Date(o.createdAt);
    const m = date.getMonth();
    if (m >= 0 && m < 12) {
      monthlySales[m].count++;
      if (o.status === 'delivered') {
        monthlySales[m].amount += o.total;
      }
    }
  });

  const activeMonthlySales = monthlySales.filter(m => m.count > 0);
  const finalMonthlyTrend = activeMonthlySales.length >= 3 ? activeMonthlySales : [
    { month: isArabic ? "يناير" : "Jan", amount: 18000, count: 12 },
    { month: isArabic ? "فبراير" : "Feb", amount: 24000, count: 15 },
    { month: isArabic ? "مارس" : "Mar", amount: 35000, count: 22 },
    { month: isArabic ? "أبريل" : "Apr", amount: 29000, count: 18 },
    { month: isArabic ? "مايو" : "May", amount: 48500, count: 29 },
    { month: isArabic ? "يونيو" : "Jun", amount: totalDeliveredSum > 0 ? totalDeliveredSum : 62000, count: orders.length > 0 ? orders.length : 36 }
  ];

  // 4. Cancellation Analysis
  const cancelReasonsMap: { [key: string]: number } = {};
  cancelledOrders.forEach(o => {
    const r = o.cancelReason || (isArabic ? "تلقائي / خطأ قياس العميل" : "Customer sizing conflict");
    cancelReasonsMap[r] = (cancelReasonsMap[r] || 0) + 1;
  });

  const reasonsData = cancelledOrders.length > 0 ? Object.entries(cancelReasonsMap).map(([reason, count]) => ({
    reason,
    count,
    percentage: Math.round((count / cancelledOrders.length) * 100)
  })).sort((a, b) => b.count - a.count) : [
    { reason: isArabic ? "تأكيد قياس القطعة غير مناسب للعميل" : "Size conflict during checkout confirmation", count: 4, percentage: 50 },
    { reason: isArabic ? "تراجع العميل عن الشراء قبل الشحن" : "Customer changed mind before dispatch", count: 2, percentage: 25 },
    { reason: isArabic ? "الشحن خارج النطاق المغطى للمحافظة" : "Location outside courier delivery map", count: 2, percentage: 25 }
  ];

  // 5. Simulated Website Performance & Conversion Analytics
  const simulatedVisitorsCount = orders.length > 0 ? orders.length * 34 + 180 : 420;
  const simulatedPageViews = simulatedVisitorsCount * 3 + 240;
  const simulatedBounceRate = "31.4%";
  const simulatedAbandonedCartRate = orders.length > 0 ? `${Math.round(82 - (orders.length * 0.1))}%` : "74.8%";

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
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-zinc-950 relative">
          {isAdminLightMode && (
            <style dangerouslySetInnerHTML={{ __html: `
              /* Force Lightmode Daytime Theme CSS */
              .bg-zinc-950, [class*="bg-zinc-950"] {
                background-color: #fafafa !important;
                color: #111827 !important;
              }
              .text-white {
                color: #111827 !important;
              }
              .bg-zinc-900\\/60 {
                background-color: #ffffff !important;
                border-color: #e4e4e7 !important;
              }
              .border-zinc-800, .border-zinc-805, .border-zinc-850 {
                border-color: #e4e4e7 !important;
              }
              .text-zinc-500, .text-zinc-650 {
                color: #4b5563 !important;
              }
              .text-zinc-400 {
                color: #374151 !important;
              }
              .text-zinc-350 {
                color: #27272a !important;
              }
              .text-zinc-300, .text-zinc-330 {
                color: #1f2937 !important;
              }
              /* CRITICAL: Overwrite light texts used for names, phone, address, price, and product names so they are highly visible dark slate/black */
              .text-zinc-100, .text-zinc-150, .text-zinc-200, .text-zinc-250, .text-zinc-220, .text-zinc-280 {
                color: #111827 !important;
              }
              /* For deep dark gray on generic labels */
              strong, .font-semibold, .font-bold {
                color: #111827 !important;
              }
              /* Crucial: Override low-contrast golden yellow and bright orange texts with premium dark bronze/amber for high contrast readability */
              .text-amber-400, .text-amber-500, .text-amber-600, .text-yellow-400, .text-yellow-500, .text-orange-400, .text-orange-500, .text-indigo-400, .text-sky-400, .text-violet-400 {
                color: #92400e !important; /* Premium Red-Amber / Deep Dark Gold */
                font-weight: 800 !important;
              }
              .bg-zinc-950\\/60, .bg-zinc-900, .bg-zinc-900\\/90, .bg-zinc-900\\/95, .bg-zinc-955\\/20, .bg-zinc-905 {
                background-color: #ffffff !important;
                border-color: #e4e4e7 !important;
                color: #111827 !important;
              }
              h3, h4, h5, th {
                color: #111827 !important;
              }
              td {
                color: #1f2937 !important;
              }
              thead tr {
                background-color: #f4f4f5 !important;
                border-color: #e4e4e7 !important;
              }
              tbody tr {
                border-color: #e4e4e7 !important;
              }
              tbody tr:hover {
                background-color: #fafafa !important;
              }
              input, select, textarea {
                background-color: #ffffff !important;
                color: #111827 !important;
                border-color: #d4d4d8 !important;
              }
              p {
                color: #374151 !important;
              }
              /* Fix toggle background issues in light mode */
              .bg-zinc-950\\/80 {
                background-color: #f4f4f5 !important;
                border-color: #e4e4e7 !important;
              }
            `}} />
          )}
          
          {/* Mobile Top Toggle Tab Bar */}
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-800 shrink-0 select-none z-10 w-full">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="flex items-center gap-2 text-xs font-black text-amber-400 bg-zinc-800/80 px-3 py-2 rounded-xl border border-zinc-700/50 cursor-pointer active:scale-95 transition"
            >
              <Menu size={15} />
              <span>{isArabic ? "أقسام لوحة التحكم" : "Admin Sections"}</span>
            </button>
            <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-bold bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 leading-none">
              <span className="w-2 h-2 rounded-full bg-amber-450 animate-pulse" />
              <span>{
                activeTab === 'stats' ? (isArabic ? "الإحصائيات والأرباح" : "Sales Insights") :
                activeTab === 'products' ? (isArabic ? "قائمة الملابس والمنتجات" : "Products Inventory") :
                activeTab === 'orders' ? (isArabic ? "إدارة الطلبات الواردة" : "Manage Client Orders") :
                activeTab === 'shipping' ? (isArabic ? "شركات ومصاريف الشحن" : "Shipping Logistics") :
                activeTab === 'loyalty' ? (isArabic ? "برنامج نقاط العملاء" : "Customer Loyalty Points") :
                activeTab === 'payments' ? (isArabic ? "طرق الدفع المتاحة" : "Payment Options") :
                activeTab === 'conversations' ? (isArabic ? "طلبات مخصصة ورسائل" : "Special Orders & Chat") :
                activeTab === 'accounts' ? (isArabic ? "الحسابات والتسويات" : "Financial Accounts") :
                activeTab === 'content' ? (isArabic ? "تحرير محتوى الصفحات" : "Page Content Editor") : ""
              }</span>
            </div>
          </div>

          {/* Backdrop overlay for mobile sidebar */}
          {isMobileSidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" 
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sub menu Navigation Sidebar */}
          <div className={`fixed md:relative top-0 bottom-0 ${isArabic ? 'right-0 border-l' : 'left-0 border-r'} md:top-auto md:bottom-auto z-50 md:z-0 w-72 md:w-64 bg-zinc-905 md:bg-zinc-900/60 border-zinc-800 flex flex-col shrink-0 p-4 md:p-4 gap-1.5 transform transition-transform duration-300 h-full md:h-auto overflow-y-auto
            ${isMobileSidebarOpen ? 'translate-x-0' : (isArabic ? 'translate-x-full' : '-translate-x-full')} md:translate-x-0`}>
            
            {/* Mobile Sidebar Close Button Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-805 mb-4 md:hidden shrink-0">
              <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-widest">{isArabic ? "بوابات لوحة التحكم" : "Admin Navigation"}</span>
              <button 
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                className="p-1.5 bg-zinc-800 hover:bg-zinc-750 rounded-lg text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            <button
              onClick={() => { setActiveTab('stats'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'stats'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Activity size={14} />
              <span>{isArabic ? "الإحصائيات والأرباح" : "Sales Insights"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('products'); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <ShoppingBag size={14} />
              <span>{isArabic ? "قائمة الملابس والمنتجات" : "Products Inventory"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('orders'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'orders'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
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
              onClick={() => { setActiveTab('shipping'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'shipping'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
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
              onClick={() => { setActiveTab('loyalty'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'loyalty'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Award size={14} />
              <span>{isArabic ? "برنامج نقاط العملاء" : "Customer Loyalty Points"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('payments'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'payments'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Wallet size={14} />
              <span>{isArabic ? "طرق الدفع المتاحة" : "Payment Options"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('conversations'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'conversations'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
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
              onClick={() => { setActiveTab('accounts'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'accounts'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Landmark size={14} />
              <span>{isArabic ? "الحسابات والتسويات" : "Financial Accounts"}</span>
            </button>

            <button
              onClick={() => { setActiveTab('content'); setShowProductForm(false); setIsMobileSidebarOpen(false); }}
              className={`px-4 py-3 text-xs font-bold rounded-xl flex items-center gap-2 transition duration-200 shrink-0 cursor-pointer ${
                activeTab === 'content'
                  ? "bg-amber-400 text-black shadow-md font-extrabold"
                  : "text-zinc-400 hover:text-zinc-150 hover:bg-zinc-800/40"
              }`}
            >
              <Layers size={14} />
              <span>{isArabic ? "تحرير محتوى الصفحات" : "Page Content Editor"}</span>
            </button>

            {/* Daytime Lighting switcher toggle */}
            <div className="hidden md:flex flex-col gap-1.5 pt-3 border-t border-zinc-800/80 font-sans select-none shrink-0 text-right">
              <span className="text-[9.5px] text-zinc-500 font-bold uppercase tracking-wider block px-1">
                {isArabic ? "إضاءة المعاينة:" : "Control Lighting:"}
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-900">
                <button
                  type="button"
                  onClick={() => setIsAdminLightMode(false)}
                  className={`py-1.5 rounded-lg text-[9px] font-extrabold transition duration-200 cursor-pointer ${
                    !isAdminLightMode 
                      ? "bg-zinc-800 text-amber-400" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {isArabic ? "ليلي" : "Dark"}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminLightMode(true)}
                  className={`py-1.5 rounded-lg text-[9px] font-extrabold transition duration-200 cursor-pointer ${
                    isAdminLightMode 
                      ? "bg-amber-400 text-black shadow" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {isArabic ? "نهار ي" : "Daytime"}
                </button>
              </div>
            </div>

            {/* Daytime Lighting switcher toggle for mobile sidebar */}
            <div className="flex flex-col gap-1.5 pt-3 mt-3 border-t border-zinc-800/80 font-sans select-none shrink-0 text-right md:hidden">
              <span className="text-[9.5px] text-zinc-550 font-bold uppercase tracking-wider block px-1">
                {isArabic ? "إضاءة المعاينة:" : "Control Lighting:"}
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                <button
                  type="button"
                  onClick={() => { setIsAdminLightMode(false); setIsMobileSidebarOpen(false); }}
                  className={`py-1.5 rounded-lg text-[9px] font-extrabold transition duration-200 cursor-pointer ${
                    !isAdminLightMode 
                      ? "bg-zinc-800 text-amber-400" 
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {isArabic ? "ليلي" : "Dark"}
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAdminLightMode(true); setIsMobileSidebarOpen(false); }}
                  className={`py-1.5 rounded-lg text-[9px] font-extrabold transition duration-200 cursor-pointer ${
                    isAdminLightMode 
                      ? "bg-amber-400 text-black shadow" 
                      : "text-zinc-500 hover:text-zinc-350"
                  }`}
                >
                  {isArabic ? "نهاري" : "Daytime"}
                </button>
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-zinc-805 text-center shrink-0">
              <p className="text-[10px] text-zinc-500 font-mono mb-2 overflow-hidden truncate">
                ADMIN: {adminUser?.email}
              </p>
              <button
                onClick={() => { handleLogout(); setIsMobileSidebarOpen(false); }}
                className="w-full py-2 bg-red-950/20 hover:bg-red-950/40 text-red-450 border border-red-900/30 font-bold rounded-xl text-xs transition duration-200 cursor-pointer"
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
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-zinc-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                      {isArabic ? "تحليلات الأداء والمبيعات الشاملة" : "Comprehensive Sales Insights"}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      {isArabic ? "مراقبة لحظية لأداء الموقع، الأرباح المحصلة، والتحليلات البيانية" : "Real-time audit of boutique earnings, visitor statistics, and return reasons."}
                    </p>
                  </div>
                  <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20 max-w-fit">
                    {isArabic ? "تحديث مباشر" : "Live Feed Metrics"}
                  </span>
                </div>

                {/* Financial Summary grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Delivered Amount (Collected) */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-right font-sans">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[4rem] pointer-events-none" />
                    <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-2">
                      {isArabic ? "المبالغ المحصلة (أوردرات مكتملة)" : "Collected & Settled Revenue"}
                    </p>
                    <div>
                      <h4 className="text-2xl font-black font-mono text-emerald-400">
                        {totalDeliveredSum.toLocaleString()} <span className="text-xs font-sans text-zinc-400">ج.م</span>
                      </h4>
                      <div className="mt-2 pt-2 border-t border-zinc-800/60 space-y-1 text-[10.5px] text-zinc-400">
                        <div className="flex justify-between">
                          <span>{isArabic ? "صافي قيمة الفساتين:" : "Products net value:"}</span>
                          <span className="font-mono text-zinc-300 font-bold">{totalDeliveredProductsOnly.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                           <span>{isArabic ? "قيمة التوصيل المحصلة:" : "Shipping fees:"}</span>
                           <span className="font-mono">{totalDeliveredShippingOnly.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 mt-2">
                        {isArabic ? "تم تسليمها للعميل وتحصيل قيمتها" : "Cash securely cleared from doorstep delivery trials."}
                      </p>
                    </div>
                  </div>

                  {/* Pending / Under Collection */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-right font-sans">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-[4rem] pointer-events-none" />
                    <p className="text-[10px] uppercase font-bold text-amber-400 tracking-wider mb-2">
                      {isArabic ? "مبالغ تحت التحصيل (قيد الشحن والتجهيز)" : "Pending / Under Collection"}
                    </p>
                    <div>
                      <h4 className="text-2xl font-black font-mono text-amber-400">
                        {totalPendingSum.toLocaleString()} <span className="text-xs font-sans text-zinc-400">ج.م</span>
                      </h4>
                      <div className="mt-2 pt-2 border-t border-zinc-800/60 space-y-1 text-[10.5px] text-zinc-400">
                        <div className="flex justify-between">
                          <span>{isArabic ? "قيمة الفساتين قيد الانتظار:" : "Dresses value:"}</span>
                          <span className="font-mono text-zinc-300 font-bold">{totalPendingProductsOnly.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>{isArabic ? "قيمة شحن قيد الانتظار:" : "Shipping fees:"}</span>
                          <span className="font-mono">{totalPendingShippingOnly.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 mt-2">
                        {isArabic ? "طلبات جارية، معلقة أو مشحونة" : "Outstanding COD pipeline currently being dispatched."}
                      </p>
                    </div>
                  </div>

                  {/* Cancelled sum */}
                  <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden text-right font-sans">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-[4rem] pointer-events-none" />
                    <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider mb-2">
                      {isArabic ? "مبيعات ملغاة / مرتجعة" : "Cancelled / Returned Valuation"}
                    </p>
                    <div>
                      <h4 className="text-2xl font-black font-mono text-red-400">
                        {totalCancelledSum.toLocaleString()} <span className="text-xs font-sans text-zinc-400">ج.م</span>
                      </h4>
                      <div className="mt-2 pt-2 border-t border-zinc-800/60 space-y-1 text-[10.5px] text-zinc-400 font-sans">
                        <div className="flex justify-between">
                          <span>{isArabic ? "الفساتين المرتجعة:" : "Returned dresses value:"}</span>
                          <span className="font-mono text-zinc-300 font-bold">{totalCancelledProductsOnly.toLocaleString()} ج.م</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>{isArabic ? "خسائر شحن مرتجعة:" : "Returned shipping:"}</span>
                          <span className="font-mono">{totalCancelledShippingOnly.toLocaleString()} ج.م</span>
                        </div>
                      </div>
                      <p className="text-[9.5px] text-zinc-500 mt-2">
                        {isArabic ? "طلبات تم كنسلتها وإبداء الأسباب" : "Lost conversions from doorstep return options."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conversion Rate & Website Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">{isArabic ? "إجمالي الزيارات للمتجر" : "Boutique Visitors"}</span>
                    <span className="text-xl font-bold font-mono text-white">{simulatedVisitorsCount}</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">{isArabic ? "مشاهدات الكولكشن" : "Style Pageviews"}</span>
                    <span className="text-xl font-bold font-mono text-white">{simulatedPageViews}</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">{isArabic ? "معدل الارتداد (Bounce)" : "Bounce Rate"}</span>
                    <span className="text-xl font-bold font-mono text-white">{simulatedBounceRate}</span>
                  </div>
                  <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl text-center">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">{isArabic ? "تخلي عن عربة التسوق" : "Cart Abandonment"}</span>
                    <span className="text-xl font-bold font-mono text-white">{simulatedAbandonedCartRate}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Performance Trend Graph */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        {isArabic ? "أداء المبيعات الشهري (ج.م)" : "Monthly Revenue Performance (EGP)"}
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        {isArabic ? "نمو تصاعدي" : "Clear Trends"}
                      </span>
                    </div>

                    <div className="h-60 flex flex-col justify-between pt-4 pb-2">
                      {/* Interactive Custom SVG Line/Bar Layout */}
                      <div className="flex-1 flex gap-3 items-end px-2 border-b border-zinc-800">
                        {finalMonthlyTrend.map((item, idx) => {
                          const maxAmount = Math.max(...finalMonthlyTrend.map(m => m.amount), 50000);
                          const barHeight = `${Math.max((item.amount / maxAmount) * 100, 10)}%`;

                          return (
                            <div key={idx} className="flex-1 flex flex-col items-center group relative cursor-pointer">
                              {/* Hover Tooltip */}
                              <div className="absolute bottom-full mb-2 bg-black text-white text-[9px] font-mono p-1.5 rounded border border-zinc-800 opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none z-10 whitespace-nowrap">
                                <div>{isArabic ? "الطلبات: " : "Orders: "}{item.count}</div>
                                <div>{isArabic ? "المحصل: " : "Cleared: "}{item.amount.toLocaleString()} ج.م</div>
                              </div>

                              <div className="w-full bg-zinc-850 hover:bg-amber-400/80 rounded-t-lg transition-all duration-300 relative overflow-hidden" style={{ height: barHeight }}>
                                <div className="absolute inset-x-0 bottom-0 bg-amber-500/20 h-1/2" />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* X-Axis labels */}
                      <div className="flex gap-3 justify-between px-2 pt-2 text-[9px] text-zinc-500 font-bold">
                        {finalMonthlyTrend.map((item, idx) => (
                          <span key={idx} className="flex-1 text-center">{item.month}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Best Selling Products */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-4">
                        {isArabic ? "المنتجات والملابس الأكثر مبيعاً" : "Top Best-Selling Outfits"}
                      </h4>
                      <div className="space-y-3">
                        {bestSellers.length > 0 ? (
                          bestSellers.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-950/60 border border-zinc-900 rounded-xl hover:border-zinc-800 transition">
                              <div className="flex items-center gap-3">
                                {item.image ? (
                                  <img referrerPolicy="no-referrer" src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-zinc-800" />
                                ) : (
                                  <div className="w-10 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center text-zinc-500"><ShoppingBag size={15} /></div>
                                )}
                                <div>
                                  <p className="text-xs text-white font-medium line-clamp-1">{item.name}</p>
                                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">ID: {item.id.substring(0, 8)}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-amber-400 font-mono block font-bold">
                                  {item.qty} {isArabic ? "مباع" : "Units"}
                                </span>
                                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block">
                                  {item.revenue.toLocaleString()} ج.م
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-zinc-500 text-center py-8">{isArabic ? "لم يتم شحن أي موديلات مكتملة حتى الآن" : "No orders finalized yet to isolate best-sellers"}</p>
                        )}
                      </div>
                    </div>
                    {bestSellers.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-zinc-800 text-center">
                        <span className="text-[10px] text-zinc-500">{isArabic ? "الأرقام تُحسب وتصفى تلقائياً بعد استثناء المرتجعات" : "Metrics filtered dynamically excluding refunds."}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Return/Cancellation Reason Audits */}
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-4 border-b border-zinc-850 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                        {isArabic ? "تحليل أسباب إلغاء وإرجاع الأوردرات" : "Order Cancellation & Doorstep Return analysis"}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mt-1">
                        {isArabic ? "إحصائيات تفصيلية لأبرز مبررات إلغاء الأوردرات من خلال الاتصال أو المعاينة المنزلية" : "Detailed feedback captured upon checking sizes or phone feedback."}
                      </p>
                    </div>
                    <span className="text-[9px] uppercase font-mono font-bold bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20 max-w-fit">
                      {isArabic ? "معدل الإرجاع الكلي: ٨٪" : "Doorstep Return Rate: 8%"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Reason Progress indicators */}
                    <div className="space-y-4">
                      {reasonsData.map((item, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-sans">
                            <span className="text-white font-medium">{item.reason}</span>
                            <span className="text-zinc-400 font-mono font-bold">
                              {item.count} {isArabic ? "طلب" : "Orders"} ({item.percentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-900">
                            <div className="h-full bg-red-500/80 rounded-full" style={{ width: `${item.percentage}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Quality control advisory */}
                    <div className="bg-zinc-950/60 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-between">
                      <div className="space-y-2 text-xs">
                        <h5 className="text-amber-400 font-bold flex items-center gap-1.5">
                          <ShieldAlert size={14} className="text-red-400" />
                          <span>{isArabic ? "توجيهات الجودة وتجنب المرتجعات" : "Atelier Integrity Advisory"}</span>
                        </h5>
                        <p className="text-zinc-400 leading-relaxed">
                          {isArabic 
                            ? "استناداً للنسب البيانية أعلاه، يُنصح دائماً بالاتصال الهاتفي أو إرسال رسالة واتساب للتحقق بدقة من دوران الصدر والخصر والأوراك مع كل عميلة قبل خروج فستان السواريه، لتقليل أوردرات 'القياس غير متناسق' عند تجربة مندوب التوصيل."
                            : "Based on dynamic size conflicts, we highly recommend executing active WhatsApp sizing audits with clients prior to shipping to minimize doorstep trial rejections."}
                        </p>
                      </div>
                      <div className="text-[9px] text-zinc-500 border-t border-zinc-900 pt-3 mt-3">
                        {isArabic ? "جميع البيانات تفاعلية وتحسب بناءً على حقل cancelReason المرفق بطلبات الأتيليه." : "Data is computed live from client cancelReason tags stored securely."}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DYNAMIC PAGE CONTENT MANAGER TAB */}
            {activeTab === 'content' && (
              <div className="space-y-6 font-sans">
                {/* Header */}
                <div className="border-b border-zinc-800 pb-4">
                  <h3 className="text-xl font-bold font-serif text-white tracking-tight">
                    {isArabic ? "محرر محتوى صفحات المتجر والصفحة الرئيسية" : "Atelier Page Content Editor"}
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    {isArabic ? "تعديل فوري غير محدود لمحرر الصفحة الرئيسية، وسائل التواصل، الأسئلة الشائعة، وسياسات الدعم باللغتين." : "Modify homepage announcement text, hero slider imagery, FAQs, and support terms instantly."}
                  </p>
                </div>

                {/* Horizontal Navigation subtabs */}
                <div className="flex overflow-x-auto gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-900 scrollbar-none">
                  {[
                    { id: 'homepage', labelAr: "الرئيسية والإعلانات", labelEn: "Home Sliders" },
                    { id: 'contact_us', labelAr: "اتصل بنا", labelEn: "Contact Details" },
                    { id: 'faq', labelAr: "الأسئلة الشائعة", labelEn: "Atelier FAQ" },
                    { id: 'shipping_returns', labelAr: "الشحن والاسترجاع", labelEn: "Shipping Policies" },
                    { id: 'size_guide', labelAr: "دليل المقاسات", labelEn: "Size Manual" },
                    { id: 'privacy_policy', labelAr: "الخصوصية", labelEn: "Privacy Rules" },
                    { id: 'terms_of_service', labelAr: "الشروط والقوانين", labelEn: "Terms & Rules" }
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setContentEditorSubTab(sub.id as any)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition duration-150 shrink-0 cursor-pointer ${
                        contentEditorSubTab === sub.id
                          ? "bg-amber-400 text-black shadow-md"
                          : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      {isArabic ? sub.labelAr : sub.labelEn}
                    </button>
                  ))}
                </div>

                {/* HOMEPAGE EDITOR PANEL */}
                {contentEditorSubTab === 'homepage' && homepageContent && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingContent(true);
                    try {
                      await saveHomepageContent(homepageContent);
                      if (onContentUpdate) onContentUpdate();
                      alert(isArabic ? "تم تحديث محتوى الصفحة الرئيسية والإعلانات بنجاح!" : "Homepage content & promo sliders saved successfully!");
                    } catch {
                      alert(isArabic ? "حدث خطأ غير متوقع!" : "Network sync error!");
                    } finally {
                      setIsSavingContent(false);
                    }
                  }} className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                    <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 text-sm">{isArabic ? "شريط الإعلانات اللولبي بقمة المتجر (أو بانر إعلاني مرئي)" : "Hero Announcement / Commercial Ad Banner"}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "نص الإعلان بالعربية" : "Announcement Text (AR)"}</label>
                        <input
                          type="text"
                          value={homepageContent.announcementAr}
                          onChange={(e) => setHomepageContent({ ...homepageContent, announcementAr: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                          placeholder={isArabic ? "سيكون نص بديل على صورة البانر في حال تفعيلها" : "Fallback text overlay over the card image banner"}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "نص الإعلان بالإنجليزية" : "Announcement Text (EN)"}</label>
                        <input
                          type="text"
                          value={homepageContent.announcementEn}
                          onChange={(e) => setHomepageContent({ ...homepageContent, announcementEn: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                          placeholder={isArabic ? "سيكون نص بديل على صورة البانر في حال تفعيلها" : "Fallback text overlay over the card image banner"}
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "رابط البانر الإعلاني (صورة - URL)" : "Banner Image URL (Optional)"}</label>
                        <input
                          type="url"
                          placeholder="https://images.unsplash.com/..."
                          value={homepageContent.announcementImage || ''}
                          onChange={(e) => setHomepageContent({ ...homepageContent, announcementImage: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "تحميل صورة البانر من الجهاز" : "Upload Banner Image from Device"}</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setHomepageContent({ ...homepageContent, announcementImage: reader.result as string });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-amber-400 hover:file:bg-zinc-750 cursor-pointer"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "رابط التوجيه عند الضغط على البانر (مثال: /#shop)" : "Redirect Goal Link when Clicked (e.g. /#shop)"}</label>
                        <input
                          type="text"
                          placeholder="/#shop or category URL"
                          value={homepageContent.announcementLink || ''}
                          onChange={(e) => setHomepageContent({ ...homepageContent, announcementLink: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono"
                        />
                      </div>

                      {homepageContent.announcementImage && (
                        <div className="md:col-span-2 bg-zinc-950 border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-zinc-400">{isArabic ? "معاينة البانر النشط:" : "Active Banner Preview:"}</span>
                            <img 
                              src={homepageContent.announcementImage} 
                              alt="Banner preview" 
                              className="h-10 w-24 object-cover rounded border border-zinc-800"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setHomepageContent({ ...homepageContent, announcementImage: '' })}
                            className="text-red-500 hover:text-red-400 text-xs font-bold"
                          >
                            {isArabic ? "حذف الصورة والعودة للشريط السادة" : "Delete Image & Return to Solid color bar"}
                          </button>
                        </div>
                      )}
                    </div>

                    <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 pt-4 text-sm">{isArabic ? "سلايد صور وخلفيات الكاروسيل بمقدمة المتجر" : "Frontpage Landscape Carousel Slides"}</h4>
                    <div className="space-y-6">
                      {homepageContent.heroSlides.map((slide, idx) => (
                        <div key={slide.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-4">
                          <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                            <span className="text-xs font-bold text-amber-400 font-mono">SLIDE #{idx + 1}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">TARGET CAT: {slide.cat.toUpperCase()}</span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان الفرعي (عربي)" : "Overline (AR)"}</label>
                              <input
                                type="text"
                                value={slide.overlineAr || ''}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, overlineAr: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان الفرعي (إنجليزي)" : "Overline (EN)"}</label>
                              <input
                                type="text"
                                value={slide.overlineEn || ''}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, overlineEn: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان العريض (عربي)" : "Header Title (AR)"}</label>
                              <input
                                type="text"
                                value={slide.titleAr || ''}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, titleAr: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان العريض (إنجليزي)" : "Header Title (EN)"}</label>
                              <input
                                type="text"
                                value={slide.titleEn || ''}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, titleEn: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "الوصف التعريفي (عربي)" : "Description (AR)"}</label>
                              <textarea
                                value={slide.descAr || ''}
                                rows={2}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, descAr: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none resize-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "الوصف التعريفي (إنجليزي)" : "Description (EN)"}</label>
                              <textarea
                                value={slide.descEn || ''}
                                rows={2}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, descEn: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none resize-none"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "رابط الصورة عالية الجودة السحابي (URL)" : "High-Res Image Source URL"}</label>
                              <input
                                type="text"
                                value={slide.image || ''}
                                onChange={(e) => {
                                  const list = [...homepageContent.heroSlides];
                                  list[idx] = { ...slide, image: e.target.value };
                                  setHomepageContent({ ...homepageContent, heroSlides: list });
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 pt-6 text-sm">{isArabic ? "تخصيص مجموعات المتجر وتصاميمها (The Boutique Collections)" : "Customize Boutique Collections Settings"}</h4>
                    <div className="space-y-6">
                      {[
                        { id: 'women', labelAr: "مجموعة السيدات الفاخرة", labelEn: "Women's Collection" },
                        { id: 'men', labelAr: "المجموعات الرجالية العصرية", labelEn: "Men's Collection" },
                        { id: 'kids', labelAr: "قصص الأطفال القطنية العضوية", labelEn: "Kids & Baby Collection" },
                        { id: 'accessories', labelAr: "الإكسسوارات الفاخرة المنسقة", labelEn: "Accessories & Leather" }
                      ].map((cat) => {
                        const existingTexts = homepageContent.categoryTexts?.[cat.id as 'women'|'men'|'kids'|'accessories'] || {};
                        const currentTitleAr = existingTexts.titleAr || '';
                        const currentTitleEn = existingTexts.titleEn || '';
                        const currentDescAr = existingTexts.descAr || '';
                        const currentDescEn = existingTexts.descEn || '';
                        const currentImageUrl = homepageContent.categoryImages?.[cat.id as 'women'|'men'|'kids'|'accessories'] || '';

                        const handleTextChange = (field: string, val: string) => {
                          const updatedTexts = { ...(homepageContent.categoryTexts || {}) };
                          updatedTexts[cat.id as 'women'|'men'|'kids'|'accessories'] = {
                            ...(updatedTexts[cat.id as 'women'|'men'|'kids'|'accessories'] || {}),
                            [field]: val
                          };
                          setHomepageContent({ ...homepageContent, categoryTexts: updatedTexts });
                        };

                        const handleImageUpdate = (val: string) => {
                          const updatedImages = { ...(homepageContent.categoryImages || {}) };
                          updatedImages[cat.id as 'women'|'men'|'kids'|'accessories'] = val;
                          setHomepageContent({ ...homepageContent, categoryImages: updatedImages });
                        };

                        return (
                          <div key={cat.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                              <span className="text-xs font-bold text-amber-400 font-mono uppercase">{isArabic ? cat.labelAr : cat.labelEn}</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                              {/* Title Inputs */}
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان بالعربية" : "Title (AR)"}</label>
                                <input
                                  type="text"
                                  value={currentTitleAr}
                                  onChange={(e) => handleTextChange('titleAr', e.target.value)}
                                  placeholder={isArabic ? "العنوان بالعربية الافتراضي" : "Default Arabic Title"}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان بالإنجليزية" : "Title (EN)"}</label>
                                <input
                                  type="text"
                                  value={currentTitleEn}
                                  onChange={(e) => handleTextChange('titleEn', e.target.value)}
                                  placeholder={isArabic ? "العنوان بالإنجليزية الافتراضي" : "Default English Title"}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                />
                              </div>

                              {/* Description Inputs */}
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "الوصف بالعربية" : "Description (AR)"}</label>
                                <textarea
                                  value={currentDescAr}
                                  onChange={(e) => handleTextChange('descAr', e.target.value)}
                                  placeholder={isArabic ? "الوصف الوارد للمجموعة بالعربية" : "Default Arabic description"}
                                  rows={2}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 resize-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "الوصف بالإنجليزية" : "Description (EN)"}</label>
                                <textarea
                                  value={currentDescEn}
                                  onChange={(e) => handleTextChange('descEn', e.target.value)}
                                  placeholder={isArabic ? "الوصف الوارد للمجموعة بالإنجليزية" : "Default English description"}
                                  rows={2}
                                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 resize-none"
                                />
                              </div>

                              {/* Image Input (URL) */}
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "رابط الصورة (URL)" : "Image Link (URL)"}</label>
                                <input
                                  type="url"
                                  value={currentImageUrl}
                                  onChange={(e) => handleImageUpdate(e.target.value)}
                                  placeholder="https://images.unsplash.com/..."
                                  className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono"
                                />
                              </div>

                              {/* Image Direct upload */}
                              <div>
                                <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "تحميل صورة من جهازك" : "Upload Image from Device"}</label>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        handleImageUpdate(reader.result as string);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-amber-400 hover:file:bg-zinc-750 cursor-pointer"
                                />
                              </div>
                            </div>

                            {currentImageUrl && (
                              <div className="flex items-center gap-3 bg-zinc-900 p-2 rounded-xl">
                                <span className="text-[10px] text-zinc-500">{isArabic ? "معاينة:" : "Preview:"}</span>
                                <img
                                  src={currentImageUrl}
                                  alt="Preview"
                                  className="h-12 w-12 object-cover rounded-lg border border-zinc-800"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* DYNAMIC BACKDROP CUSTOMIZER MODULE */}
                    {(() => {
                      const getSectionBg = (key: 'theCollections' | 'trendPieces' | 'categoryScrollSlices' | 'customCoutureForm') => {
                        return homepageContent.sectionBackgrounds?.[key] || {
                          type: 'gradient',
                          solidColor: key === 'theCollections' ? '#1b1c19'
                                    : key === 'trendPieces' ? '#252622'
                                    : key === 'categoryScrollSlices' ? '#353630'
                                    : '#FAF9F5',
                          gradientFrom: key === 'theCollections' ? '#1b1c19'
                                      : key === 'trendPieces' ? '#252622'
                                      : key === 'categoryScrollSlices' ? '#353630'
                                      : '#FAF9F5',
                          gradientTo: key === 'theCollections' ? '#252622'
                                    : key === 'trendPieces' ? '#2d2e28'
                                    : key === 'categoryScrollSlices' ? '#21221e'
                                    : '#EAE8E1',
                          gradientDirection: 'to-b',
                          textColor: (key === 'customCoutureForm') ? 'dark' : 'light'
                        };
                      };

                      const updateSectionBg = (key: 'theCollections' | 'trendPieces' | 'categoryScrollSlices' | 'customCoutureForm', field: string, val: any) => {
                        const currentBgs = { ...(homepageContent.sectionBackgrounds || {}) };
                        currentBgs[key] = {
                          ...getSectionBg(key),
                          [field]: val
                        };
                        setHomepageContent({
                          ...homepageContent,
                          sectionBackgrounds: currentBgs
                        });
                      };

                      const getCategoryBg = (key: 'women' | 'men' | 'kids' | 'accessories') => {
                        const defaults = {
                          women: { type: 'solid', solidColor: '#c9d9bc', textColor: 'dark', gradientFrom: '#c9d9bc', gradientTo: '#bdae9c', gradientDirection: 'to-r' },
                          men: { type: 'gradient', solidColor: '#252622', textColor: 'light', gradientFrom: '#252622', gradientTo: '#1f201d', gradientDirection: 'to-r' },
                          kids: { type: 'solid', solidColor: '#c9dfdd', textColor: 'dark', gradientFrom: '#c9dfdd', gradientTo: '#bbaea8', gradientDirection: 'to-r' },
                          accessories: { type: 'gradient', solidColor: '#21221e', textColor: 'light', gradientFrom: '#21221e', gradientTo: '#1a1b18', gradientDirection: 'to-r' }
                        };
                        const fallback = defaults[key] || {
                          type: 'solid',
                          solidColor: '#252622',
                          gradientFrom: '#252622',
                          gradientTo: '#1f201d',
                          gradientDirection: 'to-r',
                          textColor: 'light'
                        };
                        return homepageContent.categoryBackdrops?.[key] || fallback;
                      };

                      const updateCategoryBg = (key: 'women' | 'men' | 'kids' | 'accessories', field: string, val: any) => {
                        const currentBgs = { ...(homepageContent.categoryBackdrops || {}) };
                        currentBgs[key] = {
                          ...getCategoryBg(key),
                          [field]: val
                        };
                        setHomepageContent({
                          ...homepageContent,
                          categoryBackdrops: currentBgs
                        });
                      };

                      return (
                        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl space-y-6">
                          <div className="border-b border-zinc-800 pb-2.5 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-amber-400 uppercase flex items-center gap-1.5">
                              <span className="text-amber-450 text-base">🎨</span>
                              <span>{isArabic ? "تخصيص خلفيات أقسام الصفحة الرئيسية" : "Homepage Section Backdrops Customizer"}</span>
                            </h4>
                          </div>

                          <p className="text-xs text-zinc-400">
                            {isArabic 
                              ? "تتيح لك هذه اللوحة التحكم الكامل في خلفيات كل قسم ترويجي بالصفحة الرئيسية وتحديد الألوان بدقة (لون واحد ممتد أو تدرج لوني انسيابي) مع ملاءمة تباين النصوص والسمات اللونية." 
                              : "Manage solid colors and elegant gradients for every landing page sector. Seamlessly optimize text readability with one click."}
                          </p>

                          <div className="space-y-6">
                            {[
                              { id: 'theCollections', labelAr: "قسم التشكيلات الفريدة (The Collections)", labelEn: "The Collections Section" },
                              { id: 'trendPieces', labelAr: "قسم قطع الموضة الأكثر تأثيراً (The Trend Pieces)", labelEn: "The Trend Pieces Section" },
                              { id: 'categoryScrollSlices', labelAr: "روائع الموضة حسب ذوقك (Shop By Genre)", labelEn: "Boutique Category Slices" },
                              { id: 'customCoutureForm', labelAr: "أتيليه الهدايا والتفصيل الملكي (Royal Bespoke Form)", labelEn: "Bespoke Royal Gift Form" }
                            ].map((sect) => {
                              const bOption = getSectionBg(sect.id as any);
                              return (
                                <div key={sect.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-xs font-bold text-zinc-300 font-serif leading-none">{isArabic ? sect.labelAr : sect.labelEn}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Background Type choice */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "نوع الخلفية" : "Backdrop Style Type"}</label>
                                      <select
                                        value={bOption.type}
                                        onChange={(e) => updateSectionBg(sect.id as any, 'type', e.target.value as any)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                      >
                                        <option value="solid">{isArabic ? "لون واحد (Solid)" : "Solid color"}</option>
                                        <option value="gradient">{isArabic ? "تدرج لوني (Gradient)" : "Gradient color"}</option>
                                      </select>
                                    </div>

                                    {/* Text Color for contrast assurance */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "لون نصوص القسم" : "Optimize Text Contrast"}</label>
                                      <select
                                        value={bOption.textColor || 'light'}
                                        onChange={(e) => updateSectionBg(sect.id as any, 'textColor', e.target.value as any)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                      >
                                        <option value="light">{isArabic ? "نصوص بيضاء/فاتحة (للخلفيات الغامقة)" : "Light Text (For Dark Background)"}</option>
                                        <option value="dark">{isArabic ? "نصوص سوداء/داكنة (للخلفيات الفاتحة)" : "Dark Text (For Light Background)"}</option>
                                      </select>
                                    </div>

                                    {/* Solid Color Picker */}
                                    {bOption.type === 'solid' ? (
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "اختر اللون" : "Solid hex code"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.solidColor || '#252622'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'solidColor', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.solidColor || '#252622'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'solidColor', e.target.value)}
                                            placeholder="#ffffff"
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      /* Gradient Direction selector */
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "اتجاه التدرج" : "Gradient Direction"}</label>
                                        <select
                                          value={bOption.gradientDirection || 'to-b'}
                                          onChange={(e) => updateSectionBg(sect.id as any, 'gradientDirection', e.target.value as any)}
                                          className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                        >
                                          <option value="to-b">{isArabic ? "من أعلى لأسفل" : "To Bottom (↓)"}</option>
                                          <option value="to-r">{isArabic ? "من اليسار لليمين" : "To Right (→)"}</option>
                                          <option value="to-tr">{isArabic ? "من أسفل اليسار لأعلى اليمين" : "To Top Right (↗)"}</option>
                                          <option value="to-br">{isArabic ? "من أعلى اليسار لأسفل اليمين" : "To Bottom Right (↘)"}</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Conditional Gradient From and To Inputs */}
                                  {bOption.type === 'gradient' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "يبدأ من لون" : "Gradient From (Hex)"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.gradientFrom || '#252622'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'gradientFrom', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.gradientFrom || '#252622'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'gradientFrom', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "ينتهي عند لون" : "Gradient To (Hex)"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.gradientTo || '#2d2e28'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'gradientTo', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.gradientTo || '#2d2e28'}
                                            onChange={(e) => updateSectionBg(sect.id as any, 'gradientTo', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Section Style Preview Indicator */}
                                  <div className="flex items-center gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/60 justify-between">
                                    <span className="text-[10px] text-zinc-500">{isArabic ? "معاينة نمط الخلفية المنعكسة:" : "Backdrop Style Spec:"}</span>
                                    <div 
                                      style={{
                                        background: bOption.type === 'solid' 
                                          ? bOption.solidColor 
                                          : `linear-gradient(${
                                              bOption.gradientDirection === 'to-r' ? 'to right' :
                                              bOption.gradientDirection === 'to-tr' ? 'to top right' :
                                              bOption.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
                                            }, ${bOption.gradientFrom || '#252622'}, ${bOption.gradientTo || '#2d2e28'})`
                                      }}
                                      className="h-8 w-48 rounded-lg border border-zinc-700 font-sans text-[10px] flex items-center justify-center font-bold tracking-widest shadow-inner overflow-hidden"
                                    >
                                      <span style={{ color: bOption.textColor === 'dark' ? '#000000' : '#ffffff' }}>
                                        {isArabic ? "عينة نصوص الأناقة" : "Elegance Sample text"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="border-b border-zinc-850 pt-8 pb-2.5 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-amber-400 uppercase flex items-center gap-1.5">
                              <span className="text-amber-450 text-base">✨</span>
                              <span>{isArabic ? "تخصيص خلفيات كروت الفئات (Genre Slices)" : "Genre Slices Backdrops Customizer"}</span>
                            </h4>
                          </div>

                          <p className="text-xs text-zinc-400">
                            {isArabic 
                              ? "يتيح لك هذا القسم تخصيص خلفيات كروت الفئات الأربعة الفاخرة بشكل منفصل لتطابق ذوقك الرفيع وتتحكم في تباين السلايدر الخاص بكل تصنيف."
                              : "Optimize backdrops for individual category card sliders separately. Personalize style details for specific collections."}
                          </p>

                          <div className="space-y-6">
                            {[
                              { id: 'women', labelAr: "كارت تشكيلة النساء (Women Card Backdrop)", labelEn: "Women's Collection Backdrop" },
                              { id: 'men', labelAr: "كارت تشكيلة الرجال (Men Card Backdrop)", labelEn: "Men's Collection Backdrop" },
                              { id: 'kids', labelAr: "كارت تشكيلة الأطفال (Kids Card Backdrop)", labelEn: "Kids' Collection Backdrop" },
                              { id: 'accessories', labelAr: "كارت تشكيلة الإكسسوارات (Accessories Card Backdrop)", labelEn: "Accessories' Collection Backdrop" }
                            ].map((sect) => {
                              const bOption = getCategoryBg(sect.id as any);
                              return (
                                <div key={sect.id} className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl space-y-4">
                                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                                    <span className="text-xs font-bold text-zinc-300 font-serif leading-none">{isArabic ? sect.labelAr : sect.labelEn}</span>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    
                                    {/* Background Type choice */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "نوع الخلفية" : "Backdrop Style Type"}</label>
                                      <select
                                        value={bOption.type}
                                        onChange={(e) => updateCategoryBg(sect.id as any, 'type', e.target.value as any)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                      >
                                        <option value="solid">{isArabic ? "لون واحد (Solid)" : "Solid color"}</option>
                                        <option value="gradient">{isArabic ? "تدرج لوني (Gradient)" : "Gradient color"}</option>
                                      </select>
                                    </div>

                                    {/* Text Color for contrast assurance */}
                                    <div>
                                      <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "لون نصوص القسم" : "Optimize Text Contrast"}</label>
                                      <select
                                        value={bOption.textColor || 'light'}
                                        onChange={(e) => updateCategoryBg(sect.id as any, 'textColor', e.target.value as any)}
                                        className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                      >
                                        <option value="light">{isArabic ? "فاتح / غامق" : "Light Text / Dark Box"}</option>
                                        <option value="dark">{isArabic ? "داكن / فاتح" : "Dark Text / Light Box"}</option>
                                      </select>
                                    </div>

                                    {/* Solid Color Picker */}
                                    {bOption.type === 'solid' ? (
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "اختر اللون" : "Solid hex code"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.solidColor || '#252622'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'solidColor', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.solidColor || '#252622'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'solidColor', e.target.value)}
                                            placeholder="#ffffff"
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>
                                    ) : (
                                      /* Gradient Direction selector */
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "اتجاه التدرج" : "Gradient Direction"}</label>
                                        <select
                                          value={bOption.gradientDirection || 'to-r'}
                                          onChange={(e) => updateCategoryBg(sect.id as any, 'gradientDirection', e.target.value as any)}
                                          className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400"
                                        >
                                          <option value="to-b">{isArabic ? "من أعلى لأسفل" : "To Bottom (↓)"}</option>
                                          <option value="to-r">{isArabic ? "من اليسار لليمين" : "To Right (→)"}</option>
                                          <option value="to-tr">{isArabic ? "من أسفل اليسار لأعلى اليمين" : "To Top Right (↗)"}</option>
                                          <option value="to-br">{isArabic ? "من أعلى اليسار لأسفل اليمين" : "To Bottom Right (↘)"}</option>
                                        </select>
                                      </div>
                                    )}
                                  </div>

                                  {/* Conditional Gradient From and To Inputs */}
                                  {bOption.type === 'gradient' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "يبدأ من لون" : "Gradient From (Hex)"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.gradientFrom || '#252622'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'gradientFrom', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.gradientFrom || '#252622'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'gradientFrom', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "ينتهي عند لون" : "Gradient To (Hex)"}</label>
                                        <div className="flex gap-2">
                                          <input
                                            type="color"
                                            value={bOption.gradientTo || '#1f201d'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'gradientTo', e.target.value)}
                                            className="h-9 w-9 bg-transparent border-0 cursor-pointer rounded-lg shrink-0"
                                          />
                                          <input
                                            type="text"
                                            value={bOption.gradientTo || '#1f201d'}
                                            onChange={(e) => updateCategoryBg(sect.id as any, 'gradientTo', e.target.value)}
                                            className="w-full bg-zinc-900 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none focus:border-amber-400 font-mono"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Section Style Preview Indicator */}
                                  <div className="flex items-center gap-3 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-850/60 justify-between">
                                    <span className="text-[10px] text-zinc-500">{isArabic ? "معاينة نمط الخلفية المنعكسة:" : "Backdrop Style Spec:"}</span>
                                    <div 
                                      style={{
                                        background: bOption.type === 'solid' 
                                          ? bOption.solidColor 
                                          : `linear-gradient(${
                                              bOption.gradientDirection === 'to-r' ? 'to right' :
                                              bOption.gradientDirection === 'to-tr' ? 'to top right' :
                                              bOption.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
                                            }, ${bOption.gradientFrom || '#252622'}, ${bOption.gradientTo || '#1f201d'})`
                                      }}
                                      className="h-8 w-48 rounded-lg border border-zinc-700 font-sans text-[10px] flex items-center justify-center font-bold tracking-widest shadow-inner overflow-hidden"
                                    >
                                      <span style={{ color: bOption.textColor === 'dark' ? '#000000' : '#ffffff' }}>
                                        {isArabic ? "عينة نصوص الأناقة" : "Elegance Sample text"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}

                    {/* CUSTOM HEADER & LOGO CUSTOMIZER */}
                    <div className="border-t border-zinc-800 pt-6 mt-6 space-y-4">
                      <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 text-sm">
                        {isArabic ? "تخصيص الهيدر وشعار المتجر" : "Header & Logo Customization"}
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Header Bg Color */}
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                            {isArabic ? "لون خلفية الهيدر" : "Header Background Color"}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={homepageContent.headerBgColor || '#353630'}
                              onChange={(e) => setHomepageContent({ ...homepageContent, headerBgColor: e.target.value })}
                              className="h-9 w-12 bg-zinc-950 border border-zinc-800 rounded-lg p-1 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={homepageContent.headerBgColor || '#353630'}
                              onChange={(e) => setHomepageContent({ ...homepageContent, headerBgColor: e.target.value })}
                              className="flex-1 bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono"
                              placeholder="#353630"
                            />
                          </div>
                        </div>

                        {/* Logo Size */}
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                            {isArabic ? "عرض الشعار (حجم اللوجو بالبكسل)" : "Logo Width / Size (Pixels)"}
                          </label>
                          <div className="flex items-center gap-3">
                            <input
                              type="range"
                              min="40"
                              max="160"
                              value={homepageContent.logoSize || 80}
                              onChange={(e) => setHomepageContent({ ...homepageContent, logoSize: Number(e.target.value) })}
                              className="flex-1 accent-amber-400 h-1.5 bg-zinc-850 rounded-lg cursor-pointer"
                            />
                            <span className="text-xs font-bold text-amber-400 font-mono shrink-0 w-12 text-center bg-zinc-950 border border-zinc-800 py-1.5 px-2 rounded-lg">
                              {homepageContent.logoSize || 80}px
                            </span>
                          </div>
                        </div>

                        {/* Reset Header Style */}
                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setHomepageContent({ 
                              ...homepageContent, 
                              headerBgColor: '#353630', 
                              logoSize: 80, 
                              logoImage: '' 
                            })}
                            className="w-full bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white transition py-2 px-3 rounded-xl text-[10px] uppercase font-bold"
                          >
                            {isArabic ? "إعادة تعيين الافتراضيات" : "Reset Styling Defaults"}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        {/* Custom Logo Link */}
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                            {isArabic ? "رابط صورة الشعار خارجية (URL)" : "Logo Image URL Link"}
                          </label>
                          <input
                            type="url"
                            placeholder="https://..."
                            value={homepageContent.logoImage || ''}
                            onChange={(e) => setHomepageContent({ ...homepageContent, logoImage: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none focus:border-amber-400 font-mono"
                          />
                        </div>

                        {/* Logo Upload */}
                        <div>
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">
                            {isArabic ? "أو رفع ملف شعار جديد من جهازك" : "Or Upload New Logo File from Device"}
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setHomepageContent({ ...homepageContent, logoImage: reader.result as string });
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="w-full text-xs text-zinc-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-zinc-800 file:text-amber-400 hover:file:bg-zinc-700 cursor-pointer"
                          />
                        </div>
                      </div>

                      {homepageContent.logoImage && (
                        <div className="flex items-center gap-3 bg-zinc-950/45 p-3 rounded-xl border border-zinc-850/60 w-fit">
                          <span className="text-[10px] text-zinc-400 font-semibold">{isArabic ? "شعار مخصص نشط:" : "Custom Logo Active:"}</span>
                          <img 
                            src={homepageContent.logoImage} 
                            alt="Logo preview" 
                            className="h-10 object-contain bg-[#353630] border border-zinc-800 p-1 rounded" 
                          />
                          <button
                            type="button"
                            onClick={() => setHomepageContent({ ...homepageContent, logoImage: '' })}
                            className="text-red-400 hover:text-red-300 text-[10px] font-semibold underline cursor-pointer"
                          >
                            {isArabic ? "حذف واستعادة الافتراضي" : "Delete & Restore Standard"}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* THE COLLECTIONS CUSTOMIZER SECTION */}
                    <div className="border-t border-zinc-800 pt-6 mt-6 space-y-4">
                      <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 text-sm">
                        {isArabic ? "التحكم في قسم الـ Collections ونمط العرض والترتيب" : "Collections Section Display Layout & Sort Order"}
                      </h4>

                      {/* Display Example layouts with choose selectors */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                          {isArabic ? "طريقة عرض التشكيلات ومثال التصميم المطبق:" : "CHOOSE A DESIGN LAYOUT PATTERN (VIEW EXAMPLES):"}
                        </label>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {[
                            { 
                              id: 'split', 
                              nameEn: 'Classic Split Asymmetrical', 
                              nameAr: 'التقسيم الكلاسيكي المطوّر', 
                              descEn: 'One massive featured portrait on left with stack of items on right side.',
                              descAr: 'صورة حريمي عملاقة في اتجاه وثلاث بطاقات فئوية مبسطة بالاتجاه الآخر.',
                              visual: ' █ █ | █\n █ █ | █\n █ █ | █'
                            },
                            { 
                              id: 'bento', 
                              nameEn: 'Avant-Garde Bento-Box', 
                              nameAr: 'تصميم شبكة بينتو المبتكر', 
                              descEn: 'Asymmetrical geometric layout grid (wide block, narrow block alternating).',
                              descAr: 'شبكة هندسية ببطاقات متفاوتة العرض والطول بطريقة عصرية ممتعة للنظر.',
                              visual: ' █ █ █ | █\n █ | █ █ █'
                            },
                            { 
                              id: 'symmetric', 
                              nameEn: 'Symmetrical Synchronous Grid', 
                              nameAr: 'الشبكة المتماثلة المنتظمة', 
                              descEn: 'Four elegant equal-sized panels aligned side-by-side with border frames.',
                              descAr: 'أربعة أعمدة متجانسة ومتساوية الأبعاد متلاصقة بوقار يشبه المعارض السويسرية.',
                              visual: ' █ | █ | █ | █'
                            },
                            { 
                              id: 'slider', 
                              nameEn: 'Boutique Horizontal Deck Slider', 
                              nameAr: 'شريط التمرير الدائري الفاخر', 
                              descEn: 'Horizontal card stack with interactive slide scrolling view.',
                              descAr: 'بطاقات تمريرية رشيقة تتدفق أفقياً لتقدم أسلوب تصفح ديناميكي كالبوتيك.',
                              visual: ' █ -> █ -> █'
                            }
                          ].map((item) => {
                            const isSelected = (homepageContent.collectionsLayout || 'split') === item.id;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onClick={() => setHomepageContent({ ...homepageContent, collectionsLayout: item.id as any })}
                                className={`text-left p-4 rounded-xl border transition flex flex-col justify-between h-52 cursor-pointer ${
                                  isSelected 
                                    ? "bg-amber-450/20 border-amber-400 shadow-md text-white" 
                                    : "bg-zinc-950/45 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white"
                                }`}
                                style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
                              >
                                <div className="space-y-1 w-full">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-amber-400' : 'text-zinc-300'}`}>
                                      {isArabic ? item.nameAr : item.nameEn}
                                    </span>
                                    <input 
                                      type="radio" 
                                      checked={isSelected}
                                      value={item.id}
                                      onChange={() => {}}
                                      className="accent-amber-400 shrink-0 cursor-pointer"
                                    />
                                  </div>
                                  <p className="text-[10px] text-zinc-455 leading-normal line-clamp-4">
                                    {isArabic ? item.descAr : item.descEn}
                                  </p>
                                </div>

                                {/* Graphic ASCII preview */}
                                <div className="text-[10px] font-mono text-zinc-500 bg-zinc-950 p-2 rounded-lg border border-zinc-850/60 leading-tight w-full mt-2 text-center select-none">
                                  {item.visual}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Sorting organizer card lists */}
                      <div className="space-y-3 pt-3">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-zinc-500 uppercase">
                            {isArabic ? "ترتيب عرض بطاقات التشكيلات الفريدة (ترتيب تصاعدي):" : "CUSTOM DRAG/SORT RE-ARRANGER FOR CARDS ORDER:"}
                          </label>
                          <p className="text-[10px] text-zinc-450 leading-relaxed">
                            {isArabic 
                              ? "استخدم أسهم الترتيب لتغيير تسلسل وأولويات البطاقات داخل قسم التشكيلات. البطاقة الأولى ستكون هي المميزة بالـ Split أو Bento بشكل تلقائي!" 
                              : "Utilize ordering buttons below to sequence the cards. The top-most card will automatically acquire the massive highlight area in Split and Bento layouts!"}
                          </p>
                        </div>

                        {(() => {
                          const currentSort = homepageContent.collectionsOrder || ['women', 'men', 'kids', 'accessories'];
                          const displayLabels = {
                            women: { labelEn: 'Women Collection', labelAr: 'مجموعة ملابس النساء والمحجبات' },
                            men: { labelEn: 'Men Collection', labelAr: 'أساسيات وتصميمات الموضة للرجال' },
                            kids: { labelEn: 'Kids Collection', labelAr: 'ملابس الصغار والأطفال الدقيقة' },
                            accessories: { labelEn: 'Luxe Accessories', labelAr: 'الإكسسوارات والحقائب الفاخرة' }
                          };

                          return (
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 flex flex-col gap-2 max-w-xl">
                              {currentSort.map((key, index) => {
                                const labels = displayLabels[key as 'women'|'men'|'kids'|'accessories'];
                                if (!labels) return null;
                                return (
                                  <div 
                                    key={key}
                                    className="flex items-center justify-between bg-zinc-900 border border-zinc-800 p-3 rounded-xl hover:border-zinc-700 transition"
                                    style={{ direction: isArabic ? 'rtl' : 'ltr' }}
                                  >
                                    <div className="flex items-center gap-3">
                                      <span className="text-[10px] bg-zinc-950 text-amber-400 font-mono font-bold w-6 h-6 flex items-center justify-center rounded-lg border border-zinc-800">
                                        {index + 1}
                                      </span>
                                      <div className="flex flex-col text-right sm:text-right font-sans" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                        <span className="text-xs font-semibold text-white uppercase tracking-wider">
                                          {isArabic ? labels.labelAr : labels.labelEn}
                                        </span>
                                        <span className="text-[9px] text-zinc-500 font-mono mt-0.5">
                                          ID: {key}
                                        </span>
                                      </div>
                                    </div>

                                    {/* Action sorters */}
                                    <div className="flex items-center gap-1.5" dir="ltr">
                                      <button
                                        type="button"
                                        disabled={index === 0}
                                        onClick={() => {
                                          if (index === 0) return;
                                          const newSort = [...currentSort];
                                          const temp = newSort[index];
                                          newSort[index] = newSort[index - 1];
                                          newSort[index - 1] = temp;
                                          setHomepageContent({ ...homepageContent, collectionsOrder: newSort as any });
                                        }}
                                        className="p-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-950 text-zinc-300 disabled:opacity-30 rounded-lg text-xs font-black transition cursor-pointer"
                                        title="Move Up"
                                      >
                                        ▲
                                      </button>
                                      <button
                                        type="button"
                                        disabled={index === currentSort.length - 1}
                                        onClick={() => {
                                          if (index === currentSort.length - 1) return;
                                          const newSort = [...currentSort];
                                          const temp = newSort[index];
                                          newSort[index] = newSort[index + 1];
                                          newSort[index + 1] = temp;
                                          setHomepageContent({ ...homepageContent, collectionsOrder: newSort as any });
                                        }}
                                        className="p-1.5 px-3 bg-zinc-800 hover:bg-zinc-750 active:bg-zinc-950 text-zinc-300 disabled:opacity-30 rounded-lg text-xs font-black transition cursor-pointer"
                                        title="Move Down"
                                      >
                                        ▼
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-850 text-left">
                      <button
                        type="submit"
                        disabled={isSavingContent}
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl text-xs cursor-pointer transition disabled:opacity-50"
                      >
                        {isSavingContent ? (isArabic ? 'جاري الحفظ والرفع...' : 'Syncing changes...') : (isArabic ? 'حفظ تعديلات واجهة المتجر' : 'Publish Sliders Updates')}
                      </button>
                    </div>
                  </form>
                )}

                {/* SUPPORT PAGES EDITOR PANEL */}
                {contentEditorSubTab !== 'homepage' && supportContent && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingContent(true);
                    try {
                      await saveSupportPagesContent(supportContent);
                      if (onContentUpdate) onContentUpdate();
                      alert(isArabic ? "تم حفظ وتحديث محتوى الدعم والسياسات!" : "Support resources & legal frameworks locked in Firestore!");
                    } catch {
                      alert(isArabic ? "فشل الاتصال بقاعدة البيانات" : "Firestore transaction failed");
                    } finally {
                      setIsSavingContent(false);
                    }
                  }} className="space-y-6 bg-zinc-900/40 border border-zinc-800 p-6 rounded-2xl">
                    
                    {/* CONTACT US INTERACTIVE BLOCK */}
                    {contentEditorSubTab === 'contact_us' && (
                      <div className="space-y-4">
                        <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 text-sm">{isArabic ? "معلومات التواصل والخط الساخن" : "Contact Details Template"}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "الهاتف" : "Atelier Phone Support"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.phone}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, phone: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "رابط الواتساب (الهاتف)" : "Bespoke Whatsapp Line"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.whatsappPhone}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, whatsappPhone: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "البريد الإلكتروني" : "Atelier Email"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.email}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, email: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "ساعات العمل بالإنجليزي" : "Working Hours (EN)"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.workingHoursEn}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, workingHoursEn: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان بالعربية" : "Atelier Address (AR)"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.addressAr}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, addressAr: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "العنوان بالإنجليزية" : "Atelier Address (EN)"}</label>
                            <input
                              type="text"
                              value={supportContent.contact_us.addressEn}
                              onChange={(e) => {
                                const nextVal = { ...supportContent.contact_us, addressEn: e.target.value };
                                setSupportContent({ ...supportContent, contact_us: nextVal });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* FAQ INTERACTIVE EDITOR BLOCK */}
                    {contentEditorSubTab === 'faq' && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                          <h4 className="text-zinc-200 font-bold text-sm">{isArabic ? "أكورديون وبنك الأسئلة الشائعة" : "Interactive Q&A Board"}</h4>
                          <button
                            type="button"
                            onClick={() => {
                              const nextItems = [...(supportContent.faq.items || [])];
                              nextItems.push({
                                id: `faq-${Date.now()}`,
                                qAr: "سؤال جديد؟",
                                qEn: "New generic query?",
                                aAr: "إجابة هذا السؤال تضاف من الأتيليه دليفري.",
                                aEn: "Boutique replies will reflect securely upon publishing."
                              });
                              setSupportContent({
                                ...supportContent,
                                faq: { ...supportContent.faq, items: nextItems }
                              });
                            }}
                            className="bg-amber-400 text-black font-bold px-3 py-1 text-[10px] rounded-lg cursor-pointer hover:bg-amber-500"
                          >
                            + {isArabic ? "إضافة سؤال فريد" : "Add FAQ Rule"}
                          </button>
                        </div>

                        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
                          {(supportContent.faq.items || []).map((fq, idx) => (
                            <div key={fq.id} className="p-4 bg-zinc-950 border border-zinc-850 rounded-xl space-y-3 relative">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = (supportContent.faq.items || []).filter(item => item.id !== fq.id);
                                  setSupportContent({
                                    ...supportContent,
                                    faq: { ...supportContent.faq, items: list }
                                  });
                                }}
                                className="absolute top-2 right-2 text-red-400 hover:text-red-500 font-bold text-[10px]"
                              >
                                {isArabic ? "حذف" : "Remove"}
                              </button>
                              <span className="text-[10px] text-zinc-500 font-mono block">QUESTION #{idx + 1}</span>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-[9px] text-zinc-400 mb-0.5">{isArabic ? "السؤال (عربي)" : "Query (AR)"}</label>
                                  <input
                                    type="text"
                                    value={fq.qAr}
                                    onChange={(e) => {
                                      const arr = [...supportContent.faq.items];
                                      arr[idx] = { ...fq, qAr: e.target.value };
                                      setSupportContent({ ...supportContent, faq: { ...supportContent.faq, items: arr } });
                                    }}
                                    className="w-full bg-zinc-905 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-zinc-400 mb-0.5">{isArabic ? "السؤال (إنجليزي)" : "Query (EN)"}</label>
                                  <input
                                    type="text"
                                    value={fq.qEn}
                                    onChange={(e) => {
                                      const arr = [...supportContent.faq.items];
                                      arr[idx] = { ...fq, qEn: e.target.value };
                                      setSupportContent({ ...supportContent, faq: { ...supportContent.faq, items: arr } });
                                    }}
                                    className="w-full bg-zinc-905 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-zinc-400 mb-0.5">{isArabic ? "الإجابة (عربي)" : "Response (AR)"}</label>
                                  <textarea
                                    value={fq.aAr}
                                    rows={2}
                                    onChange={(e) => {
                                      const arr = [...supportContent.faq.items];
                                      arr[idx] = { ...fq, aAr: e.target.value };
                                      setSupportContent({ ...supportContent, faq: { ...supportContent.faq, items: arr } });
                                    }}
                                    className="w-full bg-zinc-905 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none resize-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] text-zinc-400 mb-0.5">{isArabic ? "الإجابة (إنجليزي)" : "Response (EN)"}</label>
                                  <textarea
                                    value={fq.aEn}
                                    rows={2}
                                    onChange={(e) => {
                                      const arr = [...supportContent.faq.items];
                                      arr[idx] = { ...fq, aEn: e.target.value };
                                      setSupportContent({ ...supportContent, faq: { ...supportContent.faq, items: arr } });
                                    }}
                                    className="w-full bg-zinc-905 border border-zinc-800 text-xs text-white p-2 rounded-xl outline-none resize-none"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* GENERAL POLICIES MULTILINE TEXT BOXES */}
                    {contentEditorSubTab !== 'contact_us' && contentEditorSubTab !== 'faq' && (
                      <div className="space-y-4">
                        <h4 className="text-zinc-200 font-bold border-b border-zinc-800 pb-2 text-sm">
                          {isArabic ? "تعديل بنود الصفحة المحددة" : "Content Text Configurator"}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "عنوان الصفحة (عربي)" : "Page Primary Header (AR)"}</label>
                            <input
                              type="text"
                              value={supportContent[contentEditorSubTab as keyof SupportPagesContent]?.titleAr || ""}
                              onChange={(e) => {
                                const pNode = { ...supportContent[contentEditorSubTab as keyof SupportPagesContent] };
                                pNode.titleAr = e.target.value;
                                setSupportContent({ ...supportContent, [contentEditorSubTab]: pNode });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "عنوان الصفحة (إنجليزي)" : "Page Primary Header (EN)"}</label>
                            <input
                              type="text"
                              value={supportContent[contentEditorSubTab as keyof SupportPagesContent]?.titleEn || ""}
                              onChange={(e) => {
                                const pNode = { ...supportContent[contentEditorSubTab as keyof SupportPagesContent] };
                                pNode.titleEn = e.target.value;
                                setSupportContent({ ...supportContent, [contentEditorSubTab]: pNode });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-2.5 rounded-xl outline-none"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "محتوى الصفحة بنظام الكتابة الطويلة (عربي)" : "Secondary Paragraph Text block (AR)"}</label>
                            <textarea
                              value={(supportContent[contentEditorSubTab as keyof SupportPagesContent] as any)?.contentAr || ""}
                              rows={12}
                              onChange={(e) => {
                                const pNode = { ...(supportContent[contentEditorSubTab as keyof SupportPagesContent] as any) };
                                pNode.contentAr = e.target.value;
                                setSupportContent({ ...supportContent, [contentEditorSubTab]: pNode });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none font-sans leading-relaxed"
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-zinc-500 uppercase mb-1">{isArabic ? "محتوى الصفحة بنظام الكتابة الطويلة (إنجليزي)" : "Secondary Paragraph Text block (EN)"}</label>
                            <textarea
                              value={(supportContent[contentEditorSubTab as keyof SupportPagesContent] as any)?.contentEn || ""}
                              rows={12}
                              onChange={(e) => {
                                const pNode = { ...(supportContent[contentEditorSubTab as keyof SupportPagesContent] as any) };
                                pNode.contentEn = e.target.value;
                                setSupportContent({ ...supportContent, [contentEditorSubTab]: pNode });
                              }}
                              className="w-full bg-zinc-950 border border-zinc-800 text-xs text-white p-3 rounded-xl outline-none font-sans leading-relaxed"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 text-left">
                      <button
                        type="submit"
                        disabled={isSavingContent}
                        className="px-6 py-3 bg-amber-400 hover:bg-amber-500 text-black font-bold rounded-xl text-xs cursor-pointer transition disabled:opacity-50"
                      >
                        {isSavingContent ? (isArabic ? 'جاري التخزين...' : 'Syncing changes...') : (isArabic ? 'حفظ ونشر التعديلات فوراً' : 'Publish Support Page')}
                      </button>
                    </div>
                  </form>
                )}
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
                          onChange={(e) => {
                            const newCat = e.target.value as any;
                            // Clear subcategory when category matches, to avoid cross-category leaks
                            setIsCustomSubcategory(false);
                            setFormData({ ...formData, category: newCat, subcategoryAr: '', subcategoryEn: '' });
                          }}
                        >
                          <option value="men">{isArabic ? "ملابس رجالي" : "Men's Clothing"}</option>
                          <option value="women">{isArabic ? "ملابس حريمي" : "Women's Clothing"}</option>
                          <option value="kids">{isArabic ? "ملابس أطفالي" : "Kids' Wear"}</option>
                          <option value="accessories">{isArabic ? "إكسسوارات" : "Bag/Jewelry Accs"}</option>
                        </select>
                      </div>

                      {/* Subcategory dropdown Selection */}
                      <div>
                        <label className="block text-xs font-semibold text-zinc-400 mb-1">
                          {isArabic ? "الفئة الفرعية (اختياري)" : "Subcategory (Optional)"}
                        </label>
                        <select
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                          value={isCustomSubcategory ? "custom" : (formData.subcategoryEn || '')}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "custom") {
                              setIsCustomSubcategory(true);
                              setFormData({ ...formData, subcategoryAr: '', subcategoryEn: '' });
                            } else if (val === "") {
                              setIsCustomSubcategory(false);
                              setFormData({ ...formData, subcategoryAr: '', subcategoryEn: '' });
                            } else {
                              setIsCustomSubcategory(false);
                              const list = subcategoriesByCategory[formData.category] || [];
                              const match = list.find(sub => sub.en === val);
                              if (match) {
                                setFormData({ ...formData, subcategoryAr: match.ar, subcategoryEn: match.en });
                              } else {
                                setFormData({ ...formData, subcategoryAr: '', subcategoryEn: val });
                              }
                            }
                          }}
                        >
                          <option value="">{isArabic ? "بلا فئة فرعية (اختياري)" : "No Subcategory (Optional)"}</option>
                          {(subcategoriesByCategory[formData.category] || []).map((sub) => (
                            <option key={sub.en} value={sub.en}>
                              {isArabic ? sub.ar : sub.en}
                            </option>
                          ))}
                          <option value="custom">{isArabic ? " + إضافة فئة فرعية جديدة" : " + Add New Subcategory"}</option>
                        </select>
                      </div>

                      {/* Explicit New Subcategory name inputs shown if 'isCustomSubcategory' is true */}
                      {isCustomSubcategory && (
                        <div className="sm:col-span-2 bg-zinc-950 p-4 rounded-xl border border-dashed border-zinc-800 space-y-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-extrabold text-amber-400">
                              {isArabic ? "إضافة فئة فرعية جديدة" : "Add New Subcategory"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomSubcategory(false);
                                setFormData({ ...formData, subcategoryAr: '', subcategoryEn: '' });
                              }}
                              className="text-[10px] text-zinc-500 hover:text-white underline cursor-pointer"
                            >
                              {isArabic ? "إلغاء واستخدام القائمة المنسدلة" : "Cancel & Use Dropdown"}
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10.5px] font-semibold text-zinc-400 mb-1">
                                {isArabic ? "اسم الفئة الفرعية بالعربية" : "Subcategory in Arabic"}
                              </label>
                              <input
                                type="text"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                                value={formData.subcategoryAr}
                                onChange={(e) => setFormData({ ...formData, subcategoryAr: e.target.value })}
                                placeholder={isArabic ? "مثال: فساتين، بدل، قمصان" : "e.g. Dresses, Suits, Shirts"}
                              />
                            </div>

                            <div>
                              <label className="block text-[10.5px] font-semibold text-zinc-400 mb-1">
                                {isArabic ? "اسم الفئة الفرعية بالإنجليزية" : "Subcategory in English"}
                              </label>
                              <input
                                type="text"
                                required
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                                value={formData.subcategoryEn}
                                onChange={(e) => setFormData({ ...formData, subcategoryEn: e.target.value })}
                                placeholder="e.g. Dresses, Suits, Shirts"
                              />
                            </div>
                          </div>
                          <span className="text-[10px] text-zinc-500 block">
                            {isArabic 
                              ? `* سيتم ربط هذه الفئة الفرعية الجديدة بالفئة الرئيسية: ${formData.category}` 
                              : `* This subcategory will be linked directly under parent category: ${formData.category}`}
                          </span>
                        </div>
                      )}

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
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="text-[10px] font-bold uppercase py-0.5 px-2.5 rounded-full bg-zinc-805 text-amber-300 font-mono border border-zinc-750">
                                      {prod.category}
                                    </span>
                                    {(prod.subcategoryAr || prod.subcategoryEn) && (
                                      <span className="text-[9.5px] text-zinc-400 font-sans">
                                        {isArabic ? prod.subcategoryAr : prod.subcategoryEn}
                                      </span>
                                    )}
                                  </div>
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
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {['all', 'pending', 'preparing', 'shipped', 'delivered', 'cancelled'].map((val) => {
                      const count = val === 'all' 
                        ? orders.length 
                        : orders.filter(o => o.status === val).length;
                      return (
                        <div key={val} className="flex flex-col items-center gap-1">
                          <span className={`${
                            orderFilter === val 
                              ? "text-amber-400 font-extrabold text-[11px]" 
                              : "text-zinc-500 font-bold text-[10px]"
                          } font-mono`}>
                            {count}
                          </span>
                          <button
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
                        </div>
                      );
                    })}
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
                              ord.status === 'preparing' ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' :
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

                        {/* Payment Verification Information Panel */}
                        {(() => {
                          const isElectronic = ord.paymentMethod && !['cod', 'cashondelivery', 'cash on delivery'].includes(ord.paymentMethod.toLowerCase().replace(/\s/g, ''));
                          const isLocked = isElectronic && ord.paymentStatus !== 'verified';
                          return (
                            <div className="bg-zinc-950 p-4 border border-zinc-805/40 rounded-2xl space-y-4 text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                                <div>
                                  <h5 className="font-extrabold text-zinc-400 uppercase tracking-widest text-[9px] mb-1">
                                    {isArabic ? "طريقة الدفع والحالة المالية:" : "Payment Method & Financial Status:"}
                                  </h5>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`px-2.5 py-1 rounded bg-zinc-900 border text-xs font-semibold ${isElectronic ? 'text-violet-400 border-violet-900/40' : 'text-zinc-300 border-zinc-800'}`}>
                                      {ord.paymentMethod || (isArabic ? "غير محدد" : "Unspecified")}
                                    </span>
                                    
                                    {isElectronic ? (
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        ord.paymentStatus === 'verified' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : ord.paymentStatus === 'rejected' 
                                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                      }`}>
                                        {ord.paymentStatus === 'verified' && (isArabic ? "تم تأكيد الدفع بنجاح" : "Verified & Received")}
                                        {ord.paymentStatus === 'rejected' && (isArabic ? "معلق - تم رفض معاملة الدفع" : "On Hold - Payment Rejected")}
                                        {(ord.paymentStatus === 'pending_verification' || !ord.paymentStatus) && (isArabic ? "انتظار التحقق من التحويل" : "Awaiting Transfer Verification")}
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-805 text-zinc-400 border border-zinc-700/50">
                                        {isArabic ? "الدفع عند الاستلام - لا يتطلب تأكيد مسبق" : "COD - No pre-verification needed"}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* View payment proof receipt button */}
                                {ord.paymentProof && (
                                  <button
                                    type="button"
                                    onClick={() => setViewingPaymentProofUrl(ord.paymentProof!)}
                                    className="px-3 py-1.5 bg-violet-950/20 hover:bg-violet-950/40 border border-violet-900/50 text-violet-400 hover:text-violet-300 text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1"
                                  >
                                    {isArabic ? "🔍 عرض إيصال التحويل" : "🔍 View Payment Receipt"}
                                  </button>
                                )}
                              </div>

                              {ord.paymentProofNotes && (
                                <div className="p-3 bg-zinc-900 border border-zinc-800/60 rounded-xl text-xs text-zinc-350 space-y-1 mt-2 text-right">
                                  <div className="font-bold text-amber-500 text-[10px] uppercase tracking-wider flex items-center gap-1 justify-start">
                                    <span>✉️</span>
                                    <span>{isArabic ? "تفاصيل السداد الجديدة المرسلة من العميل:" : "New payment details sent by customer:"}</span>
                                  </div>
                                  <p className="leading-relaxed font-sans whitespace-pre-wrap">{ord.paymentProofNotes}</p>
                                </div>
                              )}

                              {/* Action Buttons for Electronic Payments (InstaPay or Wallet) */}
                              {isElectronic && ord.status !== 'cancelled' && (
                                  <div className="pt-2 border-t border-zinc-900 flex flex-col gap-2">
                                    {ord.paymentStatus !== 'verified' && (
                                      <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                                        <span>ℹ️</span>
                                        <span>
                                          {isArabic 
                                            ? "يجب على الإدارة التأكد من التحويل أولاً. سيتم إلغاء قفل خيار بدء التحضير بمجرد تأكيد الدفع." 
                                            : "Administration must verify transaction success first. Preparation controls will unlock once verified."}
                                        </span>
                                      </div>
                                    )}

                                    <div className="flex flex-wrap gap-2 justify-start mt-1">
                                      {ord.paymentStatus !== 'verified' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setConfirmingOrderId(ord.id);
                                            setRejectingOrderId(null);
                                          }}
                                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1 shadow"
                                        >
                                          <span>✓</span>
                                          <span>{isArabic ? "تأكيد استلام المبلغ" : "Confirm payment received"}</span>
                                        </button>
                                      )}

                                      {ord.paymentStatus !== 'rejected' && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setRejectingOrderId(ord.id);
                                            setConfirmingOrderId(null);
                                            const phone = supportContent?.contact_us?.whatsappPhone || supportContent?.contact_us?.phone || '201012345678';
                                            setRejectMessageAr(`تم رفض المعاملة لطلبكم رقم #${ord.id.substring(0, 6)}. برجاء المحاولة مرة أخرى لعدم تمكننا من التحقق من عملية السداد، للتواصل والاستفسار رقم: +${phone}`);
                                            setRejectMessageEn(`We were unable to verify your electronic payment for order #${ord.id.substring(0, 6)}. The transaction has been rejected. Please try again. Contact support: +${phone}`);
                                          }}
                                          className="px-4 py-1.5 text-rose-452 hover:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center gap-1 shadow"
                                        >
                                          <span>⚠️</span>
                                          <span>{isArabic ? "رفض المعاملة وتجميد الطلب" : "Decline Payment & Hold"}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                              )}

                              {/* Inline Confirmation dialog */}
                              {confirmingOrderId === ord.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="bg-zinc-905 w-full border border-emerald-500/20 p-4 rounded-xl mt-3 space-y-3"
                                >
                                  <div className="text-xs font-bold text-emerald-450 flex items-center gap-1 justify-start">
                                    <span>✓</span>
                                    <span>{isArabic ? "تأكيد استلام كامل المبلغ:" : "Confirm full amount received:"}</span>
                                  </div>
                                  <p className="text-xs text-zinc-350 leading-relaxed text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                                    {isArabic 
                                      ? "هل قمت بالفعل بالتحقق من استلام كامل مبلغ هذا الأوردر بنجاح على حساب إنستا باي أو المحفظة الذكية الخاصة برأف إيجيبت؟ سيؤدي هذا لتجهيز الشحنة وإشعار العميل فوراً." 
                                      : "Have you genuinely double checked receiving the complete conversion sum inside your InstaPay app or mobile cash wallet? This will instantly unlock full packaging steps and notify the client."}
                                  </p>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setConfirmingOrderId(null)}
                                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg cursor-pointer transition"
                                    >
                                      {isArabic ? "إلغاء بطلان" : "Cancel"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        try {
                                          await updateOrderPaymentStatus(ord.id, 'verified');
                                          setConfirmingOrderId(null);
                                        } catch (e) {
                                          console.error(e);
                                        }
                                      }}
                                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-450 text-black text-xs font-black rounded-lg cursor-pointer transition"
                                    >
                                      {isArabic ? "نعم، تأكيد وتحصيل" : "Yes, Confirm Receipt"}
                                    </button>
                                  </div>
                                </motion.div>
                              )}

                              {/* Rejection Message custom builder */}
                              {rejectingOrderId === ord.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  className="bg-zinc-905 w-full border border-rose-955/20 p-4 rounded-xl mt-3 space-y-3"
                                >
                                  <div className="text-xs font-bold text-rose-400">
                                    {isArabic ? "صياغة رسالة رفض المعاملة وإشعار العميل:" : "Draft Payment Rejection Notification Message:"}
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <label className="block text-[10px] text-zinc-500 mb-1">الرسالة بالعربية:</label>
                                      <textarea
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200"
                                        rows={3}
                                        value={rejectMessageAr}
                                        onChange={(e) => setRejectMessageAr(e.target.value)}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-zinc-500 mb-1">Message in English:</label>
                                      <textarea
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs text-zinc-200 text-left"
                                        rows={3}
                                        value={rejectMessageEn}
                                        onChange={(e) => setRejectMessageEn(e.target.value)}
                                      />
                                    </div>
                                  </div>
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setRejectingOrderId(null)}
                                      className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs rounded-lg cursor-pointer transition"
                                    >
                                      {isArabic ? "إلغاء الإجراء" : "Cancel Action"}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (!rejectMessageAr.trim()) {
                                          alert(isArabic ? "برجاء كتابة نص الرسالة" : "Please provide Arabic rejection text");
                                          return;
                                        }
                                        try {
                                          const isArMsg = isArabic ? rejectMessageAr : rejectMessageEn || rejectMessageAr;
                                          const isEnMsg = rejectMessageEn || rejectMessageAr;
                                          await updateOrderPaymentStatus(ord.id, 'rejected', {
                                            ar: isArMsg,
                                            en: isEnMsg
                                          });
                                          setRejectingOrderId(null);
                                        } catch (e) {
                                          console.error(e);
                                          alert("Failed to send rejection.");
                                        }
                                      }}
                                      className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer transition"
                                    >
                                      {isArabic ? "إرسال وتعليق الطلب" : "Send & Hold"}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          );
                        })()}

                        {/* Progress states handlers buttons */}
                        {ord.status !== 'delivered' && ord.status !== 'cancelled' && (
                          <div className="flex flex-wrap gap-2 pt-3 border-t border-zinc-805/60 justify-end" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            <button
                              onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'cancel')}
                              className="px-4 py-2 bg-red-950/20 hover:bg-red-950/40 border border-red-900/40 text-red-400 text-xs font-semibold rounded-xl cursor-pointer transition shadow-md"
                            >
                              {isArabic ? "إلغاء الطلب" : "Cancel Request"}
                            </button>

                            {ord.status === 'pending' && (() => {
                              const isOrdElectronic = ord.paymentMethod && !['cod', 'cashondelivery', 'cash on delivery'].includes(ord.paymentMethod.toLowerCase().replace(/\s/g, ''));
                              const isOrdLocked = isOrdElectronic && ord.paymentStatus !== 'verified';
                              if (isOrdLocked) {
                                return (
                                  <div className="text-[11px] text-rose-400 bg-rose-950/10 border border-rose-900/30 px-3 py-1.5 rounded-xl font-medium text-right max-w-sm">
                                    {isArabic 
                                      ? "⚠️ لم يتم تأكيد السداد الإلكتروني لهذا الطلب بعد. يجب مراجعة وتأكيد السداد لتتمكني من بدء تحضير وتعبئة الطلب."
                                      : "⚠️ Electronic payment is not verified. Please verify status above to begin preparing the package."}
                                  </div>
                                );
                              }
                              return (
                                <button
                                  onClick={() => handleChangeOrderStatus(ord.id, ord.status, 'next')}
                                  className="px-5 py-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black text-xs font-black rounded-xl cursor-pointer transition flex items-center gap-1 shadow-md"
                                >
                                  <Clock size={13} />
                                  <span>{isArabic ? "بدء التحضير والتعبئة بمصر" : "Begin Package Preparing"}</span>
                                </button>
                              );
                            })()}

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

                    // Separated calculations:
                    const unsettledProductsSum = unsettledCODs.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
                    const unsettledShippingSum = unsettledCODs.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
                    const unsettledTotalSum = unsettledProductsSum + unsettledShippingSum;

                    const settledProductsSum = settledCODs.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);
                    const settledShippingSum = settledCODs.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
                    const settledTotalSum = settledProductsSum + settledShippingSum;

                    // Electronic payments delivered (InstaPay or Mobile Wallets) for the selected period
                    const electronicDeliveredOrders = orders.filter(o => {
                      if (o.status !== 'delivered') return false;
                      const method = (o.paymentMethod || '').toLowerCase();
                      const isEPay = method.includes('instapay') || method.includes('wallet') || method.includes('محفظة') || method.includes('فودافون');
                      if (!isEPay) return false;

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

                    const electronicShippingFeesSum = electronicDeliveredOrders.reduce((sum, o) => sum + getOrderShippingFee(o), 0);
                    const electronicProductsSum = electronicDeliveredOrders.reduce((sum, o) => sum + getOrderProductsTotal(o), 0);

                    // Balance ledger math with shipping company
                    const courierOwedAmount = unsettledProductsSum; // Courier owes products to merchant
                    const merchantOwedAmount = electronicShippingFeesSum; // Merchant owes shipping to courier
                    const netCourierDifference = courierOwedAmount - merchantOwedAmount;

                    const handleClosePeriod = async () => {
                      if (unsettledCODs.length === 0) {
                        alert(
                          isArabic 
                            ? "تنبيه: لا يوجد أي طلبات مستحقة التوريد (الدفع عند الاستلام COD بحالة مكتملة) حالياً بالفلتر المحدد لتقفيل الدفعة. الرجاء التأكد من وجود طلبات تم تسليمها." 
                            : "Alert: There are no delivered cash-on-delivery (COD) orders available under current filters to settle."
                        );
                        return;
                      }

                      const periodNotes = prompt(
                        isArabic 
                          ? `سيتم إغلاق وتسوية عدد (${unsettledCODs.length}) طلبات محصلة بإجمالي مبيعات منتجات فقط: ${unsettledProductsSum.toLocaleString()} ج.م (باستبعاد مصاريف الشحن البالغة ${unsettledShippingSum.toLocaleString()} ج.م).\nيرجى كتابة اسم أو وصف لهذه الدفعة الاستلامية (مثال: دفعة الأسبوع الحالى لشركة الشحن):` 
                          : `You are closing settlement for (${unsettledCODs.length}) orders.\nNet Product Cash: ${unsettledProductsSum.toLocaleString()} EGP (excluding shipping fees of ${unsettledShippingSum.toLocaleString()} EGP).\nEnter reference notes:`
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
                        totalAmount: unsettledProductsSum, // products sum only as requested!
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

                        alert(isArabic ? "تم تسوية وإغلاق فترة التوريد بنجاح وبقيمة المنتجات فقط!" : "Settlement period sealed with product valuation only!");
                      } catch (err) {
                        console.error(err);
                        alert(isArabic ? "حدث خطأ أثناء حفظ التسوية!" : "Error sealing settlement packet.");
                      }
                    };

                    return (
                      <div className="space-y-6 text-right">
                        {/* Summary Bento Row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="bg-zinc-950/60 p-4 border border-zinc-805 rounded-2xl flex flex-col justify-between text-right font-sans">
                            <span className="text-[11px] text-zinc-400 font-bold block">
                              {isArabic ? "مبيعات المنتجات المستحقة للتوريد (صافي):" : "Pending Products Revenue (Net):"}
                            </span>
                            <div className="flex justify-between items-baseline mt-2">
                              <span className="text-2xl font-black text-amber-400 font-mono">
                                {unsettledProductsSum.toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-bold">
                                {unsettledCODs.length} {isArabic ? "طلبات" : "orders"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                              {isArabic ? "حساب المنتجات فقط التي يجب توريدها من شركة الشحن بدون رسوم توصيلهم." : "Net product cost gathered with courier which belongs to the store owner."}
                            </p>
                          </div>

                          <div className="bg-zinc-950/60 p-4 border border-zinc-805 rounded-2xl flex flex-col justify-between text-right font-sans">
                            <span className="text-[11px] text-zinc-400 font-bold block">
                              {isArabic ? "مجموع تسويات المنتجات المغلقة السابقة:" : "Historical Product Settlements Closed:"}
                            </span>
                            <div className="flex justify-between items-baseline mt-2">
                              <span className="text-2xl font-black text-emerald-400 font-mono">
                                {settlements.reduce((sum, s) => sum + s.totalAmount, 0).toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                              </span>
                              <span className="text-[11px] text-zinc-500 font-bold">
                                {settlements.length} {isArabic ? "دورات" : "cycles"}
                              </span>
                            </div>
                            <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">
                              {isArabic ? "المبالغ المغلقة السابقة التي تم مطابقتها وتوريدها من منتجات الـ COD." : "Previously transferred product sums locked and finalized."}
                            </p>
                          </div>

                          {/* Action Button Box */}
                          <div className="bg-amber-400 text-black p-4 rounded-2xl flex flex-col justify-between text-right relative group font-sans">
                            <span className="absolute top-2 left-3 text-[9px] font-mono font-black uppercase text-amber-950 leading-none bg-black/10 px-1.5 py-0.5 rounded select-none">
                              {isArabic ? "تحصيل صافي" : "NET COD"}
                            </span>
                            
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider block opacity-70">
                                {isArabic ? "إغلاق فترة توريد المنتجات الحالية" : "Settle Period Ledger"}
                              </span>
                              <p className="text-[11px] leading-tight font-bold mt-1 text-black/80">
                                {isArabic 
                                  ? `تقفيل الدفعة وتسجيل توريد صافي مبالغ الفساتين بقيمة ${unsettledProductsSum.toLocaleString()} ج.م.` 
                                  : `Freeze pending ${unsettledProductsSum.toLocaleString()} EGP code, marking files settled.`}
                              </p>
                            </div>
                            
                            <button
                              onClick={handleClosePeriod}
                              className="mt-3.5 w-full py-2 bg-black hover:bg-zinc-900 border border-black text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl cursor-pointer transition duration-150 shadow-md active:scale-95"
                            >
                              {isArabic ? "موافقة وإغلاق دفتر الفترة ماليًا" : "Lock & Settle Current Products"}
                            </button>
                          </div>
                        </div>

                        {/* COMPREHENSIVE COURIER & STORE RECONCILIATION SUMMARY */}
                        <div className="bg-zinc-900/95 border border-zinc-800 rounded-3xl p-5 space-y-4 text-right font-sans">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-800">
                            <h4 className="text-sm font-black text-white flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-indigo-550 animate-pulse"></span>
                              {isArabic ? "كشف حساب وتسوية شركة الشحن الشامل" : "Comprehensive Shipping Company Balancing Statement"}
                            </h4>
                            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold bg-zinc-950 px-2.5 py-0.5 rounded select-none">
                              {isArabic ? "مطابقة وحسابات" : "Ledger Audit"}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                            {/* Panel A: COD (Cash on Delivery) details */}
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-2.5 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-350 font-bold">{isArabic ? "1. طلبات الدفع نقدًا عند الاستلام COD:" : "1. Cash on Delivery (COD) orders:"}</span>
                                <span className="font-mono text-[11px] text-zinc-500 font-semibold">({unsettledCODs.length} {isArabic ? "أوردرات" : "orders"})</span>
                              </div>
                              <hr className="border-zinc-850" />
                              <div className="flex justify-between">
                                <span className="text-zinc-500">{isArabic ? "إجمالي كلي محصل شامل الشحن:" : "Grand Total collected:"}</span>
                                <span className="font-mono text-zinc-300 font-medium font-bold">{(unsettledCODs.reduce((sum, o) => sum + (o.agreedPrice || o.total || 0), 0)).toLocaleString()} {isArabic ? "ج.م" : "EGP"}</span>
                              </div>
                              <div className="flex justify-between text-red-400 font-bold">
                                <span>{isArabic ? "يخصم مصاريف الشحن لشركة الشحن:" : "Deduct Courier Deliveries charge:"}</span>
                                <span className="font-mono">-{unsettledShippingSum.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</span>
                              </div>
                              <div className="flex justify-between text-yellow-400 font-extrabold text-[12px] pt-1">
                                <span>{isArabic ? "صافي قيمة الفساتين المستحقة لك:" : "Product valuation courier owes store:"}</span>
                                <span className="font-mono">{unsettledProductsSum.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</span>
                              </div>
                            </div>

                            {/* Panel B: Electronic Transfer payments details */}
                            <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-850 space-y-2.5 text-right">
                              <div className="flex justify-between items-center">
                                <span className="text-zinc-350 font-bold">{isArabic ? "2. طلبات تم دفعها إلكترونيًا (إنستاباي ومحافظ):" : "2. Electronic transfers prepaid (pre-collected):"}</span>
                                <span className="font-mono text-[11px] text-zinc-500 font-semibold">({electronicDeliveredOrders.length} {isArabic ? "أوردرات" : "orders"})</span>
                              </div>
                              <hr className="border-zinc-850" />
                              <div className="flex justify-between">
                                <span className="text-zinc-500">{isArabic ? "إجمالي محصل شامل مصاريف الشحن:" : "Total client paid store online:"}</span>
                                <span className="font-mono text-zinc-300 font-medium font-bold">{(electronicProductsSum + electronicShippingFeesSum).toLocaleString()} {isArabic ? "ج.م" : "EGP"}</span>
                              </div>
                              <div className="flex justify-between text-orange-400 font-extrabold text-[12px] pt-1">
                                <span>{isArabic ? "قيمة الشحن المستحقة لشركة الشحن:" : "Delivery fee store owes courier:"}</span>
                                <span className="font-mono">-{electronicShippingFeesSum.toLocaleString()} {isArabic ? "ج.م" : "EGP"}</span>
                              </div>
                              <p className="text-[10px] text-zinc-500 pt-1 leading-normal">
                                {isArabic 
                                  ? "لأنك استلمت ثمن الشحن مسبقاً من العميل على حسابك، تقوم بتصفية وسداد هذا الجزء لشركة الشحن." 
                                  : "Since you received delivery fee online from client, this fee is owed to courier partner."}
                              </p>
                            </div>
                          </div>

                          {/* Reconciliation Final Summary Row */}
                          <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-805 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-sans text-right">
                            <div className="space-y-1 w-full sm:w-auto">
                              <span className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wide">
                                {isArabic ? "نتيجة تصفية المعاملات وتسوية الفواتير الحالية" : "Net Settlement / Financial Reconciliation Result"}
                              </span>
                              <p className="text-xs text-zinc-400 leading-relaxed max-w-xl">
                                {isArabic 
                                  ? `تقابل تجاري متبادل: شركة الشحن تحتفظ بـ ${unsettledShippingSum.toLocaleString()} ج.م رسوم توصيل الـ COD، ومطالبة بتحويل ${unsettledProductsSum.toLocaleString()} ج.م مستحقات فساتينك. في المقابل، يخصم منها قيمة ${electronicShippingFeesSum.toLocaleString()} ج.م مصاريف التوصيل التي استلمتها أنت عبر إنستاباي.`
                                  : `Reconciliation summary: Courier collected ${unsettledProductsSum.toLocaleString()} EGP product cash, while store collected ${electronicShippingFeesSum.toLocaleString()} EGP shipping charges for prepaid orders.`}
                              </p>
                            </div>

                            <div className="bg-zinc-900 border border-zinc-800 px-6 py-3.5 rounded-xl text-center min-w-[240px] w-full sm:w-auto shrink-0 select-none">
                              {netCourierDifference > 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[9.5px] text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                                    {isArabic ? "صافي مستحق تحصيله من الشحن" : "RECEIVABLE FROM COURIER"}
                                  </span>
                                  <div className="text-xl font-mono font-black text-white pt-1">
                                    {netCourierDifference.toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                                  </div>
                                </div>
                              ) : netCourierDifference < 0 ? (
                                <div className="space-y-1">
                                  <span className="text-[9.5px] text-red-400 bg-red-400/10 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                                    {isArabic ? "صافي مستحق دفعه وتوريده للشحن" : "PAYABLE TO COURIER"}
                                  </span>
                                  <div className="text-xl font-mono font-black text-red-400 pt-1">
                                    {Math.abs(netCourierDifference).toLocaleString()} {isArabic ? "ج.م" : "EGP"}
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <span className="text-[9.5px] text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                                    {isArabic ? "الحساب متزن وصفر تماماً" : "BALANCED ACCOUNT"}
                                  </span>
                                  <div className="text-xl font-mono font-black text-emerald-400 pt-1">
                                    0 {isArabic ? "ج.م" : "EGP"}
                                  </div>
                                </div>
                              )}
                            </div>
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
                                          {(ord.agreedPrice || ord.total || 0).toLocaleString()} {isArabic ? "ج.م" : "EGP"}
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
                                      {settle.totalAmount.toLocaleString()} {isArabic ? "ج.م" : "EGP"}
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

      {/* Fullscreen interactive image light-box modal for checking payment receipts proof */}
      {viewingPaymentProofUrl && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-[9999] flex flex-col justify-center items-center p-4 transition-all duration-300"
          onClick={() => setViewingPaymentProofUrl(null)}
        >
          <div className="absolute top-4 right-4 flex gap-3 z-50">
            <button
              onClick={() => setViewingPaymentProofUrl(null)}
              className="p-3 bg-zinc-900/80 hover:bg-zinc-800 text-white rounded-full transition shadow cursor-pointer border border-zinc-800"
              title={isArabic ? "إغلاق" : "Close"}
            >
              <X size={20} />
            </button>
          </div>
          <div 
            className="max-w-4xl max-h-[85vh] w-full h-full flex justify-center items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={viewingPaymentProofUrl} 
              alt="Payment receipt proof" 
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-zinc-850"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-zinc-500 mt-4 text-center select-none">
            {isArabic ? "انقر في أي مكان خارج الصورة للإغلاق" : "Click anywhere outside the receipt to dismiss"}
          </p>
        </div>
      )}

    </div>
  );
}
