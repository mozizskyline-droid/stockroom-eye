/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  getDoc,
  query,
  where,
  orderBy,
  getDocFromServer,
  Firestore
} from 'firebase/firestore';
import { Product, StockTransaction, Sale, UserProfile, UserRole, SystemSettings, OperationType, FirestoreErrorInfo } from './types';
import firebaseConfig from '../firebase-applet-config.json';

// Detect whether a valid Firebase configuration is supplied
const isRealFirebase = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey !== "PLACEHOLDER_API_KEY" && 
  !firebaseConfig.apiKey.includes("PLACEHOLDER");

export const isFirebaseConfigured = isRealFirebase;

let app;
let auth: any = null;
let db: Firestore | null = null;

if (isRealFirebase) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || "(default)");
  } catch (error) {
    console.error("Firebase Initialization Error:", error);
  }
}

// Custom error handling as mandated by target guideline #3
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const currentUid = auth?.currentUser?.uid || "mock_uuid";
  const currentEmail = auth?.currentUser?.email || "mock@business.com";
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: currentUid,
      email: currentEmail,
      emailVerified: true,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ----------------------------------------------------
// LOCAL WORKSPACE STORAGE FALLBACK
// ----------------------------------------------------
class MockDatabase {
  private listeners: { [key: string]: Array<(data: any) => void> } = {};

  constructor() {
    this.initDefaults();
    // Watch other instances or tabs via standard localstorage event if active
    window.addEventListener('storage', () => {
      this.triggerListeners('products');
      this.triggerListeners('transactions');
      this.triggerListeners('sales');
      this.triggerListeners('users');
      this.triggerListeners('settings');
    });
  }

  private initDefaults() {
    if (!localStorage.getItem('inventory_products')) {
      const defaultProducts: Product[] = [
        { id: '1', name: 'Premium Coffee Beans', sku: 'COF-AR-001', category: 'Beverages', quantity: 45, costPrice: 12.50, sellingPrice: 22.00, supplier: 'Atacama Coffee Corp', minStock: 15 },
        { id: '2', name: 'Organic Almond Milk', sku: 'MILK-ALM-05', category: 'Dairy/Alts', quantity: 8, costPrice: 2.20, sellingPrice: 4.50, supplier: 'Green Pastures', minStock: 10 },
        { id: '3', name: 'Dark Chocolate Bar 85%', sku: 'CHO-DK-85', category: 'Confectionery', quantity: 120, costPrice: 1.80, sellingPrice: 3.50, supplier: 'Cocoa Horizons', minStock: 20 },
        { id: '4', name: 'Steel Cut Oats 1kg', sku: 'GRA-OAT-01', category: 'Grains', quantity: 0, costPrice: 3.00, sellingPrice: 6.00, supplier: 'Millers Grain Co', minStock: 12 },
        { id: '5', name: 'Premium Green Tea 50 bags', sku: 'TEA-GR-50', category: 'Beverages', quantity: 4, costPrice: 4.00, sellingPrice: 8.50, supplier: 'Atacama Coffee Corp', minStock: 8 }
      ];
      localStorage.setItem('inventory_products', JSON.stringify(defaultProducts));
    }

    if (!localStorage.getItem('inventory_transactions')) {
      const defaultTransactions: StockTransaction[] = [
        { id: 't1', productId: '1', productName: 'Premium Coffee Beans', type: 'stock_in', quantity: 50, reason: 'Initial ingestion', date: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), userId: 'u1', userName: 'Abebe Admin' },
        { id: 't2', productId: '1', productName: 'Premium Coffee Beans', type: 'stock_out', quantity: 5, reason: 'Sample Tasting', date: new Date(Date.now() - 3600000 * 24 * 2).toISOString(), userId: 'u2', userName: 'Mary Manager' },
        { id: 't3', productId: '4', productName: 'Steel Cut Oats 1kg', type: 'stock_in', quantity: 15, reason: 'Restock shipment', date: new Date(Date.now() - 3600000 * 24).toISOString(), userId: 'u3', userName: 'Sam Staff' },
        { id: 't4', productId: '4', productName: 'Steel Cut Oats 1kg', type: 'stock_out', quantity: 15, reason: 'Damaged by water leak', date: new Date(Date.now() - 3600000 * 4).toISOString(), userId: 'u2', userName: 'Mary Manager' }
      ];
      localStorage.setItem('inventory_transactions', JSON.stringify(defaultTransactions));
    }

