/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { UserProfile } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: UserProfile | null;
  lowStockCount: number;
  onSignOut: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, currentUser, lowStockCount, onSignOut }: SidebarProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Check role-based navigation access matching firestore rules
  const canAccessProducts = currentUser?.role === "Admin" || currentUser?.role === "Manager";
  const canAccessTransactions = currentUser?.role === "Admin" || currentUser?.role === "Manager";
  const canAccessReports = currentUser?.role === "Admin" || currentUser?.role === "Manager";
  const canAccessUsers = currentUser?.role === "Admin";
  const canAccessSettings = currentUser?.role === "Admin" || currentUser?.role === "Manager";

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, permitted: true },
    { id: 'products', label: 'Products', icon: Package, permitted: true },
    { id: 'stock-in', label: 'Stock In', icon: ArrowUpRight, permitted: canAccessTransactions },
    { id: 'stock-out', label: 'Stock Out', icon: ArrowDownLeft, permitted: canAccessTransactions },
    { id: 'sales', label: 'Sales Counter', icon: ShoppingCart, permitted: true },
    { id: 'reports', label: 'Reports', icon: BarChart3, permitted: canAccessReports },
    { id: 'users', label: 'Users & Roles', icon: Users, permitted: canAccessUsers },
    { id: 'settings', label: 'Settings', icon: Settings, permitted: canAccessSettings },
  ];

  const permittedItems = allMenuItems.filter(item => item.permitted);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white z-40 relative">
        <div className="flex items-center space-x-2">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold tracking-tight text-white text-base">STOCKROOM AI</span>
        </div>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 rounded bg-slate-800 text-slate-300 focus:outline-none"
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar main body */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-slate-900 border-r border-slate-800 w-64 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out z-30 flex flex-col pt-4 md:pt-0`}
      >
        {/* Header Branding */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 shrink-0 select-none">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-950/20">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-white tracking-wider text-sm block">STOCKROOM EYE</span>
              <span className="text-[10px] text-slate-400 font-mono tracking-widest block uppercase">Inventory Engine</span>
            </div>
          </div>
        </div>

        {/* Profile Card Summary */}
        <div className="p-4 border-b border-slate-800 mx-3 mt-3 rounded-xl bg-slate-800/40">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-full bg-blue-550/10 flex items-center justify-center border border-blue-500 text-blue-400 font-bold text-sm">
              {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-white text-xs font-semibold truncate leading-tight">{currentUser?.name || "System User"}</p>
              <div className="flex items-center space-x-2 mt-0.5">
                <span className={`px-1.5 py-0.25 rounded text-[9px] font-bold uppercase tracking-wide inline-block ${
                  currentUser?.role === "Admin" ? "bg-red-500/15 text-red-400 border border-red-500/10" :
                  currentUser?.role === "Manager" ? "bg-amber-500/15 text-amber-400 border border-amber-500/10" :
                  "bg-green-500/15 text-green-400 border border-green-500/10"
                }`}>
                  {currentUser?.role || "Staff"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation body */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {permittedItems.map((item) => {
            const Icon = item.icon;
            const isSel = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                  isSel 
                    ? 'bg-blue-600 text-white font-semibold' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`h-4.5 w-4.5 ${isSel ? 'text-white' : 'text-slate-400 group-hover:text-slate-100'}`} />
                  <span>{item.label}</span>
                </div>

                {/* Badges */}
                {item.id === 'dashboard' && lowStockCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-550/20 border border-red-500/30 text-[9px] font-bold text-red-450 animate-pulse bg-red-500 text-white">
                    {lowStockCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-800 shrink-0 bg-slate-950/40">
          <button
            onClick={() => {
              onSignOut();
              setIsOpen(false);
            }}
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium text-slate-450 hover:bg-slate-800/65 hover:text-slate-250 text-slate-400 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Backdrop for mobile drawers */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs z-20 md:hidden"
        />
      )}
    </>
  );
}
