"use client";

import Link from "next/link";
import { 
  Home, 
  Tag, 
  Truck, 
  Wallet, 
  UserPlus, 
  Gift,
  Copy,
  MessageCircle,
  Share2,
  CheckCircle,
  Users,
  IndianRupee,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";

export default function ReferralPage() {
  const referralCode = "SCRAP-ANSHU50";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    toast.success("Referral code copied to clipboard!");
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Hey! Use my code ${referralCode} to join Scrap Pay and we both get ₹50 on your first scrap pickup! ♻️💰`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8    relative  flex flex-col font-sans md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Header & Hero Banner ─── */}
      <header className="px-6 pt-10 pb-4 text-center bg-gray-50 z-10 shrink-0">
        <h1 className="text-xl font-black text-gray-900 tracking-widest uppercase mb-6">
          Refer & Earn
        </h1>
        
        {/* Colorful Banner */}
        <div className="bg-gradient-to-br from-brand-100 via-brand-50 to-green-100 rounded-3xl p-6 relative overflow-hidden shadow-sm border border-brand-200">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-200/50 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-brand-600">
              <Gift className="w-7 h-7" />
            </div>
            <p className="text-lg font-black text-brand-900 leading-snug tracking-tight">
              Invite your friends to Scrap Pay and earn <span className="text-brand-600">₹50</span> on their first successful pickup!
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col px-6 space-y-6 overflow-y-auto hide-scrollbar pb-6">
        
        {/* ─── The Sharing Card (Action Center) ─── */}
        <div className="bg-white rounded-[1.5rem] shadow-md p-6 border border-gray-100">
          <p className="text-sm font-bold text-gray-800 mb-3 text-center">Your unique referral code</p>
          
          <div className="border-2 border-dashed border-brand-300 bg-brand-50 rounded-xl px-4 py-3.5 flex justify-between items-center mb-5">
            <span className="font-mono font-black text-xl text-brand-700 tracking-widest">
              {referralCode}
            </span>
            <button 
              onClick={handleCopy}
              className="p-2 bg-white rounded-lg shadow-sm border border-brand-100 text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <Copy className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              onClick={handleWhatsAppShare}
              className="w-full bg-[#25D366] text-white py-3.5 rounded-xl font-bold text-[16px] shadow-lg shadow-[#25D366]/30 hover:bg-[#20b858] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Share via WhatsApp
            </button>
            <button 
              onClick={handleCopy}
              className="w-full bg-white text-gray-700 border border-gray-200 py-3.5 rounded-xl font-bold text-[16px] shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-5 h-5" />
              Copy Referral Link
            </button>
          </div>
        </div>

        {/* ─── How it Works (Vertical Steps) ─── */}
        <div>
          <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-wider mb-4 px-1">
            How it works?
          </h3>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-6 relative">
            {/* Step 1 */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 shrink-0 bg-blue-50 rounded-full flex items-center justify-center border border-blue-100">
                <Share2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="pt-2">
                <p className="text-[14px] font-bold text-gray-800 leading-tight">Share your link or code with friends.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 shrink-0 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100">
                <Truck className="w-5 h-5 text-amber-600" />
              </div>
              <div className="pt-2">
                <p className="text-[14px] font-bold text-gray-800 leading-tight">Friend completes their first scrap pickup.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-4 items-start relative z-10">
              <div className="w-10 h-10 shrink-0 bg-brand-50 rounded-full flex items-center justify-center border border-brand-100">
                <Wallet className="w-5 h-5 text-brand-600" />
              </div>
              <div className="pt-2">
                <p className="text-[14px] font-bold text-gray-800 leading-tight">You both get ₹50 in your Wallet!</p>
              </div>
            </div>
            
            {/* Connecting line */}
            <div className="absolute top-10 left-[2.4rem] w-0.5 h-[5.5rem] bg-gray-100 z-0"></div>
          </div>
        </div>

        {/* ─── My Referral Stats (Dashboard) ─── */}
        <div className="pb-4">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-[15px] font-black text-gray-900 uppercase tracking-wider">
              My Referral Stats
            </h3>
            <button className="text-[11px] font-bold text-brand-600 flex items-center hover:text-brand-700">
              View History <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <Users className="w-4 h-4 text-gray-600" />
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Invites</p>
              <p className="text-xl font-black text-gray-900 tracking-tight">0 <span className="text-sm font-semibold text-gray-500">Friends</span></p>
            </div>
            
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col justify-center">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center mb-2">
                <IndianRupee className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Total Earned</p>
              <p className="text-xl font-black text-green-600 tracking-tight">₹ 0</p>
            </div>
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
        
        <Link href="/wallet" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Wallet className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Wallet</span>
        </Link>

        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <UserPlus className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Referral</span>
        </button>
      </nav>
      
    </div>
  );
}
