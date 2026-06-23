import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  onSnapshot,
  where
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Product, Order, OrderStatus, Review, ShippingPlan, LoyaltyConfig, PaymentConfig, SavedAddress, FavoriteItem, Notification, Conversation, ConversationMessage, SettlementPeriod, SupportPagesContent, HomepageContent, BusinessExpense } from './types';
import { initialProducts } from './initialProducts';

// Collection references
const PRODUCTS_COLL = 'products2'; // Use namespace/distinct name or 'products'
const ORDERS_COLL = 'orders';
const CONFIG_COLL = 'admin_config';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Checks if products exist. If not, seeds the database with initial clothes.
 * If populated, inserts any individual missing seed items.
 */
export async function seedProductsIfNeeded(): Promise<void> {
  const pathForWrite = PRODUCTS_COLL;
  try {
    const querySnapshot = await getDocs(collection(db, PRODUCTS_COLL));
    if (querySnapshot.empty) {
      console.log('No clothes found in database. Seeding standard items...');
      for (const productData of initialProducts) {
        await addDoc(collection(db, PRODUCTS_COLL), {
          ...productData,
          createdAt: Date.now()
        });
      }
      console.log('Seeding clothes complete!');
    } else {
      const dbProducts: string[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.nameEn) {
          dbProducts.push(data.nameEn.toLowerCase());
        }
      });

      for (const productData of initialProducts) {
        if (!dbProducts.includes(productData.nameEn.toLowerCase())) {
          console.log(`Inserting custom added seed product: ${productData.nameEn}`);
          await addDoc(collection(db, PRODUCTS_COLL), {
            ...productData,
            createdAt: Date.now()
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Subscribe to real-time changes in products
 */
export function subscribeToProducts(callback: (products: Product[]) => void) {
  const pathForOnSnapshot = PRODUCTS_COLL;
  const q = query(collection(db, PRODUCTS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const productsList: Product[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      productsList.push({
        id: doc.id,
        ...data
      } as Product);
    });
    callback(productsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

/**
 * Add a new product (Admin feature)
 */
export async function createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<string> {
  const pathForWrite = PRODUCTS_COLL;
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLL), {
      ...product,
      createdAt: Date.now()
    });
    // Trigger dispatch for search alerts on a background promise safely
    checkSearchAlertsAndNotify({
      id: docRef.id,
      nameAr: product.nameAr,
      nameEn: product.nameEn
    }).catch(err => console.error("Search alert notification failed:", err));
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Update an existing product (Admin feature)
 */
export async function updateProduct(id: string, updates: Partial<Product>): Promise<void> {
  const pathForWrite = `${PRODUCTS_COLL}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLL, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Delete a product (Admin feature)
 */
export async function removeProduct(id: string): Promise<void> {
  const pathForWrite = `${PRODUCTS_COLL}/${id}`;
  try {
    const docRef = doc(db, PRODUCTS_COLL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Subscribe to real-time changes in orders (Admin feature)
 */
export function subscribeToOrders(callback: (orders: Order[]) => void) {
  const pathForOnSnapshot = ORDERS_COLL;
  const q = query(collection(db, ORDERS_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const ordersList: Order[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      ordersList.push({
        id: doc.id,
        ...data
      } as Order);
    });
    callback(ordersList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

/**
 * Create a new customer order
 */
export async function createOrder(order: Omit<Order, 'id' | 'createdAt' | 'status'> & { customerId?: string }): Promise<string> {
  const pathForWrite = ORDERS_COLL;
  try {
    const currentUid = auth.currentUser?.uid || undefined;
    
    // Filter out undefined properties to avoid Firestore payload crashes
    const cleanedOrder: any = {};
    Object.entries(order).forEach(([key, val]) => {
      if (val !== undefined) {
        cleanedOrder[key] = val;
      }
    });

    const docRef = await addDoc(collection(db, ORDERS_COLL), {
      ...cleanedOrder,
      customerId: order.customerId || currentUid,
      status: 'pending' as OrderStatus,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Handle user profiles
 */
export async function getUserProfile(uid: string) {
  const pathForGet = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return null;
}

export async function saveUserProfile(uid: string, data: { name: string; phone: string; address: string; city: string }) {
  const pathForWrite = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    await setDoc(docRef, {
      ...data,
      updatedAt: Date.now()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Subscribe to order history for a specific customer
 * Enforces Zero-Trust constraints by querying with a secure customerId filter
 * and sorting client-side to prevent missing indexes.
 */
export function subscribeToCustomerOrders(uid: string, callback: (orders: Order[]) => void) {
  const pathForOnSnapshot = ORDERS_COLL;
  const q = query(
    collection(db, ORDERS_COLL),
    where('customerId', '==', uid)
  );
  return onSnapshot(q, (snapshot) => {
    const ordersList: Order[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      ordersList.push({
        id: doc.id,
        ...data
      } as Order);
    });
    // Sort in-memory descending by createdAt to circumvent index requirements
    ordersList.sort((a, b) => b.createdAt - a.createdAt);
    callback(ordersList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

/**
 * Update order status (Admin feature)
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus, cancelReason?: string): Promise<void> {
  const pathForWrite = `${ORDERS_COLL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLL, orderId);
    const updateData: any = { status };
    if (cancelReason) {
      updateData.cancelReason = cancelReason;
    }
    await updateDoc(docRef, updateData);

    // Try reading order to get customerId & send them status notification
    const orderSnap = await getDoc(docRef);
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      const customerId = orderData.customerId;
      if (customerId) {
        let textAr = '';
        let textEn = '';
        if (status === 'preparing') {
          textAr = `طلبك رقم #${orderId.substring(0, 6)} يتم تحضيره وتجهيزه الآن!`;
          textEn = `Your order #${orderId.substring(0, 6)} is being prepared and sewn!`;
        } else if (status === 'shipped') {
          textAr = `طلبك رقم #${orderId.substring(0, 6)} خرج مع مندوب الشحن للتوصيل!`;
          textEn = `Your order #${orderId.substring(0, 6)} has been dispatched with the courier!`;
        } else if (status === 'delivered') {
          textAr = `تم تسليم طلبك رقم #${orderId.substring(0, 6)} بنجاح. شكراً لتسوقك من RAAV!`;
          textEn = `Your order #${orderId.substring(0, 6)} was delivered successfully. Clean wear!`;
        } else if (status === 'cancelled') {
          textAr = `تم إلغاء طلبك رقم #${orderId.substring(0, 6)} من قبل الإدارة.`;
          textEn = `Your order #${orderId.substring(0, 6)} has been cancelled.`;
        }

        if (textAr) {
          await createNotification({
            userId: customerId,
            messageAr: textAr,
            messageEn: textEn,
            type: 'order_status',
            orderId
          });
        }
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Update order payment status (Admin feature)
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'pending_verification' | 'verified' | 'rejected',
  customNotificationMessage?: { ar: string; en: string }
): Promise<void> {
  const pathForWrite = `${ORDERS_COLL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLL, orderId);
    await updateDoc(docRef, { paymentStatus });

    // Try reading order to get customerId & send them status notification
    const orderSnap = await getDoc(docRef);
    if (orderSnap.exists()) {
      const orderData = orderSnap.data();
      const customerId = orderData.customerId;
      if (customerId && customNotificationMessage) {
        await createNotification({
          userId: customerId,
          messageAr: customNotificationMessage.ar,
          messageEn: customNotificationMessage.en,
          type: 'payment_status',
          orderId
        });
      }
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Resubmit payment proof and reset payment status to pending_verification (Customer feature)
 */
export async function resubmitOrderPayment(
  orderId: string,
  paymentProof: string,
  paymentProofNotes?: string
): Promise<void> {
  const pathForWrite = `${ORDERS_COLL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLL, orderId);
    await updateDoc(docRef, {
      paymentProof,
      paymentProofNotes: paymentProofNotes || "",
      paymentStatus: 'pending_verification'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Checks if the Admin account has been initialized anywhere.
 */
export async function getAdminSetupStatus(): Promise<{ isInitialized: boolean; adminUid?: string; adminEmail?: string }> {
  const pathForGet = `${CONFIG_COLL}/setup`;
  try {
    const docRef = doc(db, CONFIG_COLL, 'setup');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        isInitialized: true,
        adminUid: data.adminUid,
        adminEmail: data.adminEmail
      };
    }
    return { isInitialized: false };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
}

/**
 * Registers the first-time admin setup config in Firestore
 */
export async function initializeAdminAccount(adminUid: string, adminEmail: string): Promise<void> {
  const pathForWrite = `${CONFIG_COLL}/setup`;
  try {
    const docRef = doc(db, CONFIG_COLL, 'setup');
    await setDoc(docRef, {
      isInitialized: true,
      adminUid,
      adminEmail,
      createdAt: Date.now()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Product Reviews Section ===
const REVIEWS_COLL = 'reviews';

export async function addReview(review: Omit<Review, 'id' | 'createdAt'>): Promise<string> {
  const pathForWrite = REVIEWS_COLL;
  try {
    const docRef = await addDoc(collection(db, pathForWrite), {
      ...review,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export function subscribeToProductReviews(productId: string, callback: (reviews: Review[]) => void) {
  const pathForOnSnapshot = REVIEWS_COLL;
  const q = query(collection(db, REVIEWS_COLL), where('productId', '==', productId));
  return onSnapshot(q, (snapshot) => {
    const reviewsList: Review[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      reviewsList.push({
        id: doc.id,
        ...data
      } as Review);
    });
    // Sort client-side by creation date descending
    reviewsList.sort((a, b) => b.createdAt - a.createdAt);
    callback(reviewsList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

// === Shipping Plans (شركات الشحن) ===
const SHIPPING_COLL = 'shipping_plans';

export function subscribeToShippingPlans(callback: (plans: ShippingPlan[]) => void) {
  const pathForOnSnapshot = SHIPPING_COLL;
  const q = query(collection(db, SHIPPING_COLL), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const plansList: ShippingPlan[] = [];
    snapshot.forEach((doc) => {
      plansList.push({
        id: doc.id,
        ...doc.data()
      } as ShippingPlan);
    });
    callback(plansList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export async function getShippingPlans(): Promise<ShippingPlan[]> {
  const pathForGet = SHIPPING_COLL;
  try {
    const querySnapshot = await getDocs(collection(db, SHIPPING_COLL));
    const plansList: ShippingPlan[] = [];
    querySnapshot.forEach((doc) => {
      plansList.push({
        id: doc.id,
        ...doc.data()
      } as ShippingPlan);
    });
    return plansList;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
}

export async function createShippingPlan(plan: Omit<ShippingPlan, 'id' | 'createdAt'>): Promise<string> {
  const pathForWrite = SHIPPING_COLL;
  try {
    const docRef = await addDoc(collection(db, SHIPPING_COLL), {
      ...plan,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function updateShippingPlan(id: string, updates: Partial<ShippingPlan>): Promise<void> {
  const pathForWrite = `${SHIPPING_COLL}/${id}`;
  try {
    const docRef = doc(db, SHIPPING_COLL, id);
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function removeShippingPlan(id: string): Promise<void> {
  const pathForWrite = `${SHIPPING_COLL}/${id}`;
  try {
    const docRef = doc(db, SHIPPING_COLL, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Loyalty Program Config (نقاط العملاء) ===
export async function getLoyaltyConfig(): Promise<LoyaltyConfig> {
  const pathForGet = 'settings/loyalty';
  try {
    const docRef = doc(db, 'settings', 'loyalty');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as LoyaltyConfig;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return {
    pointsPerEgp: 0.1, // 1 point for every 10 EGP
    egpValuePerPoint: 0.5, // 1 point = 0.5 EGP
    isActive: true,
    instructionsAr: 'احصل على 1 نقطة مقابل كل 10 جنيهات تنفقها. كل نقطة يمكن استبدالها بـ 0.5 جنيه!',
    instructionsEn: 'Earn 1 point for every 10 EGP spent. Redeem 1 point for 0.5 EGP cash discount!'
  };
}

export async function saveLoyaltyConfig(config: LoyaltyConfig): Promise<void> {
  const pathForWrite = 'settings/loyalty';
  try {
    const docRef = doc(db, 'settings', 'loyalty');
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Payment Config (طرق الدفع وطرق الدفع المتاحة) ===
export async function getPaymentConfig(): Promise<PaymentConfig> {
  const pathForGet = 'settings/payment';
  try {
    const docRef = doc(db, 'settings', 'payment');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as PaymentConfig;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  // Standard Default setup
  return {
    cashOnDeliveryActive: true,
    walletsActive: true,
    wallets: [
      {
        id: 'vf-cash',
        nameAr: 'فودافون كاش',
        nameEn: 'Vodafone Cash',
        phone: '01012345678',
        qrCode: ''
      }
    ],
    instaPayActive: true,
    instaPay: {
      username: 'store@instapay',
      phone: '01012345678',
      qrCode: ''
    }
  };
}

export async function savePaymentConfig(config: PaymentConfig): Promise<void> {
  const pathForWrite = 'settings/payment';
  try {
    const docRef = doc(db, 'settings', 'payment');
    await setDoc(docRef, config);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Customer List (لبرنامج نقاط العملاء) ===
export function subscribeToAllCustomerProfiles(callback: (users: any[]) => void) {
  const pathForOnSnapshot = 'users';
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const usersList: any[] = [];
    snapshot.forEach((doc) => {
      usersList.push({
        id: doc.id,
        ...doc.data()
      });
    });
    callback(usersList);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

// Increase customer points when an order status is marked as 'delivered' or during placement
export async function addCustomerPoints(uid: string, pointsEarned: number): Promise<void> {
  const pathForWrite = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    let currentPoints = 0;
    if (docSnap.exists()) {
      currentPoints = docSnap.data().points || 0;
    }
    await setDoc(docRef, {
      points: currentPoints + pointsEarned
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function deductCustomerPoints(uid: string, pointsToDeduct: number): Promise<void> {
  const pathForWrite = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    let currentPoints = 0;
    if (docSnap.exists()) {
      currentPoints = docSnap.data().points || 0;
    }
    const nextPoints = Math.max(0, currentPoints - pointsToDeduct);
    await setDoc(docRef, {
      points: nextPoints
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Notifications collection handlers ===
const NOTIFICATIONS_COLL = 'notifications';

export function subscribeToNotifications(userId: string, callback: (notifications: any[]) => void) {
  const pathForOnSnapshot = NOTIFICATIONS_COLL;
  const q = query(
    collection(db, NOTIFICATIONS_COLL), 
    where('userId', '==', userId)
  );
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    // Sort descending by createdAt
    list.sort((a, b) => b.createdAt - a.createdAt);
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const pathForWrite = `${NOTIFICATIONS_COLL}/${id}`;
  try {
    const docRef = doc(db, NOTIFICATIONS_COLL, id);
    await updateDoc(docRef, { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function createNotification(notif: {
  userId: string;
  messageAr: string;
  messageEn: string;
  type: string;
  orderId?: string;
}): Promise<string> {
  const pathForWrite = NOTIFICATIONS_COLL;
  try {
    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLL), {
      ...notif,
      isRead: false,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Custom Conversations handlers ===
export function subscribeToAllConversations(callback: (conversations: any[]) => void) {
  const pathForOnSnapshot = 'conversations';
  const q = query(
    collection(db, 'conversations')
  );
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export async function createCustomOrder(orderData: {
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerNotes?: string;
  customTitle: string;
  customDescription: string;
  customMaterial: string;
  customColor: string;
  customBudget: number;
  customType?: 'couture' | 'accessories';
}): Promise<{ orderId: string; conversationId: string }> {
  const pathForWrite = 'conversations/createCustom';
  try {
    const currentUid = auth.currentUser?.uid || 'guest';
    const customerId = orderData.customerId || currentUid;
    const requestTypeLabel = orderData.customType === 'accessories' 
      ? (auth.currentUser ? 'طلب إكسسوار هاند ميد مخصص' : 'Handmade Accessory') 
      : 'custom';

    // 1. Create a conversation
    const convRef = await addDoc(collection(db, 'conversations'), {
      customerId,
      customerName: orderData.customerName,
      topic: `${orderData.customType === 'accessories' ? '💍 [إكسسوار] ' : '👗 [تفصيل] '}${orderData.customTitle}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      customType: orderData.customType || 'couture'
    });
    const conversationId = convRef.id;

    // 2. Create initial welcome message from customer
    const typeLabelAr = orderData.customType === 'accessories' ? 'طلب إكسسوارات يدوية مخصصة' : 'طلب خياطة وتفصيل مخصص';
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: customerId,
      senderRole: 'customer',
      senderName: orderData.customerName,
      text: `🔔 [${typeLabelAr}]\n\n${orderData.customDescription}\n\n- (الخامة المطلوبة: ${orderData.customMaterial})\n- (اللون المراد: ${orderData.customColor})\n- (الميزانية المخصصة: ${orderData.customBudget} ج.م)`,
      createdAt: Date.now()
    });

    // 3. Create the custom order linking to conversationId
    const orderRef = await addDoc(collection(db, 'orders'), {
      customerId,
      customerName: orderData.customerName,
      customerPhone: orderData.customerPhone,
      customerAddress: orderData.customerAddress,
      customerCity: orderData.customerCity,
      customerNotes: orderData.customerNotes || '',
      items: [],
      total: orderData.customBudget,
      status: 'pending',
      orderType: 'custom',
      customType: orderData.customType || 'couture',
      customTitle: orderData.customTitle,
      customDescription: orderData.customDescription,
      customMaterial: orderData.customMaterial,
      customColor: orderData.customColor,
      customBudget: orderData.customBudget,
      linkedConversationId: conversationId,
      createdAt: Date.now()
    });

    // Update conversation with orderId
    await updateDoc(doc(db, 'conversations', conversationId), {
      orderId: orderRef.id
    });

    return { orderId: orderRef.id, conversationId };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    throw error;
  }
}

export function subscribeToCustomerConversations(uid: string, callback: (conversations: any[]) => void) {
  const pathForOnSnapshot = 'conversations';
  const q = query(
    collection(db, 'conversations'),
    where('customerId', '==', uid)
  );
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    list.sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export function subscribeToConversationMessages(conversationId: string, callback: (messages: any[]) => void) {
  const pathForOnSnapshot = `conversations/${conversationId}/messages`;
  const q = query(
    collection(db, 'conversations', conversationId, 'messages')
  );
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data()
      });
    });
    list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    callback(list);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, pathForOnSnapshot);
  });
}

export async function sendConversationMessage(
  conversationId: string,
  message: {
    senderId: string;
    senderRole: 'customer' | 'admin';
    senderName: string;
    text: string;
  }
): Promise<string> {
  const pathForWrite = `conversations/${conversationId}/messages`;
  try {
    const messagesCollection = collection(db, 'conversations', conversationId, 'messages');
    const docRef = await addDoc(messagesCollection, {
      ...message,
      createdAt: Date.now()
    });
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      updatedAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
    throw error;
  }
}


// Check search alerts on other users and notify them on new product additions
export async function checkSearchAlertsAndNotify(newProduct: { id: string; nameAr: string; nameEn: string }) {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach(async (usrDoc) => {
      const data = usrDoc.data();
      const alerts: string[] = data.searchAlerts || [];
      if (alerts.length > 0) {
        // Check if any search word is included in the new product's name
        const match = alerts.find(term => {
          const t = term.toLowerCase().trim();
          return newProduct.nameAr.toLowerCase().includes(t) || 
                 newProduct.nameEn.toLowerCase().includes(t);
        });

        if (match) {
          await createNotification({
            userId: usrDoc.id,
            messageAr: `متوفر الآن منتج جديد يطابق بحثك عن "${match}": ${newProduct.nameAr}!`,
            messageEn: `Brand new item custom matching your alert for "${match}" is live: ${newProduct.nameEn}!`,
            type: 'new_item'
          });
        }
      }
    });
  } catch (error) {
    console.error("Error running search alerts dispatch:", error);
  }
}

// === Favorites Management ===
export async function toggleProductFavorite(userId: string, productId: string): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    let favorites: FavoriteItem[] = [];
    if (docSnap.exists()) {
      favorites = docSnap.data().favorites || [];
    }

    const idx = favorites.findIndex(f => f.productId === productId);
    if (idx > -1) {
      // Remove
      favorites.splice(idx, 1);
    } else {
      // Add
      favorites.push({
        productId,
        savedAt: Date.now()
      });
    }

    await setDoc(docRef, { favorites }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Saved Addresses Management ===
export async function addSavedAddress(userId: string, address: Omit<SavedAddress, 'id'>): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    let addresses: SavedAddress[] = [];
    if (docSnap.exists()) {
      addresses = docSnap.data().addresses || [];
    }

    const newId = 'add_' + Math.random().toString(36).substring(2, 9);
    const isFirst = addresses.length === 0;
    
    // If setting custom default, remove default on existing
    if (address.isDefault || isFirst) {
      addresses = addresses.map(a => ({ ...a, isDefault: false }));
    }

    addresses.push({
      id: newId,
      ...address,
      isDefault: address.isDefault || isFirst
    });

    await setDoc(docRef, { addresses }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function updateSavedAddress(userId: string, addressId: string, updates: Partial<SavedAddress>): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let addresses: SavedAddress[] = docSnap.data().addresses || [];
      if (updates.isDefault) {
        addresses = addresses.map(a => ({ ...a, isDefault: false }));
      }
      addresses = addresses.map(a => {
        if (a.id === addressId) {
          return { ...a, ...updates };
        }
        return a;
      });
      await setDoc(docRef, { addresses }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function deleteSavedAddress(userId: string, addressId: string): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let addresses: SavedAddress[] = docSnap.data().addresses || [];
      const itemToDelete = addresses.find(a => a.id === addressId);
      addresses = addresses.filter(a => a.id !== addressId);
      
      // If deleted item was default, make first remaining as default
      if (itemToDelete?.isDefault && addresses.length > 0) {
        addresses[0].isDefault = true;
      }
      await setDoc(docRef, { addresses }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function setDefaultSavedAddress(userId: string, addressId: string): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      let addresses: SavedAddress[] = docSnap.data().addresses || [];
      addresses = addresses.map(a => ({
        ...a,
        isDefault: a.id === addressId
      }));
      await setDoc(docRef, { addresses }, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// Search alert interest toggler (أبلغني عند توفر منتجات جديدة تناسب هذا البحث)
export async function toggleSearchAlert(userId: string, queryText: string): Promise<void> {
  const pathForWrite = `users/${userId}`;
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    let searchAlerts: string[] = [];
    if (docSnap.exists()) {
      searchAlerts = docSnap.data().searchAlerts || [];
    }

    const cleaned = queryText.trim().toLowerCase();
    if (!cleaned) return;

    const idx = searchAlerts.indexOf(cleaned);
    if (idx > -1) {
      searchAlerts.splice(idx, 1);
    } else {
      searchAlerts.push(cleaned);
    }
    await setDoc(docRef, { searchAlerts }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === FINANCIAL SETTLEMENTS & SHIPPING COMPANY RECONCILIATIONS ===
export async function getSettlements(): Promise<SettlementPeriod[]> {
  const pathForGet = 'settings/settlements';
  try {
    const docRef = doc(db, 'settings', 'settlements');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return (data.periods || []) as SettlementPeriod[];
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return [];
}

export async function saveSettlements(periods: SettlementPeriod[]): Promise<void> {
  const pathForWrite = 'settings/settlements';
  try {
    const docRef = doc(db, 'settings', 'settlements');
    await setDoc(docRef, { periods });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

export async function markOrdersAsSettled(orderIds: string[], settlementId: string): Promise<void> {
  const pathForWrite = 'orders';
  try {
    for (const orderId of orderIds) {
      const docRef = doc(db, 'orders', orderId);
      await updateDoc(docRef, { 
        settled: true,
        settledInPeriodId: settlementId
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

/**
 * Subscribe to real-time updates for a specific user profile doc
 */
export function subscribeToUserProfile(uid: string, callback: (data: any) => void) {
  const docRef = doc(db, 'users', uid);
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  }, (error) => {
    console.error("Error subscribing to user profile:", error);
  });
}

// === Support Pages Configuration ===
export async function getSupportPagesContent(): Promise<SupportPagesContent> {
  const pathForGet = 'settings/support_pages';
  try {
    const docRef = doc(db, 'settings', 'support_pages');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as SupportPagesContent;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }

  // Fallbacks corresponding exactly to SupportPages.tsx initial designs
  return {
    contact_us: {
      titleAr: 'اتصل بنا',
      titleEn: 'Contact Us',
      subtitleAr: 'نحن هنا لمساعدتِك وتلبية رغبات الملابس المخصصة لديكِ. اتصلي بفريقنا الفني والأساتذة لتجربة فاخرة.',
      subtitleEn: 'Connect with our design advisors, master tailors, and customer support coordinators.',
      phone: '+20 101 234 5678',
      email: 'support@raavegy.com',
      addressAr: 'التجمع الخامس، شارع التسعين، نيو كايرو، مصر',
      addressEn: '90th Street, Fifth Settlement, New Cairo, Egypt',
      workingHoursAr: 'كل يوم من الساعة ١٢ ظهراً حتى ١٠ مساءً',
      workingHoursEn: 'Daily from 12:00 PM to 10:00 PM',
      instagramUrl: 'https://instagram.com/raav',
      facebookUrl: 'https://facebook.com/raav',
      whatsappPhone: '201012345678'
    },
    shipping_returns: {
      titleAr: 'الشحن والاسترجاع',
      titleEn: 'Shipping & Returns',
      contentAr: `### سياسة الشحن السريع والتفصيلى
**القاهرة الكبرى والجيزة (منطقة الدلتا):** التوصيل خلال 24 - 48 ساعة وبقيمة (60 ج.م).  
**باقي المحافظات:** التوصيل من 3 - 5 أيام وبقيمة (80 ج.م).  

### ميزة فحص الموديل وقياسه عند الباب!
ندرك احتياج الأزياء الراقية للمطابقة. يمكنكِ معاينة القطعة وقياس ثياب فستانكِ مع بقاء مندوب التوصيل في الانتظار بالخارج. في حال لم يعجبكِ فادفعي فقط مصاريف الشحن للمندوب وسيعود بالقطعة فوراً.

### سياسة الاسترجاع والتبديل
تتمتعين بضمان استرجاع أو تبديل مريح وسخي لمدة 14 يوماً كاملة من تاريخ الاستلام، طالما كانت القطعة بحالتها الأصلية غير المستخدمة وبالعلامة الخاصة بها (Tag).   
*ملاحظة لـ Bespoke Couture:* نظراً لكون التفصيل اليدوي يتم تفصيله خصيصاً على مقاساتكِ، فإنه غير قابل للاسترجاع النقدي، ومع ذلك نوفر تعديلات مجانية مدى الحياة في الأتيليه لدينا.`,
      contentEn: `### Express Shipping Policies
**Greater Cairo & Giza (Delta Region):** Delivered within 24 to 48 working hours. Flat rate: 60 EGP.  
**Regional & Upper Egypt:** Delivered within 3 to 5 business days. Flat rate: 80 EGP.  

### Doorstep Previews & Trial Fittings!
We recognize the luxury of custom apparel. You are fully welcome to unpack, inspect, and complete a trial fitting of the item while the courier remains waiting. Return on-the-spot by merely covering active shipping fees.

### Returns & Exchanges Policy
Enjoy a comfortable 14-day return and exchange window, provided the garment is in its original, unworn condition with tags attached.  
*Note for Bespoke Couture:* Customized Haute Couture items tailored to individual dimensions are non-refundable, but we guarantee lifetime complimentary alterations/adjustments at our boutique.`
    },
    size_guide: {
      titleAr: 'دليل المقاسات',
      titleEn: 'Size Guide',
      contentAr: `جميع القطع في بوتيك راف تتبع مقاييس الخياطة المعتادة والمعايير القياسية بدقة متناهية. استخدمي جدول الأبعاد أدناه لتحديد مقاسك الأمثل.  

إذا كانت قياساتكِ تقع خارج الأرقام القياسية أو ترغبين في قطعة تفصيل Couture فريدة تبرز قوامك بشكل مثالي، يرجى التقديم على خدمة 'طلب تفصيل مخصص' أو التواصل مع الدعم الفني لمصممينا لمساعدتكِ خطوة بخطوة.`,
      contentEn: `All garments follow strict standard tailoring guidelines to ensure an elite silhouette. Please utilize our dimensions chart to match your sizing.  

If your measurements fall outside normal boundaries or you seek a custom couture dress perfectly adjusted for you, simply submit a 'Bespoke Costume Request' or consult our style advisors via live support.`
    },
    faq: {
      titleAr: 'الأسئلة الشائعة',
      titleEn: 'Frequently Asked Questions',
      subtitleAr: 'تصفحي سريعا أكثر الأسئلة المكررة من زبوناتنا حول الشحن، القياس، الدفع، وتفصيل الهاند ميد المخصص.',
      subtitleEn: 'Review answers regarding bespoke fittings, Egyptian checkout options, and trial services.',
      items: [
        {
          id: 'faq-1',
          qAr: "هل توفرون الدفع عند الاستلام داخل مصر؟",
          qEn: "Do you offer Cash on Delivery (COD) in Egypt?",
          aAr: "نعم بكل تأكيد! نحن نوفر خيار الدفع كاش عند الاستلام لمندوب التوصيل في جميع المحافظات، كحل مريح وموثوق به تماماً.",
          aEn: "Yes, absolutely! We offer Cash on Delivery (COD) as a standard convenient feature across all Egyptian governorates."
        },
        {
          id: 'faq-2',
          qAr: "هل يمكنني قياس وتجربة القطعة عند وصول المندوب؟",
          qEn: "Can I try the clothes on when the representative arrives?",
          aAr: "نعم، هذه الميزة حصرية وفريدة لأتيليه RAAV. يمكنك معاينة القطعة وقياس ملبسك مع بقاء المندوب منتظراً بالخارج لمدة 10 دقائق. في حالة لم يناسبك المقاس، يمكنكِ إرجاعها فوراً ودفع تكلفة الشحن فقط.",
          aEn: "Yes, this is an exclusive RAAV highlight! You are welcome to inspect and complete a trial fitting of the item while the courier remains waiting. Return on the spot if unsatisfied, paying only shipping fee."
        },
        {
          id: 'faq-3',
          qAr: "ما هو معدل الشحن والتوصيل للمحافظات؟",
          qEn: "What are your shipping rates and timelines?",
          aAr: "التوصيل داخل القاهرة الكبرى والجيزة يستغرق ٢٤ - ٤٨ ساعة فقط وبسعر ٦٠ ج.م. وباقي المحافظات خلال ٣ - ٥ أيام بسعر ٨٠ ج.م.",
          aEn: "Metro Cairo & Giza takes 24 to 48 hours for 60 EGP. Regional governorates are delivered within 3 to 5 business days for 80 EGP."
        },
        {
          id: 'faq-4',
          qAr: "كيف أطلب تفصيل فستان خاص بمقاساتي المحددة؟",
          qEn: "How do I request a custom bespoke dress?",
          aAr: "بكل سهولة! يمكنك زيارة تبويب 'طلب تفصيل مخصص' في القائمة الرئيسية أو النزول لأسفل الصفحة الرئيسية لملء مواصفات فستان أحلامك، الخامات المفضلة، والميزانية. سيتم تأسيس شات فوري في بروفايلك مع المصمم لإتمام الاتفاق.",
          aEn: "Extremely simple! Visit our Bespoke Couture form at the bottom of the home screen or inside the header. Provide details about style, metrics, and targeted price, and we will initialize a private thread on your dashboard."
        },
        {
          id: 'faq-5',
          qAr: "هل تقبلون الدفع عبر Instapay أو المحافظ الذكية؟",
          qEn: "Do you accept Instapay, bank transfer or electronic wallets?",
          aAr: "نعم، نحن نقبل الدفع الفوري لمبيعات الأتيليه والتفصيل المخصص عبر حساب Instapay المباشر، المحافظ الذكية (فودافون كاش، اتصالات، إلخ)، والبطاقات الائتمانية والخصم.",
          aEn: "Yes! We accept immediate digital submissions via Instapay, smart mobile wallets (Vodafone Cash, Orange, Etisalat), bank transfers, and standard modern debit/credit cards."
        },
        {
          id: 'faq-6',
          qAr: "هل تتوفر تعديلات مجانية إذا لم يطابق مقاس الهاند ميد تماماً؟",
          qEn: "Are there free size alterations for custom orders?",
          aAr: "بالتأكيد. إذا طلبتِ تفصيل هاند ميد مخصص ووجدتِ حاجة لبعض التعديلات البسيطة في الاتساع أو الطول، يسعدنا استقبال القطعة وتعديلها مجانًا مدى الحياة في الأتيليه لدينا.",
          aEn: "Absolutely. If you acquire a bespoke couture dress and find that adjustments in width, sleeves or length are required, we gladly offer lifetime complimentary alterations at our Atelier."
        }
      ]
    },
    privacy_policy: {
      titleAr: 'سياسة الخصوصية',
      titleEn: 'Privacy Policy',
      contentAr: `### آخر تحديث: يونيو ٢٠٢٦
في أزياء RAAV، تعتبر خصوصية زبوناتنا وزوارنا ذات أهمية بالغة ونلتزم بأعلى معايير السرية المطلقة. نوضح في هذه الوثيقة طبيعة البيانات الشخصية التي نجمعها وكيف نعمل على حمايتها بضمان كامل.

#### ١. البيانات الشخصية التي نجمعها
عند تسجيل الدخول أو إرسال استفسار مخصص، نقوم بحفظ التفاصيل التي تكفي لتقديم خدمة راقية وسلسة:
* الاسم الكامل للتسجيل والتواصل.
* رقم الهاتف لتعديل المقاسات وتحديد اتجاه شحن المندوب.
* العنوان السكني لتسليم طلبيات الأزياء في مصر.
* مقاسات الجسم، الوزن والطول لقطع الـ Couture المفصلة خصيصاً.

#### ٢. استخدام وحماية البيانات
تُستخدم بياناتك فقط لمعالجة الشحنات، وإرسال تعديلات الملابس ومطابقة القياس مع الأتيليه. ونضمن لكِ عدم بيع، تأجير، أو مشاركة تفاصيل حسابك أو أبعاد جسمك ومحادثاتك الخاصة مع أي جهة خارجية أو تجارية إطلاقاً.

#### ٣. أمن المحادثات الفورية
شات محادثاتك مع مصمم الأتيليه المحترف يتم تشفيره وتأمينه بالكامل داخل قواعد بياناتنا لضمان خصوصيتك الكلمة ومراجعة تفاصيل فستانك دون أي ازعاج.`,
      contentEn: `### Last Updated: June 2026
At RAAV Atelier, the confidentiality of our clients is held with utmost importance. This Privacy Policy outlines how securely we manage your credentials, measurements, and coordinates.

#### 1. Types of Data We Collect
When interacting with custom orders, registrations or support requests, we safely store core metrics to supply high-fashion precision:
* Your full identifier names.
* Active telecommunication digits (phone/WhatsApp).
* Precise address markers to facilitate Egyptian boutique shipping.
* Detailed seam metrics (bust, hips, height) for customized tailoring options.

#### 2. Safety & Data Distribution Safeguards
Your details are processed strictly to arrange doorstep trials, catalog alterations, and matching custom patterns. We guarantee zero transmission, leasing, or commercial sharing of measurements and conversations with third-party organizations.

#### 3. Confidential Fashion Advisory
All shared metrics, specifications, and style inspirations inside private designer chats are fully isolated within Firestore to guard your digital security.`
    },
    terms_of_service: {
      titleAr: 'شروط الخدمة',
      titleEn: 'Terms of Service',
      contentAr: `### آخر تحديث: يونيو ٢٠٢٦
نرحب بكم في RAAV EGY. تحكم هذه الشروط والقوانين تصفحكم للموقع، طلب المنتجات من الكتالوج الطبيعي، واستخدام صالة استشارة وتصميم الملابس وهاند ميد داهل جمهورية مصر العربية.

#### ١. طلبات الملابس وتأكيد الحجز
جميع طلبات الفساتين السواريه والملابس الجاهزة تخضع للتأكيد عبر محادثة هاتفية أو واتساب يثبت فيها العنوان والمقاس الدقيق لتجنب حدوث أي استرجاع غير مرغوب فيه.

#### ٢. الدفع لمبيعات الهاند ميد المخصص (Bespoke)
بالقطع المخصصة التي يتم تصميمها بالطلب (Couture)، يتم توقيع طلب ومواصفات تفصيلية وبما أن الباب مغلق على المقاسات الفردية، فإن الأتيليه يستلزم سداد عربون حجز تأكيدي بسيط (عبر Instapay أو إيداع فودافون كاش أو بطاقة بنكية) للبدء في شراء تفصيلة الأقمشة وقص الموديل الفاخر.

#### ٣. خدمة المعاينة عند التسليم
أمامكِ الحق الوجوبي في معاينة وتجربة الموديل عند باب منزلك في حضور مندوبنا. في حالة الرفض، تلتزم العطية بدفع رسوم الشحن المقررة للمندوب فوراً كتعويض عن تكلفة الوقود والمشوار.`,
      contentEn: `### Last Updated: June 2026
Welcome to RAAV EGY. These terms govern the navigation of our digital storefront, bespoke custom creations, and checkout configurations across Egypt.

#### 1. Clothing Orders & Size Audits
Every ready-to-wear boutique order is verified via a call or WhatsApp message to confirm the shipping address and coordinate sizes correctly before dispatch.

#### 2. Payment for Custom Bespoke Orders
For custom haute-couture dresses drafted specifically to individual dimensions, RAAV requires a secure partial reservation deposit (payable via Instapay, smart mobile cash, or standard credit/debit card) to confirm purchase of raw high-end fabrics and initiate master pattern cuts.

#### 3. Deliveries & Doorstep Fitting Trials
You reserve the privilege of reviewing and testing garments on delivery. If the product is declined during doorstep trial, you are obligated to cover flat-rate shipping fees to compensate active logistics coordinators.`
    }
  };
}

export async function saveSupportPagesContent(content: SupportPagesContent): Promise<void> {
  const pathForWrite = 'settings/support_pages';
  try {
    const docRef = doc(db, 'settings', 'support_pages');
    await setDoc(docRef, content);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === Homepage Dynamic Content ===
export async function getHomepageContent(): Promise<HomepageContent> {
  const pathForGet = 'settings/homepage';
  try {
    const docRef = doc(db, 'settings', 'homepage');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as HomepageContent;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }

  // Fallbacks corresponding exactly to HeroCarousel.tsx
  return {
    announcementAr: 'توصيل سريع مجاني في مصر للطلبات الأكثر من ١٢٠٠ ج.م • كود الخصم: RAAV2026',
    announcementEn: 'FREE EXPEDITED SHIPPING IN EGYPT ON ORDERS OVER 1200 EGP • CODE: RAAV2026',
    heroSlides: [
      {
        id: 1,
        overlineAr: "— ربيع / صيف ٢٠٢٦",
        overlineEn: "— SPRING / SUMMER 2026",
        titleAr: "تعريف الأناقة اليومية.",
        titleEn: "Refining Everyday Elegance.",
        descAr: "اكتشف الجماليات المعاصرة مع مجموعتنا المنسقة حديثًا. مصممة للجرأة والجمال والبساطة.",
        descEn: "Discover the modern aesthetic with our newly curated collection. Designed for the bold, the beautiful, and the minimalist.",
        quoteAr: "التوازن المثالي بين دقة التصميم والأداء المعاصر لخزانة ملابس عصرية.",
        quoteEn: "The perfect balance of form and function for the modern wardrobe.",
        image: "https://img.kwcdn.com/product/fancy/9c18cbce-997c-4405-8b84-482cb677dd72.jpg?imageView2/2/w/800/q/70/format/avif?auto=format&fit=crop&q=80&w=1200", 
        cat: "women",
      },
      {
        id: 2,
        overlineAr: "— تشكيلة الأقطان الطبيعية",
        overlineEn: "— THE NATURAL LINENS",
        titleAr: "راحة ممتدة طوال اليوم.",
        titleEn: "Experience Timeless Calm.",
        descAr: "أقمشة كتانية وقطنية تتنفس في حرارة الصيف، منسوجة خصيصاً بنسب جودة رفيعة تلبي معايير الفخامة الهادئة.",
        descEn: "Pure organic fibers woven to allow airflow and extreme comfort under Cairo's golden sun rays.",
        quoteAr: "خامات ذات نسيج يعيد ابتكار مفهوم الرفاهية المباشرة بجودة تدوم.",
        quoteEn: "Elevated structures built specifically for people who cherish quiet luxury aesthetics.",
        image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
        cat: "men",
      },
      {
        id: 3,
        overlineAr: "— إكسسوارات منسقة بعناية",
        overlineEn: "— LUXURY ACCENTS",
        titleAr: "اكتمال التفاصيل الدقيقة.",
        titleEn: "Composing Perfect Accents.",
        descAr: "ساعات كلاسيكية، حقائب ومنسوجات مكملة تصاحبك لتمنح حضورك بصمة من الفرادة والجاذبية.",
        descEn: "From elegant timepieces to minimalist leatherware, find the fine lines that complete your silhouette.",
        quoteAr: "لمسات أخيرة من الرقي والكمال تكسب كل مظهر شخصيته الفريدة.",
        quoteEn: "Premium accessories designed to integrate seamlessly into a premium custom closet.",
        image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&q=80&w=1200",
        cat: "accessories",
      }
    ]
  };
}

export async function saveHomepageContent(content: HomepageContent): Promise<void> {
  const pathForWrite = 'settings/homepage';
  try {
    const docRef = doc(db, 'settings', 'homepage');
    await setDoc(docRef, content);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

// === OPERATIONS FOR OPERATIONAL STYLE BUSINESS EXPENSES ===
export async function getExpenses(): Promise<BusinessExpense[]> {
  const pathForGet = 'settings/expenses';
  try {
    const docRef = doc(db, 'settings', 'expenses');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return (docSnap.data().expenses || []) as BusinessExpense[];
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, pathForGet);
  }
  return [];
}

export async function saveExpenses(expenses: BusinessExpense[]): Promise<void> {
  const pathForWrite = 'settings/expenses';
  try {
    const docRef = doc(db, 'settings', 'expenses');
    await setDoc(docRef, { expenses });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, pathForWrite);
  }
}

