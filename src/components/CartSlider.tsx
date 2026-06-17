import React, { useState, useEffect } from 'react';
import { X, ShoppingBag, Trash2, ArrowLeft, CheckCircle, Package, Send, CreditCard, Landmark, Wallet, AlertCircle } from 'lucide-react';
import { OrderItem, PaymentConfig, ShippingPlan, SavedAddress } from '../types';
import { createOrder, getPaymentConfig, getShippingPlans, getUserProfile } from '../dbService';
import { auth } from '../firebase';

interface CartSliderProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: OrderItem[];
  onUpdateQuantity: (productId: string, size: string, color: string, newQty: number) => void;
  onRemoveItem: (productId: string, size: string, color: string) => void;
  onClearCart: () => void;
  isArabic: boolean;
}

const EGYPTIAN_CITIES = [
  { id: 'cairo', nameAr: 'القاهرة (شحن ٥٠ ج.م)', nameEn: 'Cairo (50 EGP Delivery)', fee: 50 },
  { id: 'giza', nameAr: 'الجيزة (شحن ٥٠ ج.م)', nameEn: 'Giza (50 EGP Delivery)', fee: 50 },
  { id: 'alex', nameAr: 'الإسكندرية (شحن ٧٠ ج.م)', nameEn: 'Alexandria (70 EGP Delivery)', fee: 70 },
  { id: 'qalyubia', nameAr: 'القليوبية (شحن ٧٠ ج.م)', nameEn: 'Qalyubia (70 EGP Delivery)', fee: 70 },
  { id: 'sharqia', nameAr: 'الشرقية (شحن ٨٠ ج.م)', nameEn: 'Sharqia (80 EGP Delivery)', fee: 80 },
  { id: 'dakahlia', nameAr: 'الدقهلية (شحن ٨٠ ج.م)', nameEn: 'Dakahlia (80 EGP Delivery)', fee: 80 },
  { id: 'gharbia', nameAr: 'الغربية (شحن ٨٠ ج.م)', nameEn: 'Gharbia (80 EGP Delivery)', fee: 80 },
  { id: 'monufia', nameAr: 'المنوفية (شحن ٨٠ ج.م)', nameEn: 'Monufia (80 EGP Delivery)', fee: 80 },
  { id: 'beheira', nameAr: 'البحيرة (شحن ٩٠ ج.م)', nameEn: 'Beheira (90 EGP Delivery)', fee: 90 },
  { id: 'suez', nameAr: 'السويس (شحن ٩٠ ج.م)', nameEn: 'Suez (90 EGP Delivery)', fee: 90 },
  { id: 'ismailia', nameAr: 'الإسماعيلية (شحن ٩٠ ج.م)', nameEn: 'Ismailia (90 EGP Delivery)', fee: 90 },
  { id: 'portsaid', nameAr: 'بورسعيد (شحن ٩٠ ج.م)', nameEn: 'Port Said (90 EGP Delivery)', fee: 90 },
  { id: 'sohag', nameAr: 'سوهاج (شحن ١٠٠ ج.م)', nameEn: 'Sohag (100 EGP Delivery)', fee: 100 },
  { id: 'asyut', nameAr: 'أسيوط (شحن ١٠٠ ج.م)', nameEn: 'Asyut (100 EGP Delivery)', fee: 100 },
  { id: 'luxor', nameAr: 'الأقصر (شحن ١٢٠ ج.م)', nameEn: 'Luxor (120 EGP Delivery)', fee: 120 },
  { id: 'aswan', nameAr: 'أسوان (شحن ١٢٠ ج.م)', nameEn: 'Aswan (120 EGP Delivery)', fee: 120 }
];

