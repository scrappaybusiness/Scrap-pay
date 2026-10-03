"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  User, 
  MapPin, 
  Globe, 
  Bell, 
  HelpCircle, 
  FileText, 
  LogOut,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
  Phone,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const [activeModal, setActiveModal] = useState<"none" | "address" | "language" | "notifications" | "help" | "logout">("none");

  const LANGUAGES = [
    "English", "Hindi (हिन्दी)", "Bengali (বাংলা)", "Marathi (मराठी)", 
    "Telugu (తెలుగు)", "Tamil (தமிழ்)", "Gujarati (ગુજરાતી)", "Urdu (اردو)", 
    "Kannada (ಕನ್ನಡ)", "Odia (ଓଡ଼ିଆ)", "Malayalam (മലയാളം)", "Punjabi (ਪੰਜਾਬੀ)",
    "Assamese (অসমীয়া)", "Maithili (मैथिली)", "Santali (ᱥᱟᱱᱛᱟᱲᱤ)", "Kashmiri (कॉशुर)",
    "Nepali (नेपाली)", "Konkani (कोंकणी)", "Sindhi (سنڌي)", "Dogri (डोगरी)",
    "Manipuri (ꯃꯤꯇꯩꯂꯣꯟ)", "Bodo (बर')", "Sanskrit (संस्कृतम्)"
  ];

  const handleLogout = () => {
    localStorage.removeItem("bottelpay_token");
    localStorage.removeItem("bottelpay_user");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8    relative  flex flex-col font-sans overflow-hidden md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Main Profile View ─── */}
      <div className={`w-full min-h-screen flex flex-col transition-transform duration-300 ${activeModal !== "none" ? "-translate-x-1/4 opacity-50" : "translate-x-0 opacity-100"}`}>
        <header className="px-6 pt-12 pb-6 bg-white border-b border-gray-100 flex items-center justify-between">
          <Image src="/logo-horizontal-transparent.png" alt="Scrap Pay" width={140} height={40} className="w-auto h-8 object-contain" />
        </header>

        <div className="px-6 py-8 flex flex-col items-center bg-white mb-3 shadow-sm border-b border-gray-100">
          <div className="w-24 h-24 bg-brand-50 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md relative">
            <User className="w-10 h-10 text-brand-600" />
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-1">Anshu Kumar</h2>
          <p className="text-sm font-bold text-gray-500">+91 92622 05461</p>
          <div className="mt-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-200">
            <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wide">Household Account</span>
          </div>
        </div>

        <main className="flex-1 px-4 py-4 space-y-2">
          <button onClick={() => setActiveModal("address")} className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><MapPin className="w-5 h-5"/></div>
              <span className="font-bold text-gray-900">Manage Addresses</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => setActiveModal("language")} className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600"><Globe className="w-5 h-5"/></div>
              <span className="font-bold text-gray-900">Change Language</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => setActiveModal("notifications")} className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600"><Bell className="w-5 h-5"/></div>
              <span className="font-bold text-gray-900">Notifications</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => setActiveModal("help")} className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600"><HelpCircle className="w-5 h-5"/></div>
              <span className="font-bold text-gray-900">Help & Support</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button className="w-full bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600"><FileText className="w-5 h-5"/></div>
              <span className="font-bold text-gray-900">Terms & Privacy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          <button onClick={() => setActiveModal("logout")} className="w-full bg-white mt-4 p-4 rounded-2xl flex items-center gap-4 shadow-sm border border-red-100 hover:bg-red-50 transition-colors">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500"><LogOut className="w-5 h-5"/></div>
            <span className="font-bold text-red-600">Logout</span>
          </button>
        </main>
      </div>

      {/* ─── Manage Addresses Slide-over ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out ${activeModal === "address" ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center shadow-sm z-10 shrink-0">
          <button onClick={() => setActiveModal("none")} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-black text-gray-900">Manage Addresses</h2>
        </header>
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-4 border-l-4 border-l-brand-600 relative">
            <div className="absolute top-4 right-4 text-[10px] bg-brand-50 text-brand-600 font-bold px-2 py-1 rounded">Primary</div>
            <p className="font-bold text-gray-900 mb-1 text-sm">Amrath Village</p>
            <p className="text-xs text-gray-500">Near Main Market, Jamui, Bihar 811305, India</p>
          </div>
          <Link href="/book" onClick={() => setActiveModal("none")} className="w-full bg-gray-100 border border-dashed border-gray-300 text-gray-600 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
            <Plus className="w-5 h-5" /> Add New Address
          </Link>
        </div>
      </div>

      {/* ─── Change Language Slide-over ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out ${activeModal === "language" ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center shadow-sm z-10 shrink-0">
          <button onClick={() => setActiveModal("none")} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-black text-gray-900">Select Language</h2>
        </header>
        <div className="flex-1 p-5 overflow-y-auto hide-scrollbar space-y-2">
          {LANGUAGES.map((lang, i) => (
            <label key={i} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:border-brand-300">
              <span className="font-bold text-gray-800 text-sm">{lang}</span>
              <input type="radio" name="language" defaultChecked={i === 0} className="w-5 h-5 accent-brand-600" />
            </label>
          ))}
        </div>
      </div>

      {/* ─── Notifications Slide-over ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out ${activeModal === "notifications" ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center shadow-sm z-10 shrink-0">
          <button onClick={() => setActiveModal("none")} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-black text-gray-900">Notifications</h2>
        </header>
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Pickup Alerts</p>
              <p className="text-xs text-gray-500">Driver arrival, status updates</p>
            </div>
            <div className="w-12 h-6 bg-brand-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-900 text-sm">Promotional Offers</p>
              <p className="text-xs text-gray-500">Rate boosts, referral bonuses</p>
            </div>
            <div className="w-12 h-6 bg-gray-200 rounded-full relative cursor-pointer">
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Help & Support Slide-over ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out ${activeModal === "help" ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="px-4 py-4 bg-white border-b border-gray-100 flex items-center shadow-sm z-10 shrink-0">
          <button onClick={() => setActiveModal("none")} className="p-2 mr-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <ChevronLeft className="w-5 h-5 text-gray-900" />
          </button>
          <h2 className="text-lg font-black text-gray-900">Help & Support</h2>
        </header>
        <div className="flex-1 p-5 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <HelpCircle className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">We're here to help</h3>
          <p className="text-sm text-gray-500 mb-8 px-4">Contact our support team for any queries related to your scrap pickups.</p>
          
          <button className="w-full bg-white border border-gray-200 py-4 rounded-xl font-bold text-[15px] shadow-sm flex items-center justify-center gap-3 mb-4 hover:bg-gray-50">
            <Phone className="w-5 h-5 text-gray-700" />
            Call Toll-Free: 1800-123-4567
          </button>
          
          <button className="w-full bg-[#25D366] text-white py-4 rounded-xl font-bold text-[15px] shadow-lg shadow-[#25D366]/30 flex items-center justify-center gap-3 hover:bg-[#20b858]">
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </button>
        </div>
      </div>

      {/* ─── Logout Confirmation Modal (Pop-up) ─── */}
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${activeModal === "logout" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setActiveModal("none")}></div>
        <div className={`bg-white w-full max-w-[320px] rounded-3xl p-6  relative z-10 transition-transform duration-300 ${activeModal === "logout" ? "scale-100 translate-y-0" : "scale-95 translate-y-4"}`}>
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
            <LogOut className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-black text-gray-900 text-center mb-2">Sign Out</h3>
          <p className="text-sm text-gray-500 text-center mb-6">Are you sure you want to log out of your Scrap Pay account?</p>
          <div className="flex gap-3">
            <button onClick={() => setActiveModal("none")} className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-200">
              Cancel
            </button>
            <button onClick={handleLogout} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 shadow-lg shadow-red-500/30">
              Yes, Logout
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
