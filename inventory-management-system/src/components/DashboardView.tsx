/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Package, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Sparkles,
  RefreshCcw,
  Loader2,
  CheckCircle2,
  FileSpreadsheet,
  ShoppingCart
} from 'lucide-react';
import { Product, StockTransaction, Sale, UserProfile, SystemSettings } from '../types';
import { addStockTransaction } from '../firebase';

interface DashboardViewProps {
  products: Product[];
  transactions: StockTransaction[];
  sales: Sale[];
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  settings: SystemSettings;
}

export default function DashboardView({ 
  products, 
  transactions, 
  sales, 
  setActiveTab, 
  currentUser,
  onSetToast,
  settings
}: DashboardViewProps) {
  // AI Advisor Modal State
  const [selectedAIProduct, setSelectedAIProduct] = React.useState<Product | null>(null);
  const [aiLoading, setAILoading] = React.useState(false);
  const [aiResponse, setAiResponse] = React.useState<{ suggestedQuantity: number; recommendation: string; isMock?: boolean } | null>(null);
  const [orderQty, setOrderQty] = React.useState<string>("10");

  // Filter Transactions and Sales related to Today (2026-05-27 as the current date)
  const TODAY_STR = "2026-05-27";

  const totalProducts = products.length;
  
  // Calculate valuation (cost price val)
  const totalStockValue = products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);

  const lowStockItems = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock);
  const outOfStockItems = products.filter(p => p.quantity === 0);

  // Sales Today
  const salesToday = sales.filter(s => s.date.startsWith(TODAY_STR));
  const revenueToday = salesToday.reduce((acc, s) => acc + s.total, 0);

  // Format currencies helper
  const fmt = (val: number) => {
    const cur = settings.currency || "$";
    return `${cur}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleAskAIAdvisor = async (product: Product) => {
    setSelectedAIProduct(product);
    setAILoading(true);
    setAiResponse(null);

    // Filter relevant logs for Gemini context
    const relativeSales = sales.filter(s => s.productId === product.id).slice(0, 10);
    const relativeTxs = transactions.filter(t => t.productId === product.id).slice(0, 10);

    try {
      const res = await fetch('/api/gemini/suggest-restock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          product,
          sales: relativeSales,
          transactions: relativeTxs
        })
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const data = await res.json();
      setAiResponse(data);
      setOrderQty(String(data.suggestedQuantity));
    } catch (err) {
      console.error(err);
      onSetToast(`Failed AI forecasting retrieval: ${err}`, 'error');
    } finally {
      setAILoading(false);
    }
  };

  const handleExecuteAILegacyOrder = async () => {
    if (!selectedAIProduct || !currentUser) return;
    const qtyNum = parseInt(orderQty);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      onSetToast("Please supply a valid restock quantity numerical number", "warn");
      return;
    }

    try {
      await addStockTransaction(
        selectedAIProduct.id,
        selectedAIProduct.name,
        "stock_in",
        qtyNum,
        `AI Recommended Restock order completed`,
        currentUser
      );
      onSetToast(`Successfully stocked in ${qtyNum} units of ${selectedAIProduct.name}`, 'success');
      setSelectedAIProduct(null);
    } catch (e) {
      onSetToast(`Could not complete ledger injection: ${e}`, 'error');
    }
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Dynamic Greetings with visual banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white relative overflow-hidden select-none">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-80 h-85 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl font-black tracking-tight font-sans">
              Welcome Back, {currentUser?.name || "Operator"}!
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Here is your core active inventory overview for today. Real-time logging shows active updates. Live database structures are protected under ACL gates.
            </p>
          </div>
          
          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => setActiveTab('sales')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center space-x-1.5 transition-all cursor-pointer shadow-lg shadow-blue-950/40"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Checkout Register</span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-100 flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>New Commodity</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid boxes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Box: Products */}
        <div onClick={() => setActiveTab('products')} className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm cursor-pointer hover:border-blue-200 transition duration-150">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider">Catalog size</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">{totalProducts}</h3>
            <p className="text-[10px] text-slate-450 text-slate-400">Total unique items</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
            <Package className="h-6 w-6" />
          </div>
        </div>

        {/* Box: Valuation */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider">Inventory Value</p>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">{fmt(totalStockValue)}</h3>
            <p className="text-[10px] text-slate-400">At current cost rates</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 text-slate-600">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        {/* Box: Critical Warnings */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider">Low Stock</p>
            <h3 className={`text-2xl font-extrabold leading-tight ${lowStockItems.length > 0 ? "text-amber-600" : "text-emerald-600"}`}>
              {lowStockItems.length} Items
            </h3>
            <p className="text-[10px] text-slate-400">At or below safety margins</p>
          </div>
          <div className={`p-3 rounded-lg ${lowStockItems.length > 0 ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Box: Out of Stock Warnings */}
        <div className="bg-white p-5 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <p className="text-xs uppercase font-bold text-slate-400 font-mono tracking-wider">Out of Stock</p>
            <h3 className={`text-2xl font-extrabold leading-tight ${outOfStockItems.length > 0 ? "text-red-650 text-red-650" : "text-emerald-500 text-emerald-600"}`}>
              {outOfStockItems.length} Products
            </h3>
            <p className="text-[10px] text-slate-450 text-slate-400">Critically depleted</p>
          </div>
          <div className={`p-3 rounded-lg ${outOfStockItems.length > 0 ? "bg-red-50 text-red-550 text-red-500" : "bg-emerald-50 text-emerald-600"}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Sales highlights & shortcuts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Core Stock indicators column (Warnings) */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs lg:col-span-1 p-5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 relative shrink-0">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Depleted Stock Alerts</h4>
              <p className="text-[10px] text-slate-400">Stock count is below minimum safety margins</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-3.5 pr-1">
            {[...outOfStockItems, ...lowStockItems].length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-xs font-bold text-slate-700">All Stock Clear</p>
                <p className="text-[10px] text-slate-400 mt-1">Every item quantity is above safety thresholds.</p>
              </div>
            ) : (
              [...outOfStockItems, ...lowStockItems].map((prod) => {
                const isOutOfStock = prod.quantity === 0;
                return (
                  <div key={prod.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-50 hover:bg-slate-50 transition duration-150">
                    <div className="overflow-hidden mr-2">
                      <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                      <div className="flex items-center space-x-1 mt-1 font-mono text-[9px] text-slate-400">
                        <span>SKU: {prod.sku}</span>
                        <span>•</span>
                        <span className={isOutOfStock ? "text-red-500 font-bold" : "text-amber-600 font-semibold"}>
                          Stock: {prod.quantity} (Min: {prod.minStock})
                        </span>
                      </div>
                    </div>

                    {/* Ask AI Advisories Button */}
                    <button
                      onClick={() => handleAskAIAdvisor(prod)}
                      className="px-2 py-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 text-[10px] font-bold flex items-center space-x-1 cursor-pointer shrink-0 transition"
                      title="Run restock diagnostics with AI"
                    >
                      <Sparkles className="h-3 w-3 shrink-0" />
                      <span>Ask AI</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Sales & Quick Transactions Column */}
        <div className="bg-white border border-slate-100 rounded-xl shadow-xs lg:col-span-2 p-5 flex flex-col min-h-[300px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-50 shrink-0">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Recent Actions Registry</h4>
              <p className="text-[10px] text-slate-400">Logs monitoring additions, removals, and checkouts</p>
            </div>
            
            <button 
              onClick={() => setActiveTab('reports')}
              className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
            >
              Logbook Reports &rarr;
            </button>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            {transactions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <FileSpreadsheet className="h-8 w-8 text-slate-350 mb-2" />
                <p className="text-xs font-semibold text-slate-500">No active stock transactions logged yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-50 text-slate-400 font-bold">
                      <th className="py-2">Article</th>
                      <th className="py-2">Action</th>
                      <th className="py-2 text-right">Volume</th>
                      <th className="py-2 text-right">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.slice(0, 5).map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition">
                        <td className="py-2 font-bold text-slate-800 pr-2 max-w-[150px] truncate">{tx.productName}</td>
                        <td className="py-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                            tx.type === "stock_in" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-750 text-red-500 border border-red-100"
                          }`}>
                            {tx.type === "stock_in" ? "In" : "Out"}
                          </span>
                          <span className="text-[9px] text-slate-400 ml-1.5 truncate max-w-[100px] inline-block align-middle">{tx.reason}</span>
                        </td>
                        <td className="py-2 text-right font-semibold font-mono pr-2">{tx.quantity} pcs</td>
                        <td className="py-2 text-right text-slate-400 text-[10px]">
                          {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

      {/* AI SUGGESTION DIALOG MODAL */}
      {selectedAIProduct && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative border border-slate-100 animate-in zoom-in-95 duration-150 p-6 flex flex-col max-h-[90vh]">
            {/* Modal Heading */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1 px-1.5 rounded-lg bg-blue-50 text-blue-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">Replenishment Forecaster</h3>
                  <p className="text-[10px] text-slate-400">Gemini Supply Chain AI Advisor</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAIProduct(null)} 
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 bg-slate-50 hover:bg-slate-100 rounded-full"
              >
                &times;
              </button>
            </div>

            {/* Modal Contents */}
            <div className="flex-1 overflow-y-auto my-4 space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl">
                <p className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider">Commodity Diagnostics</p>
                <p className="text-sm font-extrabold text-slate-800 mt-1">{selectedAIProduct.name}</p>
                <div className="grid grid-cols-3 gap-2.5 mt-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[9px]">Stock On Hand</span>
                    <span className="font-bold font-mono text-slate-800">{selectedAIProduct.quantity} units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Minimum Alert Level</span>
                    <span className="font-bold font-mono text-slate-800">{selectedAIProduct.minStock} units</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">Selling Rate</span>
                    <span className="font-bold text-slate-800">{fmt(selectedAIProduct.sellingPrice)}</span>
                  </div>
                </div>
              </div>

              {/* AI diagnostic results log */}
              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                  <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  <div>
                    <p className="text-xs font-bold text-slate-800">Reviewing previous logs & transactions...</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Gemini is running forecasting calculations based on velocity of sales...</p>
                  </div>
                </div>
              ) : aiResponse ? (
                <div className="space-y-4 font-sans text-xs">
                  {/* Explanation card */}
                  <div className="p-4 bg-blue-50/45 border border-blue-100 rounded-xl text-slate-700 leading-relaxed text-xs">
                    {/* Render helper logic for markdown block */}
                    <div className="prose prose-sm font-sans">
                      <p className="whitespace-pre-line leading-relaxed text-slate-705">
                        {aiResponse.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Accept / Execute order field selector */}
                  <div className="p-4 rounded-xl border border-dotted border-slate-200">
                    <p className="font-bold text-slate-800 mb-2">Order Allocation Ledger Entry</p>
                    <div className="flex items-center space-x-3">
                      <div className="w-1/2">
                        <label className="text-[9px] uppercase font-bold text-slate-400 block mb-1">Incoming restock volume</label>
                        <input
                          type="number"
                          value={orderQty}
                          onChange={(e) => setOrderQty(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div className="w-1/2 flex items-end">
                        <button
                          onClick={handleExecuteAILegacyOrder}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition flex items-center justify-center space-x-1.5 cursor-pointer shadow shadow-emerald-950/20"
                        >
                          <Plus className="h-4 w-4" />
                          <span>Commit to Ledger</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footing */}
            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                onClick={() => setSelectedAIProduct(null)}
                className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 font-bold rounded-lg text-xs mr-2 transition cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