    if (!localStorage.getItem('inventory_sales')) {
      const defaultSales: Sale[] = [
        { id: 's1', productId: '1', productName: 'Premium Coffee Beans', quantity: 2, total: 44.00, paymentType: 'Cash', date: new Date(Date.now() - 3600000 * 5).toISOString(), userId: 'u3', userName: 'Sam Staff' },
        { id: 's2', productId: '3', productName: 'Dark Chocolate Bar 85%', quantity: 5, total: 17.50, paymentType: 'Transfer', date: new Date(Date.now() - 3600000 * 2).toISOString(), userId: 'u3', userName: 'Sam Staff' }
      ];
      localStorage.setItem('inventory_sales', JSON.stringify(defaultSales));
    }

    if (!localStorage.getItem('inventory_settings')) {
      const defaultSettings: SystemSettings = {
        businessName: 'Apex Grocers',
        currency: '$',
        taxEnabled: true,
        taxRate: 7.5,
        notificationLowStock: true
      };
      localStorage.setItem('inventory_settings', JSON.stringify(defaultSettings));
    }

    if (!localStorage.getItem('inventory_users')) {
      const defaultUsers: UserProfile[] = [
        { uid: 'u1', name: 'Abebe Admin', email: 'mozizskyline@gmail.com', role: 'Admin' },
        { uid: 'u2', name: 'Mary Manager', email: 'manager@business.com', role: 'Manager' },
        { uid: 'u3', name: 'Sam Staff', email: 'staff@business.com', role: 'Staff' }
      ];
      localStorage.setItem('inventory_users', JSON.stringify(defaultUsers));
    }
  }

  getItems<T>(key: string): T[] {
    const raw = localStorage.getItem(`inventory_${key}`);
    return raw ? JSON.parse(raw) : [];
  }

  setItems<T>(key: string, data: T[]) {
    localStorage.setItem(`inventory_${key}`, JSON.stringify(data));
    this.triggerListeners(key);
  }

  onChange(key: string, callback: (data: any) => void) {
    if (!this.listeners[key]) {
      this.listeners[key] = [];
    }
    this.listeners[key].push(callback);
    // Yield current elements immediately
    if (key === 'settings') {
      const settings = localStorage.getItem('inventory_settings');
      callback(settings ? JSON.parse(settings) : {});
    } else {
      callback(this.getItems(key));
    }
    return () => {
      this.listeners[key] = this.listeners[key].filter(cb => cb !== callback);
    };
  }

  private triggerListeners(key: string) {
    if (this.listeners[key]) {
      const data = key === 'settings' 
        ? JSON.parse(localStorage.getItem('inventory_settings') || '{}')
        : this.getItems(key);
      this.listeners[key].forEach(cb => cb(data));
    }
  }
}

const mockDb = new MockDatabase();

// Mock Auth logic
let currentMockUser: UserProfile | null = null;
const mockAuthListeners: Array<(user: UserProfile | null) => void> = [];

const PERSISTED_MOCK_USER_KEY = 'inventory_current_mock_user';
const storedMockUser = localStorage.getItem(PERSISTED_MOCK_USER_KEY);
if (storedMockUser) {
  try {
    currentMockUser = JSON.parse(storedMockUser);
  } catch {
    currentMockUser = null;
  }
}

function triggerAuthListeners() {
  mockAuthListeners.forEach(cb => cb(currentMockUser));
}

