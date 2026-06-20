import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  Truck, 
  RotateCcw, 
  Scissors, 
  FileText, 
  HelpCircle, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  ChevronDown,
  MessageSquare,
  Maximize2
} from 'lucide-react';

/* --------------------------------------------------
   1. CONTACT US PAGE
   -------------------------------------------------- */
interface SubPageProps {
  isArabic: boolean;
  onBackToHome: () => void;
  content?: any;
}

export function renderCustomText(text: string) {
  if (!text) return null;
  return text.split('\n\n').map((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;
    
    // Headers
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={pIdx} className="text-base sm:text-lg font-serif font-semibold text-zinc-950 mt-6 mb-3 pb-2 border-b border-zinc-100">
          {trimmed.replace('### ', '')}
        </h3>
      );
    }
    if (trimmed.startsWith('#### ')) {
      return (
        <h4 key={pIdx} className="text-xs sm:text-sm font-serif font-bold text-zinc-950 mt-4 mb-2">
          {trimmed.replace('#### ', '')}
        </h4>
      );
    }
    
    // Lists
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
      return (
        <ul key={pIdx} className="list-disc list-inside space-y-2 my-3 pl-2 pr-2">
          {trimmed.split('\n').map((line, lIdx) => {
            const lineTrim = line.trim();
            if (!lineTrim) return null;
            return (
              <li key={lIdx} className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-light">
                {lineTrim.replace(/^[\*\-]\s+/, '')}
              </li>
            );
          })}
        </ul>
      );
    }
    
    // Standard paragraphs
    return (
      <p key={pIdx} className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-light mb-4 whitespace-pro-wrap">
        {trimmed}
      </p>
    );
  });
}

