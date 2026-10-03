"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Truck, 
  PackageCheck, 
  Trash2, 
  Headset, 
  Home, 
  Tag, 
  Wallet, 
  UserPlus,
  Calendar,
  Weight,
  Hash,
  ChevronRight
} from "lucide-react";

type TabState = "Scheduled" | "Completed" | "Cancelled";

const MOCK_PICKUPS: Record<string, any[]> = {
  Scheduled: [],
  Completed: [],
  Cancelled: []
};

export default function MyPickupsPage() {
  const [activeTab, setActiveTab] = useState<TabState>("Scheduled");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [activeTab]);

  const activePickups = MOCK_PICKUPS[activeTab] || [];

  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8    relative  flex flex-col font-sans md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Header Section ─── */}
      <header className="px-6 pt-10 pb-4 text-center">
        <h1 className="text-xl font-black text-gray-900 tracking-widest uppercase">
          PICKUPS
        </h1>
      </header>

      <main className="flex-1 flex flex-col">
        
        {/* ─── Tabbed Navigation (Horizontal Layout) ─── */}
        <div className="px-6 grid grid-cols-3 gap-3 mb-6">
          {/* Scheduled Tab */}
          <button 
            onClick={() => setActiveTab("Scheduled")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
              activeTab === "Scheduled" 
                ? "bg-white border-brand-600 shadow-md ring-1 ring-brand-600" 
                : "bg-white border-gray-100 shadow-sm opacity-70 hover:opacity-100"
            }`}
          >
            <div className={`p-2 rounded-lg mb-2 ${activeTab === "Scheduled" ? "bg-brand-50" : "bg-gray-50"}`}>
              <Truck className={`w-6 h-6 ${activeTab === "Scheduled" ? "text-brand-600" : "text-gray-500"}`} />
            </div>
            <span className={`text-[11px] font-bold ${activeTab === "Scheduled" ? "text-brand-700" : "text-gray-500"}`}>
              Scheduled
            </span>
          </button>

          {/* Completed Tab */}
          <button 
            onClick={() => setActiveTab("Completed")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
              activeTab === "Completed" 
                ? "bg-white border-brand-600 shadow-md ring-1 ring-brand-600" 
                : "bg-white border-gray-100 shadow-sm opacity-70 hover:opacity-100"
            }`}
          >
            <div className={`p-2 rounded-lg mb-2 ${activeTab === "Completed" ? "bg-green-50" : "bg-gray-50"}`}>
              <PackageCheck className={`w-6 h-6 ${activeTab === "Completed" ? "text-green-600" : "text-gray-500"}`} />
            </div>
            <span className={`text-[11px] font-bold ${activeTab === "Completed" ? "text-green-700" : "text-gray-500"}`}>
              Completed
            </span>
          </button>

          {/* Cancelled Tab */}
          <button 
            onClick={() => setActiveTab("Cancelled")}
            className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all border ${
              activeTab === "Cancelled" 
                ? "bg-white border-brand-600 shadow-md ring-1 ring-brand-600" 
                : "bg-white border-gray-100 shadow-sm opacity-70 hover:opacity-100"
            }`}
          >
            <div className={`p-2 rounded-lg mb-2 ${activeTab === "Cancelled" ? "bg-red-50" : "bg-gray-50"}`}>
              <Trash2 className={`w-6 h-6 ${activeTab === "Cancelled" ? "text-red-500" : "text-gray-500"}`} />
            </div>
            <span className={`text-[11px] font-bold ${activeTab === "Cancelled" ? "text-red-600" : "text-gray-500"}`}>
              Cancelled
            </span>
          </button>
        </div>

        {/* ─── Action Button ─── */}
        <div className="px-6 mb-8">
          <Link 
            href="/book"
            className="w-full block bg-brand-600 text-white py-3.5 rounded-full font-bold text-[16px] text-center shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-[1.02] transition-all"
          >
            Schedule Another Pickup <span className="text-xl leading-none font-medium ml-0.5">+</span>
          </Link>
        </div>

        {/* ─── Main Content Area (Horizontally Swipeable Carousel) ─── */}
        <div className="pl-6 mb-10 overflow-hidden">
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory hide-scrollbar pr-6 pb-6 pt-1 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-6 md:overflow-visible md:snap-none md:pr-0">
            {isLoading ? (
              // Loading Skeleton UI
              [1, 2].map((i) => (
                <div key={i} className="min-w-[85%] sm:min-w-[75%] md:min-w-0 md:w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 snap-center shrink-0 flex flex-col">
                  <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                    <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="w-20 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                  </div>
                  <div className="space-y-4 flex-1 mt-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
                      <div className="space-y-2 flex-1">
                        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full h-10 mt-5 bg-gray-200 rounded-xl animate-pulse"></div>
                </div>
              ))
            ) : activePickups.length === 0 ? (
              <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-10 text-center snap-center mr-6 flex flex-col items-center justify-center min-h-[280px]">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Truck className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">No {activeTab.toLowerCase()} pickups</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-[200px]">
                  When you schedule a pickup, it will appear here.
                </p>
              </div>
            ) : (
              activePickups.map((pickup, index) => (
                <div 
                  key={pickup.id} 
                  className={`min-w-[85%] sm:min-w-[75%] md:min-w-0 md:w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 snap-center shrink-0 flex flex-col transition-transform hover:-translate-y-1 ${
                    index === activePickups.length - 1 ? "mr-6" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-4 border-b border-gray-50 pb-3">
                    <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                      <Hash className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-bold text-gray-700">{pickup.id}</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      activeTab === 'Scheduled' ? 'bg-blue-50 text-blue-700' :
                      activeTab === 'Completed' ? 'bg-green-50 text-green-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {pickup.status}
                    </span>
                  </div>
                  
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Scheduled Date</p>
                        <p className="text-[13px] font-semibold text-gray-900">{pickup.date}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
                        <Weight className="w-4 h-4 text-brand-600" />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide mb-0.5">Est. Weight</p>
                        <p className="text-[13px] font-semibold text-gray-900">{pickup.weight}</p>
                      </div>
                    </div>
                  </div>

                  <button className="mt-5 pt-3 border-t border-gray-50 w-full flex items-center justify-between group">
                    <span className="text-xs font-bold text-gray-500 group-hover:text-gray-800 transition-colors">
                      View Details
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-600 transition-colors" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── Customer Support Section ─── */}
        <div className="px-6 mt-auto">
          <a href="tel:18001234567" className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center justify-between hover:shadow-md active:scale-[0.98] transition-all group block">
            <div className="flex items-center gap-4">
              <div className="bg-brand-50 w-12 h-12 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Headset className="w-6 h-6 text-brand-600" />
              </div>
              <div className="text-left">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Need Help?</p>
                <p className="text-[15px] font-bold text-gray-900">Request a Callback</p>
              </div>
            </div>
            <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center group-hover:bg-brand-50 transition-colors">
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-brand-600 transition-colors" />
            </div>
          </a>
        </div>

      </main>

      {/* ─── Fixed Bottom Navigation Bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center py-3 pb-6 md:pb-3 z-50 rounded-b-[2rem] md:rounded-b-[2.5rem]">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Home className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <Link href="/scrap-rates" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Tag className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Scrap Rates</span>
        </Link>
        
        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <Truck className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">My Pickups</span>
        </button>
        
        <Link href="/wallet" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Wallet className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Wallet</span>
        </Link>

        <Link href="/referral" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <UserPlus className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Referral</span>
        </Link>
      </nav>
      
    </div>
  );
}
