import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Award, CheckCircle2, ShoppingBag, Gift, Heart, HelpCircle, Star, Palette, MapPin } from 'lucide-react';
import { createCustomOrder } from '../dbService';
import { SectionBackdrop } from '../types';

interface CustomCoutureFormProps {
  isArabic: boolean;
  currentUser: any;
  onOpenAuth: () => void;
  onGoToProfileCustom: () => void;
  backdrop?: SectionBackdrop;
}

export default function CustomCoutureForm({
  isArabic,
  currentUser,
  onOpenAuth,
  onGoToProfileCustom,
  backdrop
}: CustomCoutureFormProps) {
  const [customType, setCustomType] = useState<'couture' | 'accessories'>('couture');
  
  // Custom interactive features for a luxury gift experience
  const [isGift, setIsGift] = useState(true);
  const [giftBoxType, setGiftBoxType] = useState<'velvet' | 'leather' | 'classic'>('velvet');
  const [giftRecipientName, setGiftRecipientName] = useState('');
  const [giftCardMessage, setGiftCardMessage] = useState('');

  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    city: currentUser?.city || 'Cairo',
    address: currentUser?.address || '',
    title: '',
    description: '',
    material: '',
    color: '',
    budget: 3000,
    notes: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Automatically adjust target defaults & reset fields if type toggled
  const handleCustomTypeChange = (type: 'couture' | 'accessories') => {
    setCustomType(type);
    setFormData(prev => ({
      ...prev,
      budget: type === 'accessories' ? 1500 : 3500,
      title: '',
      description: '',
      material: '',
      color: '',
    }));
    setErrorMsg('');
  };

  // Auto-sync form on currentUser login reference
  React.useEffect(() => {
    if (currentUser) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || currentUser.name || '',
        phone: prev.phone || currentUser.phone || '',
        city: prev.city || currentUser.city || 'Cairo',
        address: prev.address || currentUser.address || ''
      }));
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (!formData.title || !formData.description || !formData.material || !formData.color || !formData.budget) {
      setErrorMsg(isArabic ? 'يرجى مراجعة كافة الفراغات المطلوبة مسبقاً.' : 'Please fill all requested parameters fully.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    // Package the gift wrap information beautifully into the notes so it updates the backend securely
    const giftDetailsNotes = isGift 
      ? `\n[GIFT PACKAGE REQUESTED]: Yes\nBox Type: ${giftBoxType.toUpperCase()}\nRecipient: ${giftRecipientName || 'N/A'}\nCalligraphy Msg: ${giftCardMessage || 'N/A'}\n`
      : '';

    try {
      await createCustomOrder({
        customerId: currentUser.uid,
        customerName: formData.name || currentUser.name || (isArabic ? 'عميل راف' : 'RAAV Patron'),
        customerPhone: formData.phone || currentUser.phone || '',
        customerAddress: formData.address || '',
        customerCity: formData.city,
        customerNotes: (formData.notes || '') + giftDetailsNotes,
        customTitle: formData.title,
        customDescription: formData.description,
        customMaterial: formData.material,
        customColor: formData.color,
        customBudget: Number(formData.budget),
        customType: customType,
      });

      setSuccess(true);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(isArabic ? 'حدث خطأ غير متوقع أثناء إرسال طلبك الخاص.' : 'An unexpected error occurred while placing your request.');
    } finally {
      setIsLoading(false);
    }
  };

  const cairoDistricts = [
    { id: 'Cairo', nameAr: 'القاهرة والواردات', nameEn: 'Cairo' },
    { id: 'Giza', nameAr: 'الجيزة', nameEn: 'Giza' },
    { id: 'Alexandria', nameAr: 'الإسكندرية والساحل', nameEn: 'Alexandria' },
    { id: 'Qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia' },
    { id: 'Dakahlia', nameAr: 'الدقهلية', nameEn: 'Dakahlia' },
    { id: 'Gharbia', nameAr: 'الغربية', nameEn: 'Gharbia' },
    { id: 'Monufia', nameAr: 'المنوفية', nameEn: 'Monufia' },
    { id: 'Sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia' },
    { id: 'Beheira', nameAr: 'البحيرة', nameEn: 'Beheira' },
    { id: 'Plaza', nameAr: 'مدن القناة وسيناء', nameEn: 'Suez/Ismailia' },
    { id: 'Upper', nameAr: 'الصعيد والمحافظات البعيدة', nameEn: 'Upper Egypt' }
  ];

  const isLightText = backdrop ? backdrop.textColor === 'light' : false;

  const customStyle: React.CSSProperties = backdrop ? {
    background: backdrop.type === 'solid'
      ? (backdrop.solidColor || '#FAF9F5')
      : `linear-gradient(${
          backdrop.gradientDirection === 'to-r' ? 'to right' :
          backdrop.gradientDirection === 'to-tr' ? 'to top right' :
          backdrop.gradientDirection === 'to-br' ? 'to bottom right' : 'to bottom'
        }, ${backdrop.gradientFrom || '#FAF9F5'}, ${backdrop.gradientTo || '#EAE8E1'})`
  } : {};

  return (
    <section 
      id="special-custom-orders"
      style={customStyle}
      className={`w-full py-12 md:py-20 border-b border-[#E6E4DC] select-none ${backdrop ? '' : 'my-20'} font-sans focus:outline-none`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Visual Header styled elegantly in luxury serif style */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
          <div className="inline-flex items-center gap-1.5 bg-[#FAF3E0] border border-[#EACCA6]/40 text-[#B88746] px-4 py-1.5 rounded-full text-[10.5px] font-bold tracking-widest uppercase">
            <Gift size={13} className="text-[#B88746]" />
            <span>{isArabic ? "أتيليه الهدايا والتفصيل الملكي" : "THE ROYAL BESPOKE & GIFT EXPERIENCE"}</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl font-serif font-semibold tracking-tight ${isLightText ? 'text-white' : 'text-[#1F1F1F]'}`}>
            {isArabic ? "الطلبات الخاصة والقطع المُصممة كهدية قيمة" : "Tailored Bespoke Designs & Luxurious Art Gifts"}
          </h2>
          <p className={`text-sm font-light leading-relaxed ${isLightText ? 'text-zinc-200' : 'text-[#666666]'}`}>
            {isArabic 
              ? "ندرك أن كل فستان خاص أو قطعة إكسسوار فنية هاند ميد تصممينها، تحمل قيمة عاطفية وفخامة فريدة. اطلبي تصميمك الخاص واختاري من بين خيارات التغليف الفاخر لتقدميها كتحفة فنية لا تُنسى."
              : "Every custom luxury outfit or hand-beaded heirloom you design is crafted to become an eternal memory. Request your custom tailor piece, and customize our artisan silk-wrapped gift boxes."}
          </p>
        </div>

      {/* Main Container: Warm, soft light linen/beige aesthetic */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-[#E6E4DC] shadow-xl bg-[#FAF9F5] text-zinc-900 p-6 sm:p-10 md:p-12">
        {/* Soft elegant watercolor glows matching client's color palette (rather than dark sci-fi background) */}
        <div className="absolute top-0 right-[-10%] w-[50%] h-full bg-gradient-to-l from-[#C9D9BC]/25 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-[-30%] left-[-20%] w-[450px] h-[450px] bg-[#EAE8E1]/40 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[30%] w-[250px] h-[250px] bg-[#C9D9BC]/20 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-8">
          
          {/* Custom Type Selector Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E6E4DC] pb-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="text-right sm:text-left space-y-1">
              <h3 className="text-base font-serif font-semibold text-[#2C2A29] flex items-center gap-2">
                <Sparkles size={16} className="text-[#C9D9BC] fill-[#C9D9BC]" />
                <span>{isArabic ? "نوع الطلب المخصص" : "Design Specification"}</span>
              </h3>
              <p className="text-[11px] text-[#7F7F7F] font-light">
                {isArabic ? "سواء كان فستاناً ملكياً، عادياً، أو إكسسوار رأس مطرزاً بالكامل باليد." : "Select category to match your creative thoughts with our atelier artisans."}
              </p>
            </div>
            
            <div className="flex gap-2 p-1 bg-[#EEEDE9] border border-[#DFDDD8] rounded-2xl self-center sm:self-auto">
              <button
                type="button"
                onClick={() => handleCustomTypeChange('couture')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  customType === 'couture'
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{isArabic ? "تفصيل ملابس وفساتين" : "Bespoke Couture"}</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleCustomTypeChange('accessories')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  customType === 'accessories'
                    ? 'bg-zinc-900 text-white shadow-md'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                <span>{isArabic ? "إكسسوارات هاند ميد" : "Handmade Accessories"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            
            {/* LEFT SIDE STORYTELLING (The Exquisite Gift Presentation) */}
            <div className="lg:col-span-5 space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
              
              {/* Packaging Showcase Gallery */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8C7A5C] uppercase tracking-widest">
                  <Gift size={14} className="text-[#8C7A5C]" />
                  <span>{isArabic ? "تجربة التغليف والهدايا المترفة" : "ULTRA-LUXURY PRESENTATION"}</span>
                </div>
                
                <h4 className="text-xl font-serif font-black text-[#1F1F1F]">
                  {isArabic ? "تُقدّم في علبة هدايا مطرزة مخصصة بالريشة والخط العربي" : "Presented in an Exquisite Hand-Embroidered Velvet Jewel Box"}
                </h4>
                
                <p className="text-xs text-[#5C5C5C] leading-relaxed font-light">
                  {isArabic 
                    ? "نحن نؤمن بأن فخامة الهدية تبدأ من ملمسها الأول. لذلك، فإن كل قطعة مخصصة توضع بعناية فائقة داخل علبة قطيفة ملكية مبطنة بالحرير الفاخر، تُطبق بختم شمعي أصلي، مع كارت إهداء كلاسيكي فخم يُكتب فيه اسم المُهدي والمُهدى إليه والرسالة خصيصاً بريشة الخطاط وحبر الذهب السائل."
                    : "Every bespoke outfit or pearl headpiece is shipped in a hand-crafted customized velvet case lined with pure silk. Our professional calligrapher writes customized gold ink messages with quill handles to evoke matchless surprise."}
                </p>
              </div>

              {/* Photos reflecting a beautiful custom presentation */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="relative group overflow-hidden rounded-2xl h-44 border border-[#E6E4DC] shadow-sm">
                  <img 
                    src="https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600" 
                    alt="Luxury box"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
                    <span className="text-[10px] font-bold text-white block">{isArabic ? "تجربة التفاف الحرير" : "Premium Gift wrap"}</span>
                  </div>
                </div>
                
                <div className="relative group overflow-hidden rounded-2xl h-44 border border-[#E6E4DC] shadow-sm">
                  <img 
                    src="https://images.unsplash.com/photo-1512909006721-3d6018887383?auto=format&fit=crop&q=80&w=600" 
                    alt="Handwritten card"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5">
                    <span className="text-[10px] font-bold text-white block">{isArabic ? "كارت إهداء بخط يدوي" : "Handwritten message card"}</span>
                  </div>
                </div>

                <div className="col-span-2 relative group overflow-hidden rounded-2xl h-32 border border-[#E6E4DC] shadow-sm">
                  <img 
                    src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=800" 
                    alt="Premium beadwork"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/25 flex items-center justify-center p-4 text-center">
                    <p className="text-xs font-semibold text-white tracking-wider max-w-xs drop-shadow-md">
                      {isArabic ? "تصميمات هاند ميد مخصصة تفوق الخيال" : "Handcrafted detailing designed uniquely for your celebrations"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Guarantees List */}
              <div className="pt-4 space-y-4 border-t border-[#E6E4DC]">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9D9BC] shrink-0" />
                  <p className="text-xs text-[#3A3A3A] font-medium leading-snug">
                    {isArabic 
                      ? "جودة في اختيار أقمشة السواريه والخيوط الألمانية المستوردة" 
                      : "Hand-picked high-end fabrics, French laces, & crystal trims"}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9D9BC] shrink-0" />
                  <p className="text-xs text-[#3A3A3A] font-medium leading-snug">
                    {isArabic 
                      ? "شات مباشر ومتابعة حية مع مصممي الأتيليه في بروفايلك" 
                      : "Dedicated 1-on-1 private messaging with our leading couture artists"}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#C9D9BC] shrink-0" />
                  <p className="text-xs text-[#3A3A3A] font-medium leading-snug">
                    {isArabic 
                      ? "ضمان وصول الهدية مجهّزة ومغلفة تماماً لتمنح السعادة والثقة" 
                      : "Satisfaction guarantee on fitment, tailored sizes and packaging design"}
                  </p>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="bg-white/80 border border-[#E6E4DC] p-4 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-[#FAF9F5] text-[#C9D9BC] rounded-xl shrink-0">
                  <Award size={22} className="stroke-[2.5]" />
                </div>
                <div className="text-right sm:text-left">
                  <p className="font-extrabold text-[10px] uppercase tracking-widest text-[#B88746]">{isArabic ? "راف كوتور الفاخر" : "RAAV COUTURE TRUST"}</p>
                  <p className="text-xs text-[#5C5C5C] mt-0.5 leading-snug">{isArabic ? "جميع طلبات التفصيل الخاصة مكفولة لمطابقة مواصفاتك بنسبة ١٠٠٪." : "Uncompromising craftsmanship certified by our premium atelier."}</p>
                </div>
              </div>

            </div>
            
            {/* RIGHT SIDE FORM (The Bespoke Customizer Panel) */}
            <div className="lg:col-span-7 bg-white border border-[#E6E4DC] rounded-3xl p-5 sm:p-8 shadow-sm" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12 space-y-6"
                  >
                    <div className="w-16 h-16 bg-[#C9D9BC]/20 border border-[#C9D9BC] text-zinc-800 rounded-full flex items-center justify-center mx-auto shadow-sm animate-bounce">
                      <CheckCircle2 size={32} className="text-[#056D64]" />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-serif font-bold text-[#1F1F1F]">
                        {isArabic ? "تم تسجيل طلبك وتلقيه في ذمة الأتيليه!" : "Special Bespoke Order Submitted!"}
                      </h3>
                      <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                        {isArabic
                          ? "قمنا بتأسيس قناة خاصة ومباشرة لكِ لمحادثة مصمم الأتيليه فورياً. ادخلي للبروفايل الآن للمتابعة والاتفاق وبدء المعاينة."
                          : "We successfully initialized a private custom thread for you. Access your profile custom orders tab now to chat directly with your matching designer."}
                      </p>
                    </div>

                    <button
                      onClick={onGoToProfileCustom}
                      className="px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-md inline-flex items-center gap-2 uppercase tracking-wide"
                    >
                      <span>{isArabic ? "الانتقال للمحادثة وتتبع الطلب" : "GO TO LIVE CONVERSATION"}</span>
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {!currentUser ? (
                      <div className="text-center py-12 space-y-6">
                        <div className="w-14 h-14 bg-[#FAF9F5] text-zinc-400 rounded-full flex items-center justify-center mx-auto border border-[#E6E4DC]">
                          <ShoppingBag size={22} className="text-zinc-600" />
                        </div>
                        <div className="space-y-2">
                          <h4 className="font-serif font-bold text-base text-[#1F1F1F]">
                            {isArabic 
                              ? "تسجيل الدخول مطلوب لإرسال مواصفاتك" 
                              : "Account Required to Place Custom Order"}
                          </h4>
                          <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
                            {isArabic
                              ? "حتى نتمكن من فتح شات سري وآمن لكِ مع مصممي الأتيليه لمراجعة رسومات الموديل ورفع مقاساتك بدقة، يرجى تسجيل دخولك أولاً."
                              : "Sign in to submit your custom model, select premium laces, and track direct call feedback in your personal profile center."}
                          </p>
                        </div>
                        <button
                          onClick={onOpenAuth}
                          className="px-6 py-3 bg-zinc-900 hover:bg-zinc-805 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-sm"
                        >
                          {isArabic ? "تسجيل الدخول أو إنشاء حساب" : "LOG IN / CREATE ACCOUNT"}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5 text-right font-sans">
                        <div className="border-b border-[#E6E4DC] pb-3.5 flex justify-between items-center">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                            {isArabic 
                              ? (customType === 'accessories' ? "نموذج مواصفات الإكسسوار الهاند ميد المخصص" : "نموذج مواصفات التفصيل المخصص") 
                              : "Bespoke Request Specifications"}
                          </h4>
                          <span className="text-[10px] text-zinc-400">{isArabic ? "طلب مخصص ذكي" : "Smart Bespoke Request"}</span>
                        </div>

                        {errorMsg && (
                          <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-xs rounded-xl">
                            {errorMsg}
                          </div>
                        )}

                        {/* Title & Budget */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-700">
                              {isArabic 
                                ? (customType === 'accessories' ? "نوع الإكسسوار المطلوب *" : "عنوان الموديل أو الفستان المطلوب *") 
                                : (customType === 'accessories' ? "Desired Accessory Type *" : "Desired Item Name *")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic 
                                ? (customType === 'accessories' ? "مثال: هيدبيس لؤلؤ رويال، حقيبة يد مخملية" : "مثال: فستان كريب ميكادو مع تطريز يديوي") 
                                : (customType === 'accessories' ? "e.g., Pearl Crown Headpiece" : "e.g. Mikado Silk Evening Gown")}
                              className="w-full bg-[#FAF9F5] border border-[#E6E4DC] focus:border-[#C9D9BC] focus:bg-white rounded-xl p-2.5 text-xs text-zinc-900 outline-none transition"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-700">
                              {isArabic ? "الميزانية التقريبية المرصودة (بالجنيه ج.م) *" : "Your Target Budget (EGP) *"}
                            </label>
                            <input
                              type="number"
                              required
                              min={100}
                              placeholder="3000"
                              className="w-full bg-[#FAF9F5] border border-[#E6E4DC] focus:border-[#C9D9BC] focus:bg-white rounded-xl p-2.5 text-xs text-zinc-900 outline-none transition font-mono"
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        {/* Material & Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-700">
                              {isArabic 
                                ? (customType === 'accessories' ? "نوع الخيوط أو الأحجار المفضلة *" : "الخامة أو نوع الأقمشة المفضلة *") 
                                : (customType === 'accessories' ? "Preferred Stones/Beads *" : "Fabric/Material *")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic 
                                ? (customType === 'accessories' ? "مثال: لؤلؤ زراعي، كريستال، أحجار عقيق" : "مثال: ساتان سميك، حرير هندي، تول كوري") 
                                : (customType === 'accessories' ? "e.g. River pearls, gold wire" : "e.g. Mikado Silk Crepe")}
                              className="w-full bg-[#FAF9F5] border border-[#E6E4DC] focus:border-[#C9D9BC] focus:bg-white rounded-xl p-2.5 text-xs text-zinc-900 outline-none transition"
                              value={formData.material}
                              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-semibold text-zinc-700">
                              {isArabic ? "تحديد الألوان المفضلة وسياق الفستان *" : "Ideal Color Tones *"}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic ? "مثال: أوف وايت لؤلؤي، وردي باستيل، ذهبي" : "e.g., Ivory White, Soft Champagne"}
                              className="w-full bg-[#FAF9F5] border border-[#E6E4DC] focus:border-[#C9D9BC] focus:bg-white rounded-xl p-2.5 text-xs text-zinc-900 outline-none transition"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-zinc-700">
                            {isArabic 
                              ? (customType === 'accessories' ? "تفاصيل طلبك بدقة، الطول والأبعاد والرموز المطلوب نقشها *" : "تفاصيل قصة الفستان، المقاسات التقريبية، والمناسبة لتصميم ملائم *") 
                              : (customType === 'accessories' ? "Design details & metrics *" : "Specific Dimensions or Inspiration details *")}
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder={isArabic 
                              ? "يرجى كتابة تفاصيل طلب الموديل الإبداعية، أي إضافات يدوية مثل الخرز الفاخر أو نوع المقاسات التي تفضلينها للفستان أو القطعة الهاند ميد..." 
                              : "Describe your ideas, fitments, length preferences or custom detailing requirements..."}
                            className="w-full bg-[#FAF9F5] border border-[#E6E4DC] focus:border-[#C9D9BC] focus:bg-white rounded-xl p-3 text-xs text-zinc-900 outline-none transition leading-relaxed"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>

                        {/* EXQUISITE GIFT OPTION SELECTOR IN THE FORM */}
                        <div className="border border-[#EBDCB9] bg-[#FCFBF4] rounded-2xl p-4.5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Gift className="text-[#B88746]" size={16} />
                              <span className="text-xs font-bold text-[#8C7A5C]">
                                {isArabic ? "هل تريدين تقديم هذه القطعة كهدية ملكية مميزة؟" : "Present this custom piece as a luxury gift?"}
                              </span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={isGift}
                              onChange={(e) => setIsGift(e.target.checked)}
                              className="h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-[#B88746] cursor-pointer"
                            />
                          </div>

                          {isGift && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-3 pt-2 text-right border-t border-[#E8DFC9] overflow-hidden"
                            >
                              <div className="space-y-1">
                                <label className="block text-[11px] font-bold text-[#8C7A5C]">{isArabic ? "نوع علبة الهدايا الفاخرة:" : "Bespoke Jewelry/Gift Box Style:"}</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { id: 'velvet', labelAr: "مخمل ملكي مطرز", labelEn: "Embroidered Velvet" },
                                    { id: 'leather', labelAr: "جلد راف منقوش", labelEn: "Stamped Leather" },
                                    { id: 'classic', labelAr: "كلاسيك حريري", labelEn: "Classic Tied Silk" }
                                  ].map((box) => (
                                    <button
                                      key={box.id}
                                      type="button"
                                      onClick={() => setGiftBoxType(box.id as any)}
                                      className={`p-2 rounded-xl border text-[10.5px] font-bold transition text-center ${
                                        giftBoxType === box.id 
                                          ? 'border-[#B88746] bg-[#FAF3E0] text-[#8C7A5C] shadow-sm' 
                                          : 'border-[#E6E4DC] bg-white text-zinc-500 hover:border-zinc-300'
                                      }`}
                                    >
                                      {isArabic ? box.labelAr : box.labelEn}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium text-zinc-600">{isArabic ? "اسم متلقي الهدية للنقش على العلبة:" : "Recipient Name for Packaging Embossing:"}</label>
                                  <input 
                                    type="text"
                                    placeholder={isArabic ? "مثال: أميرة، ياسمين" : "Recipient name for embossing"}
                                    value={giftRecipientName}
                                    onChange={(e) => setGiftRecipientName(e.target.value)}
                                    className="w-full bg-white border border-[#E6E4DC] focus:border-[#C9D9BC] rounded-xl p-2 text-xs text-zinc-900"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[11px] font-medium text-zinc-600">{isArabic ? "رسالة كارت الإهداء (تكتب بخط اليد بالذهب):" : "Handwritten Calligraphy Card message:"}</label>
                                  <input 
                                    type="text"
                                    placeholder={isArabic ? "كل عام وأنتِ بقلبي • بارك الله لكما..." : "e.g., Happy birthday Princess..."}
                                    value={giftCardMessage}
                                    onChange={(e) => setGiftCardMessage(e.target.value)}
                                    className="w-full bg-white border border-[#E6E4DC] focus:border-[#C9D9BC] rounded-xl p-2 text-xs text-zinc-900"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>

                        {/* Personal delivery credentials */}
                        <div className="border-t border-[#E6E4DC] pt-4.5 space-y-4">
                          <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={12} className="text-[#C9D9BC]" />
                            <span>{isArabic ? "بيانات التواصل والشحن والـ WhatsApp لسرعة المتابعة" : "Patron Shipping & Verification"}</span>
                          </h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="block text-[11px] text-zinc-600">{isArabic ? "اسمك الكريم لتسمية الفاتورة والشات" : "Your Name"}</label>
                              <input
                                type="text"
                                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl p-2.5 text-xs text-zinc-900"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[11px] text-zinc-600">{isArabic ? "رقم الهاتف والواتساب *" : "Active Phone/WhatsApp *"}</label>
                              <input
                                type="text"
                                required
                                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl p-2.5 text-xs text-zinc-900 font-mono"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1 space-y-1">
                              <label className="block text-[11px] text-zinc-600">{isArabic ? "المحافظة" : "Governorate"}</label>
                              <select
                                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl p-2 text-xs text-zinc-900"
                                value={formData.city}
                                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              >
                                {cairoDistricts.map((city) => (
                                  <option key={city.id} value={city.id}>
                                    {isArabic ? city.nameAr : city.nameEn}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="sm:col-span-2 space-y-1">
                              <label className="block text-[11px] text-zinc-600">{isArabic ? "العنوان السكني بالكامل بالتفصيل" : "House Location detail"}</label>
                              <input
                                type="text"
                                placeholder={isArabic ? "مثال: فيلا 5، التجمع الخامس أول التسعين" : "e.g. Building 22, Rehab city"}
                                className="w-full bg-[#FAF9F5] border border-[#E6E4DC] rounded-xl p-2.5 text-xs text-zinc-900"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Action Submission */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 disabled:bg-[#EEEDE9] disabled:text-zinc-400 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow-sm flex items-center justify-center gap-2 uppercase tracking-wide"
                          >
                            {isLoading ? (
                              <span className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin inline-block" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>
                              {isArabic 
                                ? (customType === 'accessories' ? "إرسال طلب الإكسسوار وبدء الاستشارة" : "تسجيل طلب التفصيل وبدء الاستشارة") 
                                : (customType === 'accessories' ? "SUBMIT CUSTOM DESIGN & INHERIT GIFT" : "SEND CUSTOM ORDER REQUEST")}
                            </span>
                          </button>
                        </div>

                      </form>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
);
}
