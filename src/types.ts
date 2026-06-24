export interface Product {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  price: number;
  discountPrice?: number;
  discountStart?: string; // YYYY-MM-DD format
  discountEnd?: string;   // YYYY-MM-DD format
  category: 'men' | 'women' | 'kids' | 'accessories';
  image: string; // fallback or main image
  images?: string[]; // up to 5 images
  sizes: string[];
  colors: string[];
  inStock: boolean;
  isActive?: boolean; // display on website or not
  isTrend?: boolean;  // highlight in 'the trend pieces' section
  quantity?: number;  // total stock quantity available
  shippingPlanId?: string; // assigned shipping plan id
  createdAt: number;
  subcategoryAr?: string;
  subcategoryEn?: string;
}

export interface ShippingPlan {
  id: string;
  companyNameAr: string;
  companyNameEn: string;
  price: number;
  deliveryTimeAr: string;
  deliveryTimeEn: string;
  isActive: boolean;
  createdAt: number;
}

export interface LoyaltyConfig {
  pointsPerEgp: number; // e.g. 1 point per 10 EGP spent
  egpValuePerPoint: number; // e.g. each point is worth 0.5 EGP
  isActive: boolean;
  instructionsAr?: string;
  instructionsEn?: string;
}

export interface WalletDetail {
  id: string;
  nameAr: string;
  nameEn: string;
  phone: string;
  qrCode?: string; // Image base64 or URL
  availableBalance?: number; // Added for financial tracking
}

export interface InstaPayDetail {
  username: string; // e.g. username@instapay
  phone: string;
  qrCode?: string; // Image base64 or URL
  availableBalance?: number; // Added for financial tracking
}

export interface PaymentConfig {
  cashOnDeliveryActive: boolean;
  walletsActive: boolean;
  wallets: WalletDetail[];
  instaPayActive: boolean;
  instaPay: InstaPayDetail;
}

export interface OrderItem {
  productId: string;
  nameAr: string;
  nameEn: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerNotes?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod?: string;
  shippingPlanId?: string;
  shippingFee?: number; // actual recorded shipping fee
  paymentProof?: string; // base64 payment receipt
  createdAt: number;
  orderType?: 'standard' | 'custom';
  customTitle?: string;
  customDescription?: string;
  customMaterial?: string;
  customColor?: string;
  customBudget?: number;
  linkedConversationId?: string;
  agreedPrice?: number;
  settled?: boolean; // True if collected COD has been paid to admin in a settlement period
  settledInPeriodId?: string; // ID of the closed SettlementPeriod this belongs to
  cancelReason?: string; // Predefined or custom reason for order cancellation or return
  paymentStatus?: 'pending_verification' | 'verified' | 'rejected'; // State of electronic payment verification
  paymentProofNotes?: string; // Additional customer notes for payment resubmission
  installments?: { id: string; date: number; amount: number; type: string; notes?: string; }[];
  materialCosts?: number;
  tailoringCosts?: number;
  otherCosts?: number;
}

export interface SettlementPeriod {
  id: string;
  startDate: number;
  endDate: number;
  totalAmount: number;
  createdAt: number;
  orderIds: string[];
  notes?: string;
}

export interface BusinessExpense {
  id: string;
  category: 'Fabrics & Supplies' | 'Tailor Wages' | 'Atelier Rent & Care' | 'Advertising' | 'Logistics' | 'Other';
  amount: number;
  date: number;
  description: string;
}

export interface SavedAddress {
  id: string;
  recipientName: string;
  phone: string;
  cityId: string;
  addressDetails: string;
  isDefault: boolean;
}

export interface FavoriteItem {
  productId: string;
  savedAt: number;
}

export interface UserProfile {
  uid?: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  addresses?: SavedAddress[];
  favorites?: FavoriteItem[];
  searchAlerts?: string[];
  points?: number;
}

export interface Notification {
  id: string;
  userId: string;
  messageAr: string;
  messageEn: string;
  createdAt: number;
  isRead: boolean;
  type: string;
  orderId?: string;
}

