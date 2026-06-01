/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { supabase } from './supabaseClient';
import { Product, StockTransaction, Sale, UserProfile, SystemSettings } from './types';
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
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  UserPlus
} from 'lucide-react';

export default function App() {
  // Navigation Routing States
  const [activeTab, setActiveTab] = React.useState("dashboard");

  // Authentication states
  const [currentUser, setCurrentUser] = React.useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);
  
  // Custom Form States
  const [isSignUpView, setIsSignUpView] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');

  // Core Data States
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
  // SUPABASE SESSION LIFECYCLE LISTENER CHANNEL
  // ----------------------------------------------------
  React.useEffect(() => {
    // Read initial session on load
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'Admin', // Default role for authenticated team dashboarders
          status: 'Active'
        });
      }
      setAuthLoading(false);
    });

    // Listen to real-time auth changes (Sign-in, Sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        const userProfile: UserProfile = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || '',
          role: 'Admin',
          status: 'Active'
        };
        setCurrentUser(userProfile);
        triggerToast(`Welcome back, ${userProfile.name}! Live cloud session secured.`, 'success');
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Simulated fallback values just to populate visuals safely if empty
  React.useEffect(() => {
    if (!currentUser) return;
    // Database sync hook placeholder - can connect custom Supabase query loops here
  }, [currentUser]);

  // ----------------------------------------------------
  // EMAIL & PASSWORD ENGINE ACTION HANDLERS
  // ----------------------------------------------------
  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerToast("Please populate all credential input grids.", "warn");
      return;
    }
    
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) {
      triggerToast("Please populate all text registration inputs.", "warn");
      return;
    }

    setLoginLoading(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName }
        }
      });
      if (error) throw error;
      
      // Notify regarding the active email confirm requirement
      triggerToast("Registration complete! Please check your mailbox to click the confirmation link.", "success");
      setIsSignUpView(false);
    } catch (err: any) {
      console.error(err);
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOutSubmit = async () => {
    try {
      await supabase.auth.signOut();
      setProducts([]);
      setTransactions([]);
      setSales([]);
      setCurrentUser(null);
      setActiveTab("dashboard");
      triggerToast("Logged out from system vault successfully.", 'success');
    } catch (err) {
      triggerToast(`Sign-out execution failed: ${err}`, 'error');
    }
  };

  const handleUpdateSystemSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    triggerToast("Business workspace rules updated locally!", "success");
  };

  // Calculate low stock metrics
  const lowStockCount = products.filter(p => p.quantity > 0 && p.quantity <= p.minStock).length;

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-slate-500 font-mono tracking-widest uppercase">Booting Stockroom Core...</p>
      </div>
    );
  }

  // MODERN SECURE AUTH GATEWAY INTERFACE
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative font-sans">
        
        <div className="absolute top-[10%] left-[20%] w-[35rem] h-[35rem] bg-blue-100/40 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[35rem] h-[35rem] bg-indigo-100/40 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-md w-full bg-white border border-slate-200/60 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6">
          
          <div className="text-center space-y-2 select-none">
            <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow shadow-blue-500/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">STOCKROOM EYE</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">Supply Line Orchestrator</p>
            </div>
          </div>

          <div className="px-3 py-2.5 rounded-lg border text-center flex items-center justify-center space-x-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
            <Cloud className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Supabase Production Vault Access Enabled</span>
          </div>

          <form onSubmit={isSignUpView ? handleEmailSignUpSubmit : handleEmailLoginSubmit} className="space-y-4">
            
            {isSignUpView && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Full Name</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition font-sans bg-slate-50/50"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Email Address</label>
              <input 
                type="email"
                required
                placeholder="operator@business.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition font-sans bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">Secure Access Password</label>
              <input 
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-blue-500 transition font-sans bg-slate-50/50"
              />
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center space-x-2 border-0"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Processing Cloud Request...</span>
                </>
              ) : isSignUpView ? (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Register Production Account</span>
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  <span>Authenticate Secure Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* ACCESS MODE SWITCH LINK BUTTON */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUpView(!isSignUpView);
                triggerToast(isSignUpView ? "Switched to standard vault sign-in form." : "Switched to secure operator signup portal.", "warn");
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-500 transition bg-transparent border-0 cursor-pointer"
            >
              {isSignUpView ? "Already have a secure vault key? Log In here" : "Need workspace entry clearance? Create Account"}
            </button>
          </div>

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
          <div className="text-slate-705 text-xs font-semibold leading-normal max-w-sm">
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