// ----------------------------------------------------
// UNIFIED AUTHENTICATION INTERFACE
// ----------------------------------------------------
export function subscribeAuth(callback: (user: UserProfile | null) => void) {
  if (isRealFirebase) {
    return onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Retrieve internal profile matching user
        const uDoc = await getDoc(doc(db!, "users", fbUser.uid));
        if (uDoc.exists()) {
          callback({ uid: fbUser.uid, ...uDoc.data() } as UserProfile);
        } else {
          // If profile does not exist, provision standard staff or boostrap admin
          const isOwner = fbUser.email === "mozizskyline@gmail.com";
          const newProfile: UserProfile = {
            uid: fbUser.uid,
            name: fbUser.displayName || fbUser.email?.split('@')[0] || "Staff Member",
            email: fbUser.email || "",
            role: isOwner ? "Admin" : "Staff"
          };
          try {
            await setDoc(doc(db!, "users", fbUser.uid), {
              name: newProfile.name,
              email: newProfile.email,
              role: newProfile.role
            });
            callback(newProfile);
          } catch (e) {
            console.error("Auto registration error:", e);
            callback(newProfile); // yield it locally anyway
          }
        }
      } else {
        callback(null);
      }
    });
  } else {
    mockAuthListeners.push(callback);
    callback(currentMockUser);
    return () => {
      const idx = mockAuthListeners.indexOf(callback);
      if (idx !== -1) mockAuthListeners.splice(idx, 1);
    };
  }
}

export async function loginWithMock(role: UserRole, customName?: string, customEmail?: string) {
  const name = customName || `${role} Operator`;
  const email = customEmail || `${role.toLowerCase()}@business.com`;
  const mockProfile: UserProfile = {
    uid: `mock_${role.toLowerCase()}`,
    name,
    email,
    role
  };
  currentMockUser = mockProfile;
  localStorage.setItem(PERSISTED_MOCK_USER_KEY, JSON.stringify(mockProfile));
  
  // Also register in simulated users collection if not present
  const users = mockDb.getItems<UserProfile>('users');
  if (!users.some(u => u.uid === mockProfile.uid)) {
    users.push(mockProfile);
    mockDb.setItems('users', users);
  }

  triggerAuthListeners();
}

export async function loginWithGoogle() {
  if (isRealFirebase) {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, "auth/google");
    }
  } else {
    // If mocking, sign in as Abebe Admin by default
    await loginWithMock("Admin", "Abebe Admin", "mozizskyline@gmail.com");
  }
}

export async function signOutUser() {
  if (isRealFirebase) {
    await firebaseSignOut(auth);
  } else {
    currentMockUser = null;
    localStorage.removeItem(PERSISTED_MOCK_USER_KEY);
    triggerAuthListeners();
  }
}

// ----------------------------------------------------
// UNIFIED PRODUCTS INTERFACE
// ----------------------------------------------------
export function subscribeProducts(callback: (products: Product[]) => void) {
  if (isRealFirebase) {
    return onSnapshot(collection(db!, "products"), (snapshot) => {
      const products: Product[] = [];
      snapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      callback(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "products");
    });
  } else {
    return mockDb.onChange('products', callback);
  }
}

export async function addProduct(product: Omit<Product, 'id'>): Promise<string> {
  const id = 'prod_' + Math.random().toString(36).substr(2, 9);
  const newProduct: Product = { id, ...product };

  if (isRealFirebase) {
    try {
      await setDoc(doc(db!, "products", id), product);
      return id;
    } catch (e) {
      handleFirestoreError(e, OperationType.CREATE, `products/${id}`);
      throw e;
    }
  } else {
    const products = mockDb.getItems<Product>('products');
    products.push(newProduct);
    mockDb.setItems('products', products);
    return id;
  }
}

export async function updateProduct(id: string, fields: Partial<Product>) {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db!, "products", id), fields);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `products/${id}`);
      throw e;
    }
  } else {
    const products = mockDb.getItems<Product>('products');
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...fields };
      mockDb.setItems('products', products);
    }
  }
}

export async function deleteProduct(id: string) {
  if (isRealFirebase) {
    try {
      await deleteDoc(doc(db!, "products", id));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `products/${id}`);
      throw e;
    }
  } else {
    const products = mockDb.getItems<Product>('products');
    const filtered = products.filter(p => p.id !== id);
    mockDb.setItems('products', filtered);
  }
}

