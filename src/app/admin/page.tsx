// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { getOrders, getCollectors, assignOrder, loginUser } from "@/lib/api";
import { PickupOrder, User } from "@/lib/types";
import { toast } from "sonner";
import { ShieldCheck, RefreshCw, LogOut, Users, Package, Filter, ExternalLink, ClipboardList, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [collectors, setCollectors] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedCollectorIds, setSelectedCollectorIds] = useState<Record<string, string>>({});

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    const stored = localStorage.getItem("scrappay_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.role === "ADMIN") {
          setUser(u.data as any);
          fetchData();
        }
      } catch (e) {
        console.error(e);
      }
    }
    setIsCheckingAuth(false);
  };

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [fetchedOrders, fetchedCollectors] = await Promise.all([
        getOrders({}),
        getCollectors()
      ]);
      // Sort orders by most recent
      setOrders((fetchedOrders.data as any[] || []).sort((a: any, b: any) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      setCollectors(fetchedCollectors.data as any[] || []);
    } catch (error) {
      toast.error("Failed to load admin data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.length < 10) return toast.error("Enter a valid phone number");
    setIsLoggingIn(true);
    try {
      const u = await loginUser(phone);
      if ((u.data as any)?.role !== "ADMIN") {
        toast.error("Access denied. Admin only.");
      } else {
        localStorage.setItem("scrappay_user", JSON.stringify(u));
        setUser(u);
        toast.success("Welcome, Admin");
        fetchData();
      }
    } catch (error) {
      toast.error("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("scrappay_user");
    setUser(null);
    router.push("/");
  };

  const handleAssign = async (orderId: string) => {
    const collectorId = selectedCollectorIds[orderId];
    if (!collectorId) {
      toast.error("Please select a collector first");
      return;
    }
    setAssigningId(orderId);
    try {
      await assignOrder(orderId, collectorId);
      toast.success("Order assigned successfully!");
      fetchData(); // refresh list
    } catch (error) {
      toast.error("Failed to assign order");
    } finally {
      setAssigningId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-amber-100 text-amber-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-purple-100 text-purple-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isCheckingAuth) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-6">
            <ShieldCheck className="w-16 h-16 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">Admin Portal</h1>
          <p className="text-gray-500 text-center mb-8">Login to manage Scrap Pay operations</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                  placeholder="Enter admin phone number"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-green-600 text-white p-3 rounded-lg font-medium hover:bg-green-700 transition flex items-center justify-center disabled:opacity-70"
            >
              {isLoggingIn ? <RefreshCw className="w-5 h-5 animate-spin" /> : "Access Dashboard"}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/" className="text-green-600 hover:underline text-sm flex items-center justify-center gap-1">
              <ExternalLink className="w-4 h-4" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const filteredOrders = filterStatus === "ALL" 
    ? orders 
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-8 w-8 text-green-600" />
              <span className="font-bold text-xl text-gray-900 hidden sm:block">Admin Hub</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin/rates" className="text-gray-600 hover:text-green-600 font-medium text-sm flex items-center gap-1">
                <ClipboardList className="w-4 h-4" /> Rates
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <span className="text-sm text-gray-600 font-medium hidden sm:block">Admin: {user.name}</span>
              <button onClick={handleLogout} className="text-red-600 hover:text-red-800 p-2 rounded-full hover:bg-red-50 transition">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-6 h-6 text-green-600" />
              Orders Management
            </h1>
            <p className="text-gray-500 mt-1">Manage all pickup orders and assign collectors</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-white border border-gray-300 rounded-lg p-1 flex items-center">
              <Filter className="w-4 h-4 text-gray-500 ml-2 mr-1" />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-sm py-1 pl-1 pr-8 cursor-pointer outline-none text-gray-700"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <button 
              onClick={fetchData} 
              disabled={loadingData}
              className="bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 text-sm font-medium"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-medium">Total Orders</div>
            <div className="text-2xl font-bold text-gray-900">{orders.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-medium">Pending</div>
            <div className="text-2xl font-bold text-amber-600">{orders.filter(o => o.status === 'PENDING').length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-medium">Completed</div>
            <div className="text-2xl font-bold text-green-600">{orders.filter(o => o.status === 'COMPLETED').length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-sm font-medium">Collectors</div>
            <div className="text-2xl font-bold text-blue-600">{collectors.length}</div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loadingData ? (
            <div className="p-12 flex justify-center"><RefreshCw className="w-8 h-8 animate-spin text-green-600" /></div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p>No orders found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                  <tr>
                    <th className="px-6 py-4 font-medium">Order Details</th>
                    <th className="px-6 py-4 font-medium">Customer</th>
                    <th className="px-6 py-4 font-medium">Schedule</th>
                    <th className="px-6 py-4 font-medium">Est. Value</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Assignment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">#{order.id.slice(0, 8).toUpperCase()}</div>
                        <div className="text-gray-500 text-xs mt-1">
                          {new Date(order.createdAt || '').toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.customer?.name || 'Unknown'}</div>
                        <div className="text-gray-500 text-xs mt-1">{order.customer?.phone}</div>
                        <div className="text-gray-400 text-xs truncate max-w-[150px]" title={`${(order as any).pickupAddress}, ${order.pincode}`}>
                          {(order as any).pickupAddress} - {order.pincode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-900">{new Date(order.scheduledDate).toLocaleDateString()}</div>
                        <div className="text-gray-500 text-xs">{order.timeSlot}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">₹{order.estimatedAmount || 0}</div>
                        <div className="text-gray-500 text-xs">{order.estimatedWeight || 0} kg</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === 'PENDING' ? (
                          <div className="flex items-center gap-2 min-w-[200px]">
                            <select
                              className="border border-gray-300 rounded-lg text-sm p-1.5 focus:ring-green-500 focus:border-green-500 w-full"
                              value={selectedCollectorIds[order.id] || ""}
                              onChange={(e) => setSelectedCollectorIds({...selectedCollectorIds, [order.id]: e.target.value})}
                            >
                              <option value="" disabled>Select Collector</option>
                              {collectors.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssign(order.id)}
                              disabled={assigningId === order.id || !selectedCollectorIds[order.id]}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                              {assigningId === order.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Assign'}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-700 font-medium">
                              {order.collector?.name || 'Unassigned'}
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
