/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  SlidersHorizontal, 
  Edit2, 
  Trash2, 
  Upload, 
  FileSpreadsheet, 
  AlertTriangle,
  X,
  FileUp
} from 'lucide-react';
import { Product, UserProfile, SystemSettings } from '../types';
import { addProduct, updateProduct, deleteProduct } from '../firebase';

interface ProductsViewProps {
  products: Product[];
  currentUser: UserProfile | null;
  onSetToast: (msg: string, type: 'success' | 'warn' | 'error') => void;
  settings: SystemSettings;
}

export default function ProductsView({ products, currentUser, onSetToast, settings }: ProductsViewProps) {
  // Navigation authorization check
  const isWritable = currentUser?.role === "Admin" || currentUser?.role === "Manager";
  const isAdmin = currentUser?.role === "Admin";

  // Table filtering and search states
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("All");
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc' | null>(null);

  // Modal / Form opening states
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [showCSVModal, setShowCSVModal] = React.useState(false);
  
  // Selected product state for Edit / Delete
  const [editingProduct, setEditingProduct] = React.useState<Product | null>(null);

  // Form Fields
  const [name, setName] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [quantity, setQuantity] = React.useState(0);
  const [costPrice, setCostPrice] = React.useState(0.0);
  const [sellingPrice, setSellingPrice] = React.useState(0.0);
  const [supplier, setSupplier] = React.useState("");
  const [minStock, setMinStock] = React.useState(10);
  const [imageUrl, setImageUrl] = React.useState("");

  // CSV Drag and Drop state
  const [dragActive, setDragActive] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Dynamic values extraction
  const categories = ["All", ...Array.from(new Set(products.map(p => p.category)))];

  const handleOpenAddModal = () => {
    if (!isWritable) {
      onSetToast("Access Denied: Only Admin and Manager profiles are permitted to write products", "error");
      return;
    }
    setName("");
    setSku("");
    setCategory("");
    setQuantity(0);
    setCostPrice(0.0);
    setSellingPrice(0.0);
    setSupplier("");
    setMinStock(5);
    setImageUrl("");
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    if (!isWritable) {
      onSetToast("Access Denied: Only Admin and Manager can modify products.", "error");
      return;
    }
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setCategory(product.category);
    setQuantity(product.quantity);
    setCostPrice(product.costPrice);
    setSellingPrice(product.sellingPrice);
    setSupplier(product.supplier);
    setMinStock(product.minStock);
    setImageUrl(product.imageUrl || "");
    setShowEditModal(true);
  };

  // Auto-generate high quality SKU if omitted
  const generateSKU = (prodName: string, catName: string) => {
    const pPart = (prodName || "PRD").slice(0, 3).toUpperCase();
    const cPart = (catName || "GEN").slice(0, 3).toUpperCase();
    const randPart = Math.floor(100 + Math.random() * 900);
    return `${cPart}-${pPart}-${randPart}`;
  };

  const handleSaveNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      onSetToast("Product name is required", "warn");
      return;
    }

    const calculatedSku = sku.trim() || generateSKU(name, category);

    try {
      await addProduct({
        name: name.trim(),
        sku: calculatedSku,
        category: category.trim() || "Uncategorized",
        quantity: Number(quantity) || 0,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        supplier: supplier.trim() || "Local Supplier",
        minStock: Number(minStock) || 5,
        imageUrl: imageUrl.trim() || undefined
      });
      onSetToast(`Successfully registered ${name}!`, 'success');
      setShowAddModal(false);
    } catch (err) {
      onSetToast(`Trouble adding commodity: ${err}`, 'error');
    }
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!name.trim()) {
      onSetToast("Product name cannot be empty", "warn");
      return;
    }

    try {
      await updateProduct(editingProduct.id, {
        name: name.trim(),
        sku: sku.trim() || editingProduct.sku,
        category: category.trim() || "Uncategorized",
        quantity: Number(quantity) || 0,
        costPrice: Number(costPrice) || 0,
        sellingPrice: Number(sellingPrice) || 0,
        supplier: supplier.trim() || "Local Supplier",
        minStock: Number(minStock) || 5,
        imageUrl: imageUrl.trim() || undefined
      });
      onSetToast("Product was updated successfully", 'success');
      setShowEditModal(false);
    } catch (err) {
      onSetToast(`Error modifying product: ${err}`, 'error');
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!isAdmin) {
      onSetToast("Access Denied: Only Admins can delete elements to preserve financial integrity.", "error");
      return;
    }
    if (confirm(`Are you absolutely sure you want to delete "${productName}" from catalogs? This cannot be undone.`)) {
      try {
        await deleteProduct(productId);
        onSetToast(`Deleted ${productName} successfully.`, 'success');
      } catch (err) {
        onSetToast(`Error deleting product: ${err}`, 'error');
      }
    }
  };

  // CSV Drag-and-drop processing
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processCSVFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processCSVFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const processCSVFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      if (!text) {
        onSetToast("Invalid CSV file loaded", "error");
        return;
      }
      parseCSVTextAndImport(text);
    };
    reader.readAsText(file);
  };

  // CSV Text parsing logic
  const parseCSVTextAndImport = async (text: string) => {
    const lines = text.split(/\r?\n/);
    if (lines.length <= 1) {
      onSetToast("CSV must contain columns headers and at least 1 record", "warn");
      return;
    }

    let successCount = 0;
    let failCount = 0;

    // Standard expected parser
    // Column header template: Name,SKU,Category,Quantity,CostPrice,SellingPrice,Supplier,MinStock
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].trim();
      if (!row) continue;

      const cells = row.split(',').map(c => c.replace(/^["']|["']$/g, '').trim());
      if (cells.length < 3) {
        failCount++;
        continue;
      }

      const pName = cells[0];
      const pSku = cells[1] || "";
      const pCat = cells[2] || "Uncategorized";
      const pQty = parseInt(cells[3]) || 0;
      const pCost = parseFloat(cells[4]) || 0.0;
      const pSell = parseFloat(cells[5]) || 0.0;
      const pSup = cells[6] || "Local Supplier";
      const pMin = parseInt(cells[7]) || 10;

      if (!pName) {
        failCount++;
        continue;
      }

      try {
        await addProduct({
          name: pName,
          sku: pSku || generateSKU(pName, pCat),
          category: pCat,
          quantity: pQty,
          costPrice: pCost,
          sellingPrice: pSell,
          supplier: pSup,
          minStock: pMin
        });
        successCount++;
      } catch (err) {
        console.error(err);
        failCount++;
      }
    }

    onSetToast(`Bulk upload finished! Imported ${successCount} commodities successfully. ${failCount} errors.`, 'success');
    setShowCSVModal(false);
  };

  // In-app interactive download of template
  const handleDownloadCSVTemplate = () => {
    const headers = "Name,SKU,Category,Quantity,CostPrice,SellingPrice,Supplier,MinStock\n";
    const sample = "Organic Matcha,TEA-MAT-50,Beverages,25,8.50,15.00,Kyoto Farms,8\nFlax Seed Bread,BAK-FLX-01,Bakery,12,1.90,3.50,Millers Grain Co,5\n";
    const fileContent = headers + sample;
    
    const blob = new Blob([fileContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "bulk_inventory_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Perform search, category filter, and sorting
  const filteredProducts = products.filter(prod => {
    const matchesSearch = 
      prod.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prod.sku.toLowerCase().includes(searchTerm.toLowerCase()) || 
      prod.supplier.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === "All" || prod.category === selectedCategory;

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (sortDirection === 'asc') return a.quantity - b.quantity;
    if (sortDirection === 'desc') return b.quantity - a.quantity;
    return 0; // retain database natural order
  });

  const getStatusBadge = (prod: Product) => {
    if (prod.quantity === 0) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">
          Out of Stock
        </span>
      );
    }
    if (prod.quantity <= prod.minStock) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
          Low Stock
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700 border border-green-200">
        In Stock
      </span>
    );
  };

  return (
    <div className="space-y-6 flex flex-col min-h-0 overflow-y-auto pr-1">
      {/* Search filters and control rails */}
      <div className="bg-white p-4 rounded-xl border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm shrink-0">
        <div className="flex-1 flex flex-col md:flex-row gap-3">
          {/* Universal Search Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products by SKU, name, supplier..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Dynamic categories selector Filter */}
          <div className="w-full md:w-48 relative">
            <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat === "All" ? "All Categories" : cat}</option>
              ))}
            </select>
          </div>

          {/* Quantity Sort Toggler */}
          <button
            onClick={() => {
              if (sortDirection === null) setSortDirection('asc');
              else if (sortDirection === 'asc') setSortDirection('desc');
              else setSortDirection(null);
            }}
            className={`px-3 py-2.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer ${
              sortDirection 
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>
              Sort: {sortDirection === 'asc' ? 'Volume (Low-High)' : sortDirection === 'desc' ? 'Volume (High-Low)' : 'No Sort'}
            </span>
          </button>
        </div>

        {/* Catalog adjustment actions */}
        <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
          {isWritable && (
            <>
              <button
                onClick={() => setShowCSVModal(true)}
                className="px-4 py-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 text-indigo-700 text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer transition shadow-xs"
              >
                <Upload className="h-4 w-4" />
                <span>Bulk CSV Upload</span>
              </button>
              <button
                onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold flex items-center space-x-1.5 cursor-pointer transition shadow shadow-blue-950/20"
              >
                <Plus className="h-4.5 w-4.5" />
                <span>Add Product</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main product catalogue list table */}
      <div className="bg-white border border-slate-100 rounded-xl shadow-xs overflow-hidden flex flex-col flex-1 min-h-[300px]">
        {filteredProducts.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 text-slate-400">
            <Package className="h-10 w-10 text-slate-300 mb-2.5" />
            <p className="text-sm font-bold text-slate-700">No Inventory Commodities Match</p>
            <p className="text-xs text-slate-400 mt-1">Try relaxing terms, selecting another class level or registering a fresh item using "Add Product".</p>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-150 py-3 block-header select-none">
                <tr>
                  <th className="py-4 px-5">Commodity Name</th>
                  <th className="py-4 px-3">SKU</th>
                  <th className="py-4 px-3">Category</th>
                  <th className="py-4 px-3 text-right">Qty</th>
                  <th className="py-4 px-3 text-right">Cost</th>
                  <th className="py-4 px-3 text-right">Selling</th>
                  <th className="py-4 px-3">Supplier</th>
                  <th className="py-4 px-3">Status</th>
                  {isWritable && <th className="py-4 px-4 text-center">Controls</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredProducts.map((prod) => (
                  <tr key={prod.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-5 font-bold text-slate-800">
                      <div className="flex items-center space-x-3">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} referrerPolicy="no-referrer" className="h-8 w-8 rounded object-cover border border-slate-100 shrink-0" alt="" />
                        ) : (
                          <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold shrink-0 font-mono text-[10px]">
                            {prod.name.slice(0,2).toUpperCase()}
                          </div>
                        )}
                        <span className="truncate max-w-[180px]" title={prod.name}>{prod.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500 tracking-tight">{prod.sku}</td>
                    <td className="py-3 px-3 font-medium text-slate-600">{prod.category}</td>
                    <td className="py-3 px-3 text-right font-bold font-mono">{prod.quantity} pcs</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {(settings.currency || "$")}{prod.costPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-700">
                      {(settings.currency || "$")}{prod.sellingPrice.toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 truncate max-w-[120px]">{prod.supplier}</td>
                    <td className="py-3 px-3">{getStatusBadge(prod)}</td>
                    {isWritable && (
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex space-x-1 items-center">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Commodity Metadata"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteProduct(prod.id, prod.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-550 text-red-500 hover:bg-red-50 transition cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD COMMODITY MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleSaveNewProduct}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative border border-slate-100 p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">Add New Commodity Catalog Item</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Commodity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Premium Whole Coffee Beans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Beverages"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">SKU (Auto-gen if empty)</label>
                  <input
                    type="text"
                    placeholder="e.g. COF-PRD-101"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400 animate-pulse">Initial stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Cost Price ({(settings.currency || "$")}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={costPrice || ""}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Selling Price ({(settings.currency || "$")}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={sellingPrice || ""}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kyoto Beans Corp"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Minimum Stock Limit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={minStock}
                    onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Product Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="e.g. https://images.unsplash.com/photo-example..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 mr-2 hover:bg-slate-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded shadow cursor-pointer transition"
              >
                Create Product Catalogue
              </button>
            </div>
          </form>
        </div>
      )}

      {/* EDIT COMMODITY MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleSaveEditProduct}
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl relative border border-slate-100 p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <h3 className="font-extrabold text-slate-800 text-sm">Modify Commodity Details</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1">
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Commodity Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Organic Almond Milk"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Dairy/Alts"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. MILK-ALM-05"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Stock count quantity</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-xs focus:outline-none cursor-not-allowed font-mono font-bold"
                    disabled
                    title="Change counts using Stock In/Out or Sales tabs to maintain ledger trail!"
                  />
                  <div className="text-[8px] text-slate-400 pt-0.5 leading-none">Modify via transaction tabs to audit logs</div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Cost Price ({(settings.currency || "$")}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={costPrice || ""}
                    onChange={(e) => setCostPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Selling Price ({(settings.currency || "$")}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="0.00"
                    value={sellingPrice || ""}
                    onChange={(e) => setSellingPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Green Pastures LLC"
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Minimum Stock Limit</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={minStock}
                    onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-400">Product Image URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 mr-2 hover:bg-slate-50 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white rounded shadow cursor-pointer transition"
              >
                Update Commodity Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CSV BULK UPLOAD MODAL */}
      {showCSVModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative border border-slate-100 p-6 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
                <h3 className="font-extrabold text-slate-800 text-sm">Bulk Upload Catalogue CSV</h3>
              </div>
              <button type="button" onClick={() => setShowCSVModal(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">&times;</button>
            </div>

            <div className="my-4 space-y-4 flex-1 overflow-y-auto">
              <p className="text-xs text-slate-500 leading-relaxed">
                Add multiples commodities instantly. Drag-and-drop your inventory CSV file or choose a file from your system directory.
              </p>

              {/* Drag n Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileSelect}
                className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition duration-150 ${
                  dragActive 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-350 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <FileUp className={`h-10 w-10 mb-2.5 transition ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                <p className="text-xs font-bold text-slate-850 text-slate-705">
                  {dragActive ? 'Release file here' : 'Drop inventory CSV here, or browse'}
                </p>
                <p className="text-[10px] text-slate-400 mt-1 font-semibold">Supports files up to 5MB</p>
              </div>

              {/* Help Download Template Banner */}
              <div className="p-3.5 bg-slate-50 rounded-xl flex items-start justify-between space-x-3 text-xs">
                <div>
                  <p className="font-bold text-slate-800">CSV Template Specs</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">Must feature commas separating columns: Name, SKU, Category, Quantity, Cost, Selling, Supplier, MinStock.</p>
                </div>
                <button
                  onClick={handleDownloadCSVTemplate}
                  className="px-2.5 py-1.5 shrink-0 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded font-bold text-[10px] transition"
                  title="Download correct format example"
                >
                  Get Template
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-right shrink-0">
              <button
                type="button"
                onClick={() => setShowCSVModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded cursor-pointer"
              >
                Cancel Upload
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
