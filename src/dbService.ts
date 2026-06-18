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
import { Product, Order, OrderStatus, Review, ShippingPlan, LoyaltyConfig, PaymentConfig, SavedAddress, FavoriteItem, Notification, Conversation, ConversationMessage, SettlementPeriod } from './types';
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
    const docRef = await addDoc(collection(db, ORDERS_COLL), {
      ...order,
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
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
  const pathForWrite = `${ORDERS_COLL}/${orderId}`;
  try {
    const docRef = doc(db, ORDERS_COLL, orderId);
    await updateDoc(docRef, { status });

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
}): Promise<{ orderId: string; conversationId: string }> {
  const pathForWrite = 'conversations/createCustom';
  try {
    const currentUid = auth.currentUser?.uid || 'guest';
    const customerId = orderData.customerId || currentUid;

    // 1. Create a conversation
    const convRef = await addDoc(collection(db, 'conversations'), {
      customerId,
      customerName: orderData.customerName,
      topic: orderData.customTitle,
      createdAt: Date.now(),
      updatedAt: Date.now()
    });
    const conversationId = convRef.id;

    // 2. Create initial welcome message from customer
    await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
      senderId: customerId,
      senderRole: 'customer',
      senderName: orderData.customerName,
      text: `${orderData.customDescription}\n\n- (الخامة المطلوبة: ${orderData.customMaterial})\n- (اللون المراد: ${orderData.customColor})\n- (الميزانية المخصصة: ${orderData.customBudget} ج.م)`,
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