export default function CartSlider({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  isArabic
}: CartSliderProps) {
  const [checkoutMode, setCheckoutMode] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);

  // Form Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCityId, setCustomerCityId] = useState('cairo');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Configurations States
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig | null>(null);
  const [shippingPlans, setShippingPlans] = useState<ShippingPlan[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('cod');
  const [selectedCarrierPlanId, setSelectedCarrierPlanId] = useState<string>('');

  // Brand new integrations: Saved Addresses dropdown & payment proof input
  const [userAddresses, setUserAddresses] = useState<SavedAddress[]>([]);
  const [paymentProofImage, setPaymentProofImage] = useState<string | null>(null);

  // Auto load configurations and saved addresses
  useEffect(() => {
    if (isOpen) {
      // Load payment/shipping config
      getPaymentConfig().then(cfg => {
        setPaymentConfig(cfg);
        if (cfg) {
          if (cfg.cashOnDeliveryActive) setSelectedPaymentMethod('cod');
          else if (cfg.instaPayActive) setSelectedPaymentMethod('instapay');
          else if (cfg.walletsActive && cfg.wallets.length > 0) setSelectedPaymentMethod(cfg.wallets[0].id);
        }
      });
      getShippingPlans().then(plans => {
        const active = plans.filter(p => p.isActive);
        setShippingPlans(active);
        if (active.length > 0) {
          setSelectedCarrierPlanId(active[0].id);
        }
      });

      // Quick load user addresses
      if (auth.currentUser) {
        getUserProfile(auth.currentUser.uid).then(profile => {
          if (profile && profile.addresses) {
            setUserAddresses(profile.addresses);
            
            // Auto inject default saved address if it exists
            const defaultAddr = profile.addresses.find((a: any) => a.isDefault);
            if (defaultAddr) {
              setCustomerName(defaultAddr.recipientName);
              setCustomerPhone(defaultAddr.phone);
              setCustomerCityId(defaultAddr.cityId);
              setCustomerAddress(defaultAddr.addressDetails);
            } else if (profile.addresses.length > 0) {
              const firstAddr = profile.addresses[0];
              setCustomerName(firstAddr.recipientName);
              setCustomerPhone(firstAddr.phone);
              setCustomerCityId(firstAddr.cityId);
              setCustomerAddress(firstAddr.addressDetails);
            }
          }
        });
      } else {
        setUserAddresses([]);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const itemsPriceTotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  
  // Decide active plan attributes
  const selectedPlanObj = shippingPlans.find(p => p.id === selectedCarrierPlanId);
  const selectedCityInfo = EGYPTIAN_CITIES.find(c => c.id === customerCityId) || EGYPTIAN_CITIES[0];
  const isCustomShippingActive = shippingPlans.length > 0;

  const deliveryFee = isCustomShippingActive && selectedPlanObj
    ? selectedPlanObj.price
    : (itemsPriceTotal > 1200 && (customerCityId === 'cairo' || customerCityId === 'giza') ? 0 : selectedCityInfo.fee);

  const grandTotal = itemsPriceTotal + deliveryFee;

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone || !customerAddress) {
      alert(isArabic ? "برجاء استكمال جميع الخانات الأساسية للطلب!" : "Please fill in all required checkout data!");
      return;
    }

    if (selectedPaymentMethod !== 'cod' && !paymentProofImage) {
      alert(isArabic 
        ? "يجب إرفاق صورة من السداد على الموقع لكي يتم تأكيد الأوردر من قبل الإدارة!" 
        : "You must attach a screenshot/proof of payment on the website to confirm your order by management!");
      return;
    }

    setIsSubmitting(true);
    try {
      let resolvedPaymentMethod = 'COD (Cash on Delivery)';
      if (selectedPaymentMethod === 'instapay') {
        resolvedPaymentMethod = 'InstaPay Transfer';
      } else if (selectedPaymentMethod !== 'cod') {
        const matchedWallet = paymentConfig?.wallets.find(w => w.id === selectedPaymentMethod);
        resolvedPaymentMethod = matchedWallet 
          ? `E-Wallet (${isArabic ? matchedWallet.nameAr : matchedWallet.nameEn})` 
          : 'E-Wallet Transfer';
      }

      const orderId = await createOrder({
        customerName,
        customerPhone,
        customerAddress,
        customerCity: isCustomShippingActive && selectedPlanObj
          ? (isArabic ? selectedPlanObj.companyNameAr : selectedPlanObj.companyNameEn)
          : (isArabic ? selectedCityInfo.nameAr.split(' ')[0] : selectedCityInfo.nameEn.split(' ')[0]),
        customerNotes: customerNotes.trim() || undefined,
        items: cartItems,
        total: grandTotal,
        paymentMethod: resolvedPaymentMethod,
        shippingPlanId: isCustomShippingActive && selectedPlanObj ? selectedPlanObj.id : undefined,
        paymentProof: paymentProofImage || undefined
      });

      setOrderSuccess(orderId);
      onClearCart();
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerNotes('');
      setPaymentProofImage(null);
      setCheckoutMode(false);
    } catch (error) {
      console.error("Order creation failed:", error);
      alert(isArabic ? "حدث خطأ أثناء إتمام طلبك. يرجى المحاولة مرة أخرى." : "Error finalizing order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      <div className="absolute inset-0 overflow-hidden">
        {/* Dark overlay */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        />

        {/* Sliding card panel */}
        <div className={`fixed inset-y-0 ${isArabic ? 'left-0' : 'right-0'} max-w-full flex pl-0 md:pl-10`}>
          <div
            className="w-screen max-w-md bg-white border-r border-l border-zinc-100 text-zinc-900 flex flex-col h-full shadow-2xl relative transition-transform duration-300"
            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
          >
            {/* Header block */}
            <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-zinc-900" size={19} />
                <h2 className="text-base font-serif font-bold tracking-tight text-zinc-900 uppercase">
                  {orderSuccess 
                    ? (isArabic ? 'تم الطلب بنجاح' : 'Success!') 
                    : checkoutMode 
                      ? (isArabic ? 'بيانات الشحن والتوصيل' : 'Delivery Details') 
                      : (isArabic ? 'سلة المشتريات' : 'Shopping Cart')}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full border border-zinc-200 hover:bg-zinc-50 hover:text-black transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body contents */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              
              {/* ORDER SUCCESS SCREEN */}
              {orderSuccess ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-4 py-8">
                  <div className="p-4 bg-emerald-50 text-emerald-600 rounded-full mb-5 border border-emerald-100">
                    <CheckCircle size={52} className="animate-pulse" />
                  </div>
                  <h3 className="text-lg font-serif font-bold mb-2 text-zinc-950">
                    {isArabic ? "شكراً لتسوقك من RAAV!" : "Thank you for shopping with RAAV!"}
                  </h3>
                  <p className="text-xs text-zinc-500 mb-6 leading-relaxed">
                    {isArabic 
                      ? "تم استلام طلبك بنجاح وجارٍ تحضيره للشحن الآن. سنتواصل معك هاتفياً لتأكيد الشحن."
                      : "Your premium clothes order has been logged! We will call you shortly to arrange quick courier dispatch."}
                  </p>

                  <div className="w-full bg-zinc-50 border border-zinc-100 rounded-xl p-4 text-left mb-6 font-mono text-xs">
                    <div className="flex justify-between mb-2">
                      <span className="text-zinc-400">{isArabic ? "رقم الطلب:" : "Order Reference:"}</span>
                      <span className="text-zinc-909 font-bold text-zinc-900">{orderSuccess}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">{isArabic ? "طريقة الدفع:" : "Payment Method:"}</span>
                      <span className="text-zinc-700 font-sans">{isArabic ? "الدفع عند الاستلام (COD)" : "Cash on Delivery"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setOrderSuccess(null);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-black text-white hover:bg-zinc-900 rounded-full font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    <Package size={15} />
                    <span>{isArabic ? "مواصلة التسوق" : "Continue Shopping"}</span>
                  </button>
                </div>
              ) : checkoutMode ? (
                /* CHECKOUT METHOD FORM */
                <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                  {/* Back to Cart Trigger */}
                  <button
                    type="button"
                    onClick={() => setCheckoutMode(false)}
                    className="text-xs hover:text-amber-800 transition flex items-center gap-1 text-zinc-500 mb-2 cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>{isArabic ? 'العودة لتعديل السلة' : 'Adjust Clothing Pieces'}</span>
                  </button>

                  <div className="space-y-3">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {isArabic ? "الاسم بالكامل *" : "Full Customer Name *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isArabic ? "مثال: أحمد محمد علي" : "e.g. John Doe"}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                      />
                    </div>

                    {/* Customer Phone */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {isArabic ? "رقم الهاتف للاتصال دليفري *" : "Egyptian Mobile Number *"}
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder={isArabic ? "مثال: 01xxxxxxxxx" : "e.g. 01234567890"}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-left text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                      />
                    </div>

                    {/* Shipping Carrier / Plan Picker */}
                    {isCustomShippingActive ? (
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          {isArabic ? "اختر شركة الشحن للتوصيل *" : "Select Shipping Courier *"}
                        </label>
                        <select
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                          value={selectedCarrierPlanId}
                          onChange={(e) => setSelectedCarrierPlanId(e.target.value)}
                        >
                          {shippingPlans.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {isArabic 
                                ? `${plan.companyNameAr} - ${plan.price} ج.م (${plan.deliveryTimeAr})` 
                                : `${plan.companyNameEn} - ${plan.price} EGP (${plan.deliveryTimeEn})`
                              }
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      /* Egyptian Province Selection fallback */
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          {isArabic ? "المحافظة للتوصيل *" : "Select Governorate *"}
                        </label>
                        <select
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                          value={customerCityId}
                          onChange={(e) => setCustomerCityId(e.target.value)}
                        >
                          {EGYPTIAN_CITIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {isArabic ? c.nameAr : c.nameEn}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Detailed Street Address */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {isArabic ? "العنوان بالتفصيل *" : "Detailed Home Address *"}
                      </label>
                      <textarea
                        rows={2}
                        required
                        placeholder={isArabic ? "مثال: رقم المبنى، اسم الشارع، رقم الشقة، بجانب صيدلية..." : "e.g. Building No., Apartment Floor, Landmarks..."}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                        value={customerAddress}
                        onChange={(e) => setCustomerAddress(e.target.value)}
                      />
                    </div>

                    {/* Delivery Optional Notes */}
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                        {isArabic ? "ملاحظات إضافية (اختياري)" : "Delivery Notes (Optional)"}
                      </label>
                      <input
                        type="text"
                        placeholder={isArabic ? "مثال: تسليم عند حارس العقار أو الاتصال قبل الحضور" : "e.g. Call before coming, drop at gate..."}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 focus:outline-none focus:bg-white focus:border-black transition-all"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                      />
                    </div>

                    {/* Payment Method Selector */}
                    {paymentConfig && (
                      <div className="space-y-2 border-t border-zinc-100 pt-3 mt-3">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                          {isArabic ? "خيارات وسيلة الدفع المتاحة لطلبك *" : "Select Checkout Payment Method *"}
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                          {paymentConfig.cashOnDeliveryActive && (
                            <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              selectedPaymentMethod === 'cod' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50/50'
                            }`}>
                              <input
                                type="radio" name="payment_method" value="cod"
                                className="text-zinc-900 focus:ring-0"
                                checked={selectedPaymentMethod === 'cod'}
                                onChange={() => setSelectedPaymentMethod('cod')}
                              />
                              <div className="text-right">
                                <div className="font-bold text-zinc-900">{isArabic ? "الدفع نقداً عند استلام الشحنة" : "Cash on Delivery"}</div>
                                <div className="text-[10px] text-zinc-400">{isArabic ? "الدفع كاش للمندوب بباب المنزل" : "Pay courier at doorstep"}</div>
                              </div>
                            </label>
                          )}

                          {paymentConfig.instaPayActive && paymentConfig.instaPay.username && (
                            <label className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              selectedPaymentMethod === 'instapay' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50/50'
                            }`}>
                              <input
                                type="radio" name="payment_method" value="instapay"
                                className="text-zinc-900 focus:ring-0"
                                checked={selectedPaymentMethod === 'instapay'}
                                onChange={() => setSelectedPaymentMethod('instapay')}
                              />
                              <div className="text-right">
                                <span className="font-bold text-zinc-905 ml-1.5 text-zinc-900">{isArabic ? "تحويل كاش عبر InstaPay" : "InstaPay Direct"}</span>
                                <span className="text-[9px] bg-green-500/10 text-green-700 px-1.5 py-0.5 rounded uppercase font-bold">Fast Transfer</span>
                              </div>
                            </label>
                          )}

                          {paymentConfig.walletsActive && paymentConfig.wallets.map((w) => (
                            <label key={w.id} className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                              selectedPaymentMethod === w.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50/50'
                            }`}>
                              <input
                                type="radio" name="payment_method" value={w.id}
                                className="text-zinc-900 focus:ring-0"
                                checked={selectedPaymentMethod === w.id}
                                onChange={() => setSelectedPaymentMethod(w.id)}
                              />
                              <div className="text-right">
                                <span className="font-bold text-zinc-900">{isArabic ? w.nameAr : w.nameEn}</span>
                                <span className="text-[10px] text-zinc-400 font-mono block select-all">{w.phone}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* DISPLAY TRANSFER DETAIL PANEL (InstaPay or E-Wallet) */}
                        {selectedPaymentMethod === 'instapay' && paymentConfig.instaPay && (
                          <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 mt-2 leading-relaxed text-right">
                            <h5 className="font-serif font-black text-xs text-zinc-900 flex items-center gap-1 justify-end">
                              <span>{isArabic ? "تفاصيل حساب InstaPay للتحويل:" : "InstaPay Address:"}</span>
                              <Landmark size={14} className="text-green-600" />
                            </h5>
                            <div className="text-xs space-y-1 text-zinc-700 text-right">
                              <div>{isArabic ? "عنوان الدفع للاستلام:" : "Transfer Username Address:"} <strong className="text-zinc-950 font-mono select-all bg-zinc-100 p-0.5 rounded px-1.5 inline-block">{paymentConfig.instaPay.username}</strong></div>
                              <div>{isArabic ? "رقم الهاتف المرتبط بالتحويل:" : "Associated Mobile Number:"} <strong className="text-zinc-950 font-mono select-all bg-zinc-100 p-0.5 rounded px-1.5 inline-block">{paymentConfig.instaPay.phone}</strong></div>
                            </div>
                            {paymentConfig.instaPay.qrCode && (
                              <div className="text-center pt-2">
                                <p className="text-[10px] text-zinc-400 mb-1">{isArabic ? "افتح تطبيق انستاباي وامسح هذا الـ QR Code لتسريع السداد:" : "Scan this QR Code for instant checkout:"}</p>
                                <img src={paymentConfig.instaPay.qrCode} referrerPolicy="no-referrer" alt="InstaPay QR Code" className="w-24 h-24 mx-auto object-cover border border-zinc-150 shadow rounded-lg" />
                              </div>
                            )}
                          </div>
                        )}

                        {selectedPaymentMethod !== 'cod' && selectedPaymentMethod !== 'instapay' && (
                          (() => {
                            const activeWallet = paymentConfig.wallets.find(w => w.id === selectedPaymentMethod);
                            if (activeWallet) {
                              return (
                                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl space-y-2 mt-2 leading-relaxed text-right">
                                  <h5 className="font-bold text-xs text-amber-800 flex items-center gap-1 justify-end">
                                    <span>{isArabic ? `تفاصيل المحفظة للتحويل:` : `Mobile Wallet Details:`}</span>
                                    <Wallet size={14} />
                                  </h5>
                                  <div className="text-xs space-y-1 text-zinc-700 text-right">
                                    <div>{isArabic ? "تحويل كاش إلى رقم الهاتف التالي:" : "Send Cash Transfer to:"} <strong className="text-zinc-950 font-mono select-all bg-zinc-100 p-0.5 rounded px-1.5 inline-block" style={{ direction: 'ltr' }}>{activeWallet.phone}</strong></div>
                                    <p className="text-[10px] text-zinc-500">{isArabic ? "يرجى تحويل القيمة الكلية الموضحة بالأسفل وإتمام الطلب." : "Please do manual client transfer, then click Confirm."}</p>
                                  </div>
                                  {activeWallet.qrCode && (
                                    <div className="text-center pt-2">
                                      <img src={activeWallet.qrCode} referrerPolicy="no-referrer" alt="Wallet QR Code" className="w-24 h-24 mx-auto object-cover border border-zinc-150 shadow rounded-lg" />
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return null;
                          })()
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pricing Breakdown inside form checkout */}
                  <div className="bg-zinc-50 border border-zinc-100 rounded-xl p-4 mt-6 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">{isArabic ? "سعر القطع مجملة:" : "Clothes Subtotal:"}</span>
                      <span className="font-serif text-zinc-900 font-semibold">{itemsPriceTotal} ج.م</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">{isArabic ? "مصاريف شحن المندوب:" : "Courier Dispatch Fee:"}</span>
                      <span className="font-sans text-zinc-700">
                        {deliveryFee === 0 ? (
                          <span className="text-emerald-700 font-bold">{isArabic ? "مجاناً" : "FREE"}</span>
                        ) : `${deliveryFee} ج.م`}
                      </span>
                    </div>
                    {itemsPriceTotal < 1200 && (customerCityId === 'cairo' || customerCityId === 'giza') && !isCustomShippingActive && (
                      <p className="text-[10px] text-amber-900 italic mt-1 font-light">
                        {isArabic 
                          ? `أضف بـ ${1200 - itemsPriceTotal} ج.م قطع ملابس أخرى لتحصل على شحن مجاني بمحافظتي القاهرة والجيزة!` 
                          : `Spend ${1200 - itemsPriceTotal} EGP more for FREE shipping inside Cairo/Giza!`}
                      </p>
                    )}
                    <div className="flex justify-between pt-2.5 border-t border-zinc-200 text-xs font-bold text-zinc-950">
                      <span>{isArabic ? "المبلغ الكلي المستحق عند الاستلام:" : "Total Amount Due:"}</span>
                      <span className="font-serif text-sm">{grandTotal} ج.م</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-black hover:bg-zinc-900 text-white font-semibold text-center rounded-full text-xs tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={14} />
                          <span>{isArabic ? "تأكيد وإرسال طلب الشراء" : "Confirm Premium Order"}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : cartItems.length === 0 ? (
                /* EMPTY CART CASE */
                <div className="h-full flex flex-col items-center justify-center text-center py-12">
                  <ShoppingBag size={44} className="text-zinc-300 mb-4 animate-pulse" />
                  <p className="text-zinc-700 font-semibold mb-1">
                    {isArabic ? "سلة التسوق فارغة تماماً!" : "Shopping cart is currently empty!"}
                  </p>
                  <p className="text-xs text-zinc-400 max-w-[250px] leading-relaxed mb-6 font-light">
                    {isArabic 
                      ? "تصفح أحدث إطلاقات ملابس رجالي، حريمي، وأطفالي الرائعة وأضفها لحقيبتك الخاصة." 
                      : "Explore the most refined clothing collections for Men, Women, and Kids and style your bag."}
                  </p>
                  <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-zinc-50 border border-zinc-200 text-zinc-800 hover:border-zinc-300 rounded-full text-xs font-semibold tracking-wide transition cursor-pointer"
                  >
                    {isArabic ? "متابعة التصفح" : "Browse Wardrobe"}
                  </button>
                </div>
              ) : (
                /* CART LIST ITEMS */
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-sans">
                      {isArabic ? 'المنتج' : 'Item details'}
                    </span>
                    <button
                      onClick={onClearCart}
                      className="text-xs text-red-600 hover:text-red-700 transition flex items-center gap-1 cursor-pointer font-light"
                    >
                      <Trash2 size={12} />
                      <span>{isArabic ? "إفراغ السلة" : "Clear All"}</span>
                    </button>
                  </div>

                  <div className="divide-y divide-zinc-100">
                    {cartItems.map((item) => (
                      <div
                        key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`}
                        className="py-4 flex gap-4 first:pt-0 group text-right"
                      >
                        <div className="w-16 h-20 bg-zinc-50 rounded-lg overflow-hidden shrink-0 border border-zinc-100">
                          <img
                            src={item.image}
                            alt={isArabic ? item.nameAr : item.nameEn}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between text-right" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
                          <div>
                            <div className="flex justify-between gap-1 items-start">
                              <h4 className="text-zinc-900 font-serif font-medium text-xs sm:text-sm line-clamp-1">
                                {isArabic ? item.nameAr : item.nameEn}
                              </h4>
                              <button
                                onClick={() => onRemoveItem(item.productId, item.selectedSize, item.selectedColor)}
                                className="text-zinc-300 hover:text-zinc-600 p-0.5 transition cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </div>

                            {/* Attributes display */}
                            <div className="flex flex-wrap gap-2 mt-1.5 text-[10px] text-zinc-500">
                              <span className="bg-zinc-100/60 px-2 py-0.5 rounded-full border border-zinc-100">
                                {isArabic ? "مقاس:" : "Size:"} {item.selectedSize}
                              </span>
                              <span className="bg-zinc-100/60 px-2 py-0.5 rounded-full border border-zinc-100 flex items-center gap-1">
                                {isArabic ? "لون:" : "Color:"}
                                <span className="w-2.5 h-2.5 rounded-full inline-block border border-zinc-200" style={{ backgroundColor: item.selectedColor }} />
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="flex items-center gap-1 bg-zinc-100/80 p-0.5 rounded-lg border border-zinc-100">
                              <button
                                onClick={() => onUpdateQuantity(item.productId, item.selectedSize, item.selectedColor, Math.max(1, item.quantity - 1))}
                                className="w-6 h-6 hover:bg-white text-zinc-600 rounded-md flex items-center justify-center text-xs font-mono cursor-pointer"
                              >
                                -
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-zinc-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.productId, item.selectedSize, item.selectedColor, item.quantity + 1)}
                                className="w-6 h-6 hover:bg-white text-zinc-600 rounded-md flex items-center justify-center text-xs font-mono cursor-pointer"
                              >
                                +
                              </button>
                            </div>

                            <div className="text-zinc-900 font-serif font-bold text-xs">
                              {item.price * item.quantity} ج.م
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom summary and billing launcher (Only if products exist in cart and not in checkout/success) */}
            {cartItems.length > 0 && !checkoutMode && !orderSuccess && (
              <div className="border-t border-zinc-100 bg-zinc-50 p-6 space-y-4">
                <div className="flex justify-between items-center text-xs font-sans">
                  <span className="text-zinc-500">{isArabic ? "المجموع الفرعي للقطع:" : "Total Premium Items:"}</span>
                  <span className="font-serif text-base font-bold text-zinc-950">{itemsPriceTotal} ج.م</span>
                </div>
                <p className="text-[10px] text-zinc-400 text-center leading-relaxed font-light">
                  {isArabic 
                    ? "الدفع نقدًا عند استلام الشحنة. مصاريف الشحن ستحدد بخطوة العنوان التالية." 
                    : "Cash on delivery orders. Delivery charges applied on the next step."}
                </p>

                <button
                  onClick={() => setCheckoutMode(true)}
                  className="w-full py-4 bg-black hover:bg-zinc-900 text-white font-semibold text-xs text-center rounded-full flex items-center justify-center gap-1.5 cursor-pointer shadow-md tracking-wider uppercase font-sans transition-all"
                >
                  <CreditCard size={14} />
                  <span>{isArabic ? "إدخل العنوان وإتمام الطلب" : "Initiate Checkout & Delivery"}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
