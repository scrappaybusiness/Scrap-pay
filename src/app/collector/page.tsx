// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { getOrders, updateOrderStatus, loginUser } from "@/lib/api";
import { PickupOrder, User } from "@/lib/types";
import { toast } from "sonner";
import { Truck, Phone, MapPin, Clock, Package, LogOut, CheckCircle, Play, RefreshCw, User as UserIcon } from "lucide-react";

export default function CollectorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<PickupOrder[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);

  // States for completion form
  const [activeCompleteForm, setActiveCompleteForm] = useState<string | null>(null);
  const [actualWeight, setActualWeight] = useState<string>("");
  const [finalAmount, setFinalAmount] = useState<string>("");

  useEffect(() => {
    const stored = localStorage.getItem("scrappay_user");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.role === "COLLECTOR") {
          setUser(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const fetchOrders = async (collectorId: string) => {
    setFetchingOrders(true);
    try {
      const data = await getOrders({ collectorId });
      setOrders(data);
    } catch (error) {
      toast.error("Failed to fetch orders");
    } finally {
      setFetchingOrders(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders(user.id);
    }
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    try {
      const res = await loginUser(phone);
      if (res && res.role === "COLLECTOR") {
        localStorage.setItem("scrappay_user", JSON.stringify(res));
        setUser(res.data as any);
        toast.success("Logged in successfully");
      } else {
        toast.error("Not authorized as a collector");
      }
    } catch (error) {
      toast.error("Login failed. Check your phone number.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("scrappay_user");
    setUser(null);
    setOrders([]);
    toast.success("Logged out");
  };

  const handleStartPickup = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, { status: "IN_PROGRESS" });
      toast.success("Pickup started");
      if (user) fetchOrders(user.id);
    } catch (error) {
      toast.error("Failed to start pickup");
    }
  };

  const handleCompletePickup = async (e: React.FormEvent, orderId: string) => {
    e.preventDefault();
    if (!actualWeight || !finalAmount) {
      toast.error("Please enter actual weight and final amount");
      return;
    }
    try {
      await updateOrderStatus(orderId, {
        status: "COMPLETED",
        actualWeight: Number(actualWeight),
        finalAmount: Number(finalAmount),
      });
      toast.success("Pickup completed");
      setActiveCompleteForm(null);
      setActualWeight("");
      setFinalAmount("");
      if (user) fetchOrders(user.id);
    } catch (error) {
      toast.error("Failed to complete pickup");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      });
    } catch (e) {
      return dateString;
    }
  };

  const sortedOrders = [...orders].sort((a, b) => {
    const priority: Record<string, number> = { ASSIGNED: 1, IN_PROGRESS: 2, COMPLETED: 3 };
    return (priority[a.status] || 99) - (priority[b.status] || 99);
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center text-green-600">
            <Truck className="w-12 h-12" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Collector Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your pickups
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="focus:ring-green-500 focus:border-green-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign in"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-6 h-6 text-green-600" />
            <span className="font-semibold text-gray-900 text-lg">Scrap Pay</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600 hidden sm:flex">
              <UserIcon className="w-4 h-4 mr-1" />
              {user.name}
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 hover:text-gray-700 focus:outline-none p-2"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Your Pickups</h1>
          <button
            onClick={() => fetchOrders(user.id)}
            disabled={fetchingOrders}
            className="flex items-center text-sm text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-full"
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${fetchingOrders ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {fetchingOrders && orders.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 text-green-600 animate-spin" />
          </div>
        ) : sortedOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
            <p className="mt-1 text-gray-500">You have no assigned pickups at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Card Header Status Banner */}
                <div className={`px-4 py-2 flex justify-between items-center ${
                  order.status === 'COMPLETED' ? 'bg-gray-50' : 
                  order.status === 'IN_PROGRESS' ? 'bg-green-50 border-b border-green-100' : 
                  'bg-white border-b border-gray-100'
                }`}>
                  <span className="text-sm font-medium text-gray-500">#{order.orderNumber}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    order.status === 'COMPLETED' ? 'bg-gray-200 text-gray-700' :
                    order.status === 'IN_PROGRESS' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {order.status.replace("_", " ")}
                  </span>
                </div>

                <div className="p-4">
                  {/* Customer Info */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{order.customer?.name || "Customer"}</h3>
                      <a href={`tel:${order.customer?.phone}`} className="flex items-center text-sm text-blue-600 mt-1 hover:underline">
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        {order.customer?.phone}
                      </a>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm text-gray-600">
                    <div className="flex items-start">
                      <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 shrink-0" />
                      <span>{order.pickupAddress}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                      <span>{formatDate(order.scheduledDate)} &middot; {order.timeSlot}</span>
                    </div>
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400 shrink-0" />
                      <span>Est. {order.estimatedWeight} kg &middot; ₹{order.estimatedAmount}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {order.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStartPickup(order.id)}
                      className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Pickup
                    </button>
                  )}

                  {order.status === "IN_PROGRESS" && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {activeCompleteForm === order.id ? (
                        <form onSubmit={(e) => handleCompletePickup(e, order.id)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Actual Wt (kg)</label>
                              <input
                                type="number"
                                required
                                min="0.1"
                                step="0.1"
                                value={actualWeight}
                                onChange={(e) => setActualWeight(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g. 5.5"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Final Amt (₹)</label>
                              <input
                                type="number"
                                required
                                min="0"
                                value={finalAmount}
                                onChange={(e) => setFinalAmount(e.target.value)}
                                className="w-full text-sm border-gray-300 rounded-md py-2 px-3 border focus:ring-green-500 focus:border-green-500"
                                placeholder="e.g. 150"
                              />
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              type="button"
                              onClick={() => setActiveCompleteForm(null)}
                              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="flex-1 py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          onClick={() => setActiveCompleteForm(order.id)}
                          className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Complete Pickup
                        </button>
                      )}
                    </div>
                  )}

                  {order.status === "COMPLETED" && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
                      <span className="text-gray-500">Collected Weight</span>
                      <span className="font-medium text-gray-900">{order.actualWeight} kg</span>
                      <span className="text-gray-300">|</span>
                      <span className="text-gray-500">Paid Amount</span>
                      <span className="font-medium text-green-600">₹{order.finalAmount}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
