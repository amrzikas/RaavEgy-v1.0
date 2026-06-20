import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Award, CheckCircle2, ShoppingBag, Landmark, ArrowRight } from 'lucide-react';
import { createCustomOrder } from '../dbService';

interface CustomCoutureFormProps {
  isArabic: boolean;
  currentUser: any;
  onOpenAuth: () => void;
  onGoToProfileCustom: () => void;
}

export default function CustomCoutureForm({
  isArabic,
  currentUser,
  onOpenAuth,
  onGoToProfileCustom,
}: CustomCoutureFormProps) {
  const [customType, setCustomType] = useState<'couture' | 'accessories'>('couture');
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
      budget: type === 'accessories' ? 1000 : 3000,
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

    try {
      await createCustomOrder({
        customerId: currentUser.uid,
        customerName: formData.name || currentUser.name || (isArabic ? 'عميل راف' : 'RAAV Patron'),
        customerPhone: formData.phone || currentUser.phone || '',
        customerAddress: formData.address || '',
        customerCity: formData.city,
        customerNotes: formData.notes,
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

  return (
    <section id="special-custom-orders" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-16 font-sans focus:outline-none">
      <div className="relative overflow-hidden rounded-[2.5rem] border border-amber-950/20 shadow-2xl bg-zinc-950 text-white p-6 sm:p-10 md:p-14">
        {/* Visual atmospheric effects */}
        <div className="absolute top-0 right-0 w-[45%] h-full bg-gradient-to-l from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-[-30%] left-[-20%] w-[450px] h-[450px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[30%] w-[250px] h-[250px] bg-white/5 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 space-y-10">
          
          {/* Custom Type Selector Tabs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800/80 pb-6" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
            <div className="text-right sm:text-left">
              <h3 className="text-lg font-serif font-bold text-amber-400">
                {isArabic ? "قسم تفصيل الهاند ميد والطلبات الخاصة" : "RAAV Bespoke & Custom Designs"}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 font-light">
                {isArabic ? "اختاري نوع طلبك المخصص لمطابقة طلبك مع مصممي الأتيليه المحترفين" : "Select design type to pair your creative ideas with our elite artisans"}
              </p>
            </div>
            
            <div className="flex gap-2.5 p-1 bg-zinc-900 border border-zinc-850 rounded-2xl self-center sm:self-auto">
              <button
                type="button"
                onClick={() => handleCustomTypeChange('couture')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  customType === 'couture'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <Sparkles size={14} className={customType === 'couture' ? 'text-black' : 'text-amber-400'} />
                <span>{isArabic ? "تفصيل ملابس وفساتين" : "Bespoke Couture"}</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleCustomTypeChange('accessories')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  customType === 'accessories'
                    ? 'bg-amber-400 text-black shadow-md shadow-amber-400/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                }`}
              >
                <Sparkles size={14} className={customType === 'accessories' ? 'text-black' : 'text-amber-400'} />
                <span>{isArabic ? "إكسسوارات هاند ميد" : "Handmade Accessories"}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* LEFT/RIGHT Intro info depending on language */}
            <div className="lg:col-span-5 space-y-6" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
              <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em]">
                <Sparkles size={12} className="text-amber-400 animate-pulse" />
                <span>
                  {isArabic 
                    ? (customType === 'accessories' ? "قسم الإكسسوارات الهاند ميد الفاخرة" : "قسم تفصيل الهاند ميد الفاخر") 
                    : (customType === 'accessories' ? "EXQUISITE HANDMADE ACCESSORIES" : "HIGH-COUTURE BESPOKE STUDIO")}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-black tracking-tight leading-tight text-white">
                {isArabic 
                  ? (customType === 'accessories' ? "طلب تصميم وتطريز الإكسسوارات الخاصة" : "طلب الملابس والفساتين الخاصة المخصصة") 
                  : (customType === 'accessories' ? "Delicate Timeless Accessories Crafted for You" : "Your Custom Dream Tailored to Perfect Reality")}
              </h2>

              <p className="text-sm text-zinc-300 font-light leading-relaxed">
                {isArabic
                  ? (customType === 'accessories' 
                    ? "هل تبحثين عن هيد بيس (تاج ورأس شعر) متناسق تماماً مع فستانك، حقيبة يد مطرزة باللؤلؤ والخرز الفاخر، أو طرحة زفاف منقوشة بالكريستال البوهيمي اللامع؟ مصممو RAAV يصممون وينفذون لكِ إكسسوارات يدوية مذهلة تكمل سحركِ بقطع فريدة حصرية. املئي هذا الطلب للتواصل الفوري الفعال." 
                    : "هل تبحثين عن قصة معينة، فستان بمقاساتك الدقيقة، أو فستان سواريه مطرز باليد؟ في أتيليه RAAV، نحول أفكارك وصورك إلى تحف فنية ملموسة بخامات مستوردة ممتازة ودقة لا تضاهى. املئي هذا الطلب وسيتولى فريقنا التنفيذي التواصل وتفعيل شات فوري في بروفايلك للاتفاق.")
                  : (customType === 'accessories'
                    ? "Looking for a custom hairpiece/headband, an exquisite hand-beaded bridal clutch with pearls, or a crystal-studded wedding veil? RAAV artisans craft timeless, one-of-a-kind handmade accessory masterpieces to complement your look. Send your design notes now to begin immediate discussion."
                    : "Whether it is an elegant luxury evening gown, precision handmade embroidery, or highly custom tailored ensembles, our artisans translate your style criteria into masterworks. Supply your metrics, fabrics, and color palette below to start active communication.")}
              </p>

              <div className="pt-4 space-y-3 font-sans text-xs text-zinc-400">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>
                    {isArabic 
                      ? (customType === 'accessories' ? "مستوى عالٍ من الدقة في تطريز الكريستال واللؤلؤ والخرز" : "استشارات ودردشة فورية ومتابعة خطوة بخطوة") 
                      : (customType === 'accessories' ? "Precision beadwork & crystal arrangement" : "Real-time updates, sample reviews & bespoke sizes")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>
                    {isArabic 
                      ? (customType === 'accessories' ? "تصاميم حصرية خالية من التكرار لمناسبتك السعيدة" : "إمكانية إرسال عينات ملابس ومعاينتها قبل التفصيل النهائي") 
                      : (customType === 'accessories' ? "100% original designs customized to your dress" : "Hand-picked fabrics, sketches & premium finishing")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>
                    {isArabic 
                      ? (customType === 'accessories' ? "ميزانية مرنة ومناسبة تناسب متطلبات إكسسوارك الفاخر" : "أسعار تبدأ حسب مواصفاتك وبميزانية تناسب متطلباتك") 
                      : (customType === 'accessories' ? "Flexible budget optimization for special additions" : "Cost and budget transparency with secure instapay deposit")}
                  </span>
                </div>
              </div>

              {/* Loyalty reminder */}
              <div className="bg-zinc-900/40 border border-zinc-805 p-5 rounded-2xl flex items-center gap-3.5">
                <Award className="text-amber-400 shrink-0" size={24} />
                <div className="text-right sm:text-left">
                  <p className="font-extrabold text-[11px] uppercase tracking-wider text-amber-500">{isArabic ? "نقاط ولاء مضمونة" : "LOYALTY PROGRAM REWARDS"}</p>
                  <p className="text-xs text-zinc-300 mt-0.5 leading-snug">{isArabic ? "تكسبين نقاطاً كاملة قابلة للاستبدال كخصومات فورية عند تأكيل طلبك المخصص." : "Bespoke orders earn standard loyalty program cash back bonuses automatically."}</p>
                </div>
              </div>
            </div>

            {/* RIGHT/LEFT Active Interaction Area */}
            <div className="lg:col-span-7 bg-zinc-900/30 border border-zinc-800/40 rounded-3xl p-5 sm:p-8" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-10 space-y-6"
                  >
                    <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-bounce">
                      <CheckCircle2 size={36} />
                    </div>

                    <div className="space-y-2">
                      <h3 className="text-xl font-bold text-white">{isArabic ? "تم استلام طلبك المخصص بنجاح!" : "Special Bespoke Order Submitted!"}</h3>
                      <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                        {isArabic
                          ? "لقد قمنا بتأسيس قناة محادثة مخصصة لطلبك. يمكنك الدخول الآن فوراً والتحدث مع المصمم وتلقي عروض الأسعار والدفع مياشرة."
                          : "We successfully initialized a private custom thread for you. Access your profile custom orders tab now to chat directly with your matching designer."}
                      </p>
                    </div>

                    <button
                      onClick={onGoToProfileCustom}
                      className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black text-xs rounded-xl cursor-pointer transition shadow-lg inline-flex items-center gap-2 uppercase tracking-wider"
                    >
                      <span>{isArabic ? "الانتقال للمحادثة وتتبع الطلب" : "GO TO LIVE CONVERSATION"}</span>
                      <ArrowRight size={13} className={isArabic ? "rotate-180" : ""} />
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
                        <div className="w-14 h-14 bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center mx-auto border border-zinc-700">
                          <ShoppingBag size={24} />
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="font-bold text-sm text-zinc-100">
                            {isArabic 
                              ? (customType === 'accessories' ? "سجلي دخولك لطلب الإكسسوار المخصص" : "سجلي دخولك لتصميم الموديل المخصص") 
                              : "Account Required to Place Custom Order"}
                          </h4>
                          <p className="text-xs text-zinc-400 max-w-xs mx-auto leading-relaxed">
                            {isArabic
                              ? "يتطلب هاند ميد RAAV المخصص حساباً خاصاً لحفظ طلباتك ومتابعة الشات والرسائل الفورية ومراجعة التصاميم مع الأتيليه."
                              : "Submit custom requirements, materials, budgets, and track real-time couture team feedback in private chat."}
                          </p>
                        </div>
                        <button
                          onClick={onOpenAuth}
                          className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 text-black font-black text-xs rounded-xl cursor-pointer transition shadow-md"
                        >
                          {isArabic ? "سدلي الدخول أو انشئي حساباً مجاناً" : "LOG IN / CREATE ACCOUNT"}
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5 text-right font-sans">
                        <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
                          <h4 className="text-xs font-extrabold uppercase tracking-widest text-[9px] text-amber-400">
                            {isArabic 
                              ? (customType === 'accessories' ? "نموذج طلب إكسسوار هاند ميد" : "نموذج التفصيل اليدوي") 
                              : "Bespoke Request Specifications"}
                          </h4>
                          <span className="text-[10px] text-zinc-500">{isArabic ? "يرجى ملء البيانات" : "Please provide details"}</span>
                        </div>

                        {errorMsg && (
                          <div className="p-3.5 bg-red-950/20 text-red-400 border border-red-900/30 text-xs rounded-xl">
                            {errorMsg}
                          </div>
                        )}

                        {/* Title & Budget */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">
                              {isArabic 
                                ? (customType === 'accessories' ? "اسم ونوع الإكسسوار المطلوب *" : "عنوان الموديل المطلوب *") 
                                : (customType === 'accessories' ? "Desired Accessory name/type *" : "Desired Dress/Item Name *")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic 
                                ? (customType === 'accessories' ? "مثال: هيدبيس لؤلؤ كريستال، حقيبة مطرزة باللؤلؤ" : "مثال: فستان خطوبة مطرز باللؤلؤ") 
                                : (customType === 'accessories' ? "e.g., Pearl Crystal Headpiece, Floral Clutch" : "e.g. Silk Wedding Veil Gown")}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg p-2.5 text-xs text-white"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "الميزانية التقريبية بالجنيه ج.م *" : "Your Target Budget (EGP) *"}</label>
                            <input
                              type="number"
                              required
                              min={100}
                              placeholder="1000"
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg p-2.5 text-xs text-white font-mono"
                              value={formData.budget}
                              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                            />
                          </div>
                        </div>

                        {/* Material & Color */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">
                              {isArabic 
                                ? (customType === 'accessories' ? "الخامات المفضلة كاللؤلؤ أو الكريستال *" : "نوع الخامة أو القماش المفضل *") 
                                : (customType === 'accessories' ? "Preferred Materials *" : "Fabric/Material *")}
                            </label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic 
                                ? (customType === 'accessories' ? "مثال: لؤلؤ طبيعي عاجي، كريستال نمساوي، سلك مذهّب" : "مثال: حرير طبيعي، كريب ميكادو، ساتان شانيل") 
                                : (customType === 'accessories' ? "e.g., Natural ivory pearls, Austrian crystals" : "e.g. Mikado Silk Crepe")}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg p-2.5 text-xs text-white"
                              value={formData.material}
                              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-zinc-400 mb-1">{isArabic ? "اللون المطلوب بالتفصيل *" : "Desired Color tones *"}</label>
                            <input
                              type="text"
                              required
                              placeholder={isArabic 
                                ? (customType === 'accessories' ? "مثال: أبيض عاجي Off-white، ذهبي شامبين، فضي ميتاليك" : "مثال: أبيض عاجي Off-white، كحلي ملكي") 
                                : (customType === 'accessories' ? "e.g., Ivory White, Champagne Gold, Silver" : "e.g. Ivory white, Royal Blue")}
                              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg p-2.5 text-xs text-white"
                              value={formData.color}
                              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <label className="block text-xs font-semibold text-zinc-400 mb-1">
                            {isArabic 
                              ? (customType === 'accessories' ? "تفاصيل التصميم ومقاسات الأبعاد (العرض والارتفاع) *" : "تفاصيل التصميم ومقاسات الجسم (الصدر، الخصر، الطول) *") 
                              : (customType === 'accessories' ? "Accessory details & dimension metrics *" : "Detailed Specifications & Metric Constraints *")}
                          </label>
                          <textarea
                            required
                            rows={3}
                            placeholder={isArabic 
                              ? (customType === 'accessories' 
                                ? "مثال: أود تطريز اللؤلؤ بشكل كثيف، هيدبيس لينة لتناسب تسريحة شعر مرفوعة، الطول ٢٠ سم..." 
                                : "يرجى كتابة تفاصيل الموديل، الطول المطلوب، مقاساتك إن وجد، أو أي إضافات يدوية مثل الخرز والتطريز...") 
                              : (customType === 'accessories'
                                ? "Describe custom patterns, head size details, embroidery density, or matching dress photos..."
                                : "Include structural lines, embroidery requests, length parameters, or any custom size considerations...")}
                            className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-lg p-2.5 text-xs text-white leading-relaxed"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          />
                        </div>

                        {/* Personal delivery credentials for safety and trust */}
                        <div className="border-t border-zinc-850 pt-4 space-y-4">
                          <h5 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{isArabic ? "بيانات للتواصل والتوصيل عند اكتمال التصميم" : "Account Verification for Bespoke Shipping"}</h5>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">{isArabic ? "الاسم الكريم للتواصل" : "Your Name"}</label>
                              <input
                                type="text"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] text-zinc-400 mb-1">{isArabic ? "رقم الهاتف الفعال للتأكيد والواتساب" : "Contact Phone (Active)"}</label>
                              <input
                                type="text"
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white font-mono"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-1">
                              <label className="block text-[11px] text-zinc-400 mb-1">{isArabic ? "المحافظة" : "Governorate"}</label>
                              <select
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-white"
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
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] text-zinc-400 mb-1">{isArabic ? "العنوان السكني بالكامل" : "Detail Address"}</label>
                              <input
                                type="text"
                                placeholder={isArabic ? "مثال: التجمع الخامس، شارع التسعين، فيلا ٢٢" : "Store delivery target address"}
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white"
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
                            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 disabled:from-zinc-800 disabled:to-zinc-800 text-black font-black text-xs rounded-xl cursor-pointer transition shadow-lg flex items-center gap-2 uppercase tracking-wide"
                          >
                            {isLoading ? (
                              <span className="w-4 h-4 rounded-full border border-black border-t-transparent animate-spin inline-block" />
                            ) : (
                              <Send size={13} />
                            )}
                            <span>
                              {isArabic 
                                ? (customType === 'accessories' ? "إرسال طلب الإكسسوار وبدء الاستشارة" : "إرسال طلب التفصيل وبدء الاستشارة") 
                                : (customType === 'accessories' ? "SUBMIT ACCESSORY CUSTOM REQUEST" : "SUBMIT ORDER & START CONSULTATION")}
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
    </section>
  );
}
