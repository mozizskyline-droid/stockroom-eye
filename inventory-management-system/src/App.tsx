import React from 'react';
import { supabase } from './supabaseClient';
import { 
  Package, 
  Loader2, 
  Cloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  LogOut,
  LayoutDashboard,
  Boxes
} from 'lucide-react';

// 1. ADD THIS NEW FORM COMPONENT
function AddProductForm({ onProductAdded }: { onProductAdded: () => void }) {
  const [name, setName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // This uses your existing 'supabase' connection
    const { error } = await supabase.from('products').insert([{ name }]);
    if (error) console.error("Insert error:", error);
    else {
      setName('');
      onProductAdded(); // This triggers the refresh
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-slate-100 rounded-xl flex gap-2">
      <input 
        className="flex-1 p-2 border rounded text-xs"
        placeholder="New product name" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
      />
      <button disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded text-xs font-bold">
        {loading ? 'Adding...' : 'Add Item'}
      </button>
    </form>
  );
}

// 2. UPDATE YOUR EXISTING INVENTORY VIEW
function InventoryView() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [refresh, setRefresh] = React.useState(0);

  React.useEffect(() => {
    supabase.from('products').select('*').then(({ data }) => setProducts(data || []));
  }, [refresh]);

  return (
    <div>
      {/* Include the new form here */}
      <AddProductForm onProductAdded={() => setRefresh(r => r + 1)} />
      
      <div className="space-y-2">
        {products.map((p) => (
          <div key={p.id} className="p-3 bg-white border border-slate-200 rounded-lg text-xs">
            {p.name}
          </div>
        ))}
      </div>
    </div>
  );
}
function InventoryView() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function fetchProducts() {
      const { data, error } = await supabase.from('products').select('*');
      if (error) console.error("Error fetching:", error);
      else setProducts(data || []);
      setLoading(false);
    }
    fetchProducts();
  }, []);

  if (loading) return <div className="text-center p-10 text-xs text-slate-400">Loading vault data...</div>;

  return (
    <div className="space-y-4">
      {products.length === 0 ? (
        <div className="text-center p-10 text-slate-500">No products found in the vault.</div>
      ) : (
        products.map((p: any) => (
          <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
            {p.name || 'Unnamed Product'}
          </div>
        ))
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [loginLoading, setLoginLoading] = React.useState(false);
  const [isSignUpMode, setIsSignUpMode] = React.useState(false);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [fullName, setFullName] = React.useState('');
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'warn' | 'error' } | null>(null);

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
    else triggerToast("Signed in!", "success");
    setLoginLoading(false);
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleEmailLoginSubmit} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-black">STOCKROOM EYE</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">{loginLoading ? "..." : "Sign In"}</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-slate-900 text-white p-4">
        <button onClick={() => setActiveTab("dashboard")} className="block w-full p-2 text-left">Dashboard</button>
        <button onClick={() => setActiveTab("inventory")} className="block w-full p-2 text-left">Product Vault</button>
      </div>
      <div className="flex-1 p-6">
        {activeTab === "dashboard" ? <div>Welcome back, {currentUser.name}</div> : <InventoryView />}
      </div>
    </div>
  );
}