export interface AdminConfig {
  isInitialized: boolean;
  adminEmail: string;
  adminUid: string;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Conversation {
  id: string;
  customerId: string;
  topic: string;
  orderId?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ConversationMessage {
  id: string;
  senderId: string;
  senderRole: 'customer' | 'admin';
  senderName: string;
  text: string;
  createdAt: number;
}

export interface SupportPageItem {
  titleAr: string;
  titleEn: string;
  contentAr: string;
  contentEn: string;
}

export interface FaqItem {
  id: string;
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
}

export interface SupportPagesContent {
  contact_us: {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    phone: string;
    email: string;
    addressAr: string;
    addressEn: string;
    workingHoursAr: string;
    workingHoursEn: string;
    instagramUrl?: string;
    facebookUrl?: string;
    whatsappPhone: string;
  };
  shipping_returns: SupportPageItem;
  size_guide: SupportPageItem;
  faq: {
    titleAr: string;
    titleEn: string;
    subtitleAr: string;
    subtitleEn: string;
    items: FaqItem[];
  };
  privacy_policy: SupportPageItem;
  terms_of_service: SupportPageItem;
}

export interface HeroSlideInput {
  id: string | number;
  overlineAr: string;
  overlineEn: string;
  titleAr: string;
  titleEn: string;
  descAr: string;
  descEn: string;
  quoteAr?: string;
  quoteEn?: string;
  image: string;
  cat: string;
}

export interface SectionBackdrop {
  type: 'solid' | 'gradient';
  solidColor?: string; // hex color or similar (e.g. #353630)
  gradientFrom?: string; // hex color or similar
  gradientTo?: string; // hex color or similar
  gradientDirection?: 'to-b' | 'to-r' | 'to-tr' | 'to-br';
  textColor?: 'light' | 'dark'; // option to optimize text color contrast automatically
}

export interface CustomAdBanner {
  id: string; // 'ad1' | 'ad2' etc.
  badgeAr?: string;
  badgeEn?: string;
  titleAr?: string;
  titleEn?: string;
  descAr?: string;
  descEn?: string;
  buttonTextAr?: string;
  buttonTextEn?: string;
  buttonLink?: string;
  bannerImage?: string; // image overlay background
  backgroundColor?: string; // hex colour for background, e.g. #222222
  textColor?: string; // hex color for text, e.g. #ffffff
  badgeBgColor?: string; // e.g. bg-amber-500/15 or custom hex color
  badgeTextColor?: string; // e.g. #e5d3b3
  buttonBgColor?: string; // e.g. #facc15
  buttonTextColor?: string; // e.g. #000000
}

export interface HomepageContent {
  announcementAr: string;
  announcementEn: string;
  announcementImage?: string;
  announcementLink?: string;
  adBanner1?: CustomAdBanner;
  adBanner2?: CustomAdBanner;
  heroSlides: HeroSlideInput[];
  categoryImages?: {
    women?: string;
    men?: string;
    kids?: string;
    accessories?: string;
  };
  categoryTexts?: {
    women?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    men?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    kids?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
    accessories?: { titleAr?: string; titleEn?: string; descAr?: string; descEn?: string; };
  };
  sectionBackgrounds?: {
    theCollections?: SectionBackdrop;
    trendPieces?: SectionBackdrop;
    categoryScrollSlices?: SectionBackdrop;
    customCoutureForm?: SectionBackdrop;
  };
  categoryBackdrops?: {
    women?: SectionBackdrop;
    men?: SectionBackdrop;
    kids?: SectionBackdrop;
    accessories?: SectionBackdrop;
  };
  headerBgColor?: string;
  logoSize?: number;
  logoImage?: string;
  logoText?: string;
  logoTextColor?: string;
  logoTextFont?: string;
  collectionsLayout?: 'split' | 'bento' | 'symmetric' | 'slider';
  collectionsOrder?: ('women' | 'men' | 'kids' | 'accessories')[];
  heroSectionEnabled?: boolean;
  heroSectionShowTexts?: boolean;
  heroSectionTitleAr?: string;
  heroSectionTitleEn?: string;
  heroSectionSubAr?: string;
  heroSectionSubEn?: string;
  heroSectionBtnTextAr?: string;
  heroSectionBtnTextEn?: string;
  heroSectionBtnLink?: string;
  heroSectionImages?: string[];
  heroSectionLayout?: 'single' | 'split' | 'grid' | 'slider';
  heroCarouselEnabled?: boolean;
  collectionsSectionEnabled?: boolean;
  trendSectionEnabled?: boolean;
  categorySlicesSectionEnabled?: boolean;
  customCoutureSectionEnabled?: boolean;
}
