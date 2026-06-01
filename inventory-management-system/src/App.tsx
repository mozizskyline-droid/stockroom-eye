/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { supabase } from './supabaseClient';
import { 
  Package, 
  Loader2, 
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogIn,
  UserPlus,
  LogOut,
  LayoutDashboard,
  Boxes,
  Settings
} from 'lucide-react';

export default function App() {
  // Navigation & Authentication states
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [isSignUpMode, setIsSignUpMode] = React.useState(false);

  // Form Field States
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');

  // Global Toast Alert State
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  const triggerToast = React.useCallback((message: string, type: 'success' | 'warn' | 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => prev?.message === message ? null : prev);
    }, 4000);
  }, []);

  // Handle Supabase session initialization & monitoring
  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setCurrentUser({
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || ''
        });
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && session.user) {
        const profile = {
          id: session.user.id,
          name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
          email: session.user.email || ''
        };
        setCurrentUser(profile);
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      triggerToast("Signed in securely!", "success");
    } catch (err: any) {
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName) return;
    setLoginLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      triggerToast("Registration completed!", "success");
      setIsSignUpMode(false);
    } catch (err: any) {
      triggerToast(err.message || String(err), 'error');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSignOutSubmit = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    triggerToast("Logged out successfully.", 'success');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-xs font-bold text-slate-400 font-mono tracking-widest uppercase">Connecting System Hub...</p>
      </div>
    );
  }

  // AUTHENTICATION GATEWAY VIEW
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans relative">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-6 md:p-8 space-y-6 z-10">
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow shadow-blue-500/20">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">STOCKROOM EYE</h2>
              <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase">Cloud Control Dashboard</p>
            </div>
          </div>

          <div className="px-3 py-2 rounded-lg border text-center flex items-center justify-center space-x-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200***">
            <Cloud className="h-4 w-4 text-emerald-600" />
            <span>Supabase Active Gateway Connection</span>
          </div>

          <form onSubmit={isSignUpMode ? handleEmailSignUpSubmit : handleEmailLoginSubmit} className="space-y-4">
            {isSignUpMode && (
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500">Full Name</label>
                <input 
                  type="text" required placeholder="Full Name" value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Email Address</label>
              <input 
                type="email" required placeholder="manager@company.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-500">Password</label>
              <input 
                type="password" required placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit" disabled={loginLoading}
              className="w-full mt-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition flex items-center justify-center space-x-2 border-0"
            >
              {loginLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : isSignUpMode ? "Register Account" : "Secure Sign In"}
            </button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center">
            <button onClick={() => setIsSignUpMode(!isSignUpMode)} className="text-xs font-bold text-blue-600 bg-transparent border-0 cursor-pointer">
              {isSignUpMode ? "Already have an account? Sign In" : "Need credentials? Create Account"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // MAIN RUNNING WORKSPACE VIEW
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans overflow-hidden">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-2.5 p-4 rounded-xl shadow-2xl border bg-white border-slate-100">
          {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
          {toast.type === "warn" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
          {toast.type === "error" && <XCircle className="h-5 w-5 text-red-500" />}
          <div className="text-slate-700 text-xs font-semibold">{toast.message}</div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 bg-slate-900 text-slate-200 flex flex-col shrink-0 border-r border-slate-800 md:fixed md:h-screen z-20">
        <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
          <Package className="h-5 w-5 text-blue-500" />
          <span className="font-black text-sm tracking-wider uppercase text-white">Stockroom Eye</span>
        </div>
        <div className="flex-1 p-3 space-y-1 overflow-y-auto">
          <button 
            onClick={() => setActiveTab("dashboard")} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition border-0 text-left ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Overview Metrics</span>
          </button>
          <button 
            onClick={() => setActiveTab("inventory")} 
            className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition border-0 text-left ${activeTab === 'inventory' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Boxes className="h-4 w-4" />
            <span>Product Vault</span>
          </button>
        </div>
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <div className="px-3 py-2 mb-2 text-xs text-slate-400 truncate font-semibold">
            Logged in as: <span className="text-white block font-mono text-[10px] mt-0.5">{currentUser.email}</span>
          </div>
          <button 
            onClick={handleSignOutSubmit} 
            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/30 transition cursor-pointer border-0 text-left bg-transparent"
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect Session</span>
          </button>
        </div>
      </div>

      {/* Working Panel */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0 h-screen overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <h1 className="text-sm font-black uppercase text-slate-700 tracking-wider flex items-center space-x-2">
            <span>Control Node</span>
            <span className="text-[10px] bg-blue-50 text-blue-600 font-mono px-2 py-0.5 rounded-full lowercase font-medium">/{activeTab}</span>
          </h1>
        </header>

        <main className="flex-1 p-6 overflow-y-auto bg-slate-50/50">
          {activeTab === "dashboard" ? (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg border border-slate-950">
                <h2 className="text-lg font-black tracking-tight">System Status: Core Operational</h2>
                <p className="text-xs text-slate-400 mt-1">Welcome back, {currentUser.name}. Your active Cloud Core has synchronized tracking successfully.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Active Infrastructure Node</h3>
                  <p className="text-2xl font-black text-slate-800 mt-2 font-mono">Supabase DB</p>
                </div>
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Secure Access Protocol</h3>
                  <p className="text-2xl font-black text-emerald-600 mt-2 font-mono">JWT Verified</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-2">
              <Settings className="h-8 w-8 text-slate-300 mx-auto animate-spin [animation-duration:8s]" />
              <h3 className="text-sm font-bold text-slate-700">Storage Control Channel Initializing</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">Database relational tables are active. Run the table setup migrations directly inside your SQL editor panel to link product rows.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
