/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { supabase } from './supabaseClient';
import { 
  Package, Loader2, Cloud, CheckCircle2, XCircle, 
  AlertTriangle, LogOut, LayoutDashboard, Boxes, Settings 
} from 'lucide-react';

// --- NEW FUNCTIONAL COMPONENT ---
function InventoryManager() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [newItem, setNewItem] = React.useState('');

  const refreshData = async () => {
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
    setLoading(false);
  };

  React.useEffect(() => { refreshData(); }, []);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem) return;
    await supabase.from('products').insert([{ name: newItem }]);
    setNewItem('');
    refreshData();
  };

  return (
    <div className="space-y-4">
      <form onSubmit={addProduct} className="flex gap-2 mb-6">
        <input 
          className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          placeholder="Enter new product name..." 
          value={newItem} 
          onChange={(e) => setNewItem(e.target.value)} 
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl">Add Item</button>
      </form>
      
      {loading ? (
        <div className="text-center p-10"><Loader2 className="animate-spin h-6 w-6 text-slate-400 mx-auto" /></div>
      ) : (
        products.map(p => (
          <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
            {p.name}
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {
  // ... (Keep all your existing states: activeTab, currentUser, etc.)
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [isSignUpMode, setIsSignUpMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

  // ... (Keep your existing triggerToast, handleLogin, etc. functions here)
  const triggerToast = React.useCallback((message: string, type: 'success' | 'warn' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser({ id: session.user.id, name: session.user.user_metadata.full_name, email: session.user.email });
      setAuthLoading(false);
    });
  }, []);

  const handleEmailLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) triggerToast(error.message, 'error');
    else triggerToast("Signed in securely!", "success");
    setLoginLoading(false);
  };

  const handleSignOutSubmit = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  // ... (Return your UI template, replacing the Settings/Initializing block with <InventoryManager />)
  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!currentUser) {
    /* Your Auth UI block here */
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <form onSubmit={handleEmailLoginSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
        <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
        <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
        <button className="w-full bg-blue-600 text-white p-2 rounded">Sign In</button>
      </form>
    </div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar - Same as yours */}
      <div className="w-64 bg-slate-900 text-white p-4">
        <button onClick={() => setActiveTab("dashboard")} className="block w-full p-2">Dashboard</button>
        <button onClick={() => setActiveTab("inventory")} className="block w-full p-2">Product Vault</button>
      </div>

      <main className="flex-1 p-6">
        {activeTab === "dashboard" ? (
          <div>Dashboard content</div>
        ) : (
          <InventoryManager /> 
        )}
      </main>
    </div>
  );
}