export function ContactUsPage({ isArabic, onBackToHome, content }: SubPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', subject: 'general', message: '' });
    }, 1200);
  };

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      {/* Page Title */}
      <div className="text-center mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 text-amber-900 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          <Sparkles size={11} className="text-amber-805 animate-pulse" />
          <span>{isArabic ? "تواصل مباشر" : "WE'RE HERE FOR YOU"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
          {content ? (isArabic ? content.titleAr : content.titleEn) : (isArabic ? "اتصل بنا" : "Contact Us")}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-3 max-w-md mx-auto">
          {content 
            ? (isArabic ? content.subtitleAr : content.subtitleEn) 
            : (isArabic 
              ? "نحن هنا لمساعدتِك وتلبية رغبات الملابس المخصصة لديكِ. اتصلي بفريقنا الفني والأساتذة لتجربة فاخرة." 
              : "Connect with our design advisors, master tailors, and customer support coordinators.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-start" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        
        {/* Left Side: Contact details */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          <div className="bg-white border border-zinc-150/50 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 sm:space-y-8">
            <h3 className="text-lg sm:text-xl font-serif font-medium text-zinc-950">
              {isArabic ? "معلومات الأتيليه الرئيسي" : "Our Flagship Atelier"}
            </h3>

            {/* Direct Whatsapp item */}
            <a 
              href={`https://wa.me/${content?.whatsappPhone || "201012345678"}`} 
              target="_blank" 
              rel="noreferrer" 
              className="flex items-start gap-4 p-3.5 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/60 rounded-2xl transition duration-300 group cursor-pointer"
            >
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm">
                <MessageSquare size={18} />
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">
                  {isArabic ? "شات واتساب فوري" : "INSTANT WHATSAPP"}
                </p>
                <p className="text-xs sm:text-sm text-zinc-900 font-semibold">
                  {content?.whatsappPhone ? `+${content.whatsappPhone}` : "+20 101 234 5678"}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {isArabic ? "اضغطي هنا للدردشة المباشرة مع منسقينا" : "Tap to chat immediately with an advisor"}
                </p>
              </div>
            </a>

            <div className="space-y-5">
              {/* Telephone */}
              <div className="flex gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-800 shrink-0">
                  <Phone size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{isArabic ? "رقم الهاتف" : "Telephone Support"}</p>
                  <p className="text-xs sm:text-sm text-zinc-900 font-medium font-mono">{content?.phone || "+20 101 234 5678"}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-800 shrink-0">
                  <Mail size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{isArabic ? "البريد الإلكتروني للعملاء" : "Client Care Email"}</p>
                  <p className="text-xs sm:text-sm text-zinc-900 font-medium font-mono">{content?.email || "support@raavegy.com"}</p>
                </div>
              </div>

              {/* Address */}
              <div className="flex gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-800 shrink-0">
                  <MapPin size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{isArabic ? "موقع صالة العرض" : "Boutique Location"}</p>
                  <p className="text-xs sm:text-sm text-zinc-900 font-medium">
                    {content 
                      ? (isArabic ? content.addressAr : content.addressEn) 
                      : (isArabic 
                        ? "التجمع الخامس، شارع التسعين، نيو كايرو، مصر" 
                        : "90th Street, Fifth Settlement, New Cairo, Egypt")}
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex gap-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 border border-zinc-150 rounded-xl flex items-center justify-center text-zinc-850 shrink-0">
                  <Clock size={16} />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">{isArabic ? "ساعات العمل" : "Operating Hours"}</p>
                  <p className="text-xs sm:text-sm text-zinc-900 font-medium">
                    {content 
                      ? (isArabic ? content.workingHoursAr : content.workingHoursEn) 
                      : (isArabic 
                        ? "كل يوم من الساعة ١٢ ظهراً حتى ١٠ مساءً" 
                        : "Daily from 12:00 PM to 10:05 PM")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Map mockup card */}
          <div className="bg-zinc-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md">
            <div className="absolute top-[-20%] right-[-20%] w-[180px] h-[180px] bg-amber-500/10 rounded-full blur-[40px]" />
            <div className="relative z-10 space-y-3">
              <span className="text-[8px] tracking-widest font-bold uppercase text-amber-400">
                {isArabic ? "معاينة تجربة الدخول" : "VISIT ATELIER"}
              </span>
              <p className="text-xs text-zinc-300 font-light">
                {isArabic 
                  ? "نرحب بزيارتكِ لتجربة عينات الأقمشة ومناقشة التفصيلات مع الخبراء. يرجى حجز موعد مسبقاً." 
                  : "Walk-ins are welcome for fabric audits and size definitions. Pre-booking ensures a dedicated personal designer."}
              </p>
              <button 
                onClick={onBackToHome}
                className="text-xs inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 uppercase font-sans font-bold tracking-wider pt-2"
              >
                <span>{isArabic ? "الرجوع للرئيسية" : "BACK TO HOME COLLECTION"}</span>
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Message form */}
        <div className="lg:col-span-7 bg-white border border-zinc-150 rounded-3xl p-6 sm:p-10 shadow-sm">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12 space-y-6"
              >
                <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-inner animate-bounce mb-2">
                  <CheckCircle2 size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-zinc-950 font-serif">
                    {isArabic ? "تم إرسال رسالتكِ بنجاح!" : "Message Submitted Successfully!"}
                  </h3>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                    {isArabic 
                      ? "نشكرك على تواصلك الجميل. سيقوم أحد مستشاري RAAV بالتواصل معك عبر الواتساب أو اتصال مباشر خلال ساعتين على الأكثر."
                      : "We received your correspondence. A RAAV coordinator will reach back to you via call or Whatsapp within 2 hours."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="px-6 py-3 bg-zinc-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition hover:bg-zinc-800"
                >
                  {isArabic ? "ارسال رسالة أخرى" : "Send Another Inquiry"}
                </button>
              </motion.div>
            ) : (
              <motion.form 
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="border-b border-zinc-100 pb-3">
                  <h3 className="text-lg font-serif text-zinc-950 font-medium">
                    {isArabic ? "تفاصيل طلب الاستفسار" : "Send Us a Message"}
                  </h3>
                  <p className="text-[10px] sm:text-xs text-zinc-400 mt-1">
                    {isArabic ? "يرجى ملء البيانات لنرتب لكِ مستشار تصميم مناسب" : "Provide details to match your request with our expert artisans"}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{isArabic ? "الاسم الكامل *" : "Your Name *"}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Heba Ahmed"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-amber-550/80 rounded-xl p-3 text-xs text-zinc-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{isArabic ? "رقم الهاتف الفعال للتواصل *" : "Contact Phone *"}</label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +20 101 234 5678"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-amber-550/80 rounded-xl p-3 text-xs text-zinc-900 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{isArabic ? "البريد الإلكتروني *" : "Email Address *"}</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. client@example.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-amber-550/80 rounded-xl p-3 text-xs text-zinc-900 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{isArabic ? "نوع الاستفسار *" : "Inquiry Type *"}</label>
                  <select
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-amber-550/80 rounded-xl p-3 text-xs text-zinc-900"
                  >
                    <option value="general">{isArabic ? "استفسارات عامة" : "General Inquiry"}</option>
                    <option value="bespoke">{isArabic ? "تفصيل وموديلات مخصصة (Couture)" : "Tailoring & Bespoke (Couture)"}</option>
                    <option value="order">{isArabic ? "تتبع طلبي الحالي أو الشحن" : "Order Status & Shipping"}</option>
                    <option value="returns">{isArabic ? "طلب استبدال أو تعديل مقاس" : "Returns & Size Alterations"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 mb-1.5">{isArabic ? "رسالتكِ بالتفصيل *" : "Your Detailed Message *"}</label>
                  <textarea
                    required
                    rows={4}
                    placeholder={isArabic ? "يرجى كتابة كافة تفاصيل طلبك أو مقاسك أو تعديلاتك المطلوبة..." : "Tell us about sizes, dress modifications, custom notes, or address highlights..."}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-zinc-50 border border-zinc-200 focus:bg-white focus:border-amber-550/80 rounded-xl p-3 text-xs text-zinc-900 leading-relaxed"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-zinc-950 hover:bg-zinc-800 disabled:bg-zinc-300 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {loading ? (
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block" />
                  ) : (
                    <Send size={13} />
                  )}
                  <span>{isArabic ? "إرسال الرسالة الآن" : "Send Correspondence"}</span>
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
}

/* --------------------------------------------------
   2. SHIPPING & RETURNS PAGE
   -------------------------------------------------- */
export function ShippingReturnsPage({ isArabic, content }: { isArabic: boolean; content?: any }) {
  if (content) {
    return (
      <section className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 text-amber-900 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
            <Truck size={11} className="text-amber-805 animate-bounce" />
            <span>{isArabic ? "سياسة التوصيل المريحة والآمنة" : "LUXURY DIRECT DISPATCH"}</span>
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
            {isArabic ? content.titleAr : content.titleEn}
          </h1>
        </div>
        <div className="bg-white border border-zinc-150 rounded-[2rem] p-6 sm:p-12 shadow-sm relative overflow-hidden" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
          <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            {renderCustomText(isArabic ? content.contentAr : content.contentEn)}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Editorial Header */}
      <div className="text-center mb-12 sm:mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 text-amber-900 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          <Truck size={11} className="text-amber-805 animate-bounce" />
          <span>{isArabic ? "سياسة التوصيل المريحة والآمنة" : "LUXURY DIRECT DISPATCH"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
          {isArabic ? "الشحن والاسترجاع" : "Shipping & Returns"}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
          {isArabic 
            ? "نحن نعيد تصور تجربة تسوق الأزياء الراقية في مصر. استمتعي بخدمة المعاينة الدقيقة وقياس القطع مع المندوب قبل الدفع." 
            : "Redefining bespoke shopping in Egypt. Experience trial fittings and doorstep measurements prior to payment."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        
        {/* Shipping details */}
        <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 sm:space-y-8 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-900 rounded-xl flex items-center justify-center">
              <Truck size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-medium text-zinc-950">
                {isArabic ? "سياسة وتفاصيل الشحن السريع" : "Premium Shipping & Dispatch"}
              </h3>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{isArabic ? "التغطية والأسعار" : "COVERAGE & FARES"}</p>
            </div>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-zinc-650 leading-relaxed font-light">
            {isArabic ? (
              <>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">القاهرة الكبرى والجيزة (منطقة الدلتا):</p>
                  <p>التوصيل السريع خلال ٢٤ - ٤٨ ساعة عمل فقط. سعر الشحن قياسي (٦٠ ج.م).</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">الإسكندرية ومحافظات الوجه البحري والقبلي والمحافظات البعيدة:</p>
                  <p>الشحن والتوصيل خلال ٣ - ٥ أيام عمل. سعر الشحن الموحد (٨٠ ج.م).</p>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-2xl flex items-start gap-3 mt-4">
                  <span className="text-amber-600 text-lg">✦</span>
                  <div>
                    <strong className="text-amber-900 block font-bold mb-0.5">ميزة فحص الموديل وقياسه عند الباب!</strong>
                    <span>ندرك احتياج الأزياء الراقية للمطابقة. يمكنكِ معاينة القطعة وقياس ثياب فستانكِ مع بقاء مندوب التوصيل في الانتظار بالخارج. في حال لم يعجبكِ فادفعي فقط مصاريف الشحن للمندوب وسيعود بالقطعة فوراً.</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">Greater Cairo & Giza (Delta Region):</p>
                  <p>Express dispatch within 24 to 48 hours max. Standard flat shipping fee: 60 EGP.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">Alexandria, Coastal & Upper Egypt Governorates:</p>
                  <p>Dispatched and delivered within 3 to 5 business days. Flat regional shipping rate: 80 EGP.</p>
                </div>
                <div className="p-4 bg-amber-50/50 border border-amber-100/60 rounded-2xl flex items-start gap-3 mt-4">
                  <span className="text-amber-600 text-lg">✦</span>
                  <div>
                    <strong className="text-amber-900 block font-bold mb-0.5">Doorstep Previews & Trial Fittings!</strong>
                    <span>We recognize the luxury of custom apparel. You are fully welcome to unpack, inspect, and complete a trial fitting of the item while the courier remains waiting. Return on-the-spot by merely covering active shipping fees.</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Returns details */}
        <div className="bg-white border border-zinc-150 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 sm:space-y-8 text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 bg-amber-500/10 text-amber-900 rounded-xl flex items-center justify-center">
              <RotateCcw size={20} />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-serif font-medium text-zinc-950">
                {isArabic ? "سياسة الاسترجاع والتبديل" : "Returns & Alteration Policy"}
              </h3>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">{isArabic ? "مدة ١٤ يوماً بضمان كامل" : "14 DAYS ASSURANCE GUARANTEE"}</p>
            </div>
          </div>

          <div className="space-y-6 text-xs sm:text-sm text-zinc-650 leading-relaxed font-light">
            {isArabic ? (
              <>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">فترة الاسترجاع والتبديل الكلية:</p>
                  <p>تتمتعين بضمان استرجاع أو تبديل مريح وسخي لمدة ١٤ يوماً كاملة من تاريخ الاستلام، طالما كانت القطعة بحالتها الأصلية غير المستخدمة وبالعلامة الخاصة بها (Tag).</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">شروط استرجاع قطع الهاند ميد والفساتين المخصصة:</p>
                  <p>نظراً لكون التفصيل اليدوي (Couture) يتم تفصيله خصيصاً بمقاسات جسدك الدقيقة وخامته المطلوبة، فإنها غير قابلة للاسترجاع النقدي بمجرد تأكيدها واستلامها. ومع ذلك، نوفر لكِ تعديلات مجانية مدى الحياة لمطابقة المقاس والاتساع دائماً في أتيليه نيو كايرو.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">خطوات التفعيل السهلة:</p>
                  <p>تواصلين مع دعم عملاء RAAV على رقم الواتساب الموحد، وسيرسل لكِ الأتيليه مندوب استدعاء خلال ٢٤ ساعة يستبدل القطعة أو يستردها نقداً فور فحصها بالعين المجردة.</p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">General Return & Exchange Window:</p>
                  <p>Eligible for general refunds or comfort exchanges within 14 full days tracking from receipt, provided the outfit remains unworn, unwashed, and in pristine condition with its boutique labels intact.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">Special Handling for Custom Bespoke Couture Items:</p>
                  <p>Since custom order items (Bespoke Couture) are meticulously drafted and hand-beaded specifically to your strict metrics, they are non-refundable after completion. However, we guarantee complimentary, lifetime size alterations/adjustments at our boutique.</p>
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-zinc-950 font-serif text-sm">Seamless Return Support:</p>
                  <p>Reach out securely to our WhatsApp support. We will schedule a pickup representative within 24 hours to handle exchange or execute immediate cash-refund procedures after inspection.</p>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </section>
  );
}

/* --------------------------------------------------
   3. SIZE GUIDE PAGE
   -------------------------------------------------- */
export function SizeGuidePage({ isArabic, content }: { isArabic: boolean; content?: any }) {
  const [activeTab, setActiveTab] = useState<'women' | 'men' | 'kids'>('women');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');

  // Multiplier or precise unit converter
  const u = (val: number) => {
    if (unit === 'in') {
      return (val / 2.54).toFixed(1);
    }
    return val;
  };

  const sizesData = {
    women: [
      { size: 'XS', bust: 80, waist: 62, hips: 86, length: 140 },
      { size: 'S', bust: 84, waist: 66, hips: 90, length: 142 },
      { size: 'M', bust: 88, waist: 70, hips: 94, length: 145 },
      { size: 'L', bust: 94, waist: 76, hips: 100, length: 147 },
      { size: 'XL', bust: 100, waist: 82, hips: 106, length: 150 },
      { size: 'XXL', bust: 106, waist: 88, hips: 112, length: 152 },
    ],
    men: [
      { size: 'S', bust: 92, waist: 80, hips: 96, length: 70 },
      { size: 'M', bust: 98, waist: 86, hips: 102, length: 72 },
      { size: 'L', bust: 104, waist: 92, hips: 108, length: 74 },
      { size: 'XL', bust: 110, waist: 98, hips: 114, length: 76 },
      { size: 'XXL', bust: 116, waist: 104, hips: 120, length: 78 },
    ],
    kids: [
      { size: '2-4 Y', bust: 56, waist: 52, hips: 58, length: 55 },
      { size: '4-6 Y', bust: 60, waist: 55, hips: 62, length: 65 },
      { size: '6-8 Y', bust: 65, waist: 58, hips: 68, length: 75 },
      { size: '8-10 Y', bust: 71, waist: 62, hips: 74, length: 85 },
      { size: '10-12 Y', bust: 78, waist: 66, hips: 81, length: 95 },
    ]
  };

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Title */}
      <div className="text-center mb-10 sm:mb-14">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 text-amber-900 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          <Scissors size={11} className="text-amber-805 animate-spin" style={{ animationDuration: '6s' }} />
          <span>{isArabic ? "دليل قياسات الجسم الاحترافي" : "METRIC PRECISION GUIDELINE"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
          {content ? (isArabic ? content.titleAr : content.titleEn) : (isArabic ? "دليل المقاسات" : "Size Guide")}
        </h1>
        <div className="text-xs sm:text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
          {content ? (
            <div className="text-right sm:text-right" style={{ textAlign: isArabic ? 'right' : 'left' }}>
              {renderCustomText(isArabic ? content.contentAr : content.contentEn)}
            </div>
          ) : (
            <p>
              {isArabic 
                ? "نساعدك في تحديد مقاس مناسب لابتكار موديلات تناسب جسدك بشكل رائع ومميز. جميع مقاساتنا قياسية ومعيارية دقيقة." 
                : "Locate your standard body mapping metrics. Standardized sizes and body lengths curated to perfect proportions."}
            </p>
          )}
        </div>
      </div>

      <div className="bg-white border border-zinc-150 rounded-3xl p-5 sm:p-8 shadow-sm space-y-6 max-w-4xl mx-auto" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
        
        {/* Controls Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          {/* Sizing categories tabs */}
          <div className="flex gap-1.5 p-1 bg-zinc-50 border border-zinc-150 rounded-xl">
            {(['women', 'men', 'kids'] as const).map((gender) => (
              <button
                key={gender}
                onClick={() => setActiveTab(gender)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition duration-300 cursor-pointer ${
                  activeTab === gender
                    ? 'bg-zinc-950 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-900'
                }`}
              >
                {gender === 'women' && (isArabic ? "النساء" : "Women")}
                {gender === 'men' && (isArabic ? "الرجال" : "Men")}
                {gender === 'kids' && (isArabic ? "الأطفال" : "Kids")}
              </button>
            ))}
          </div>

          {/* Unit Toggle: cm / inches */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs text-zinc-400 font-medium">
              {isArabic ? "الوحدة:" : "Measurement Unit:"}
            </span>
            <div className="flex gap-1 p-0.5 bg-zinc-50 border border-zinc-150 rounded-lg">
              <button
                onClick={() => setUnit('cm')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition font-mono ${
                  unit === 'cm' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-400'
                }`}
              >
                CM
              </button>
              <button
                onClick={() => setUnit('in')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition font-mono ${
                  unit === 'in' ? 'bg-amber-400 text-zinc-950 shadow-xs' : 'text-zinc-400'
                }`}
              >
                INCH
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic measurements table */}
        <div className="overflow-x-auto rounded-2xl border border-zinc-150">
          <table className="w-full text-center border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-150 text-[10px] sm:text-xs font-bold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4 text-center">{isArabic ? "المقاس" : "Size"}</th>
                <th className="py-3 px-4 text-center">{isArabic ? "الصدر" : "Bust / Chest"}</th>
                <th className="py-3 px-4 text-center">{isArabic ? "الخصر" : "Waist"}</th>
                <th className="py-3 px-4 text-center">{isArabic ? "الردف / الأرداف" : "Hips"}</th>
                <th className="py-3 px-4 text-center">{isArabic ? "الطول المعتاد" : "Standard Length"}</th>
              </tr>
            </thead>
            <tbody className="text-xs sm:text-sm text-zinc-700 divide-y divide-zinc-150">
              {sizesData[activeTab].map((row) => (
                <tr key={row.size} className="hover:bg-amber-50/20 transition-colors">
                  <td className="py-3 sm:py-4 px-4 font-serif font-bold text-zinc-950">{row.size}</td>
                  <td className="py-3 sm:py-4 px-4 font-mono">{u(row.bust)} {unit}</td>
                  <td className="py-3 sm:py-4 px-4 font-mono">{u(row.waist)} {unit}</td>
                  <td className="py-3 sm:py-4 px-4 font-mono">{u(row.hips)} {unit}</td>
                  <td className="py-3 sm:py-4 px-4 font-mono">{u(row.length)} {unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Measuring instructions block */}
        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-zinc-100 text-xs text-zinc-500 leading-relaxed font-light">
          <div className="space-y-2 text-right sm:text-right font-sans" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="font-bold text-zinc-950 font-serif text-sm">
              {isArabic ? "كيف تقيسين أبعادكِ بدقة؟" : "How should I measure?"}
            </h4>
            {isArabic ? (
              <ul className="space-y-1.5 list-disc list-inside">
                <li><strong>الصدر:</strong> لفي شريط القياس حول أبرز منطقة في الصدر بشكل مريح وأفقي.</li>
                <li><strong>الخصر:</strong> قيسي أنحف منطقة من الخصر الطبيعي، عادة فوق السرة بقليل.</li>
                <li><strong>الأرداف:</strong> لفي الشريط حول أعرض منطقة من الأرداف مع إبقاء القدمين معاً.</li>
                <li><strong>الطول المعتاد:</strong> يُقاس رأسياً من الكتف نزولاً إلى خط الهامش السفلي.</li>
              </ul>
            ) : (
              <ul className="space-y-1.5 list-disc list-inside">
                <li><strong>Bust:</strong> Measure around the fullest part of your chest, keeping tape horizontal.</li>
                <li><strong>Waist:</strong> Measure around the narrowest part of your waist, slightly above belly button.</li>
                <li><strong>Hips:</strong> Measure around the fullest part of your hips with feet together.</li>
                <li><strong>Length:</strong> Measure from the shoulder seam straight down to the hemline.</li>
              </ul>
            )}
          </div>

          <div className="space-y-2 text-right sm:text-right font-sans" style={{ textAlign: isArabic ? 'right' : 'left' }}>
            <h4 className="font-bold text-zinc-950 font-serif text-sm">
              {isArabic ? "تعديل القياس الاحترافي" : "Bespoke Fittings"}
            </h4>
            <p>
              {isArabic 
                ? "إذا لم تطابق أبعاد جسمكِ الأرقام المذكورة، يمكنكِ كعميلة راقية إرسال مقاساتكِ الفردية الدقيقة للصدر، الخصر، الهيبس، والارتفاع عبر شات المصمم في بروفايلك وسيقوم الأتيليه بتصميم قطعة مخصصة بنسبة مطابقة ١٠٠٪."
                : "Should your dimensions exist outside traditional categories, you are fully supported! Submit exact custom metrics for bust, waist, hips and lengths inside our Bespoke Couture form to initiate custom designs."}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}

/* --------------------------------------------------
   4. FAQ PAGE
   -------------------------------------------------- */
export function FaqPage({ isArabic, content }: { isArabic: boolean; content?: any }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const defaultFaqs = [
    {
      qAr: "هل توفرون الدفع عند الاستلام داخل مصر؟",
      qEn: "Do you offer Cash on Delivery (COD) in Egypt?",
      aAr: "نعم بكل تأكيد! نحن نوفر خيار الدفع كاش عند الاستلام لمندوب التوصيل في جميع المحافظات، كحل مريح وموثوق به تماماً.",
      aEn: "Yes, absolutely! We offer Cash on Delivery (COD) as a standard convenient feature across all Egyptian governorates.",
      category: "payment"
    },
    {
      qAr: "هل يمكنني قياس وتجربة القطعة عند وصول المندوب؟",
      qEn: "Can I try the clothes on when the representative arrives?",
      aAr: "نعم، هذه الميزة حصرية وفريدة لأتيليه RAAV. يمكنك معاينة القطعة وقياس ملبسك مع بقاء المندوب منتظراً بالخارج لمدة 10 دقائق. في حالة لم يناسبك المقاس، يمكنكِ إرجاعها فوراً ودفع تكلفة الشحن فقط.",
      aEn: "Yes, this is an exclusive RAAV highlight! You are welcome to inspect and complete a trial fitting of the item while the courier remains waiting. Return on the spot if unsatisfied, paying only shipping fee.",
      category: "shipping"
    },
    {
      qAr: "ما هو معدل الشحن والتوصيل للمحافظات؟",
      qEn: "What are your shipping rates and timelines?",
      aAr: "التوصيل داخل القاهرة الكبرى والجيزة يستغرق ٢٤ - ٤٨ ساعة فقط وبسعر ٦٠ ج.م. وباقي المحافظات خلال ٣ - ٥ أيام بسعر ٨٠ ج.م.",
      aEn: "Metro Cairo & Giza takes 24 to 48 hours for 60 EGP. Regional governorates are delivered within 3 to 10 days for 80 EGP.",
      category: "shipping"
    },
    {
      qAr: "كيف أطلب تفصيل فستان خاص بمقاساتي المحددة؟",
      qEn: "How do I request a custom bespoke dress?",
      aAr: "بكل سهولة! يمكنك زيارة تبويب 'طلب تفصيل مخصص' في القائمة الرئيسية أو النزول لأسفل الصفحة الرئيسية لملء مواصفات فستان أحلامك، الخامات المفضلة، والميزانية. سيتم تأسيس شات فوري في بروفايلك مع المصمم لإتمام الاتفاق.",
      aEn: "Extremely simple! Visit our Bespoke Couture form at the bottom of the home screen or inside the header. Provide details about style, metrics, and targeted price, and we will initialize a private thread on your dashboard.",
      category: "custom"
    },
    {
      qAr: "هل تقبلون الدفع عبر Instapay أو المحافظ الذكية؟",
      qEn: "Do you accept Instapay, bank transfer or electronic wallets?",
      aAr: "نعم، نحن نقبل الدفع الفوري لمبيعات الأتيليه والتفصيل المخصص عبر حساب Instapay المباشر، المحافظ الذكية (فودافون كاش، اتصالات، إلخ)، والبطاقات الائتمانية والخصم.",
      aEn: "Yes! We accept immediate digital submissions via Instapay, smart mobile wallets (Vodafone Cash, Orange, Etisalat), bank transfers, and standard modern debit/credit cards.",
      category: "payment"
    },
    {
      qAr: "هل تتوفر تعديلات مجانية إذا لم يطابق مقاس الهاند ميد تماماً؟",
      qEn: "Are there free size alterations for custom orders?",
      aAr: "بالتأكيد. إذا طلبتِ تفصيل هاند ميد مخصص ووجدتِ حاجة لبعض التعديلات البسيطة في الاتساع أو الطول، يسعدنا استقبال القطعة وتعديلها مجانًا في الأتيليه لدينا.",
      aEn: "Absolutely. If you acquire a bespoke couture dress and find that adjustments in width, sleeves or length are required, we gladly offer lifetime complimentary alterations at our Atelier.",
      category: "custom"
    }
  ];

  const faqs = (content && content.items && content.items.length > 0) ? content.items : defaultFaqs;

  // Filtering faqs on query
  const filteredFaqs = faqs.filter((f: any) => {
    const q = isArabic ? f.qAr : f.qEn;
    const a = isArabic ? f.aAr : f.aEn;
    const search = searchQuery.toLowerCase();
    return q.toLowerCase().includes(search) || a.toLowerCase().includes(search);
  });

  return (
    <section className="py-12 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      
      {/* Header */}
      <div className="text-center mb-10 sm:mb-14 font-sans">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/60 text-amber-950 rounded-full text-[10px] sm:text-[11px] font-bold tracking-[0.2em] uppercase mb-4">
          <HelpCircle size={11} className="text-amber-805 animate-pulse" />
          <span>{isArabic ? "مساعدتِك الفورية وإجاباتنا" : "ANSWERS & GENERAL HELP"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-serif font-light text-zinc-950 tracking-tight leading-tight">
          {isArabic ? (content?.titleAr || "الأسئلة الشائعة") : (content?.titleEn || "Frequently Asked Questions")}
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-3 max-w-xl mx-auto leading-relaxed">
          {isArabic 
            ? (content?.subtitleAr || "تصفحي سريعا أكثر الأسئلة المكررة من زبوناتنا حول الشحن، القياس، الدفع، وتفصيل الهاند ميد المخصص.") 
            : (content?.subtitleEn || "Review answers regarding bespoke fittings, Egyptian checkout options, and trial services.")}
        </p>
      </div>

      {/* Dynamic Search */}
      <div className="max-w-2xl mx-auto mb-10 text-center relative px-2">
        <div className="relative border border-zinc-200/80 bg-white rounded-2xl flex items-center px-4 py-2 hover:border-amber-400/80 transition focus-within:border-amber-400/80">
          <Search size={16} className="text-zinc-400 shrink-0 mx-1" />
          <input
            type="text"
            placeholder={isArabic ? "ابحثي عن استفسار محدد..." : "Search for questions, help terms..."}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs text-zinc-900 py-1.5"
            style={{ direction: isArabic ? 'rtl' : 'ltr' }}
          />
        </div>
      </div>

      {/* Accordion Layout */}
      <div className="max-w-3xl mx-auto space-y-3 px-2 font-sans">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((faq: any, idx: number) => {
            const isOpen = openIdx === idx;
            const q = isArabic ? faq.qAr : faq.qEn;
            const a = isArabic ? faq.aAr : faq.aEn;

            return (
              <div 
                key={idx}
                className="bg-white border border-zinc-150/60 hover:border-zinc-250 rounded-2xl overflow-hidden transition font-sans"
                style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-zinc-950 font-serif font-medium text-xs sm:text-sm text-right cursor-pointer gap-4"
                  style={{ textAlign: isArabic ? 'right' : 'left' }}
                >
                  <span className="flex-1" style={{ textAlign: isArabic ? 'right' : 'left' }}>{q}</span>
                  <ChevronDown size={15} className={`text-zinc-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 text-amber-600' : ''}`} />
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-zinc-500 leading-relaxed font-light border-t border-zinc-50 font-sans">
                        {a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs text-zinc-405">
            {isArabic ? "لم نجد أي نتائج تطابق هذا البحث." : "No results found matching your search."}
          </div>
        )}
      </div>

    </section>
  );
}

/* --------------------------------------------------
   5. PRIVACY POLICY PAGE
   -------------------------------------------------- */
export function PrivacyPolicyPage({ isArabic, content }: { isArabic: boolean; content?: any }) {
  const hasCustomContent = content && (isArabic ? content.contentAr : content.contentEn);
  return (
    <section className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      <div className="bg-white border border-zinc-150 rounded-[2rem] p-6 sm:p-12 shadow-sm relative overflow-hidden" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
        
        {/* Abstract decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-bl-[5rem] pointer-events-none" />

        <div className="flex items-center gap-3 border-b border-zinc-100 pb-5 mb-8">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-900 rounded-xl flex items-center justify-center shrink-0">
            <ShieldCheck size={20} />
          </div>
          <div>
            <span className="text-[8px] font-bold tracking-widest text-[#8a92a6] uppercase block">
              {isArabic ? "سرية وأمان تام" : "SECURE ENCRYPTION GUARANTEE"}
            </span>
            <h1 className="text-2xl sm:text-3.5xl font-serif text-zinc-950 font-medium tracking-tight">
              {isArabic ? (content?.titleAr || "سياسة الخصوصية") : (content?.titleEn || "Privacy Policy")}
            </h1>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-light space-y-6">
          {hasCustomContent ? (
            renderCustomText(isArabic ? content.contentAr : content.contentEn)
          ) : isArabic ? (
            <>
              <p className="font-medium text-zinc-950 text-sm">آخر تحديث: يونيو ٢٠٢٦</p>
              <p>في أتيليه وأزياء RAAV، تعتبر خصوصية زبوناتنا وزوارنا ذات أهمية بالغة ونلتزم بأعلى معايير السرية المطلقة. نوضح في هذه الوثيقة طبيعة البيانات الشخصية التي نجمعها وكيف نعمل على حمايتها بضمان كامل.</p>
              
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">١. البيانات الشخصية التي نجمعها</h3>
                <p>عند تسجيل الدخول أو إرسال استفسار مخصص، نقوم بحفظ التفاصيل التي تكفي لتقديم خدمة راقية وسلسة:</p>
                <ul className="list-disc list-inside space-y-1 pr-2">
                  <li>الاسم الكامل للتسجيل والتواصل الاجتماعي.</li>
                  <li>رقم الهاتف لتعديل السواريه وتحديد اتجاه شحن المندوب.</li>
                  <li>العنوان لتسليم طلبيات الأزياء في مصر.</li>
                  <li>مقاسات الجسم والوزن والطول لقطع Couture المفصلة خصيصاً.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">٢. استخدام وحماية البيانات</h3>
                <p>تُسخّدم بياناتك فقط لمعالجة الشحنات، وإرسال عينات ملابس، ومطابقة القياس مع الأتيليه. ونضمن لكِ عدم بيع، تأجير، أو مشاركة تفاصيل حسابك أو أبعاد جسمك ومحادثاتك الخاصة مع أي جهة خارجية أو تجارية تطلقاً.</p>
              </div>

              <div className="space-y-3">
                <h3 className="font-serif font-bold text-zinc-950 text-base">٣. أمن المحادثات الفورية</h3>
                <p>شات محادثاتك مع مصمم الأتيليه المحترف يتم تشفيره وتأمينه بالكامل داخل قواعد بياناتنا لضمان خصوصيتك الكلمة ومراجعة تفاصيل فستانك دون أي ازعاج.</p>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-zinc-950 text-sm">Last Updated: June 2026</p>
              <p>At RAAV Atelier, the confidentiality of our clients is held with utmost importance. This Privacy Policy documents we securely manage your credentials, measurements, and coordinates.</p>
              
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">1. Types of Data We Collect</h3>
                <p>When interacting with custom orders, registrations or support requests, we safely store core metrics to supply high-fashion precision:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Your full identifier names.</li>
                  <li>Active telecommunication digits (phone/Whatsapp).</li>
                  <li>Precise address markers to facilitate Egyptian boutique shipping.</li>
                  <li>Detailed seam metrics (bust, hips, height) for customized tailoring options.</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">2. Safety & Data Distribution Safeguards</h3>
                <p>Your details are processed strictly to arrange doorstep trials, catalog alterations, and matching custom patterns. We guarantee zero transmission, leasing, or commercial sharing of measurements and conversations with third party organizations.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">3. Confidential Fashion Advisory</h3>
                <p>All shared metrics, specifications, and style inspirations inside private designer chats are fully isolated within Firestore to guard your digital security.</p>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}

/* --------------------------------------------------
   6. TERMS OF SERVICE PAGE
   -------------------------------------------------- */
export function TermsOfServicePage({ isArabic, content }: { isArabic: boolean; content?: any }) {
  const hasCustomContent = content && (isArabic ? content.contentAr : content.contentEn);
  return (
    <section className="py-12 sm:py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 font-sans">
      <div className="bg-white border border-zinc-150 rounded-[2rem] p-6 sm:p-12 shadow-sm relative overflow-hidden" style={{ direction: isArabic ? 'rtl' : 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
        
        {/* Abstract decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-100/30 rounded-bl-[5rem] pointer-events-none" />

        <div className="flex items-center gap-3 border-b border-zinc-100 pb-5 mb-8">
          <div className="w-10 h-10 bg-amber-500/10 text-amber-900 rounded-xl flex items-center justify-center shrink-0">
            <FileText size={20} />
          </div>
          <div>
            <span className="text-[8px] font-bold tracking-widest text-[#8a92a6] uppercase block">
              {isArabic ? "العلاقة القانونية بين الأتيليه والعميل" : "AGREEMENT & RETAIL COMPLIANCE"}
            </span>
            <h1 className="text-2xl sm:text-3.5xl font-serif text-zinc-950 font-medium tracking-tight">
              {isArabic ? (content?.titleAr || "شروط الخدمة") : (content?.titleEn || "Terms of Service")}
            </h1>
          </div>
        </div>

        <div className="text-xs sm:text-sm text-zinc-650 leading-relaxed font-light space-y-6">
          {hasCustomContent ? (
            renderCustomText(isArabic ? content.contentAr : content.contentEn)
          ) : isArabic ? (
            <>
              <p className="font-medium text-zinc-950 text-sm">آخر تحديث: يونيو ٢٠٢٦</p>
              <p>نرحب بكم في RAAV EGY. تحكم هذه الشروط والقوانين تصفحكم للموقع، طلب المنتجات من الكتالوج الطبيعي، واستخدام صالة استشارة وتصميم الملابس وهاند ميد داهل جمهورية مصر العربية.</p>
              
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">١. طلبات الملابس وتأكيد الحجز</h3>
                <p>جميع طلبات الفساتين السواريه والملابس الجاهزة تخضع للتأكيد عبر محادثة هاتفية أو واتساب يثبت فيها العنوان والمقاس الدقيق لتجنب حدوث أي استرجاع غير مرغوب فيه.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">٢. الدفع لمبيعات الهاند ميد المخصص (Bespoke)</h3>
                <p>بالقطع المخصصة التي يتم تصميمها بالطلب (Couture)، يتم توقيع طلب ومواصفات تفصيلية وبما أن الباب مغلق على المقاسات الفردية، فإن الأتيليه يستلزم سداد عربون حجز تأكيدي بسيط (عبر Instapay أو إيداع فودافون كاش أو بطاقة بنكية) للبدء في شراء تفصيلة الأقمشة وقص الموديل الفاخر.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">٣. خدمة المعاينة عند التسليم</h3>
                <p>أمامكِ الحق الوجوبي في معاينة وتجربة الموديل عند باب منزلك في حضور مندوبنا. في حالة الرفض، تلتزم العطية بدفع رسوم الشحن المقررة للمندوب فوراً كتعويض عن تكلفة الوقود والمشوار.</p>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-zinc-950 text-sm">Last Updated: June 2026</p>
              <p>Welcome to RAAV EGY. These terms govern the navigation of our digital storefront, bespoke custom creations, and checkout configurations across Egypt.</p>
              
              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">1. Clothing Orders & Size Audits</h3>
                <p>Every ready-to-wear boutique order is verified via a call or WhatsApp message to confirm the shipping address and coordinate sizes correctly before dispatch.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">2. Payment for Custom Bespoke Orders</h3>
                <p>For custom haute-couture dresses drafted specifically to individual dimensions, RAAV requires a secure partial reservation deposit (payable via Instapay, smart mobile cash, or standard credit/debit card) to confirm purchase of raw high-end fabrics and initiate master pattern cuts.</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-serif font-bold text-zinc-950 text-base">3. Deliveries & Doorstep fitting trials</h3>
                <p>You reserve the privilege of reviewing and testing garments on delivery. If the product is declined during doorstep trial, you are obligated to cover flat-rate shipping fees to compensate active logistics coordinators.</p>
              </div>
            </>
          )}
        </div>

      </div>
    </section>
  );
}
