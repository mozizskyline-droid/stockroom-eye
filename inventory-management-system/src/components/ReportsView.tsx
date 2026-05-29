/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Package, 
  ShoppingBag,
  Award,
  CircleDollarSign
} from 'lucide-react';
import { Product, Sale, StockTransaction, SystemSettings } from '../types';

interface ReportsViewProps {
  products: Product[];
  sales: Sale[];
  transactions: StockTransaction[];
  settings: SystemSettings;
}

export default function ReportsView({ products, sales, transactions, settings }: ReportsViewProps) {
  // --- DATA PREPARATION FOR CHARTS ---

  // 1. Group daily billing sales (BAR CHART)
  const dailySalesMap: { [date: string]: number } = {};
  sales.forEach(sale => {
    const dStr = sale.date.split('T')[0];
    dailySalesMap[dStr] = (dailySalesMap[dStr] || 0) + sale.total;
  });

  // Sort dates ascending and keep last 7 days of records
  const dailySalesData = Object.keys(dailySalesMap)
    .sort()
    .slice(-7)
    .map(date => ({
      name: new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      "Sales Revenue": dailySalesMap[date]
    }));

  // 2. Categories Distribution (PIE CHART) - based on count
  const catMap: { [cat: string]: number } = {};
  products.forEach(p => {
    catMap[p.category] = (catMap[p.category] || 0) + 1;
  });

  const categoryPieData = Object.keys(catMap).map(cat => ({
    name: cat,
    value: catMap[cat]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

  // 3. Stock Movement Trends (LINE CHART) - group cumulative stock_in vs stock_out volumes
  const movementMap: { [date: string]: { "Stock In": number; "Stock Out": number } } = {};
  
  transactions.forEach(tx => {
    const dStr = tx.date.split('T')[0];
    if (!movementMap[dStr]) {
      movementMap[dStr] = { "Stock In": 0, "Stock Out": 0 };
    }
    if (tx.type === "stock_in") {
      movementMap[dStr]["Stock In"] += tx.quantity;
    } else {
      movementMap[dStr]["Stock Out"] += tx.quantity;
    }
  });

  const stockMovementData = Object.keys(movementMap)
    .sort()
    .slice(-7)
    .map(date => ({
      name: new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      "Stock In": movementMap[date]["Stock In"],
      "Stock Out": movementMap[date]["Stock Out"]
    }));

  // 4. Best Selling Products table calculation
  const bestSellerMap: { [productId: string]: { name: string; quantity: number; revenue: number } } = {};
  sales.forEach(sale => {
    if (!bestSellerMap[sale.productId]) {
      bestSellerMap[sale.productId] = { name: sale.productName, quantity: 0, revenue: 0 };
    }
    bestSellerMap[sale.productId].quantity += sale.quantity;
    bestSellerMap[sale.productId].revenue += sale.total;
  });

  const bestSellers = Object.keys(bestSellerMap)
    .map(id => ({ id, ...bestSellerMap[id] }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  // 5. General valuation stats metrics
  const totalStockValuationCost = products.reduce((acc, p) => acc + (p.quantity * p.costPrice), 0);
  const totalStockValuationSell = products.reduce((acc, p) => acc + (p.quantity * p.sellingPrice), 0);
  const projectedProfitValue = totalStockValuationSell - totalStockValuationCost;

  const totalSalesVolumeCount = sales.reduce((acc, s) => acc + s.quantity, 0);
  const totalRevenueAllTime = sales.reduce((acc, s) => acc + s.total, 0);

  const fmt = (val: number) => {
    const symbols = settings.currency || "$";
    return `${symbols}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0 overflow-y-auto pr-1">
      
      {/* High-level reporting counters card row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        
        {/* Cost valuation and Selling valuation */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Book Cost Valuation</span>
            <DollarSign className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 font-mono">{fmt(totalStockValuationCost)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Total buy rates of all stock on hand</p>
        </div>

        {/* Projected Sell evaluation */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Retail Sales Valuation</span>
            <CircleDollarSign className="h-4.5 w-4.5 text-slate-400" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 font-mono">{fmt(totalStockValuationSell)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Expected revenue if fully liquidated</p>
        </div>

        {/* Expected profits */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Projected margin profits</span>
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
          </div>
          <h3 className="text-xl font-extrabold text-emerald-600 font-mono">{fmt(projectedProfitValue)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">Total unrealized profits margin</p>
        </div>

        {/* Cumulative performance */}
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between pb-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase font-mono tracking-wider">Historic Revenue Log</span>
            <ShoppingBag className="h-4.5 w-4.5 text-blue-500" />
          </div>
          <h3 className="text-xl font-extrabold text-blue-600 font-mono">{fmt(totalRevenueAllTime)}</h3>
          <p className="text-[10px] text-slate-400 mt-1">All time checkouts: {totalSalesVolumeCount} units sold</p>
        </div>
      </div>

      {/* Visual analytics dashboards section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        
        {/* Sales trend bar chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs">
          <div className="pb-3 border-b border-slate-50 mb-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Sales Revenue Trend</h4>
            <p className="text-[10px] text-slate-400">Total transaction values settled over the last 7 active periods</p>
          </div>

          <div className="h-64 mt-1">
            {dailySalesData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No sales registered yet to plot graphs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} 
                    formatter={(val) => [fmt(val as number), "Revenue"]}
                  />
                  <Bar dataKey="Sales Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Stock logistics cycle line chart */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs">
          <div className="pb-3 border-b border-slate-50 mb-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Stock Movements Cycle</h4>
            <p className="text-[10px] text-slate-400">Total volume fluctuations of shipments (Stock In) vs usage count (Stock Out)</p>
          </div>

          <div className="h-64 mt-1">
            {stockMovementData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">No stock logistics movements tracked yet to plot graphs.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stockMovementData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" tickLine={false} />
                  <YAxis fontSize={10} stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="Stock In" stroke="#10b981" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Stock Out" stroke="#f43f5e" strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 shrink-0">
        {/* Categories Distribution PIE CHART */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs lg:col-span-1">
          <div className="pb-3 border-b border-slate-50 mb-4">
            <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Categories Share</h4>
            <p className="text-[10px] text-slate-400">Catalog concentration broken down by categories</p>
          </div>

          <div className="h-56 flex flex-col justify-between items-center text-xs">
            {categoryPieData.length === 0 ? (
              <p className="text-slate-400 text-center py-12">No inventory categorizations yet.</p>
            ) : (
              <>
                <div className="w-full flex-1 relative h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Commodities`, "Concentration"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Labels legend */}
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 pt-3 w-full border-t border-slate-55 border-slate-100 max-h-16 overflow-y-auto">
                  {categoryPieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center space-x-1">
                      <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                      <span className="text-[10px] text-slate-500 font-semibold">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Best sellers top performers metrics */}
        <div className="bg-white border border-slate-100 p-5 rounded-xl shadow-xs lg:col-span-2 flex flex-col min-h-[250px]">
          <div className="pb-3 border-b border-slate-50 mb-4 shrink-0">
            <div className="flex items-center space-x-1.5">
              <Award className="h-4.5 w-4.5 text-amber-500" />
              <h4 className="font-extrabold text-slate-800 text-sm tracking-tight">Bestselling Performance Indicators</h4>
            </div>
            <p className="text-[10px] text-slate-400">The 5 fastest-selling inventory items calculated of recent records</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {bestSellers.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs text-center">
                Committed sales orders are required to chart performance profiles.
              </div>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full text-left font-sans whitespace-nowrap">
                  <thead>
                    <tr className="border-b border-slate-50 text-slate-400 font-bold pb-1.5">
                      <th className="py-2.5">Position</th>
                      <th className="py-2.5">Commodity Title</th>
                      <th className="py-2.5 text-right">Items Sold</th>
                      <th className="py-2.5 text-right">Total Billing Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bestSellers.map((item, idx) => (
                      <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50/65 transition duration-100">
                        <td className="py-3 font-semibold text-slate-500">
                          <span className={`h-5 w-5 rounded-full inline-flex items-center justify-center text-[10px] font-bold ${
                            idx === 0 ? 'bg-amber-100 text-amber-800' : 
                            idx === 1 ? 'bg-slate-100 text-slate-700' : 
                            idx === 2 ? 'bg-orange-100 text-orange-850 text-orange-700 font-extrabold' : 'bg-slate-55'
                          }`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td className="py-3 font-bold text-slate-800">{item.name}</td>
                        <td className="py-3 text-right font-mono font-bold pr-2">{item.quantity} pcs</td>
                        <td className="py-3 text-right font-mono font-extrabold text-emerald-600">{fmt(item.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
