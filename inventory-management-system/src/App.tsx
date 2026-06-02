import React from 'react';
import { supabase } from './supabaseClient';
import { Loader2 } from 'lucide-react';

// This is the combined, corrected InventoryView
function InventoryView() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [adding, setAdding] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase.from('products').select('*');
    setProducts(data || []);
    setLoading(false);
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    setAdding(true);
    await supabase.from('products').insert([{ name: newName }]);
    setNewName('');
    await fetchProducts(); // Refresh the list
    setAdding(false);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="flex gap-2">
        <input 
          className="flex-1 p-2 border rounded text-xs"
          placeholder="New product name" 
          value={newName} 
          onChange={(e) => setNewName(e.target.value)} 
        />
        <button disabled={adding} className="bg-blue-600 text-white px-4 py-2 rounded text-xs font-bold">
          {adding ? 'Adding...' : 'Add Item'}
        </button>
      </form>

      {loading ? (
        <div className="text-center text-slate-400">Loading vault data...</div>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-semibold text-slate-700">
              {p.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [currentUser, setCurrentUser] = React.useState<any>(null);
  const [authLoading, setAuthLoading] = React.useState(true);
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setCurrentUser({ id: session.user.id, name: session.user.user_metadata.full_name, email: session.user.email });
      setAuthLoading(false);
    });
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await supabase.auth.signInWithPassword({ email, password });
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl space-y-4">
          <h2 className="text-xl font-black">STOCKROOM EYE</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2 border rounded" />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2 border rounded" />
          <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">Sign In</button>
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
