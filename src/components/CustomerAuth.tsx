import React, { useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { saveUserProfile } from '../dbService';
import { Mail, Lock, User, Phone, MapPin, Loader, ArrowRight, UserCheck, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CustomerAuthProps {
  onSuccess: (uid: string) => void;
  isArabic: boolean;
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

export default function CustomerAuth({ onSuccess, isArabic }: CustomerAuthProps) {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Extra signup variables
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cityId, setCityId] = useState('cairo');
  
  const [isLoading, setIsLoading] = useState(false);
  const [errMessage, setErrMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrMessage(null);

    try {
      if (isLoginMode) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(userCredential.user.uid);
      } else {
        // Sign Up
        if (!fullName || !phone || !address) {
          throw new Error(isArabic ? "برجاء استكمال جميع بيانات التسجيل المميزة!" : "Please fill in all requested fields to configure your account!");
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        const uid = userCredential.user.uid;
        
        // Update auth displayName profile metadata
        await updateProfile(userCredential.user, {
          displayName: fullName
        });

        // Save detailed profile data in Firestore
        const selectedCity = EGYPTIAN_CITIES.find(c => c.id === cityId);
        await saveUserProfile(uid, {
          name: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: selectedCity ? (isArabic ? selectedCity.nameAr : selectedCity.nameEn) : 'Cairo'
        });

        onSuccess(uid);
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
      let translatedErr = err.message;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        translatedErr = isArabic 
          ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. يرجى مراجعة الحساب." 
          : "Invalid email or matching credentials. Please re-check.";
      } else if (err.code === 'auth/email-already-in-use') {
        translatedErr = isArabic 
          ? "هذا البريد الإلكتروني مسجل بالفعل لدرا في قاعدة البيانات!" 
          : "Email is already linked with another premium account!";
      } else if (err.code === 'auth/weak-password') {
        translatedErr = isArabic 
          ? "كلمة المرور ضعيفة جداً. يرجى استخدام ٦ أحرف على الأقل." 
          : "Password too weak. Please use at least 6 characters.";
      }
      setErrMessage(translatedErr);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fbfcff] min-h-screen pt-24 pb-16 flex items-center justify-center font-sans" style={{ direction: isArabic ? 'rtl' : 'ltr' }}>
      <div className="max-w-md w-full px-4">
        
        <div className="bg-white rounded-[2rem] border border-zinc-100 shadow-xl p-8 sm:p-10 text-right space-y-6 relative overflow-hidden" style={{ textAlign: isArabic ? 'right' : 'left' }}>
          
          {/* Visual Accent */}
          <div className="absolute top-0 right-0 left-0 h-1.5 bg-zinc-950" />

          {/* Logo Brand Banner */}
          <div className="flex justify-center pt-2">
            <img 
              src="/src/assets/images/raav_clean_circle_logo_1782164055293.jpg" 
              alt="RAAV Couture" 
              className="w-28 h-28 object-cover rounded-full border border-zinc-150 shadow-md transform hover:scale-[1.02] transition duration-300"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Form Header */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-serif font-medium text-zinc-950 tracking-tight">
              {isLoginMode 
                ? (isArabic ? "تسجيل الدخول الفاخر" : "Secure Sign In") 
                : (isArabic ? "إنشاء حساب جديد كليّاً" : "Create Account")}
            </h2>
            <p className="text-xs text-zinc-400 font-light max-w-xs mx-auto leading-relaxed">
              {isLoginMode 
                ? (isArabic ? "تسجيل دخول يمنحك حق مراجعة طلبياتك ومصاريف الشحن وتعديل العناوين" : "Securely check out your orders, default shipping addresses, and profiles") 
                : (isArabic ? "احظى بعضوية للطلب المباشر بضغطة زر والحصول على عروض حصرية" : "Complete registration to unlock express order dispatcher details")}
            </p>
          </div>

          {/* Error Message Box */}
          {errMessage && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 text-center font-medium"
            >
              {errMessage}
            </motion.div>
          )}

          {/* Interactive fields submission */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Registrations specific: Full Name */}
            {!isLoginMode && (
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  {isArabic ? "الاسم بالكامل *" : "Full Name *"}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder={isArabic ? "أحمد محمد علي" : "e.g. John Doe"}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                  <User size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {isArabic ? "البريد الإلكتروني *" : "Email Address *"}
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all pl-10 font-mono text-left"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ direction: 'ltr' }}
                />
                <Mail size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                {isArabic ? "كلمة المرور الحامية *" : "Password *"}
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all pl-10 font-mono text-left"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ direction: 'ltr' }}
                />
                <Lock size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
              </div>
            </div>

            {/* Registration fields: Phone & Address & Province */}
            {!isLoginMode && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 pt-1"
                >
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isArabic ? "رقم الهاتف دليفري *" : "Mobile Phone *"}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        placeholder="01xxxxxxxxx"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-left font-mono text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all pl-10"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        style={{ direction: 'ltr' }}
                      />
                      <Phone size={13} className="absolute left-3.5 top-3.5 text-zinc-400" />
                    </div>
                  </div>

                  {/* Governorate */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isArabic ? "المحافظة للتوصيل *" : "Governorate *"}
                    </label>
                    <select
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all"
                      value={cityId}
                      onChange={(e) => setCityId(e.target.value)}
                    >
                      {EGYPTIAN_CITIES.map(city => (
                        <option key={city.id} value={city.id}>
                          {isArabic ? city.nameAr : city.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Street address */}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {isArabic ? "العنوان بالتفصيل *" : "Detailed Home Address *"}
                    </label>
                    <div className="relative">
                      <textarea
                        rows={2}
                        required
                        placeholder={isArabic ? "الشارع، رقم العمارة، الشقة، وأي معالم مميزة..." : "Building No., street name, floor, landmark details..."}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-2.5 px-4 text-xs text-zinc-900 focus:outline-none focus:border-black focus:bg-white transition-all pr-10"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                      <MapPin size={13} className={`absolute ${isArabic ? 'right-3.5' : 'left-3.5'} top-3.5 text-zinc-400`} />
                    </div>
                  </div>

                </motion.div>
              </AnimatePresence>
            )}

            {/* CTA submission button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-zinc-950 hover:bg-zinc-900 text-white font-bold text-xs tracking-wider uppercase rounded-full flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                {isLoading ? (
                  <Loader size={14} className="animate-spin text-white" />
                ) : (
                  <>
                    <span>
                      {isLoginMode 
                        ? (isArabic ? "تسجيل الآن والدخول" : "Sign In Account") 
                        : (isArabic ? "تفصيل وتسجيل الحساب العضو" : "Construct Account")}
                    </span>
                    <ArrowRight size={13} />
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Sibling toggle option link */}
          <div className="text-center pt-2 border-t border-zinc-100/60">
            <button
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrMessage(null);
              }}
              className="text-xs text-zinc-550 hover:text-black transition font-medium"
            >
              {isLoginMode 
                ? (isArabic ? "ليس لديك حساب مميز؟ سجل عضويتك الآن" : "Don't have an elegance membership? Register") 
                : (isArabic ? "هل تمتلك حساباً مفعلاً؟ سجل دخولك" : "Already have configured client profile? Sign In")}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
