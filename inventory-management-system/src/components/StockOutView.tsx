/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, ArrowDownLeft, AlertCircle, HelpCircle } from 'lucide-react';
import { Product, UserProfile, SystemSettings } from '../types';
import { addStockTransaction } from '../firebase';

interface StockOutViewProps {
  products: Product[];
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  settings: SystemSettings;
}

export default function StockOutView({ products, currentUser, onSetToast, settings }: StockOutViewProps) {
  const [search, setSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [quantity, setQuantity] = React.useState<string>("");
  const [reasonCategory, setReasonCategory] = React.useState("Damage");
  const [customReason, setCustomReason] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const reasons = ["Damage", "Transfer", "Audit Adjustment", "Other"];

  // Search filter
  const filteredSearchMatches = products.filter(p => 
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.sku.toLowerCase().includes(search.toLowerCase())) &&
    search.trim() !== ""
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearch("");
    setQuantity("");
    setCustomReason("");
    setReasonCategory("Damage");
  };

  const handleStockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      onSetToast("Please select a product from the list to reduce stock", "warn");
      return;
    }
    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      onSetToast("Quantity must be a positive integer greater than zero", "warn");
      return;
    }

    // ADVANCED SAFETY ENFORCEMENT: Preventing negative stock values
    if (qtyVal > selectedProduct.quantity) {
      onSetToast(`Transaction Denied: Insufficient stock. You are attempting to remove ${qtyVal} pcs, but only ${selectedProduct.quantity} exist. Negative inventory is prohibited.`, 'error');
      return;
    }

    if (!currentUser) {
      onSetToast("Authentication error: Session is invalid", "error");
      return;
    }

    setIsLoading(true);
    try {
      const finalReason = customReason.trim() 
        ? `${reasonCategory}: ${customReason.trim()}` 
        : `${reasonCategory} write-off`;

      await addStockTransaction(
        selectedProduct.id,
        selectedProduct.name,
        "stock_out",
        qtyVal,
        finalReason,
        currentUser
      );
      onSetToast(`Successfully deducted ${qtyVal} units of ${selectedProduct.name}`, 'success');
      
      setSelectedProduct(null);
      setQuantity("");
      setCustomReason("");
    } catch (err) {
      onSetToast(`Could not record stock out: ${err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Compute forecast outcome
  const upcomingQty = selectedProduct ? selectedProduct.quantity - (parseInt(quantity) || 0) : 0;
  const isDangerouslyUnderstocked = selectedProduct && upcomingQty <= selectedProduct.minStock;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
      {/* Search column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Deduct Ledger Commodity Stock</h3>
            <p className="text-[10px] text-slate-400">Record inventory shrinkage, transfers, or damaged write-offs</p>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type product name or catalog SKU..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 transition"
              disabled={isLoading}
            />

            {/* Float items list matches */}
            {search.trim() !== "" && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto z-10 p-2 space-y-0.5 divide-y divide-slate-50">
                {filteredSearchMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">No matching catalog items found.</p>
                ) : (
                  filteredSearchMatches.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer bg-transparent border-0"
                    >
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{prod.name}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">SKU: {prod.sku} • Stock On Hand: {prod.quantity}</p>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold font-mono ${
                        prod.quantity === 0 ? "bg-red-50 text-red-650 text-red-500" : "bg-slate-100 text-slate-600"
                      }`}>
                        Stock: {prod.quantity}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Context box display */}
          {selectedProduct ? (
            <div className="p-4 bg-orange-50/50 border border-orange-150 border-orange-200/50 rounded-xl relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-start justify-between relative z-10 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-orange-650 text-orange-600 tracking-wide">Reduction Target Selection</span>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{selectedProduct.name}</h4>
                  <p className="font-mono text-[9px] text-slate-500">Global SKU Code: {selectedProduct.sku}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="text-slate-400 hover:text-slate-600 text-sm bg-white h-6 w-6 rounded-full flex items-center justify-center border border-slate-200/40 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Stats box */}
              <div className="grid grid-cols-3 gap-3.5 mt-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px]">Stock On Hand</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedProduct.quantity} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Safety Threshold</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedProduct.minStock} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Commodity Value</span>
                  <span className="font-extrabold text-slate-800">
                    {(settings.currency || "$")}{selectedProduct.sellingPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Dynamic warning if calculation takes stock under threshold */}
              {parseInt(quantity) > 0 && selectedProduct && (
                <div className="mt-4 p-3 bg-white/70 rounded-lg border border-orange-200 flex items-start space-x-2 animate-in slide-in-from-top-2 duration-150">
                  <AlertCircle className={`h-4.5 w-4.5 shrink-0 mt-0.5 ${upcomingQty < 0 ? 'text-red-500 text-red-500' : 'text-amber-650'}`} />
                  <div>
                    {upcomingQty < 0 ? (
                      <p className="text-[10px] font-bold text-red-550 text-red-500 leading-none">
                        CRITICAL FAULT: Deducting this amount causes NEGATIVE STOCK ({upcomingQty} items). System blocks this adjustment.
                      </p>
                    ) : isDangerouslyUnderstocked ? (
                      <p className="text-[10px] font-bold text-amber-700 leading-none">
                        STOCK WARNING: Removal leaves only **{upcomingQty} units** in stock, slipping below the safety buffer of {selectedProduct.minStock}.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 leading-none">
                        Ledger adjustment safe: **{upcomingQty} units** left after removal.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 select-none">
              <HelpCircle className="h-9 w-9 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Pick a catalog item above to record a stock deduction.</p>
            </div>
          )}
        </div>
      </div>

      {/* Ledger fields Column */}
      <div className="lg:col-span-1">
        <form 
          onSubmit={handleStockOutSubmit}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col"
        >
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Removal details</h4>
            <p className="text-[10px] text-slate-400">Specify reasoning for stock write-offs</p>
          </div>

          {/* Volume Quantity field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Deduct Quantity *</label>
            <input
              type="number"
              min="1"
              required
              disabled={!selectedProduct || isLoading}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 5"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Category of reason */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Deduction Reason category *</label>
            <select
              disabled={!selectedProduct || isLoading}
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 disabled:opacity-50 appearance-none bg-no-repeat cursor-pointer"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Custom specifications notes */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Write-off specifications / notes</label>
            <textarea
              disabled={!selectedProduct || isLoading}
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="e.g., Bread mold found in box #2"
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedProduct || upcomingQty < 0 || isLoading}
            className="w-full py-2.5 bg-red-600 hover:bg-red-550 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-slate-250 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <ArrowDownLeft className="h-4.5 w-4.5" />
            <span>Commit Write-Off Log</span>
          </button>
        </form>
      </div>
    </div>
  );
}
