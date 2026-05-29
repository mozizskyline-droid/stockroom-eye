/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = "Admin" | "Manager" | "Staff";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  minStock: number;
  imageUrl?: string;
  updatedAt?: string;
}

export interface StockTransaction {
  id: string;
  productId: string;
  productName: string;
  type: "stock_in" | "stock_out";
  quantity: number;
  reason: string; // e.g. "Received shipment", "Damage", "Transfer", "Audit Adjustment"
  date: string;
  userId: string;
  userName: string;
}

export interface Sale {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  total: number;
  paymentType: "Cash" | "Transfer";
  date: string;
  userId: string;
  userName: string;
}

export interface SystemSettings {
  businessName: string;
  currency: string;
  taxEnabled: boolean;
  taxRate: number; // e.g., 7.5 for 7.5%
  notificationLowStock: boolean;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}
