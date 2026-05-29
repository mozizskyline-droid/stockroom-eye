/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings, 
  Save, 
  HelpCircle,
  TrendingDown,
  Percent,
  Coins,
  BadgeDollarSign
} from 'lucide-react';
import { SystemSettings, UserProfile } from '../types';

interface SettingsViewProps {
  settings: SystemSettings;
  onUpdateSettings: (newSettings: SystemSettings) => void;
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
}

export default function SettingsView({ settings, onUpdateSettings, currentUser, onSetToast }: SettingsViewProps) {
  const isWritable = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const [bName, setBName] = React.useState(settings.businessName);
  const [curr, setCurr] = React.useState(settings.currency);
  const [taxEn, setTaxEn] = React.useState(settings.taxEnabled);
  const [tRate, setTRate] = React.useState(settings.taxRate);
  const [isSaving, setIsSaving] = React.useState(false);

  const currencies = [
    { label: "US Dollar ($)", symbol: "$" },
    { label: "Euro (€)", symbol: "€" },
    { label: "British Pound (£)", symbol: "£" },
    { label: "Nigerian Naira (₦)", symbol: "₦" },
    { label: "Indian Rupee (₹)", symbol: "₹" },
    { label: "Yen (¥)", symbol: "¥" }
  ];

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWritable) {
      onSetToast("Access Denied: Only Admins/Managers can modify core business rules.", "error");
      return;
    }

    if (!bName.trim()) {
      onSetToast("Business Name is a required fields parameter", "warn");
      return;
    }

    setIsSaving(true);
    try {
      onUpdateSettings({
        businessName: bName.trim(),
        currency: curr,
        taxEnabled: taxEn,
        taxRate: Number(tRate) || 0.0
      });
      onSetToast("System configurations saved successfully!", "success");
    } catch (err) {
      onSetToast(`Trouble committing system configurations: ${err}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto pr-1">
      {/* Settings Form Layout Column */}
      <div className="lg:col-span-2">
        <form 
          onSubmit={handleSaveSettings}
          className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-5 flex flex-col"
        >
          <div className="pb-3 border-b border-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-800 text-sm tracking-tight">System Localization Settings</h3>
              <p className="text-[10px] text-slate-400">Configure core metadata, currencies, and tax parameters</p>
            </div>
            
            {isWritable ? (
              <button
                type="submit"
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-55"
              >
                <Save className="h-4 w-4 shrink-0" />
                <span>{isSaving ? "Saving..." : "Save Settings"}</span>
              </button>
            ) : (
              <span className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-400 uppercase font-mono">View Only Mode</span>
            )}
          </div>

          {/* Business branding name input field */}
          <div className="space-y-1 text-xs">
            <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
              <BadgeDollarSign className="h-3.5 w-3.5 text-slate-450 shrink-0" />
              <span>Business Trading Name *</span>
            </label>
            <input
              type="text"
              required
              disabled={!isWritable || isSaving}
              value={bName}
              onChange={(e) => setBName(e.target.value)}
              placeholder="e.g. Apex Grocers"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold disabled:bg-slate-100 disabled:text-slate-405 disabled:cursor-not-allowed"
            />
          </div>

          {/* Grid fields layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Currency settings picker */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Coins className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                <span>Default Currency Prefix</span>
              </label>
              <select
                disabled={!isWritable || isSaving}
                value={curr}
                onChange={(e) => setCurr(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-semibold focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
              >
                {currencies.map((c) => (
                  <option key={c.symbol} value={c.symbol}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Tax parameters */}
            <div className="space-y-1 text-xs">
              <label className="text-[10px] uppercase font-bold text-slate-400 flex items-center space-x-1">
                <Percent className="h-3.5 w-3.5 text-slate-450 shrink-0" />
                <span>Sales Tax Rate Percentage (%)</span>
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  disabled={!isWritable || isSaving || !taxEn}
                  value={tRate}
                  onChange={(e) => setTRate(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="e.g. 7.50"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold focus:outline-none focus:border-blue-500 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Tax active switch toggle option  */}
          <div className="p-4 rounded-xl border border-dotted border-slate-250 border-slate-200 hover:bg-slate-50/50 transition">
            <label className="flex items-start space-x-3 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                disabled={!isWritable || isSaving}
                checked={taxEn}
                onChange={(e) => setTaxEn(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4 shrink-0"
              />
              <div>
                <p className="font-bold text-slate-800 leading-tight">Apply Checkout Sales tax rate calculation</p>
                <p className="text-[10px] text-slate-400 mt-1">If enabled, subtotals computed at checkout counters will incorporate the customized tax percentage into billing grand totals.</p>
              </div>
            </label>
          </div>
        </form>
      </div>

      {/* Overview assistance side help box Column */}
      <div className="lg:col-span-1">
        <div className="bg-slate-900 text-slate-200 p-5 rounded-xl border border-slate-850 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 text-white pb-3 border-b border-slate-800 shrink-0">
            <Settings className="h-4.5 w-4.5 text-blue-500 animate-spin-slow" />
            <h4 className="font-extrabold text-sm tracking-tight">Access Control Rules</h4>
          </div>

          <div className="space-y-3.5 text-xs">
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Stockroom Eye implements high-integrity role-based security structures. Changes to databases are governed strictly inside Cloud Firestore Security rules:
            </p>

            <ul className="space-y-2.5 text-[11px]">
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 bg-red-500 rounded-full shrink-0 mt-1.5"></span>
                <span className="text-slate-300">**Admin Privileges:** Complete, unhindered catalog edits, ledger write-offs, team registrations, and metadata localized variables saving.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 bg-amber-500 rounded-full shrink-0 mt-1.5"></span>
                <span className="text-slate-300 font-sans">**Manager Privileges:** Product registration updates, shipment replenishment write-ins, write-off logs, and variables tracking. Invitations or direct user modifications are blocked.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="h-1.5 w-1.5 bg-green-500 rounded-full shrink-0 mt-1.5"></span>
                <span className="text-slate-300 font-sans">**Staff Privileges:** Restricted catalog visibility, checkout sales cashier operations, dashboard parameters reading. Direct commodity creation or write-offs are locked.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
