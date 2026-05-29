/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  subscribeAuth, 
  loginWithGoogle, 
  loginWithMock, 
  signOutUser, 
  subscribeProducts, 
  subscribeTransactions, 
  subscribeSales, 
  subscribeUsers, 
  subscribeSettings, 
  updateSettings,
  isFirebaseConfigured
} from './firebase';
import { Product, StockTransaction, Sale, UserProfile, SystemSettings, UserRole } from './types';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import DashboardView from './components/DashboardView';
import ProductsView from './components/ProductsView';
import StockInView from './components/StockInView';
import StockOutView from './components/StockOutView';
import SalesView from './components/SalesView';
import ReportsView from './components/ReportsView';
import UsersView from './components/UsersView';
import SettingsView from './components/SettingsView';

import { 
  Package, 
  Loader2, 
  UserCheck, 
  CloudOff, 
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn
} from 'lucide-react';

export default function App() {
  // Navigation Routing States
  const [activeTab, setActiveTab] = React.useState("dashboard");

  // Authentication & Directory states
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);

  // Core Data Subscription States
  const [products, setProducts] = React.useState<Product[]>([]);
  const [transactions, setTransactions] = React.useState<StockTransaction[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [users, setUsers] = React.useState<UserProfile[]>([]);
  const [settings, setSettings] = React.useState<SystemSettings>({
    businessName: "Stockroom Eye",
    currency: "$",
    taxEnabled: true,
    taxRate: 7.50
  });

  // Global Toast Alert State
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'warn' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => prev?.message === message ? null : prev);
    }, 4500);
  };

  // ----------------------------------------------------
  // REACT ENGINE SUBSCRIPTION PIPELINES
  // ----------------------------------------------------
  React.useEffect(() => {
    // Listen to real/simulated authentication logs
    const unsubscribeAuth = subscribeAuth((userProfile) => {
      setCurrentUser(userProfile);
      setAuthLoading(false);
      
      if (userProfile) {
        triggerToast(`Welcome back, ${userProfile.name}! Connected securely under ${userProfile.role} clearance.`, 'success');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, []);

  React.useEffect(() => {
    if (!currentUser) return;

    // Build real-time database listener channels (supports real Firestore or simulated memory bounds!)
    const pSub = subscribeProducts((plist) => setProducts(plist));
    const tSub = subscribeTransactions((txlist) => setTransactions(txlist));
    const sSub = subscribeSales((slist) => setSales(slist));
    const uSub = subscribeUsers((ulist) => setUsers(ulist));
    const setSub = subscribeSettings((s) => setSettings(s));

    return () => {
      pSub();
      tSub();
      sSub();
      uSub();
      setSub();
    };
  }, [currentUser]);

  // ----------------------------------------------------
  // AUTHENTICATION CONTROLLER HANDLERS
  // ----------------------------------------------------
  const handleGoogleLoginSubmit = async () => {
    setLoginLoading(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleMockLoginClick = async (role: UserRole, emailStr: string, nameStr: string) => {
    setLoginLoading(true);
    try {
      if (isFirebaseConfigured) {
        triggerToast(`Cloud database is active. Pre-fabricated bypass login is blocked for integrity. Please sign in via Google.`, 'warn');
        setLoginLoading(false);
        return;
      }
      
      // sign in instantly on mock database
      await loginWithMock(role, nameStr, emailStr);
    } catch (err: any) {
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOutSubmit = async () => {
    try {
      await signOutUser();
      setProducts([]);
      setTransactions([]);
      setSales([]);
      setCurrentUser(null);
      setActiveTab("dashboard");
      triggerToast("Logged out successfully.", 'success');
    } catch (err) {
      triggerToast(`Sign-out failed: ${err}`, 'error');
    }
  };

  const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
    try {
      await updateSettings(newSettings);
      triggerToast("Business settings updated successfully!", "success");
    } catch (err) {
      triggerToast(`Could not save settings: ${err}`, 'error');
    }
  };

  // Calculate low stock metrics for warnings notifications
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Booting Stockroom Core...</p>
      </div>
    );
  }

  // LOGIN PAGE LAYOUT (SSO Focused)
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative font-sans">
        
        {/* Subtle background gradients */}
        <div className="absolute top-[10%] left-[20%] w-[35rem] h-[35rem] bg-indigo-100/50 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[35rem] h-[35rem] bg-sky-100/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-md w-full bg-white border border-slate-150 border-slate-200/50 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
          
          {/* Logo Branding */}
          <div className="text-center space-y-2 select-none">
            <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow shadow-blue-500/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">STOCKROOM EYE</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Supply Line Orchestrator</p>
            </div>
          </div>

          {/* Setup Cloud Badge Notice */}
          <div className={`px-3 py-2.5 rounded-lg border text-center flex items-center justify-center space-x-2 text-xs font-semibold ${
            isFirebaseConfigured 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
              : 'bg-indigo-50 text-indigo-700 border-indigo-200'
          }`}>
            {isFirebaseConfigured ? (
              <>
                <Cloud className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Live Secured Firebase Vault Active</span>
              </>
            ) : (
              <>
                <CloudOff className="h-4 w-4 text-indigo-600 shrink-0 animate-pulse" />
                <span>Simulated Workspace Environment Enabled</span>
              </>
            )}
          </div>

          <div className="space-y-4">
            <p className="text-xs text-slate-500 text-center leading-relaxed">
              Stockroom Eye offers secure administrative governance for products, transactions, and real-time sales reporting. Authorized SSO login is required.
            </p>

            <button
              onClick={handleGoogleLoginSubmit}
              disabled={loginLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center space-x-2 border-0"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Loading Session...</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>{isFirebaseConfigured ? "Connect via Authorized Google Login" : "Log In As Demo Admin"}</span>
                </>
              )}
            </button>
          </div>

          {/* BYPASS SIMULATION MODE PANEL */}
          {!isFirebaseConfigured && (
            <div className="pt-5 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-1">
                <UserCheck className="h-4 w-4 text-indigo-600" />
                <span className="text-[10px] uppercase font-bold text-indigo-750 font-mono tracking-wider">Inspect Security Clearance Roles</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">Click below to bypass auth and explore role-based permissions dashboard immediately:</p>
              
              <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-extrabold font-mono">
                <button
                  onClick={() => handleMockLoginClick("Admin", "admin@apex.com", "Abebe Admin")}
                  className="py-2.5 rounded border border-slate-200 hover:bg-red-50 text-red-700 hover:border-red-200 transition bg-white block cursor-pointer"
                >
                  Admin
                </button>
                <button
                  onClick={() => handleMockLoginClick("Manager", "manager@apex.com", "Mary Manager")}
                  className="py-2.5 rounded border border-slate-200 hover:bg-amber-50 text-amber-705 text-amber-700 hover:border-amber-200 transition bg-white block cursor-pointer"
                >
                  Manager
                </button>
                <button
                  onClick={() => handleMockLoginClick("Staff", "staff@apex.com", "Sam Staff")}
                  className="py-2.5 rounded border border-slate-200 hover:bg-green-50 text-green-700 hover:border-green-200 transition bg-white block cursor-pointer"
                >
                  Staff
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // PRIMARY DASHBOARD WORKSPACE FLOW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* Dynamic Toast System */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 p-4 rounded-xl shadow-2xl border bg-white animate-in slide-in-from-bottom-5 duration-205 border-slate-100 select-none">
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
          {toast.type === "warn" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}
          <div className="text-slate-850 text-slate-705 text-xs font-semibold leading-normal max-w-sm">
            {toast.message}
          </div>
        </div>
      )}

      {/* Main Sidebar Module */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentUser={currentUser}
        lowStockCount={lowStockCount}
        onSignOut={handleSignOutSubmit}
      />

      {/* Control space container */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 h-screen overflow-hidden">
        
        {/* Topbar Header */}
        <Topbar 
          currentUser={currentUser} 
          settings={settings}
          onSetToast={triggerToast}
        />

        {/* Dynamic Inner View Switch */}
        <main className="flex-1 p-6 overflow-hidden flex flex-col min-h-0 bg-slate-50/50">
          {activeTab === "dashboard" && (
            <DashboardView 
              products={products}
              transactions={transactions}
              sales={sales}
              setActiveTab={setActiveTab}
              currentUser={currentUser}
              onSetToast={triggerToast}
              settings={settings}
            />
          )}

          {activeTab === "products" && (
            <ProductsView 
              products={products}
              currentUser={currentUser}
              onSetToast={triggerToast}
              settings={settings}
            />
          )}

          {activeTab === "stock-in" && (
            <StockInView 
              products={products}
              currentUser={currentUser}
              onSetToast={triggerToast}
              settings={settings}
            />
          )}

          {activeTab === "stock-out" && (
            <StockOutView 
              products={products}
              currentUser={currentUser}
              onSetToast={triggerToast}
              settings={settings}
            />
          )}

          {activeTab === "sales" && (
            <SalesView 
              products={products}
              sales={sales}
              currentUser={currentUser}
              onSetToast={triggerToast}
              settings={settings}
            />
          )}

          {activeTab === "reports" && (
            <ReportsView 
              products={products}
              sales={sales}
              transactions={transactions}
              settings={settings}
            />
          )}

          {activeTab === "users" && (
            <UsersView 
              users={users}
              currentUser={currentUser}
              onSetToast={triggerToast}
            />
          )}

          {activeTab === "settings" && (
            <SettingsView 
              settings={settings}
              onUpdateSettings={handleUpdateSystemSettings}
              currentUser={currentUser}
              onSetToast={triggerToast}
            />
          )}
        </main>
      </div>
    </div>
  );
}
