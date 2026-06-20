import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { 
  getUserProfile, 
  saveUserProfile, 
  subscribeToCustomerOrders, 
  subscribeToProducts,
  subscribeToNotifications,
  markNotificationAsRead,
  subscribeToCustomerConversations,
  subscribeToConversationMessages,
  sendConversationMessage,
  addSavedAddress,
  updateSavedAddress,
  deleteSavedAddress,
  setDefaultSavedAddress,
  toggleProductFavorite,
  toggleSearchAlert,
  subscribeToUserProfile,
  resubmitOrderPayment
} from '../dbService';
import { Order, OrderStatus, Product, SavedAddress, FavoriteItem, Notification, Conversation, ConversationMessage } from '../types';
import { 
  User, Shield, Package, LayoutGrid, Clock, MapPin, Truck, Phone, 
  LogOut, CheckCircle, Edit, Check, Heart, Trash2, Plus, AlertCircle, Bell, Eye, Search, Star, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerProfileProps {
  uid: string;
  onLogout: () => void;
  isArabic: boolean;
  onBrowseShop: () => void;
  initialTab?: 'addresses' | 'orders' | 'favorites' | 'custom';
}

const EGYPTIAN_CITIES = [
  { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo' },
  { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza' },
  { id: 'alex', nameAr: 'الإسكندرية', nameEn: 'Alexandria' },
  { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia' },
  { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia' },
  { id: 'dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
  { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia' },
  { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia' },
  { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira' },
  { id: 'suez', nameAr: 'السويس', nameEn: 'Suez' },
  { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia' },
  { id: 'portsaid', nameAr: 'بورسعيد', nameEn: 'Port Said' },
  { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag' },
  { id: 'asyut', nameAr: 'أسيوط', nameEn: 'Asyut' },
  { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor' },
  { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan' }
];

export default function CustomerProfile({ uid, onLogout, isArabic, onBrowseShop, initialTab }: CustomerProfileProps) {
  const [profileData, setProfileData] = useState<{ 
    name: string; 
    phone: string; 
    address: string; 
    city: string;
    addresses?: SavedAddress[];
    favorites?: FavoriteItem[];
    searchAlerts?: string[];
    points?: number;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'addresses' | 'orders' | 'favorites' | 'custom'>(initialTab || 'orders');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [conversationDraft, setConversationDraft] = useState('');
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  
  // Sidebar alerts state
  const [newAlertTerm, setNewAlertTerm] = useState('');
  
  // Adding address form states
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCityId, setNewCityId] = useState('cairo');
  const [newDetails, setNewDetails] = useState('');
  const [newIsDefault, setNewIsDefault] = useState(false);

  // Profile basic info modification
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Image receipt zoom popup
  const [zoomedReceipt, setZoomedReceipt] = useState<string | null>(null);

  // Resubmission of payment states (saved by orderId)
  const [paymentResubmitImage, setPaymentResubmitImage] = useState<Record<string, string>>({});
  const [paymentResubmitNotes, setPaymentResubmitNotes] = useState<Record<string, string>>({});
  const [isResubmittingPayment, setIsResubmittingPayment] = useState<Record<string, boolean>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [operationPending, setOperationPending] = useState(false);

  // Live collections setup
  useEffect(() => {
    let unsubsProfile: () => void = () => {};
    let unsubsOrders: () => void = () => {};
    let unsubsProducts: () => void = () => {};
    let unsubsNotifs: () => void = () => {};
    let unsubsChats: () => void = () => {};

    const loadCoreData = async () => {
      setIsLoading(true);
      
      try {
        // Subscribe to user profile real-time
        unsubsProfile = subscribeToUserProfile(uid, (uData) => {
          if (uData) {
            setProfileData({
              name: uData.name || '',
              phone: uData.phone || '',
              address: uData.address || '',
              city: uData.city || 'Cairo',
              addresses: uData.addresses || [],
              favorites: uData.favorites || [],
              searchAlerts: uData.searchAlerts || [],
              points: uData.points || 0
            });
            setEditName(uData.name || '');
            setEditPhone(uData.phone || '');
          } else {
            setProfileData({
              name: auth.currentUser?.displayName || 'RAAV Shopper',
              phone: '',
              address: '',
              city: 'Cairo',
              addresses: [],
              favorites: [],
              searchAlerts: [],
              points: 0
            });
            setEditName(auth.currentUser?.displayName || 'RAAV Shopper');
          }
        });

        // 1. Subscribe to consumer orders
        unsubsOrders = subscribeToCustomerOrders(uid, (orderList) => {
          setOrders(orderList);
        });

        // 2. Subscribe to catalog products for wishlist linking
        unsubsProducts = subscribeToProducts((prodList) => {
          setProducts(prodList);
        });

        // 3. Subscribe to real-time client notifications
        unsubsNotifs = subscribeToNotifications(uid, (notifList) => {
          setNotifications(notifList);
        });

        // 4. Customer conversations for custom accessories and chat follow-up
        unsubsChats = subscribeToCustomerConversations(uid, (threads) => {
          setConversations(threads);
          if (!selectedConversationId && threads.length > 0) {
            setSelectedConversationId(threads[0].id);
          }
        });
      } catch (err) {
        console.error("Failed to load core data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadCoreData();

    return () => {
      unsubsProfile();
      unsubsOrders();
      unsubsProducts();
      unsubsNotifs();
      unsubsChats();
    };
  }, [uid]);

  useEffect(() => {
    if (!selectedConversationId) {
      setConversationMessages([]);
      return;
    }

    const unsubscribeMessages = subscribeToConversationMessages(selectedConversationId, setConversationMessages);
    return () => unsubscribeMessages();
  }, [selectedConversationId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [conversationMessages, selectedConversationId, activeTab]);

  // Refresh user profile after write updates
  const reloadUserProfileSilently = async () => {
    const updated = await getUserProfile(uid);
    if (updated) {
      setProfileData({
        name: updated.name || '',
        phone: updated.phone || '',
        address: updated.address || '',
        city: updated.city || 'Cairo',
        addresses: updated.addresses || [],
        favorites: updated.favorites || [],
        searchAlerts: updated.searchAlerts || [],
        points: updated.points || 0
      });
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setOperationPending(true);
    try {
      await saveUserProfile(uid, {
        name: editName.trim(),
        phone: editPhone.trim(),
        address: profileData?.address || '',
        city: profileData?.city || 'Cairo'
      });
      setIsEditingProfile(false);
      await reloadUserProfileSilently();
    } catch (err) {
      console.error(err);
    } finally {
      setOperationPending(false);
    }
  };

  // Address CRUD Handlers
  const handleAddAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecipient.trim() || !newPhone.trim() || !newDetails.trim()) return;
    setOperationPending(true);
    try {
      await addSavedAddress(uid, {
        recipientName: newRecipient.trim(),
        phone: newPhone.trim(),
        cityId: newCityId,
        addressDetails: newDetails.trim(),
        isDefault: newIsDefault
      });
      // Reset form fields
      setNewRecipient('');
      setNewPhone('');
      setNewDetails('');
      setNewIsDefault(false);
      setShowAddAddress(false);
      await reloadUserProfileSilently();
    } catch (err) {
      console.error(err);
    } finally {
      setOperationPending(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!confirm(isArabic ? 'هل تريد بالتأكيد حذف هذا العنوان؟' : 'Are you sure you want to delete this address?')) return;
    try {
      await deleteSavedAddress(uid, addrId);
      await reloadUserProfileSilently();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkDefaultAddress = async (addrId: string) => {
    try {
      await setDefaultSavedAddress(uid, addrId);
      await reloadUserProfileSilently();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendConversationMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversationId || !conversationDraft.trim()) return;
    try {
      await sendConversationMessage(selectedConversationId, {
        senderId: uid,
        senderRole: 'customer',
        senderName: profileData?.name || auth.currentUser?.displayName || 'Customer',
        text: conversationDraft.trim()
      });
      setConversationDraft('');
    } catch (err) {
      console.error(err);
    }
  };

  // Favorites logic (Enforcing 1-month-only display filter)
  const renderFavorites = () => {
    const rawFavorites = profileData?.favorites || [];
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    
    // Filter favorites valid for max 30 days
    const activeFavorites = rawFavorites.filter((f) => {
      const ageMs = Date.now() - f.savedAt;
      return ageMs <= ONE_MONTH_MS;
    });

    if (activeFavorites.length === 0) {
      return (
        <div className="py-16 text-center space-y-4">
          <Heart size={40} className="text-zinc-200 fill-zinc-50 mx-auto" strokeWidth={1} />
          <div>
            <p className="text-zinc-700 font-semibold text-sm">
              {isArabic ? "قائمة المفضلات فارغة حالياً!" : "Your favorites shelf is empty!"}
            </p>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {isArabic 
                ? "يتم حفظ الموديلات التي تضعها في المفضلة لمدة شهر واحد فقط لتسهيل الطلب والمقاس."
                : "Your stylish likes are kept for 1 month only before rotating automatically."}
            </p>
          </div>
          <button onClick={onBrowseShop} className="px-5 py-2 bg-black text-white rounded-full text-xs font-semibold cursor-pointer">
            {isArabic ? "تصفح موديلات فريدة" : "Discover Styles"}
          </button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeFavorites.map((fav) => {
          const product = products.find(p => p.id === fav.productId);
          if (!product) return null;

          const daysLeft = Math.max(1, Math.ceil((ONE_MONTH_MS - (Date.now() - fav.savedAt)) / (24 * 60 * 60 * 1000)));

          return (
            <motion.div 
              key={product.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-4 border border-zinc-100 rounded-xl flex gap-4 hover:shadow-md transition"
            >
              <img 
                src={product.image} 
                alt={isArabic ? product.nameAr : product.nameEn} 
                className="w-16 h-20 object-cover bg-zinc-50 border border-zinc-100 rounded-lg"
              />
              <div className="flex-1 flex flex-col justify-between" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                <div>
                  <h4 className="text-zinc-900 font-medium text-xs sm:text-sm line-clamp-1">
                    {isArabic ? product.nameAr : product.nameEn}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-zinc-900 font-bold text-xs sm:text-sm">
                      {product.price} {isArabic ? "ج.م" : "EGP"}
                    </span>
                    <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Clock size={8} />
                      <span>{isArabic ? `متبقى ${daysLeft} يوم` : `${daysLeft}d left`}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2">
                  <button 
                    onClick={() => onBrowseShop()} 
                    className="px-3 py-1 bg-zinc-950 text-white rounded-full text-[10px] font-medium hover:bg-amber-800 transition cursor-pointer"
                  >
                    {isArabic ? "طلب الموديل" : "Order outfit"}
                  </button>
                  <button 
                    onClick={async () => {
                      await toggleProductFavorite(uid, product.id);
                      await reloadUserProfileSilently();
                    }}
                    className="p-1 px-2 border border-zinc-200 text-zinc-450 hover:bg-rose-50 hover:text-rose-600 rounded-full transition cursor-pointer text-[10px]"
                    title={isArabic ? "إزالة" : "Remove"}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    );
  };

  // Search Alerts management
  const handleAddSearchAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlertTerm.trim()) return;
    try {
      await toggleSearchAlert(uid, newAlertTerm.trim());
      setNewAlertTerm('');
      await reloadUserProfileSilently();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReadNotification = async (id: string) => {
    try {
      await markNotificationAsRead(id);
    } catch (err) {
      console.error(err);
    }
  };

  const getCityName = (cityId: string) => {
    const matched = EGYPTIAN_CITIES.find(c => c.id === cityId);
    return matched ? (isArabic ? matched.nameAr : matched.nameEn) : cityId;
  };

  const getUnreadNotifsCount = () => {
    return notifications.filter(n => !n.isRead).length;
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onLogout();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex items-center justify-center font-sans bg-[#fbfbfc]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-400 uppercase tracking-widest">
            {isArabic ? "جاري تحميل بيانات حسابك الآمن..." : "Verifying Profile Security..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fbfcff] min-h-screen pt-24 pb-20 font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Upper Profile Banner */}
        <div className="mb-10 p-6 sm:p-8 bg-zinc-900 text-white rounded-3xl relative overflow-hidden shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-6" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-950/20 via-transparent to-black/30 pointer-events-none" />
          
          <div className="relative z-10 flex items-center gap-4">
            <span className="p-4 bg-zinc-800 text-amber-500 rounded-2xl border border-zinc-700/50">
              <User size={30} strokeWidth={1.5} />
            </span>
            <div>
              <div className="flex items-center gap-2 justify-start flex-wrap">
                <h1 className="text-2xl font-serif font-medium text-white">
                  {profileData?.name || 'RAAV Customer'}
                </h1>
                <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-bold tracking-widest uppercase">
                  {isArabic ? "عضو متميز" : "Premium Shopper"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                {auth.currentUser?.email}
              </p>
              
              {/* Customer points total badge */}
              <div className="flex items-center gap-2 mt-2">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-xs text-zinc-200">
                  {isArabic 
                    ? `رصيد النقاط المكتسبة: ${profileData?.points || 0} نقطة` 
                    : `Earned Loyalty Points: ${profileData?.points || 0} pts`}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 w-full md:w-auto justify-end md:justify-start items-center">
            {isEditingProfile ? (
              <form onSubmit={handleEditProfileSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-zinc-800/80 p-2.5 rounded-2xl border border-zinc-700 w-full sm:w-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={e => setEditName(e.target.value)} 
                    placeholder={isArabic ? "الاسم" : "Name"}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-white w-full sm:w-28"
                    required
                  />
                  <input 
                    type="tel" 
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)} 
                    placeholder={isArabic ? "الهاتف" : "Phone"}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none text-white w-full sm:w-28 text-center"
                  />
                </div>
                <div className="flex gap-1.5 justify-end">
                  <button type="submit" disabled={operationPending} className="p-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white flex-1 sm:flex-initial flex items-center justify-center cursor-pointer">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setIsEditingProfile(false)} className="p-2 bg-zinc-700 hover:bg-zinc-650 rounded-lg text-zinc-300 flex-1 sm:flex-initial flex items-center justify-center cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs border border-zinc-700 rounded-xl transition text-zinc-200 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              >
                <Edit size={13} />
                <span>{isArabic ? "تعديل الحساب" : "Edit Profile"}</span>
              </button>
            )}

            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-zinc-800 hover:bg-red-950 hover:text-red-300 text-xs border border-zinc-700 hover:border-red-900 rounded-xl transition text-zinc-350 flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center text-zinc-300"
            >
              <LogOut size={13} />
              <span>{isArabic ? "خروج" : "Logout"}</span>
            </button>
          </div>
        </div>

        {/* Dashboard Content Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEFT SIDE PANEL: Notifications Center and Search Alerts */}
          <div className="lg:col-span-1 space-y-6 order-2 lg:order-1">
            
            {/* In-App Notifications Center with realtime update */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
              <div className="flex justify-between items-center border-b border-zinc-50 pb-3 mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                  <Bell size={14} className="text-zinc-500" />
                  <span>{isArabic ? "مركز التنبيهات والطلبات" : "Alerts & Order Status"}</span>
                </h3>
                {getUnreadNotifsCount() > 0 && (
                  <span className="bg-rose-500 text-white font-bold text-[9px] px-2 py-0.5 rounded-full animate-bounce">
                    {getUnreadNotifsCount()} {isArabic ? "جديد" : "New"}
                  </span>
                )}
              </div>

              {notifications.length === 0 ? (
                <div className="py-8 text-center text-zinc-400 text-xs font-light">
                  {isArabic ? "لا توجد تنبيهات جديدة في حسابك" : "You have no active alerts."}
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-3 rounded-xl border transition-all ${
                        notif.isRead 
                          ? 'bg-zinc-50/50 border-zinc-100 text-zinc-500' 
                          : 'bg-amber-50/50 border-amber-100 text-zinc-900 shadow-xs'
                      }`}
                      style={{ textAlign: isArabic ? 'right' : 'left' }}
                    >
                      <p className="text-xs leading-relaxed font-medium">
                        {isArabic ? notif.messageAr : notif.messageEn}
                      </p>
                      <div className="flex justify-between items-center mt-2 border-t border-dotted border-zinc-200/50 pt-1.5 text-[9px] text-zinc-400">
                        <span>{new Date(notif.createdAt).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        {!notif.isRead && (
                          <button 
                            onClick={() => handleReadNotification(notif.id)}
                            className="text-amber-700 hover:text-black font-semibold cursor-pointer underline shrink-0"
                          >
                            {isArabic ? "قراءة" : "Mark as read"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Search Term alerts config */}
            <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm">
              <div className="border-b border-zinc-50 pb-3 mb-4 text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2 justify-start">
                  <Search size={14} className="text-zinc-500" />
                  <span>{isArabic ? "أبلغني بجديد RAAV" : "Product Arrival Alerts"}</span>
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                  {isArabic 
                    ? "سجل كلمات البحث التي تهتم بها (مثل: فستان، قميص) وسنخطرك فوراً عند توفر أي موديل يطابقها!"
                    : "Add keywords (e.g. dress, men, linen). We'll notify you automatically when they match new catalog releases!"}
                </p>
              </div>

              <form onSubmit={handleAddSearchAlert} className="flex gap-1.5 mb-4">
                <input 
                  type="text" 
                  value={newAlertTerm}
                  onChange={e => setNewAlertTerm(e.target.value)}
                  placeholder={isArabic ? "مثال: فستان، كتان..." : "e.g. shirt, silk..."}
                  className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs px-3 focus:outline-none focus:bg-white focus:border-zinc-950 text-zinc-800"
                  required
                />
                <button type="submit" className="p-2.5 bg-zinc-950 text-white hover:bg-zinc-850 rounded-lg cursor-pointer">
                  <Plus size={13} />
                </button>
              </form>

              {/* Alert tags list */}
              <div className="flex flex-wrap gap-1.5">
                {(profileData?.searchAlerts || []).map((term, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-50 border border-zinc-200 text-[10px] text-zinc-700 rounded-full font-medium">
                    <span>{term}</span>
                    <button 
                      type="button" 
                      onClick={async () => {
                        await toggleSearchAlert(uid, term);
                        await reloadUserProfileSilently();
                      }}
                      className="text-red-500 hover:text-red-700 font-bold shrink-0 text-[9px] cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {(profileData?.searchAlerts || []).length === 0 && (
                  <span className="text-[10px] text-zinc-400 italic">
                    {isArabic ? "لا توجد كلمات منبهة نشطة" : "No search alerting terms registered yet."}
                  </span>
                )}
              </div>
            </div>

          </div>

          {/* MAIN COLUMN (2 cols gap): Tabbed details display */}
          <div className="lg:col-span-2 space-y-6 order-1 lg:order-2">
            
            {/* Navigation Tabs */}
            <div 
              className="bg-white p-1.5 sm:p-2 rounded-2xl border border-zinc-150/80 shadow-xs flex gap-1 overflow-x-auto sm:overflow-visible shrink-0 snap-x"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex-1 shrink-0 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer snap-start ${
                  activeTab === 'orders' 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'text-zinc-650 hover:bg-zinc-50'
                }`}
              >
                <Package size={14} className="shrink-0" />
                <span>{isArabic ? "طلبات الشراء" : "Purchases"}</span>
                <span className={`px-2 py-0.5 text-[9px] rounded-full shrink-0 ${
                  activeTab === 'orders' ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('addresses')}
                className={`flex-1 shrink-0 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer snap-start ${
                  activeTab === 'addresses' 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'text-zinc-650 hover:bg-zinc-50'
                }`}
              >
                <MapPin size={14} className="shrink-0" />
                <span>{isArabic ? "العناوين المحفوظة" : "Addresses Details"}</span>
                <span className={`px-2 py-0.5 text-[9px] rounded-full shrink-0 ${
                  activeTab === 'addresses' ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {(profileData?.addresses || []).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('favorites')}
                className={`flex-1 shrink-0 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer snap-start ${
                  activeTab === 'favorites' 
                    ? 'bg-zinc-950 text-white shadow-sm' 
                    : 'text-zinc-650 hover:bg-zinc-50'
                }`}
              >
                <Heart size={14} className="shrink-0" />
                <span>{isArabic ? "المفضلة الشهرية" : "My Wishlist"}</span>
                <span className={`px-2 py-0.5 text-[9px] rounded-full shrink-0 ${
                  activeTab === 'favorites' ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {(profileData?.favorites || []).length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 shrink-0 py-2.5 sm:py-3 px-3 sm:px-4 text-xs sm:text-sm font-medium rounded-xl transition flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer snap-start ${
                  activeTab === 'custom'
                    ? 'bg-zinc-950 text-white shadow-sm'
                    : 'text-zinc-650 hover:bg-zinc-50'
                }`}
              >
                <Sparkles size={14} className="shrink-0" />
                <span>{isArabic ? "طلبات مخصصة" : "Custom Requests"}</span>
                <span className={`px-2 py-0.5 text-[9px] rounded-full shrink-0 ${
                  activeTab === 'custom' ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-100 text-zinc-500'
                }`}>
                  {(orders.filter((order) => order.orderType === 'custom')).length}
                </span>
              </button>
            </div>

            {/* TAB CONTENTS CONTAINER */}
            <div className="bg-white rounded-2xl border border-zinc-105/80 p-4 sm:p-8 shadow-xs">
              
              {/* TAB 1: ORDERS HISTORY */}
              {activeTab === 'orders' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-50 pb-3 mb-2" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    <h3 className="text-sm font-serif font-medium text-zinc-900">
                      {isArabic ? "بيانات وسجل طلباتك" : "Logged Transactions"}
                    </h3>
                    <span className="text-[10px] text-zinc-400 italic">
                      {isArabic ? "الدفع عند الاستلام أو بمحفظة/InstaPay" : "COD & electronic uploads"}
                    </span>
                  </div>

                  {orders.length === 0 ? (
                    <div className="py-16 text-center space-y-4">
                      <LayoutGrid size={36} className="text-zinc-200 animate-pulse mx-auto" />
                      <div>
                        <p className="text-zinc-700 font-semibold text-xs sm:text-sm">
                          {isArabic ? "لم تقم بتسجيل أي طلب بعد!" : "No apparel purchases logged yet."}
                        </p>
                        <p className="text-[11px] text-zinc-450 mt-1 max-w-sm mx-auto leading-relaxed">
                          {isArabic 
                            ? "تسوق التشكيلة الفريدة من الملابس الأنيقة الممتازة وباشر طلباتك الآن!"
                            : "Configure your basket with some of the most beautiful designs cataloged!"}
                        </p>
                      </div>
                      <button onClick={onBrowseShop} className="px-5 py-2 bg-black text-white hover:bg-zinc-900 text-xs font-semibold rounded-full cursor-pointer">
                        {isArabic ? "تصفح المتجر الفاخر" : "Discover Collections"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {orders.filter((order) => order.orderType !== 'custom').map((order) => {
                        const isElectronic = order.paymentMethod && !['cod', 'cashondelivery', 'cash on delivery'].includes(order.paymentMethod.toLowerCase().replace(/\s/g, ''));
                        return (
                          <div key={order.id} className="border border-zinc-100 bg-zinc-50/50 rounded-2xl p-5 space-y-4 text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                            
                            {/* Order metadata line */}
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-zinc-200/40 pb-3 font-sans text-xs text-zinc-500">
                              <div>
                                <div className="flex items-center gap-2 justify-start flex-wrap">
                                  <span className="font-mono font-medium text-zinc-900">#{order.id.slice(0, 12)}...</span>
                                  <span className="text-[9px] bg-zinc-200/60 px-2 py-0.5 rounded text-zinc-650">
                                    {new Date(order.createdAt).toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-[10px] text-zinc-400 mt-1 font-light">
                                  {isArabic 
                                    ? `طريقة الدفع: ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : order.paymentMethod}` 
                                    : `Pay Method: ${order.paymentMethod}`}
                                </p>
                              </div>

                              {/* Status and receipts preview */}
                              <div className="flex items-center gap-2 self-end sm:self-auto font-sans flex-wrap">
                                {order.paymentProof && (
                                  <button 
                                    onClick={() => setZoomedReceipt(order.paymentProof!)}
                                    className="text-[10px] text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition"
                                  >
                                    <Eye size={10} />
                                    <span>{isArabic ? "عرض إيصال التحويل" : "View Receipt"}</span>
                                  </button>
                                )}

                                {isElectronic && (
                                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                    order.paymentStatus === 'verified' 
                                      ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                                      : order.paymentStatus === 'rejected' 
                                        ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                                        : 'bg-amber-50 text-amber-600 border-amber-100'
                                  }`}>
                                    {order.paymentStatus === 'verified' && (isArabic ? "تأكيد السداد: مقبول" : "Payment Confirmed")}
                                    {order.paymentStatus === 'rejected' && (isArabic ? "تأكيد السداد: مرفوض" : "Payment Rejected")}
                                    {(order.paymentStatus === 'pending_verification' || !order.paymentStatus) && (isArabic ? "انتظار مراجعة السداد" : "Awaiting Verification")}
                                  </span>
                                )}

                                {order.status === 'pending' && (
                                  <span className="bg-amber-50 text-amber-600 border border-amber-100 rounded-full px-3 py-1 text-[10px] font-bold">
                                    {isArabic ? "جاري المراجعة" : "Reviewing"}
                                  </span>
                                )}
                                {order.status === 'preparing' && (
                                  <span className="bg-blue-50 text-blue-600 border border-blue-100 rounded-full px-3 py-1 text-[10px] font-bold">
                                    {isArabic ? "يتم التحضير والقص" : "Preparing Fashion"}
                                  </span>
                                )}
                                {order.status === 'shipped' && (
                                  <span className="bg-indigo-50 text-indigo-600 border border-indigo-150 rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                                    <Truck size={10} />
                                    <span>{isArabic ? "مع المندوب للتوصيل" : "Shipped / Deliver"}</span>
                                  </span>
                                )}
                                {order.status === 'delivered' && (
                                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full px-3 py-1 text-[10px] font-bold flex items-center gap-1">
                                    <CheckCircle size={10} />
                                    <span>{isArabic ? "تم الاستلام" : "Delivered"}</span>
                                  </span>
                                )}
                                {order.status === 'cancelled' && (
                                  <span className="bg-red-50 text-red-600 border border-red-100 rounded-full px-3 py-1 text-[10px] font-bold">
                                    {isArabic ? "ملغي" : "Cancelled"}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Items listing inside card */}
                            <div className="space-y-3">
                              {(order.items || []).map((item, idx) => (
                                <div key={idx} className="flex gap-3 items-center">
                                  <img
                                    src={item.image}
                                    alt={isArabic ? item.nameAr : item.nameEn}
                                    className="w-10 h-12 object-cover bg-zinc-100 rounded-lg border border-zinc-200"
                                  />
                                  <div className="flex-1 text-right text-xs" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                    <h4 className="text-zinc-900 font-medium line-clamp-1">
                                      {isArabic ? item.nameAr : item.nameEn}
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 mt-1">
                                      {isArabic ? `مقاس: ${item.selectedSize} - لون:` : `Size: ${item.selectedSize} - Color:`}
                                      <span className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-200 mx-1 align-middle" style={{ backgroundColor: item.selectedColor }} />
                                    </p>
                                  </div>
                                  <div className="text-xs font-semibold text-zinc-900">
                                    {item.quantity} × {item.price} {isArabic ? "ج.م" : "EGP"}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Order Total Receipt Line */}
                            <div className="pt-3 border-t border-zinc-200/30 flex justify-between items-center text-xs font-semibold">
                              <span className="text-zinc-500">{isArabic ? "إجمالي قيمة الفاتورة الشاملة:" : "Total Premium Despatched:"}</span>
                              <span className="text-zinc-950 text-sm font-bold font-serif">{order.total} {isArabic ? "ج.م" : "EGP"}</span>
                            </div>

                            {/* Resubmit payment section on paymentStatus === 'rejected' */}
                            {isElectronic && order.paymentStatus === 'rejected' && (
                              <div className="mt-3 p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs space-y-3">
                                <div className="flex items-center gap-2 text-rose-800 font-bold">
                                  <AlertCircle size={14} className="shrink-0" />
                                  <span>
                                    {isArabic 
                                      ? "تم رفض وثيقة الخطوة السابقة من السداد لهذا الطلب." 
                                      : "The payment proof for this order was rejected."}
                                  </span>
                                </div>
                                <p className="text-zinc-600 leading-relaxed font-light">
                                  {isArabic
                                    ? "المرجو كتابة تفاصيل السداد الجديد (مثل رقم التحويل أو المحفظة الإلكترونية) وإرفاق الإيصال الجديد ليتم تواصل الإدارة ومراجعة المعاملة فوراً."
                                    : "Please write details of your new payment (or wallet number) and attach the new receipt so that management can re-verify and approve your order immediately."}
                                </p>

                                <div className="space-y-3 pt-1">
                                  {/* Text comment input */}
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                                      {isArabic ? "تفاصيل السداد الجديد / رسالتك للإدارة:" : "New Payment details / Message directly to admin:"}
                                    </label>
                                    <textarea
                                      className="w-full p-2 bg-white border border-zinc-200 rounded-lg text-xs font-sans text-zinc-800 focus:outline-none focus:border-rose-400 placeholder:text-zinc-400"
                                      rows={2}
                                      placeholder={isArabic ? "اكتبي الرقم المحول منه، المحفظة، المعاملة، أو غيرها..." : "e.g., wallet number, InstaPay transaction handle, reference..."}
                                      value={paymentResubmitNotes[order.id] || ""}
                                      onChange={(e) => {
                                        setPaymentResubmitNotes(prev => ({
                                          ...prev,
                                          [order.id]: e.target.value
                                        }));
                                      }}
                                    />
                                  </div>

                                  {/* Image base64 upload label */}
                                  <div>
                                    <label className="block text-[10px] uppercase font-bold text-zinc-500 mb-1">
                                      {isArabic ? "صورة إثبات السداد المحدث (مطلوب):" : "Updated Receipt Image Proof (Required):"}
                                    </label>
                                    <div className="flex gap-2 items-center">
                                      <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-zinc-300 hover:border-zinc-400 rounded-xl p-3 bg-white cursor-pointer transition">
                                        <span className="text-[11px] text-zinc-500 font-medium">
                                          {paymentResubmitImage[order.id] 
                                            ? (isArabic ? "✅ تم اختيار صورة الإيصال" : "✅ Receipt image selected")
                                            : (isArabic ? "📁 اضغطي هنا لاختيار الصورة" : "📁 Click to select screenshot")}
                                        </span>
                                        <input 
                                          type="file" 
                                          accept="image/*" 
                                          className="hidden" 
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                              try {
                                                const base64 = await new Promise<string>((resolve, reject) => {
                                                  const reader = new FileReader();
                                                  reader.readAsDataURL(file);
                                                  reader.onload = () => resolve(reader.result as string);
                                                  reader.onerror = error => reject(error);
                                                });
                                                setPaymentResubmitImage(prev => ({
                                                  ...prev,
                                                  [order.id]: base64
                                                }));
                                              } catch (err) {
                                                console.error("Failed to parse proof image:", err);
                                              }
                                            }
                                          }}
                                        />
                                      </label>
                                      
                                      {paymentResubmitImage[order.id] && (
                                        <img 
                                          src={paymentResubmitImage[order.id]} 
                                          className="w-10 h-12 object-cover rounded border border-zinc-200" 
                                          alt="Preview" 
                                        />
                                      )}
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    disabled={isResubmittingPayment[order.id]}
                                    onClick={async () => {
                                      const img = paymentResubmitImage[order.id];
                                      if (!img) {
                                        alert(isArabic 
                                          ? "يرجى إرفاق صورة الإيصال الجديد أولاً!" 
                                          : "Please attach a new receipt screenshot first!");
                                        return;
                                      }
                                      
                                      setIsResubmittingPayment(prev => ({ ...prev, [order.id]: true }));
                                      try {
                                        await resubmitOrderPayment(order.id, img, paymentResubmitNotes[order.id] || "");
                                        alert(isArabic 
                                          ? "تم إعادة إرسال بيانات الإيصال والسداد الجديد للإدارة بنجاح ويجري تدقيقها من قبل المسؤولين." 
                                          : "New payment details and proof submitted to management. Administrators will verify it shortly.");
                                        
                                        // Clear states
                                        setPaymentResubmitImage(prev => {
                                          const copy = { ...prev };
                                          delete copy[order.id];
                                          return copy;
                                        });
                                        setPaymentResubmitNotes(prev => {
                                          const copy = { ...prev };
                                          delete copy[order.id];
                                          return copy;
                                        });
                                      } catch (err) {
                                        console.error(err);
                                        alert(isArabic 
                                          ? "حدث خطأ أثناء إرسال البيانات المسجلة، يرجى المحاولة ثانيةً." 
                                          : "There was an error updating your payment details, please try again.");
                                      } finally {
                                        setIsResubmittingPayment(prev => ({ ...prev, [order.id]: false }));
                                      }
                                    }}
                                    className={`w-full py-2 px-4 rounded-xl text-xs font-bold text-white transition ${
                                      isResubmittingPayment[order.id]
                                        ? "bg-zinc-300 cursor-not-allowed text-zinc-500"
                                        : "bg-rose-600 hover:bg-rose-500 cursor-pointer shadow-md"
                                    }`}
                                  >
                                    {isResubmittingPayment[order.id] 
                                      ? (isArabic ? "جاري إرسال البيانات ومزامنتها..." : "Submitting new data...") 
                                      : (isArabic ? "إرسال السداد الجديد وإعادة المراجعة للطلب" : "Submit New Receipt & Request Re-verification")}
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SAVED ADDRESSES WITH FULL CRUD */}
              {activeTab === 'addresses' && (
                <div className="space-y-6">
                  
                  <div className="flex justify-between items-center border-b border-zinc-50 pb-3 mb-2" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    <h3 className="text-sm font-serif font-medium text-zinc-900">
                      {isArabic ? "إدارة العناوين المسجلة" : "Your Saved Checkout Locations"}
                    </h3>
                    <button
                      onClick={() => setShowAddAddress(!showAddAddress)}
                      className="px-3 py-1.5 bg-black hover:bg-zinc-900 text-white rounded-xl text-xs font-medium transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>{isArabic ? "إضافة عنوان جديد" : "Add Location"}</span>
                    </button>
                  </div>

                  {/* Inline Address Creation Form */}
                  <AnimatePresence>
                    {showAddAddress && (
                      <motion.form 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        onSubmit={handleAddAddressSubmit}
                        className="bg-zinc-50 border border-zinc-200 rounded-2xl p-5 space-y-4 overflow-hidden text-right"
                        style={{ textAlign: isArabic ? 'right' : 'left' }}
                      >
                        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-widest pb-2 border-b border-zinc-250">
                          {isArabic ? "تعبئة بيانات عنوان الشحن" : "Shipping Destination Input"}
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Recipient */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {isArabic ? "اسم المستلم بالكامل *" : "Recipient Name *"}
                            </label>
                            <input 
                              type="text" 
                              required 
                              value={newRecipient}
                              onChange={e => setNewRecipient(e.target.value)}
                              placeholder="e.g. Aly Maher"
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-black text-zinc-800 transition"
                            />
                          </div>

                          {/* Phone */}
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {isArabic ? "رقم الهاتف للاتصال *" : "Mobile Line *"}
                            </label>
                            <input 
                              type="tel" 
                              required 
                              value={newPhone}
                              onChange={e => setNewPhone(e.target.value)}
                              placeholder="01012345678"
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-black text-zinc-800 text-left font-mono"
                              style={{ direction: 'ltr' }}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* City */}
                          <div className="md:col-span-1 space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {isArabic ? "المحافظة *" : "Governorate *"}
                            </label>
                            <select 
                              value={newCityId}
                              onChange={e => setNewCityId(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs text-zinc-800 focus:outline-none focus:border-black"
                            >
                              {EGYPTIAN_CITIES.map(c => (
                                <option key={c.id} value={c.id}>{isArabic ? c.nameAr : c.nameEn}</option>
                              ))}
                            </select>
                          </div>

                          {/* Address details */}
                          <div className="md:col-span-2 space-y-1">
                            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                              {isArabic ? "العنوان السكني بالتفصيل (الشارع، العمارة، الشقة) *" : "Detailed Home Address *"}
                            </label>
                            <input 
                              type="text" 
                              required 
                              value={newDetails}
                              onChange={e => setNewDetails(e.target.value)}
                              placeholder={isArabic ? "مثال: ٢٢ شارع النزهة، عمارة الأمل، طابق ٣، شقة ٥" : "e.g. 22 Al-Nozha street, floor 3, apt 5"}
                              className="w-full bg-white border border-zinc-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-black text-zinc-800 transition"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 justify-start">
                          <input 
                            type="checkbox" 
                            id="set-default-address"
                            checked={newIsDefault}
                            onChange={e => setNewIsDefault(e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 accent-black cursor-pointer align-middle"
                          />
                          <label htmlFor="set-default-address" className="text-xs font-medium text-zinc-650 cursor-pointer select-none">
                            {isArabic ? "تعيين كعنوان افتراضي للشحن للتسوق السريع" : "Set as default for seamless checkout automatic injections"}
                          </label>
                        </div>

                        <div className="flex gap-2 pt-3 border-t border-zinc-200/50">
                          <button 
                            type="submit" 
                            disabled={operationPending}
                            className="px-5 py-2 bg-zinc-950 hover:bg-black text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            {operationPending ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <Check size={12} />
                                <span>{isArabic ? "حفظ العنوان وتأكيده" : "Commit Address Location"}</span>
                              </>
                            )}
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setShowAddAddress(false)}
                            className="px-4 py-2 border border-zinc-200 rounded-lg text-xs text-zinc-650 hover:bg-zinc-100 cursor-pointer"
                          >
                            {isArabic ? "إلغاء الأمر" : "Cancel"}
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* List of custom registered addresses */}
                  <div className="space-y-4">
                    {(profileData?.addresses || []).length === 0 ? (
                      <div className="py-12 bg-zinc-50 border border-zinc-100 rounded-2xl text-center space-y-3">
                        <MapPin size={28} className="text-zinc-400 mx-auto animate-bounce" />
                        <div>
                          <p className="text-zinc-700 text-xs sm:text-sm font-semibold">
                            {isArabic ? "لا توجد عناوين توصيل مسجلة حالياً" : "Your address handbook is empty"}
                          </p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {isArabic 
                              ? "أضف عنوان شحن لتوفير الوقت وتسهيل شحن الملابس الفاخرة إليك!" 
                              : "Registered addresses are auto-injected dynamically when you place custom orders."}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(profileData?.addresses || []).map((addr) => (
                          <div 
                            key={addr.id} 
                            className={`p-4 border rounded-2xl flex flex-col justify-between gap-4 transition-all ${
                              addr.isDefault 
                                ? 'bg-amber-50/20 border-amber-300 shadow-xs' 
                                : 'bg-white border-zinc-150 hover:border-zinc-300'
                            }`}
                            style={{ textAlign: isArabic ? 'right' : 'left' }}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <span className="font-serif font-semibold text-zinc-900 text-xs sm:text-sm flex items-center gap-1.5">
                                  <User size={13} className="text-zinc-400" />
                                  <span>{addr.recipientName}</span>
                                </span>
                                {addr.isDefault ? (
                                  <span className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
                                    {isArabic ? "عنوان افتراضي" : "Default Destination"}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleMarkDefaultAddress(addr.id)}
                                    className="text-[9px] text-zinc-400 hover:text-amber-800 font-bold cursor-pointer transition border border-dashed border-zinc-200 hover:border-amber-300 px-2 py-0.5 rounded-full"
                                  >
                                    {isArabic ? "اجعله افتراضياً" : "Set as Default"}
                                  </button>
                                )}
                              </div>

                              <div className="space-y-1.5 text-xs text-zinc-650 font-sans">
                                <p className="flex items-center gap-1.5">
                                  <Phone size={11} className="text-zinc-400" />
                                  <span className="font-mono">{addr.phone}</span>
                                </p>
                                <p className="flex items-center gap-1.5">
                                  <MapPin size={11} className="text-zinc-400 shrink-0" />
                                  <span>{getCityName(addr.cityId)}</span>
                                </p>
                                <p className="text-[11px] leading-relaxed pl-5 text-zinc-500 mt-1" style={{ textAlign: isArabic ? 'right' : 'left' }}>
                                  {addr.addressDetails}
                                </p>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-zinc-200/40 flex justify-end gap-1.5 mt-2">
                              <button
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="px-3 py-1 text-[10px] text-red-500 hover:bg-red-50 rounded-lg flex items-center gap-1 cursor-pointer transition border border-transparent"
                              >
                                <Trash2 size={11} />
                                <span>{isArabic ? "حذف" : "Remove"}</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM REQUESTS & CHAT */}
              {activeTab === 'custom' && (
                <div className="space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                  <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
                    <h3 className="text-sm font-serif font-medium text-zinc-900">
                      {isArabic ? 'طلبات الهاند ميد وتفصيل السواريه الفاخر' : 'Bespoke Evening & Couture Requests'}
                    </h3>
                    <span className="text-[10px] text-zinc-400 italic">
                      {isArabic ? 'تابعي حركة وتصميم طلبك وميزانيتك من هنا' : 'Track your design status & consult with artisans'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-6">
                    {/* Left/Right Sidebar List of Custom Orders */}
                    <div className={`space-y-3 ${selectedConversationId ? 'hidden lg:block' : 'block'}`}>
                      {orders.filter((order) => order.orderType === 'custom').length === 0 ? (
                        <div className="p-8 border border-dashed border-zinc-200 rounded-2xl text-center text-zinc-400 text-xs sm:text-sm">
                          {isArabic 
                            ? 'لم تسجلي أي طلب تفصيل أو هاند ميد حتى الآن. يمكنكِ تقديم طلب في النموذج الفاخر أسفل الصفحة الرئيسية.' 
                            : 'No bespoke fashion orders found. Lodge comments via the couture studio form on Home page.'}
                        </div>
                      ) : (
                        orders.filter((order) => order.orderType === 'custom').map((order) => {
                          const isSelected = selectedConversationId === order.linkedConversationId;
                          
                          // Localized status dictionary
                          const getArabicStatus = (status: string) => {
                            switch (status) {
                              case 'pending': return 'قيد المراجعة الفنية';
                              case 'preparing': return 'قيد التفصيل اليدوي والتطريز';
                              case 'shipped': return 'تم الشحن للتسليم';
                              case 'delivered': return 'تم التسليم والحمد لله';
                              case 'cancelled': return 'تم الإلغاء';
                              default: return status;
                            }
                          };

                          return (
                            <button
                              key={order.id}
                              onClick={() => order.linkedConversationId && setSelectedConversationId(order.linkedConversationId)}
                              className={`w-full p-4.5 rounded-2xl border transition duration-200 cursor-pointer text-right ${
                                isArabic ? 'text-right' : 'text-left'
                              } ${
                                isSelected 
                                  ? 'border-zinc-950 bg-zinc-950 text-white shadow-xl' 
                                  : 'border-zinc-200 bg-zinc-50 hover:bg-zinc-100/70 hover:border-zinc-350'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <p className="text-xs font-black uppercase tracking-wider">
                                    {order.customTitle || order.customerName}
                                  </p>
                                  <p className={`text-[11px] font-light leading-relaxed line-clamp-2 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                                    {order.customDescription}
                                  </p>
                                </div>
                                <span className={`text-[9px] font-bold px-2 py-1 rounded-full shrink-0 border uppercase tracking-wider ${
                                  isSelected 
                                    ? 'bg-amber-400 text-black border-amber-400' 
                                    : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                                }`}>
                                  {isArabic ? getArabicStatus(order.status) : order.status.toUpperCase()}
                                </span>
                              </div>
                              <div className="mt-3.5 pt-3.5 border-t border-current/10 text-[10px] opacity-80 flex flex-wrap gap-x-3 gap-y-1">
                                {order.customMaterial && (
                                  <span>
                                    <strong>{isArabic ? 'الخامة' : 'Fabric'}:</strong> {order.customMaterial}
                                  </span>
                                )}
                                {order.customColor && (
                                  <span>
                                    <strong>{isArabic ? 'اللون' : 'Color'}:</strong> {order.customColor}
                                  </span>
                                )}
                                {typeof order.customBudget === 'number' && (
                                  <span>
                                    <strong>{isArabic ? 'الميزانية المقترحة' : 'Target Budget'}:</strong> {order.customBudget} {isArabic ? 'ج.م' : 'EGP'}
                                  </span>
                                )}
                                {typeof order.agreedPrice === 'number' && order.agreedPrice > 0 && (
                                  <span className={`font-black ${isSelected ? 'text-amber-400' : 'text-emerald-700'}`}>
                                    🏷️ {isArabic ? 'السعر المتفق عليه النهائي' : 'Agreed price'}: {order.agreedPrice} {isArabic ? 'ج.م' : 'EGP'}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* Active Conversation and Chat Area */}
                    <div className={`border border-zinc-200 rounded-3xl bg-white overflow-hidden shadow-sm flex flex-col min-h-[450px] ${selectedConversationId ? 'flex' : 'hidden lg:flex'}`}>
                      <div className="p-4 sm:p-5 border-b border-zinc-100 flex items-center justify-between text-right gap-3">
                        <div>
                          {selectedConversationId && (
                            <button
                              onClick={() => setSelectedConversationId('')}
                              className="lg:hidden mb-2 text-[10px] bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-zinc-700 px-2.5 py-1 rounded-lg font-medium cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <span>{isArabic ? '← العودة للطلبات' : '← Back to requests'}</span>
                            </button>
                          )}
                          <p className="text-xs font-black text-zinc-900 uppercase tracking-widest">{isArabic ? 'قناة المحادثة والاستشارات الحية' : 'Couture Chat Workspace'}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">{isArabic ? 'تواصلي مباشرة مع المصمم لتعديل المقاسات والاتفاق' : 'Live conversation line with your matching RAAV designer'}</p>
                        </div>
                        {selectedConversationId && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-900 border border-amber-500/10 px-2.5 py-1 rounded-full font-bold shrink-0">
                            {conversations.find((thread) => thread.id === selectedConversationId)?.topic || (isArabic ? 'حالة نشطة' : 'Active Channel')}
                          </span>
                        )}
                      </div>

                      {/* Chat Messages Bubble List with Auto-Scroll */}
                      <div className="flex-1 max-h-[360px] overflow-y-auto p-4 space-y-4 bg-zinc-50">
                        {!selectedConversationId ? (
                          <div className="text-center text-zinc-405 text-zinc-400 text-xs sm:text-sm py-20 flex flex-col items-center justify-center gap-3">
                            <span className="text-2xl animate-spin">✨</span>
                            <p>{isArabic ? 'الرجاء اختيار طلب تفصيل خاص من القائمة الجانبية لبدء المحادثة.' : 'Select a custom request from the list to view its chat.'}</p>
                          </div>
                        ) : conversationMessages.length === 0 ? (
                          <div className="text-center text-zinc-400 text-xs py-20">
                            {isArabic ? 'بدء المحادثة الفورية مع المصمم الآن... اكتب رسالتك بالأسفل.' : 'Secure connection established. Type your opening message below.'}
                          </div>
                        ) : (
                          <>
                            {conversationMessages.map((message) => {
                              const isMyMessage = message.senderRole === 'customer';
                              // Elegant layout logic: ensure own client bubbles stay on traditional right-side (regardless of layout direction config)
                              const justifyClass = isArabic
                                ? (isMyMessage ? 'justify-start' : 'justify-end')
                                : (isMyMessage ? 'justify-end' : 'justify-start');

                              return (
                                <div key={message.id} className={`flex ${justifyClass}`}>
                                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                                    isMyMessage 
                                      ? 'bg-zinc-950 text-white font-medium text-right' 
                                      : 'bg-white text-zinc-800 border border-zinc-150 text-right'
                                  }`}>
                                    <div className={`text-[9px] font-black uppercase tracking-wider mb-1 ${
                                      isMyMessage ? 'text-amber-400' : 'text-amber-600'
                                    }`}>
                                      {message.senderName}
                                    </div>
                                    <p className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">{message.text}</p>
                                    <span className="block text-[8px] opacity-40 mt-1.5 font-mono text-left">
                                      {new Date(message.createdAt || Date.now()).toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                            <div ref={messagesEndRef} />
                          </>
                        )}
                      </div>

                      {/* Msg sending form */}
                      <form onSubmit={handleSendConversationMessage} className="p-3 sm:p-4 border-t border-zinc-100 bg-white flex gap-2">
                        <input
                          value={conversationDraft}
                          onChange={(e) => setConversationDraft(e.target.value)}
                          placeholder={isArabic ? 'اكتب رسالتك للمصمم...' : 'Write your bespoke query...'}
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-black focus:bg-white text-right"
                          disabled={!selectedConversationId}
                        />
                        <button
                          type="submit"
                          className="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-black uppercase tracking-wider disabled:opacity-50 transition cursor-pointer"
                          disabled={!selectedConversationId || !conversationDraft.trim()}
                        >
                          {isArabic ? 'إرسال' : 'Send'}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: FAVORITES */}
              {activeTab === 'favorites' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-zinc-50 pb-3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                    <h3 className="text-sm font-serif font-medium text-zinc-900">
                      {isArabic ? "المفضلة الشخصية المؤقتة" : "Dynamic Month-to-Month Favorites"}
                    </h3>
                    <span className="text-[10px] bg-zinc-50 text-amber-700 border border-zinc-150 px-2.5 py-1 rounded-full font-sans font-medium flex items-center gap-1">
                      <AlertCircle size={10} />
                      <span>{isArabic ? "حفظ لمدة شهر واحد فقط" : "Retained for 30 days maximum"}</span>
                    </span>
                  </div>

                  {renderFavorites()}
                </div>
              )}

            </div>
          </div>

        </div>

        {/* IMAGE ZOOM PREVIEW POPUP */}
        <AnimatePresence>
          {zoomedReceipt && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setZoomedReceipt(null)}
              className="fixed inset-0 z-55 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-zoom-out"
            >
              <motion.div 
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.95 }}
                className="bg-white/5 p-2 rounded-3xl max-w-lg max-h-[85vh] overflow-hidden"
              >
                <img 
                  src={zoomedReceipt} 
                  alt="Payment receipt proof screenshot" 
                  className="rounded-2xl max-w-full max-h-[80vh] object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}