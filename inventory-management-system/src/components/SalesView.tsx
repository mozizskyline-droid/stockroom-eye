/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import React from 'react';
import { 
  ShoppingCart, 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  DollarSign, 
  Check, 
  Receipt,
  History,
  Tag
} from 'lucide-react';
import { Product, Sale, UserProfile, SystemSettings } from '../types';
import { addSale } from '../firebase';

interface SalesViewProps {
  products: Product[];
  sales: Sale[];
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  settings: SystemSettings;
}

interface CartItem {
  product: Product;
  quantity: number;
}

export default function SalesView({ products, sales, currentUser, onSetToast, settings }: SalesViewProps) {
  // Search parameters for sales drawer
  const [catalogueSearch, setCatalogueSearch] = React.useState("");
  const [paymentType, setPaymentType] = React.useState<"Cash" | "Transfer">("Cash");
  const [basket, setBasket] = React.useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Filter catalogue items for selection
  const filteredCatalogItems = products.filter(p => 
    p.name.toLowerCase().includes(catalogueSearch.toLowerCase()) || 
    p.sku.toLowerCase().includes(catalogueSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogueSearch.toLowerCase())
  );

  const handleAddItemToBasket = (prod: Product) => {
    if (prod.quantity === 0) {
      onSetToast("Item is out of stock!", "warn");
      return;
    }

    const existingIndex = basket.findIndex(item => item.product.id === prod.id);
    if (existingIndex !== -1) {
      const currentQtyInCart = basket[existingIndex].quantity;
      if (currentQtyInCart >= prod.quantity) {
        onSetToast(`Cannot add more. Catalog limits reached (${prod.quantity} available)`, "warn");
        return;
      }
      const updatedBasket = [...basket];
      updatedBasket[existingIndex].quantity += 1;
      setBasket(updatedBasket);
    } else {
      setBasket([...basket, { product: prod, quantity: 1 }]);
    }
  };

  const handleAdjustCartQty = (productId: string, adjustment: number) => {
    const updated = basket.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + adjustment;
        // Verify upper limit stock
        if (newQty > item.product.quantity) {
          onSetToast(`Cannot exceed current stock level of ${item.product.quantity} items`, "warn");
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0);
    setBasket(updated);
  };

  const handleRemoveFromBasket = (productId: string) => {
    setBasket(basket.filter(item => item.product.id !== productId));
  };

  // Pricing calculations
  const subtotal = basket.reduce((acc, item) => acc + (item.product.sellingPrice * item.quantity), 0);
  const taxRateDecimal = settings.taxEnabled ? (settings.taxRate / 100) : 0;
  const taxValue = subtotal * taxRateDecimal;
  const grandTotal = subtotal + taxValue;

  const handleCheckoutSubmit = async () => {
    if (basket.length === 0) {
      onSetToast("Your checkout cart is empty", "warn");
      return;
    }
    if (!currentUser) {
      onSetToast("Authentication error, check role access", "error");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;

    try {
      // Loop checkout and record individual sale
      for (const item of basket) {
        // Double-check stock level at compile bounds
        if (item.quantity > item.product.quantity) {
          throw new Error(`Stock level is depleted for ${item.product.name}. Cart adjusted in-house.`);
        }

        // Record sale (this reduces stock internally and appends audit logs!)
        await addSale(
          item.product.id,
          item.product.name,
          item.quantity,
          item.product.sellingPrice,
          paymentType,
          currentUser
        );
        successCount++;
      }

      onSetToast(`Successfully registered checkout representing ${successCount} commodities!`, 'success');
      setBasket([]);
    } catch (err) {
      console.error(err);
      onSetToast(`Unable to process checkout: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const fmt = (val: number) => {
    const symbols = settings.currency || "$";
    return `${symbols}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0 flex-1 overflow-y-auto pr-1">
      {/* Checkout section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start shrink-0">
        
        {/* left catalogue grid drawer */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-150 border-slate-100 p-5 shadow-sm flex flex-col h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-50 shrink-0">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Active Register Catalog</h4>
              <p className="text-[10px] text-slate-400">Click elements to add to standard checkout basket</p>
            </div>
            
            {/* Search items inside checkout catalogue */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-450 text-slate-400" />
              <input
                type="text"
                placeholder="Search catalog by category..."
                value={catalogueSearch}
                onChange={(e) => setCatalogueSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {filteredCatalogItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center select-none">
                <Tag className="h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No commodities in register catalog</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
                {filteredCatalogItems.map((prod) => {
                  const outOfStock = prod.quantity === 0;
                  return (
                    <button
                      key={prod.id}
                      onClick={() => handleAddItemToBasket(prod)}
                      disabled={outOfStock}
                      className={`p-3 rounded-lg border text-left flex justify-between items-center transition relative overflow-hidden select-none cursor-pointer border-slate-100 hover:border-blue-200 hover:bg-slate-50/40 ${
                        outOfStock ? 'opacity-50 cursor-not-allowed bg-slate-50' : ''
                      }`}
                    >
                      <div className="overflow-hidden mr-3">
                        <p className="text-xs font-bold text-slate-800 truncate leading-tight">{prod.name}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-1 leading-none uppercase">{prod.category} • SKU: {prod.sku}</p>
                        <p className="text-xs font-extrabold text-slate-705 text-blue-600 mt-1.5">{fmt(prod.sellingPrice)}</p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono tracking-tight ${
                          outOfStock 
                            ? 'bg-red-50 text-red-650 text-red-500' 
                            : prod.quantity <= prod.minStock 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-slate-105 bg-slate-100 text-slate-600'
                        }`}>
                          {outOfStock ? "DEPLETED" : `${prod.quantity} Left`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right cashier basket receipt */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col h-[400px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 shrink-0">
            <div className="flex items-center space-x-1.5">
              <ShoppingCart className="h-4.5 w-4.5 text-blue-600" />
              <h4 className="font-extrabold text-slate-800 text-sm">Basket Checkout</h4>
            </div>
            {basket.length > 0 && (
              <button 
                onClick={() => setBasket([])} 
                className="text-[10px] text-red-500 font-bold hover:underline"
              >
                Clear Cart
              </button>
            )}
          </div>

          {/* Cart list items */}
          <div className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1 text-xs">
            {basket.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center select-none py-12">
                <ShoppingCart className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-xs font-semibold text-slate-500">Cart is empty.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Click commodities in left drawer to checkout register.</p>
              </div>
            ) : (
              basket.map((item) => (
                <div key={item.product.id} className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <div className="overflow-hidden mr-2 flex-1">
                    <p className="font-bold text-slate-800 truncate leading-none">{item.product.name}</p>
                    <p className="text-[9px] text-slate-400 mt-1 font-semibold">{fmt(item.product.sellingPrice)} each</p>
                  </div>

                  <div className="flex items-center space-x-2.5 shrink-0">
                    <div className="flex items-center space-x-1.5 bg-slate-50 rounded p-1">
                      <button 
                        type="button"
                        onClick={() => handleAdjustCartQty(item.product.id, -1)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-bold font-mono text-xs w-5 text-center">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => handleAdjustCartQty(item.product.id, 1)}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-500"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromBasket(item.product.id)}
                      className="p-1 text-slate-350 hover:text-red-500 rounded hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations details and actions */}
          <div className="pt-4 border-t border-slate-100 space-y-3 shrink-0">
            {/* Pay methods toggles */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setPaymentType("Cash")}
                className={`py-1.5 rounded-lg font-bold border transition flex items-center justify-center space-x-1 cursor-pointer ${
                  paymentType === "Cash" 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <DollarSign className="h-3.5 w-3.5" />
                <span>Cash Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("Transfer")}
                className={`py-1.5 rounded-lg font-bold border transition flex items-center justify-center space-x-1 cursor-pointer ${
                  paymentType === "Transfer" 
                    ? 'border-blue-600 bg-blue-50 text-blue-700' 
                    : 'border-slate-200 hover:bg-slate-50 text-slate-650'
                }`}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>Bank Transfer</span>
              </button>
            </div>

            {/* Calculations lines */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between font-medium text-slate-500">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {settings.taxEnabled && (
                <div className="flex justify-between font-medium text-slate-500">
                  <span>Tax ({settings.taxRate}%)</span>
                  <span>{fmt(taxValue)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-slate-800 pt-1 border-t border-dotted border-slate-200 text-sm">
                <span>Cashier Total</span>
                <span className="text-blue-600">{fmt(grandTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckoutSubmit}
              disabled={basket.length === 0 || isProcessing}
              className="w-full py-2 bg-blue-600 hover:bg-blue-550 hover:bg-blue-500 text-white font-bold text-xs rounded-lg transition shadow cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              {isProcessing ? "Processing..." : `Register Completed checkout Line`}
            </button>
          </div>
        </div>
      </div>

      {/* Historical Ledger row lists */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm shrink-0 flex flex-col min-h-[250px]">
        <div className="flex items-center space-x-2 pb-3 border-b border-slate-50 shrink-0">
          <History className="h-4.5 w-4.5 text-slate-500" />
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Recorded Sales Journal</h4>
            <p className="text-[10px] text-slate-400">Ledger lines details in reverse chronological date order</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {sales.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-6">
              <Receipt className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs font-semibold text-slate-550 text-slate-500">No sales transactions committed yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-50 text-slate-400 font-bold">
                    <th className="py-2">Sale Reference</th>
                    <th className="py-2">Commodity sold</th>
                    <th className="py-2 text-right">Items</th>
                    <th className="py-2 text-right">Revenue total</th>
                    <th className="py-2 text-center">Payment type</th>
                    <th className="py-2 text-right">Time Log</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((item) => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                      <td className="py-2 font-mono font-bold text-slate-600">#{item.id}</td>
                      <td className="py-2 font-extrabold text-slate-800">{item.productName}</td>
                      <td className="py-2 text-right font-mono font-bold px-2">{item.quantity} pcs</td>
                      <td className="py-2 text-right font-mono font-extrabold text-blue-600 px-2">{fmt(item.total)}</td>
                      <td className="py-2 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                          item.paymentType === "Cash" 
                            ? "bg-green-50 text-green-700 border-green-150" 
                            : "bg-indigo-50 text-indigo-700 border-indigo-150"
                        }`}>
                          {item.paymentType}
                        </span>
                      </td>
                      <td className="py-2 text-right text-slate-405 text-slate-400 font-mono text-[10px]">
                        {new Date(item.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
