"use client";

import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { 
  MapPin, 
  Scale, 
  Trophy,
  Home, 
  Tag, 
  Truck,
  Wallet,
  UserPlus,
  User,
  Recycle,
  X,
  Star,
  Users,
  Search,
  Navigation
} from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const [userName, setUserName] = useState("Anshu");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    // Attempt to load from localStorage if logged in
    try {
      const userRaw = localStorage.getItem("bottelpay_user");
      if (userRaw) {
        const user = JSON.parse(userRaw);
        if (user?.name) setUserName(user.name.split(" ")[0]);
      }
    } catch {}
  }, []);

  const handleLocationConfirm = () => {
    setIsMapOpen(false);
    toast.success("Address saved successfully");
  };

  return (
    <>
    <OnboardingTutorial />
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8  md:bg-transparent   md:pb-8 relative flex flex-col font-sans overflow-hidden md:max-w-6xl md:mx-auto md:px-6 md:pt-6 md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Header Section ─── */}
      <header className="flex justify-between items-center px-6 pt-10 pb-4 shrink-0">
        <h1 className="text-[22px] font-black text-gray-900 tracking-tight">
          Hi 👋, {userName}
        </h1>
        <Link href="/profile" className="w-10 h-10 bg-brand-50 rounded-full flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-gray-100 hover:scale-105 active:scale-95 transition-transform">
          <User className="w-5 h-5 text-brand-600" />
        </Link>
      </header>

      <main className="flex-1 px-6 md:px-0 space-y-5 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 overflow-y-auto hide-scrollbar pb-24 md:pb-0">
        
        {/* Active Pickup Notification Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-brand-500 rounded-2xl p-4 shadow-lg shadow-blue-500/20 text-white flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-100">Pickup Scheduled</p>
              <p className="text-sm font-black">Partner arriving in 15 mins</p>
            </div>
          </div>
          <button className="bg-white text-blue-600 px-4 py-2 rounded-xl text-xs font-black shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
            Track
          </button>
        </div>

        {/* ─── Address Section ─── */}
        <div className="bg-white rounded-xl shadow-sm p-3.5 flex justify-between items-center border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="bg-brand-50 p-2 rounded-lg">
              <MapPin className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Selected Address</p>
              <p className="text-[13px] font-bold text-gray-900 line-clamp-1">Amrath, Bihar, India</p>
            </div>
          </div>
          <button onClick={() => setIsMapOpen(true)} className="text-xs font-bold text-brand-600 hover:text-brand-700 hover:bg-brand-100 active:scale-95 transition-all bg-brand-50 px-3 py-1.5 rounded-lg">
            Change/Select
          </button>
        </div>
        
        <div className="flex justify-center my-8">
          <Image src="/logo-horizontal-transparent.png" alt="Scrap Pay" width={180} height={60} className="object-contain" />
        </div>

        {/* ─── Trust & Accuracy Banner (Card) ─── */}
        <div className="bg-white rounded-xl shadow-md p-5 flex gap-4 border border-gray-100 items-center">
          <div className="w-16 h-16 shrink-0 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100 shadow-inner">
            <Scale className="w-8 h-8 text-brand-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Recycle className="w-4 h-4 text-brand-600" />
              <span className="text-[13px] font-black text-gray-900 tracking-tight uppercase">Scrap Pay</span>
            </div>
            <h2 className="text-[15px] font-black text-gray-900 leading-tight mb-1">
              100% accuracy guarantee
            </h2>
            <p className="text-[11px] text-gray-500 font-medium leading-snug">
              100% weight accuracy with best in class material identification
            </p>
          </div>
        </div>

        {/* ─── Primary CTA ─── */}
        <Link 
          href="/book"
          className="w-full flex justify-center items-center gap-1 bg-brand-600 text-white py-3.5 rounded-full font-bold text-[17px] shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-[1.02] transition-all"
        >
          Schedule Pickup <span className="text-xl leading-none font-medium ml-0.5">+</span>
        </Link>

        {/* ─── Brand Area ─── */}
        <div className="flex flex-col items-center justify-center py-4 opacity-50">
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-brand-600 p-1.5 rounded-md">
              <Recycle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black text-gray-800 tracking-tighter">Scrap<span className="text-brand-600">Pay</span></span>
          </div>
          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Recycle with ease</p>
        </div>

        {/* ─── Gamification Section ─── */}
        <button 
          onClick={() => setIsLeaderboardOpen(true)}
          className="w-full bg-white rounded-xl shadow-sm p-4 flex justify-between items-center border border-gray-100 mb-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-2.5">
            <div className="bg-yellow-50 p-1.5 rounded-lg">
              <Trophy className="w-5 h-5 text-yellow-500" />
            </div>
            <span className="text-sm font-bold text-gray-800">Highest recycler of the day</span>
          </div>
          <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm ring-2 ring-gray-50 overflow-hidden">
            <User className="w-4 h-4 text-brand-600" />
          </div>
        </button>
        <div className="flex flex-col items-center justify-center pt-8 pb-4 opacity-70">
          <Image src="/logo-stacked-transparent.png" alt="Scrap Pay" width={80} height={80} className="object-contain grayscale mb-2 opacity-50" />
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">India's Smartest Recycling Platform</p>
        </div>
      </main>

      {/* ─── Map & Location UI Modal ─── */}
      <div className={`fixed inset-0 z-[60] flex flex-col bg-white transition-transform duration-300 ease-in-out ${isMapOpen ? 'translate-y-0' : 'translate-y-full'}`}>
        <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center justify-between shrink-0 shadow-sm z-10 relative">
          <button onClick={() => setIsMapOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-black text-gray-900 absolute left-1/2 -translate-x-1/2">Select Address</h2>
        </header>

        <div className="px-4 py-4 shrink-0 bg-white shadow-sm z-10">
          <div className="relative mb-3">
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search / Enter Address Manually" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
          </div>
          <button className="flex items-center gap-2 text-brand-600 font-bold text-sm bg-brand-50 px-4 py-3 rounded-xl w-full justify-center hover:bg-brand-100 active:scale-[0.98] transition-all">
            <Navigation className="w-4 h-4" /> Use Current Location
          </button>
        </div>

        {/* Visual Map Placeholder */}
        <div className="flex-1 bg-blue-50 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent bg-[length:20px_20px]"></div>
          {/* Map Grid effect */}
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>
          
          <div className="absolute z-10 flex flex-col items-center">
            <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full mb-1 shadow-lg">Move pin to adjust</div>
            <MapPin className="w-10 h-10 text-brand-600 drop-shadow-md -mt-2 animate-bounce" />
            <div className="w-2 h-1 bg-black/20 rounded-full mt-1 blur-[1px]"></div>
          </div>
        </div>

        <div className="p-5 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
          <button onClick={handleLocationConfirm} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-brand-600/30 hover:bg-brand-700 active:scale-[0.98] transition-all">
            Confirm Location
          </button>
        </div>
      </div>

      {/* ─── Leaderboard Modal ─── */}
      <div className={`fixed inset-0 z-[70] flex flex-col justify-end transition-all duration-300 ${isLeaderboardOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLeaderboardOpen(false)}></div>
        <div className={`bg-gray-50 w-full max-w-md mx-auto rounded-t-3xl  relative z-10 transition-transform duration-300 flex flex-col max-h-[80vh] ${isLeaderboardOpen ? "translate-y-0" : "translate-y-full"}`}>
          
          <div className="px-6 pt-5 pb-4 flex justify-between items-center bg-white rounded-t-3xl border-b border-gray-100 shrink-0">
            <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" /> Leaderboard
            </h2>
            <button onClick={() => setIsLeaderboardOpen(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200">
              <X className="w-5 h-5 text-gray-900" />
            </button>
          </div>
          
          <div className="flex-1 p-6 overflow-y-auto space-y-3 hide-scrollbar">
            {[
              { rank: 1, name: "Anshu", kg: 150, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { rank: 2, name: "Rahul", kg: 120, color: "bg-gray-200 text-gray-700 border-gray-300" },
              { rank: 3, name: "Priya", kg: 95, color: "bg-orange-100 text-orange-700 border-orange-200" },
              { rank: 4, name: "Amit", kg: 80, color: "bg-white text-gray-700 border-gray-100" },
              { rank: 5, name: "Neha", kg: 65, color: "bg-white text-gray-700 border-gray-100" },
            ].map((user) => (
              <div key={user.rank} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${user.rank <= 3 ? user.color : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black w-6 text-center">{user.rank}</span>
                  <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center border border-black/5">
                    <User className="w-5 h-5 opacity-70" />
                  </div>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex items-center gap-1 font-black">
                  {user.kg} <span className="text-[10px] uppercase tracking-wide opacity-70">Kg</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Fixed Bottom Navigation Bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center py-3 pb-6 md:pb-3 z-50">
        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <Home className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        
        <Link href="/scrap-rates" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Tag className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Scrap Rates</span>
        </Link>
        
        <Link href="/my-pickups" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Truck className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">My Pickups</span>
        </Link>
        
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
    </>
  );
}
