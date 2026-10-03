"use client";

import Link from "next/link";
import { 
  Home, 
  Tag, 
  Truck, 
  Wallet, 
  UserPlus, 
  Landmark,
  ArrowUpRight,
  ArrowDownLeft,
  Receipt,
  CalendarDays,
  History
} from "lucide-react";

const TRANSACTIONS: any[] = [];

export default function WalletPage() {
  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8    relative  flex flex-col font-sans md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Header Section ─── */}
      <header className="px-6 pt-10 pb-4 text-center bg-gray-50 z-10">
        <h1 className="text-xl font-black text-gray-900 tracking-widest uppercase">
          Wallet
        </h1>
      </header>

      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* ─── Current Balance & Action Card ─── */}
        <div className="px-6 mb-6 shrink-0">
          <div className="bg-brand-600 rounded-3xl p-6 shadow-xl shadow-brand-600/30 text-white relative overflow-hidden">
            {/* Decorative background circles */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black opacity-10 rounded-full blur-xl"></div>
            
            <div className="relative z-10">
              <p className="text-brand-100 font-medium text-sm mb-1">Current Balance</p>
              <h2 className="text-4xl font-black tracking-tight mb-6">₹ 0</h2>
              
              <button className="w-full bg-white text-brand-700 py-3.5 rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 shadow-sm hover:bg-gray-50 active:scale-95 transition-all">
                <Landmark className="w-5 h-5" />
                Withdraw to UPI / Bank
              </button>
            </div>
          </div>
        </div>

        {/* ─── Earnings Dashboard Section ─── */}
        <div className="px-6 grid grid-cols-3 gap-3 mb-8 shrink-0">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Weekly</p>
            <p className="text-base font-black text-gray-900">₹0</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Monthly</p>
            <p className="text-base font-black text-gray-900">₹0</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wide mb-1">Lifetime</p>
            <p className="text-base font-black text-brand-700">₹0</p>
          </div>
        </div>

        {/* ─── Transaction History (Vertical Scrolling Area) ─── */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 flex items-center gap-2 mb-3 shrink-0">
            <History className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Transaction History</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto hide-scrollbar px-6 pb-6 space-y-3">
            {TRANSACTIONS.length === 0 ? (
              <div className="w-full h-full min-h-[200px] flex flex-col items-center justify-center text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-black text-gray-800 mb-1">No transactions yet</h3>
                <p className="text-gray-400 font-medium text-sm leading-relaxed max-w-[200px]">
                  Your earnings and withdrawals will appear here.
                </p>
              </div>
            ) : TRANSACTIONS.map((tx, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-default">
                
                {/* Left Side: Icon, Date, Booking ID */}
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                    tx.type === "earned" ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-200"
                  }`}>
                    {tx.type === "earned" ? (
                      <Receipt className="w-5 h-5 text-green-600" />
                    ) : (
                      <Landmark className="w-5 h-5 text-gray-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-gray-900 mb-0.5">{tx.title}</p>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-gray-500">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {tx.date}
                      </span>
                      <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      <span>{tx.id}</span>
                    </div>
                  </div>
                </div>

                {/* Right Side: Amount */}
                <div className="flex items-center gap-1 shrink-0">
                  {tx.type === "earned" ? (
                    <>
                      <span className="text-[15px] font-black text-green-600 tracking-tight">{tx.amount}</span>
                      <ArrowDownLeft className="w-4 h-4 text-green-600" />
                    </>
                  ) : (
                    <>
                      <span className="text-[15px] font-black text-gray-900 tracking-tight">{tx.amount}</span>
                      <ArrowUpRight className="w-4 h-4 text-gray-400" />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
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
        
        <Link href="/my-pickups" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Truck className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">My Pickups</span>
        </Link>
        
        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <Wallet className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Wallet</span>
        </button>

        <Link href="/referral" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <UserPlus className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Referral</span>
        </Link>
      </nav>
      
    </div>
  );
}
