/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, ArrowUpRight, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { Product, UserProfile, SystemSettings } from '../types';
import { addStockTransaction } from '../firebase';

interface StockInViewProps {
  products: Product[];
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  settings: SystemSettings;
}

export default function StockInView({ products, currentUser, onSetToast, settings }: StockInViewProps) {
  const [search, setSearch] = React.useState("");
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [quantity, setQuantity] = React.useState<string>("");
  const [supplier, setSupplier] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  // Filter products matching search term
  const filteredSearchMatches = products.filter(p => 
    (p.name.toLowerCase().includes(search.toLowerCase()) || 
     p.sku.toLowerCase().includes(search.toLowerCase())) &&
    search.trim() !== ""
  );

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setSearch("");
    setSupplier(product.supplier || "");
    setQuantity("");
    setNotes("");
  };

  const handleStockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) {
      onSetToast("Please select a product from the registry list to restock", "warn");
      return;
    }
    const qtyVal = parseInt(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      onSetToast("Stock quantity must be a positive integer greater than zero", "warn");
      return;
    }
    if (!currentUser) {
      onSetToast("Critical authentication error: No logged in user detected.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const reasonMsg = notes.trim() ? `Delivery: ${notes.trim()}` : `Received shipment from ${supplier.trim() || 'Supplier'}`;
      await addStockTransaction(
        selectedProduct.id,
        selectedProduct.name,
        "stock_in",
        qtyVal,
        reasonMsg,
        currentUser
      );
      onSetToast(`Successfully stocked in ${qtyVal} units of ${selectedProduct.name}`, 'success');
      
      // Clear fields
      setSelectedProduct(null);
      setQuantity("");
      setSupplier("");
      setNotes("");
    } catch (err) {
      onSetToast(`Could not record stock in: ${err}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
      {/* Search and context layout Column */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">Select Commodity to Replenish</h3>
            <p className="text-[10px] text-slate-400">Search by name or SKU identifier to update details</p>
          </div>

          {/* Search registry bar */}
          <div className="relative">
            <Search className="absolute left-3 top-3.5 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type product name or SKU alphanumeric code..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-none font-semibold focus:outline-none focus:border-blue-500 transition"
              disabled={isLoading}
            />

            {/* Float selection list */}
            {search.trim() !== "" && (
              <div className="absolute left-0 right-0 mt-1.5 max-h-56 bg-white border border-slate-200 rounded-lg shadow-xl overflow-y-auto z-10 p-2 space-y-0.5 divide-y divide-slate-50">
                {filteredSearchMatches.length === 0 ? (
                  <p className="text-xs text-slate-400 p-3 text-center">No catalog matches. Try relaxing keywords.</p>
                ) : (
                  filteredSearchMatches.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSelectProduct(prod)}
                      className="w-full text-left px-3 py-2.5 rounded-md hover:bg-slate-50 transition flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <p className="font-bold text-slate-800 leading-tight">{prod.name}</p>
                        <p className="font-mono text-[9px] text-slate-400 mt-0.5">SKU: {prod.sku} • Supplier: {prod.supplier}</p>
                      </div>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono">Stock: {prod.quantity}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current selected Product card display */}
          {selectedProduct ? (
            <div className="p-4 bg-blue-50/45 border border-blue-100 rounded-xl relative overflow-hidden select-none animate-in fade-in zoom-in-95 duration-100">
              <div className="flex items-start justify-between relative z-10">
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-blue-600 tracking-wide">Ready for Stock In</span>
                  <h4 className="font-bold text-slate-800 text-sm leading-tight mt-0.5">{selectedProduct.name}</h4>
                  <p className="font-mono text-[10px] text-slate-500">Global SKU Code: {selectedProduct.sku}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)} 
                  className="text-slate-400 hover:text-slate-600 text-sm bg-white/55 h-6 w-6 rounded-full flex items-center justify-center border border-slate-200/40 cursor-pointer"
                >
                  &times;
                </button>
              </div>

              {/* Stats box */}
              <div className="grid grid-cols-3 gap-3.5 mt-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[9px]">Safety Threshold</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedProduct.minStock} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Stock On Hand</span>
                  <span className="font-extrabold text-slate-800 font-mono">{selectedProduct.quantity} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px]">Purchase Rating</span>
                  <span className="font-extrabold text-slate-800">
                    {(settings.currency || "$")}{selectedProduct.costPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-center text-slate-400 select-none">
              <HelpCircle className="h-9 w-9 text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-500">Pick a catalog item above to record a delivery.</p>
            </div>
          )}
        </div>
      </div>

      {/* Stocking ledger form Column */}
      <div className="lg:col-span-1">
        <form 
          onSubmit={handleStockInSubmit}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4 flex flex-col"
        >
          <div>
            <h4 className="font-extrabold text-slate-800 text-sm">Replenishment Audit Fields</h4>
            <p className="text-[10px] text-slate-400">All metrics are timestamped and verified</p>
          </div>

          {/* Volume Quantity field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Quantity Received *</label>
            <input
              type="number"
              min="1"
              required
              disabled={!selectedProduct || isLoading}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g. 50"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Supplier reference field */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Supplier Reference</label>
            <input
              type="text"
              disabled={!selectedProduct || isLoading}
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Supplier name"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          {/* Notes area */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400">Transaction Details / Notes</label>
            <textarea
              disabled={!selectedProduct || isLoading}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Weekly delivery container #4 checkout"
              rows={3}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedProduct || isLoading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="h-4.5 w-4.5 shrink-0" />
            <span>Commit Stock In Ingestion</span>
          </button>
        </form>
      </div>
    </div>
  );
}
