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
}

export interface InstaPayDetail {
  username: string; // e.g. username@instapay
  phone: string;
  qrCode?: string; // Image base64 or URL
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
  paymentProof?: string; // base64 payment receipt
  createdAt: number;
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