// ----------------------------------------------------
// UNIFIED TRANSACTIONS INTERFACE
// ----------------------------------------------------
export function subscribeTransactions(callback: (txs: StockTransaction[]) => void) {
  if (isRealFirebase) {
    return onSnapshot(collection(db!, "transactions"), (snapshot) => {
      const txs: StockTransaction[] = [];
      snapshot.forEach((doc) => {
        txs.push({ id: doc.id, ...doc.data() } as StockTransaction);
      });
      // Sort by date desc
      txs.sort((a,b) => b.date.localeCompare(a.date));
      callback(txs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "transactions");
    });
  } else {
    return mockDb.onChange('transactions', (data: StockTransaction[]) => {
      const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
      callback(sorted);
    });
  }
}

export async function addStockTransaction(productId: string, productName: string, type: "stock_in" | "stock_out", qty: number, reason: string, user: UserProfile) {
  const id = 'tx_' + Math.random().toString(36).substr(2, 9);
  const tx: StockTransaction = {
    id,
    productId,
    productName,
    type,
    quantity: qty,
    reason,
    date: new Date().toISOString(),
    userId: user.uid,
    userName: user.name
  };

  if (isRealFirebase) {
    try {
      // 1. Log Transaction
      await setDoc(doc(db!, "transactions", id), tx);
      // 2. Adjust Product stock count.
      // Fetch product quantity from DB
      const prodRef = doc(db!, "products", productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentQty = prodSnap.data().quantity || 0;
        const newQty = type === "stock_in" ? currentQty + qty : Math.max(0, currentQty - qty);
        await updateDoc(prodRef, { quantity: newQty });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `transactions/${id}`);
      throw e;
    }
  } else {
    // Save transaction
    const transactions = mockDb.getItems<StockTransaction>('transactions');
    transactions.push(tx);
    mockDb.setItems('transactions', transactions);

    // Update Product quantity
    const products = mockDb.getItems<Product>('products');
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const currentQty = products[index].quantity;
      const newQty = type === "stock_in" ? currentQty + qty : Math.max(0, currentQty - qty);
      products[index].quantity = newQty;
      mockDb.setItems('products', products);
    }
  }
}

// ----------------------------------------------------
// UNIFIED SALES INTERFACE
// ----------------------------------------------------
export function subscribeSales(callback: (sales: Sale[]) => void) {
  if (isRealFirebase) {
    return onSnapshot(collection(db!, "sales"), (snapshot) => {
      const sales: Sale[] = [];
      snapshot.forEach((doc) => {
        sales.push({ id: doc.id, ...doc.data() } as Sale);
      });
      sales.sort((a, b) => b.date.localeCompare(a.date));
      callback(sales);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "sales");
    });
  } else {
    return mockDb.onChange('sales', (data: Sale[]) => {
      const sorted = [...data].sort((a,b) => b.date.localeCompare(a.date));
      callback(sorted);
    });
  }
}

export async function addSale(productId: string, productName: string, qty: number, unitSellingPrice: number, paymentType: "Cash" | "Transfer", user: UserProfile) {
  const id = 'sale_' + Math.random().toString(36).substr(2, 9);
  const total = qty * unitSellingPrice;
  const saleRecord: Sale = {
    id,
    productId,
    productName,
    quantity: qty,
    total,
    paymentType,
    date: new Date().toISOString(),
    userId: user.uid,
    userName: user.name
  };

  if (isRealFirebase) {
    try {
      // 1. Log sale record
      await setDoc(doc(db!, "sales", id), saleRecord);
      
      // 2. Adjust product inventory quantity and add simple transaction audit log
      const prodRef = doc(db!, "products", productId);
      const prodSnap = await getDoc(prodRef);
      if (prodSnap.exists()) {
        const currentQty = prodSnap.data().quantity || 0;
        const newQty = Math.max(0, currentQty - qty);
        await updateDoc(prodRef, { quantity: newQty });

        // Add corresponding stock_out transaction for the audit log
        const txId = 'tx_sale_' + Math.random().toString(36).substr(2, 9);
        const txLog: StockTransaction = {
          id: txId,
          productId,
          productName,
          type: "stock_out",
          quantity: qty,
          reason: `Sale #${id}`,
          date: new Date().toISOString(),
          userId: user.uid,
          userName: user.name
        };
        await setDoc(doc(db!, "transactions", txId), txLog);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `sales/${id}`);
      throw e;
    }
  } else {
    // Mock record sales
    const sales = mockDb.getItems<Sale>('sales');
    sales.push(saleRecord);
    mockDb.setItems('sales', sales);

    // Mock adjust product
    const products = mockDb.getItems<Product>('products');
    const index = products.findIndex(p => p.id === productId);
    if (index !== -1) {
      const currentQty = products[index].quantity;
      const newQty = Math.max(0, currentQty - qty);
      products[index].quantity = newQty;
      mockDb.setItems('products', products);
    }

    // Add transaction audit log
    const transactions = mockDb.getItems<StockTransaction>('transactions');
    const txLog: StockTransaction = {
      id: 'tx_sale_' + Math.random().toString(36).substr(2, 9),
      productId,
      productName,
      type: "stock_out",
      quantity: qty,
      reason: `Sale #${id}`,
      date: new Date().toISOString(),
      userId: user.uid,
      userName: user.name
    };
    transactions.push(txLog);
    mockDb.setItems('transactions', transactions);
  }
}

