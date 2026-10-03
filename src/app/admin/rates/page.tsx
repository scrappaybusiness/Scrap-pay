// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { getScrapRates, updateScrapRate, createScrapRate, loginUser } from "@/lib/api";
import { ScrapCategory, User } from "@/lib/types";
import { toast } from "sonner";
import { IndianRupee, Edit3, Save, Plus, X, ArrowLeft, LogOut, Tag, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminRates() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const [rates, setRates] = useState<ScrapCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // New rate state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRate, setNewRate] = useState({
    name: "",
    category: "Paper",
    pricePerKg: "",
    description: ""
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("scrappay_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === "ADMIN") {
          setUser(u);
          fetchRates();
        } else {
          router.push("/admin");
        }
      } catch (e) {
        router.push("/admin");
      }
    } else {
      router.push("/admin");
    }
    setIsCheckingAuth(false);
  }, [router]);

  const fetchRates = async () => {
    setLoading(true);
    try {
      const data = await getScrapRates();
      setRates(data);
    } catch (error) {
      toast.error("Failed to load scrap rates");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (rate: ScrapCategory) => {
    setEditingId(rate.id);
    setEditPrice(rate.pricePerKg.toString());
  };

  const handleSaveEdit = async (id: string) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price < 0) {
      return toast.error("Invalid price");
    }
    
    setIsSaving(true);
    try {
      await updateScrapRate(id, { pricePerKg: price });
      toast.success("Rate updated");
      setEditingId(null);
      fetchRates();
    } catch (error) {
      toast.error("Failed to update rate");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(newRate.pricePerKg);
    if (!newRate.name || isNaN(price) || price < 0) {
      return toast.error("Please fill required fields correctly");
    }

    setIsAdding(true);
    try {
      await createScrapRate({
        name: newRate.name,
        category: newRate.category,
        pricePerKg: price,
        description: newRate.description
      });
      toast.success("New scrap rate added");
      setShowAddForm(false);
      setNewRate({ name: "", category: "Paper", pricePerKg: "", description: "" });
      fetchRates();
    } catch (error) {
      toast.error("Failed to add rate");
    } finally {
      setIsAdding(false);
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="text-gray-500 hover:text-green-600 flex items-center gap-1 transition">
                <ArrowLeft className="w-5 h-5" /> Back
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-green-600" />
                <span className="font-bold text-lg text-gray-900 hidden sm:block">Rate Management</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 font-medium">Admin: {user.name}</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Tag className="w-6 h-6 text-green-600" />
              Scrap Rates
            </h1>
            <p className="text-gray-500 mt-1">Manage pricing for different scrap categories</p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition flex items-center gap-2"
          >
            {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            {showAddForm ? "Cancel" : "Add New Rate"}
          </button>
        </div>

        {showAddForm && (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-8 animate-in fade-in slide-in-from-top-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Add New Scrap Item</h2>
            <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Copper Wire"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={newRate.name}
                  onChange={(e) => setNewRate({...newRate, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={newRate.category}
                  onChange={(e) => setNewRate({...newRate, category: e.target.value})}
                >
                  <option value="Paper">Paper</option>
                  <option value="Plastics">Plastics</option>
                  <option value="Metals">Metals</option>
                  <option value="E-Waste">E-Waste</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Kg (₹)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IndianRupee className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                    value={newRate.pricePerKg}
                    onChange={(e) => setNewRate({...newRate, pricePerKg: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Clean, stripped copper"
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
                  value={newRate.description}
                  onChange={(e) => setNewRate({...newRate, description: e.target.value})}
                />
              </div>
              <div className="md:col-span-2 mt-2">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full bg-green-600 text-white p-2.5 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center disabled:opacity-70"
                >
                  {isAdding ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Save New Rate"}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-12"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rates.map((rate) => (
              <div key={rate.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:border-green-300 transition">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{rate.category}</span>
                  {editingId === rate.id ? (
                    <button 
                      onClick={() => handleSaveEdit(rate.id)}
                      disabled={isSaving}
                      className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded"
                    >
                      {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleEditClick(rate)}
                      className="text-gray-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded transition"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900 mb-1 truncate" title={rate.name}>{rate.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 h-10 overflow-hidden">{rate.description || 'No description provided'}</p>
                  
                  <div className="flex items-center mt-auto">
                    <span className="text-gray-500 mr-2">Price:</span>
                    {editingId === rate.id ? (
                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                          <IndianRupee className="h-3 w-3 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          autoFocus
                          className="w-full pl-6 pr-2 py-1 text-lg font-bold text-green-600 border-b-2 border-green-500 focus:outline-none bg-green-50"
                          value={editPrice}
                          onChange={(e) => setEditPrice(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(rate.id)}
                        />
                      </div>
                    ) : (
                      <span className="text-xl font-bold text-green-600 flex items-center">
                        <IndianRupee className="w-5 h-5" />
                        {rate.pricePerKg}
                        <span className="text-sm font-normal text-gray-500 ml-1">/ kg</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {rates.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                <Tag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p>No scrap rates configured yet.</p>
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 text-green-600 font-medium hover:underline"
                >
                  Add your first rate
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