// ----------------------------------------------------
// UNIFIED USERS INTERFACE
// ----------------------------------------------------
export function subscribeUsers(callback: (users: UserProfile[]) => void) {
  if (isRealFirebase) {
    return onSnapshot(collection(db!, "users"), (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((doc) => {
        users.push({ uid: doc.id, ...doc.data() } as UserProfile);
      });
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });
  } else {
    return mockDb.onChange('users', callback);
  }
}

export async function updateUserRole(uid: string, role: UserRole) {
  if (isRealFirebase) {
    try {
      await updateDoc(doc(db!, "users", uid), { role });
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`);
      throw e;
    }
  } else {
    const users = mockDb.getItems<UserProfile>('users');
    const index = users.findIndex(u => u.uid === uid);
    if (index !== -1) {
      users[index].role = role;
      mockDb.setItems('users', users);
    }
  }
}

export async function addUserProfile(uid: string, name: string, email: string, role: UserRole) {
  if (isRealFirebase) {
    try {
      await setDoc(doc(db!, "users", uid), { name, email, role });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${uid}`);
      throw e;
    }
  } else {
    const users = mockDb.getItems<UserProfile>('users');
    if (!users.some(u => u.uid === uid)) {
      users.push({ uid, name, email, role });
      mockDb.setItems('users', users);
    }
  }
}

export async function deleteUser(uid: string) {
  if (isRealFirebase) {
    try {
      await deleteDoc(doc(db!, "users", uid));
    } catch (e) {
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}`);
      throw e;
    }
  } else {
    const users = mockDb.getItems<UserProfile>('users');
    const filtered = users.filter(u => u.uid !== uid);
    mockDb.setItems('users', filtered);
  }
}

// ----------------------------------------------------
// UNIFIED SETTINGS INTERFACE
// ----------------------------------------------------
export function subscribeSettings(callback: (settings: SystemSettings) => void) {
  if (isRealFirebase) {
    return onSnapshot(doc(db!, "settings", "global"), (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data() as SystemSettings);
      } else {
        // Defaults if database is clean
        const defaultSettings: SystemSettings = {
          businessName: 'Apex Grocers',
          currency: '$',
          taxEnabled: true,
          taxRate: 7.5,
          notificationLowStock: true
        };
        setDoc(doc(db!, "settings", "global"), defaultSettings).catch(console.error);
        callback(defaultSettings);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "settings/global");
    });
  } else {
    return mockDb.onChange('settings', callback);
  }
}

export async function updateSettings(settings: SystemSettings) {
  if (isRealFirebase) {
    try {
      await setDoc(doc(db!, "settings", "global"), settings);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, "settings/global");
      throw e;
    }
  } else {
    localStorage.setItem('inventory_settings', JSON.stringify(settings));
    // Trigger in-app listeners
    mockDb.setItems('settings', [settings]); // trigger simulation pipeline
  }
}
