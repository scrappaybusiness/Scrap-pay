"use client";

import { OnboardingTutorial } from "@/components/OnboardingTutorial";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  Navigation,
  Sparkles,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Building2,
  Home as HomeIcon,
  CheckCircle2,
  LogIn
} from "lucide-react";
import { toast } from "sonner";

export default function HomePage() {
  const router = useRouter();

  // User & Authentication State (Supports Guest Browsing)
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState("");
  const [userMobile, setUserMobile] = useState("");
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  // 15-Minute Timer & Fast2SMS Login Modal State
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingActionUrl, setPendingActionUrl] = useState<string | null>(null);

  // Modal Fast2SMS Flow States
  const [modalStep, setModalStep] = useState<"phone" | "otp" | "role">("phone");
  const [modalPhone, setModalPhone] = useState("");
  const [modalOtp, setModalOtp] = useState(["", "", "", "", "", ""]);
  const [modalRole, setModalRole] = useState<"household" | "business" | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalNotice, setModalNotice] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─── 1. Check Authenticated Session on Load (Allows Guest Browsing) ───
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("bottelpay_token") || localStorage.getItem("scrap_pay_session");
        const userRaw = localStorage.getItem("bottelpay_user") || localStorage.getItem("scrap_pay_user");

        if (token && userRaw) {
          const user = JSON.parse(userRaw);
          if (user?.name) {
            setUserName(user.name.split(" ")[0]);
          } else {
            setUserName("User");
          }
          if (user?.mobile) setUserMobile(user.mobile);
          setIsAuthenticated(true);
        } else {
          // Guest User: Do NOT force redirect, allow free browsing!
          setIsAuthenticated(false);
          setUserName("");
        }
      }
    } catch (e) {
      setIsAuthenticated(false);
    }
  }, []);

  // ─── 2. 15-Minute Automatic Login Prompt for Guest Users ───
  useEffect(() => {
    if (isAuthenticated) return;

    // Trigger login popup after 15 minutes of guest browsing
    const FIFTEEN_MINUTES = 15 * 60 * 1000;
    const timer = setTimeout(() => {
      const dismissed = typeof window !== "undefined" && sessionStorage.getItem("scrap_pay_login_prompt_dismissed");
      if (!dismissed) {
        setShowLoginModal(true);
      }
    }, FIFTEEN_MINUTES);

    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  // Resend OTP countdown inside modal
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (showLoginModal && modalStep === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showLoginModal, modalStep, resendTimer]);

  // ─── 3. Action Interceptor for Core Features ───
  const handleProtectedAction = (targetUrl: string) => {
    if (isAuthenticated) {
      router.push(targetUrl);
    } else {
      // Guest User clicked core action (e.g. Schedule Pickup) -> show Fast2SMS Modal
      setPendingActionUrl(targetUrl);
      setShowLoginModal(true);
    }
  };

  const handleDismissModal = () => {
    setShowLoginModal(false);
    setPendingActionUrl(null);
    setModalStep("phone");
    setModalError("");
    setModalNotice("");
    if (typeof window !== "undefined") {
      sessionStorage.setItem("scrap_pay_login_prompt_dismissed", "true");
    }
  };

  // ─── 4. Modal Fast2SMS Step 1: Send OTP ───
  const handleModalPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");
    setModalNotice("");

    const cleanPhone = modalPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setModalError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: cleanPhone }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setModalOtp(["", "", "", "", "", ""]);
        setModalStep("otp");
        setResendTimer(30);
        setCanResend(false);

        if (data.dev_otp) {
          setModalNotice(`OTP dispatched via Fast2SMS. (Dev Code: ${data.dev_otp})`);
        } else {
          setModalNotice("✅ 6-digit OTP sent to your phone via Fast2SMS.");
        }
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setModalError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      setModalError(`Network error: ${err.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ─── 5. Modal Fast2SMS Step 2: Verify OTP ───
  const handleModalOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...modalOtp];
    newOtp[index] = digit;
    setModalOtp(newOtp);
    setModalError("");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleModalOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !modalOtp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleModalOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = [...modalOtp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setModalOtp(newOtp);
      const targetIndex = Math.min(pasted.length, 5);
      otpRefs.current[targetIndex]?.focus();
    }
  };

  const handleModalOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError("");

    const fullOtp = modalOtp.join("");
    if (fullOtp.length !== 6) {
      setModalError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: modalPhone,
          otp: fullOtp,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setModalError("");
        setModalNotice("");
        setModalStep("role");
      } else {
        setModalError(data.error || "Invalid OTP. Please check the code and try again.");
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setModalError(`Verification error: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // ─── 6. Modal Fast2SMS Step 3: Role & Session Confirmation ───
  const handleModalRoleSelect = (selectedRole: "household" | "business") => {
    setModalRole(selectedRole);

    const generatedName = `User ${modalPhone.slice(-4)}`;
    const userObj = {
      id: Math.floor(1000 + Math.random() * 9000),
      name: generatedName,
      mobile: `+91 ${modalPhone}`,
      role: selectedRole,
    };
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    if (typeof window !== "undefined") {
      localStorage.setItem("bottelpay_token", token);
      localStorage.setItem("bottelpay_user", JSON.stringify(userObj));
      localStorage.setItem("scrap_pay_session", "true");
      localStorage.setItem("scrap_pay_user", JSON.stringify(userObj));
      document.cookie = `bottelpay_token=${token}; path=/; max-age=2592000`;
    }

    setIsAuthenticated(true);
    setUserName(generatedName.split(" ")[0]);
    setUserMobile(userObj.mobile);
    setShowLoginModal(false);
    toast.success(`Welcome to Scrap Pay, ${generatedName}!`);

    if (pendingActionUrl) {
      router.push(pendingActionUrl);
      setPendingActionUrl(null);
    }
  };

  const handleLocationConfirm = () => {
    setIsMapOpen(false);
    toast.success("Address saved successfully");
  };

  // Dynamic Avatar Initial Generator
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "G";

  return (
    <>
    <OnboardingTutorial />
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8 relative flex flex-col font-sans overflow-hidden md:max-w-6xl md:mx-auto md:px-6 md:pt-6">
      
      {/* ─── Header Section (Dynamic Greeting & Dynamic Avatar) ─── */}
      <header className="flex justify-between items-center px-6 pt-10 pb-4 shrink-0 bg-white md:bg-transparent border-b md:border-b-0 border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight">
              Hi 👋, {isAuthenticated ? (userName || "User") : "Guest"}
            </h1>
            {!isAuthenticated && (
              <span className="bg-emerald-50 text-emerald-700 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Browsing Mode
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 font-medium">
            {isAuthenticated ? "Welcome back to your green dashboard" : "Explore scrap rates & book pickups doorstep"}
          </p>
        </div>

        {/* Dynamic Avatar with First Letter or Login Trigger */}
        {isAuthenticated ? (
          <Link 
            href="/profile" 
            className="w-11 h-11 bg-gradient-to-br from-emerald-500 to-brand-600 text-white rounded-full flex items-center justify-center font-black text-lg shadow-sm border-2 border-white ring-2 ring-emerald-100 hover:scale-105 active:scale-95 transition-transform"
            title="My Profile"
          >
            {userInitial}
          </Link>
        ) : (
          <button 
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Login</span>
          </button>
        )}
      </header>

      <main className="flex-1 px-6 md:px-0 space-y-4 md:grid md:grid-cols-2 md:gap-8 md:space-y-0 overflow-y-auto hide-scrollbar pb-24 md:pb-0 pt-3">
        
        {/* ─── 2. PROMOTIONAL BANNER: 10% Extra Cash (Prominently Visible to All) ─── */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-emerald-600 rounded-3xl p-5 shadow-lg shadow-orange-500/20 text-white flex items-center justify-between relative overflow-hidden active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3.5 relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shrink-0">
              <Sparkles className="w-7 h-7 text-yellow-200 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-white text-orange-700 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                  10% Extra
                </span>
                <span className="text-[11px] font-bold text-orange-100 tracking-wider">SPECIAL PROMO</span>
              </div>
              <h3 className="text-base font-black tracking-tight leading-snug">
                Get 10% Extra Cash on Your First Scrap Pickup! 💰
              </h3>
              <p className="text-xs text-white/90 font-medium mt-0.5">
                Bonus cash automatically applied to all doorstep orders
              </p>
            </div>
          </div>
          <button 
            onClick={() => handleProtectedAction("/book")}
            className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2.5 rounded-xl text-xs font-black shadow-md shrink-0 active:scale-95 transition-all relative z-10 ml-2"
          >
            Claim 10%
          </button>
          {/* Ambient background glow */}
          <div className="absolute -right-8 -bottom-8 w-28 h-28 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* ─── Active Pickup Notification Banner ─── */}
        <div 
          onClick={() => handleProtectedAction("/my-pickups")}
          className="bg-gradient-to-r from-blue-600 to-brand-500 rounded-2xl p-4 shadow-lg shadow-blue-500/20 text-white flex items-center justify-between active:scale-[0.98] transition-transform cursor-pointer"
        >
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
        <div 
          onClick={() => setIsMapOpen(true)}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-brand-200 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center text-brand-600">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Current Pickup Address</p>
              <p className="text-sm font-black text-gray-800">Amrath Village, Jamui</p>
            </div>
          </div>
          <span className="text-xs font-bold text-brand-600">Change</span>
        </div>

        {/* ─── Scrap Rates Card ─── */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-brand-600" /> Today's Scrap Rates
            </h2>
            <Link href="/scrap-rates" className="text-xs font-bold text-brand-600 hover:underline">
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs font-bold text-gray-500">Iron / लोहा</p>
              <p className="text-base font-black text-gray-900 mt-1">₹30<span className="text-[10px] text-gray-400 font-normal">/kg</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs font-bold text-gray-500">Paper / रद्दी</p>
              <p className="text-base font-black text-gray-900 mt-1">₹14<span className="text-[10px] text-gray-400 font-normal">/kg</span></p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xs font-bold text-gray-500">Plastic / प्लास्टिक</p>
              <p className="text-base font-black text-gray-900 mt-1">₹12<span className="text-[10px] text-gray-400 font-normal">/kg</span></p>
            </div>
          </div>
        </div>

        {/* ─── Core Action CTA: Request Pickup Now (Intercepted for Guest) ─── */}
        <div className="bg-gradient-to-br from-brand-600 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-600/20 relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 space-y-2 max-w-[220px]">
            <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full backdrop-blur-md">
              Doorstep Service
            </span>
            <h2 className="text-2xl font-black leading-tight">
              Got Scrap to Sell?
            </h2>
            <p className="text-xs text-white/80 font-medium leading-relaxed">
              Doorstep pickup with certified digital scales. Instant payment to UPI / Cash.
            </p>
          </div>
          <button 
            onClick={() => handleProtectedAction("/book")}
            className="mt-6 bg-white text-brand-700 font-black py-4 px-6 rounded-2xl text-center shadow-lg hover:bg-gray-50 active:scale-95 transition-all text-sm block w-full"
          >
            Request Pickup Now
          </button>
        </div>

        {/* ─── Leaderboard Trigger ─── */}
        <div 
          onClick={() => setIsLeaderboardOpen(true)}
          className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-yellow-300 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400">Neighborhood Champions</p>
              <p className="text-sm font-black text-gray-800">Green Recyclers Leaderboard</p>
            </div>
          </div>
          <span className="text-xs font-bold text-yellow-600">View Rank &rarr;</span>
        </div>

      </main>

      {/* ─── Leaderboard Slide-over Modal ─── */}
      <div className={`fixed inset-0 z-50 transition-opacity duration-300 ${isLeaderboardOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setIsLeaderboardOpen(false)}></div>
        <div className={`bg-gray-50 w-full max-w-md mx-auto rounded-t-3xl relative z-10 transition-transform duration-300 flex flex-col max-h-[80vh] ${isLeaderboardOpen ? "translate-y-0" : "translate-y-full"}`}>
          
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
              { rank: 1, name: isAuthenticated ? (userName || "You") : "Top Recycler", kg: 150, color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
              { rank: 2, name: "Rahul", kg: 120, color: "bg-gray-200 text-gray-700 border-gray-300" },
              { rank: 3, name: "Priya", kg: 95, color: "bg-orange-100 text-orange-700 border-orange-200" },
              { rank: 4, name: "Amit", kg: 80, color: "bg-white text-gray-700 border-gray-100" },
              { rank: 5, name: "Neha", kg: 65, color: "bg-white text-gray-700 border-gray-100" },
            ].map((user) => (
              <div key={user.rank} className={`flex items-center justify-between p-4 rounded-2xl border shadow-sm ${user.rank <= 3 ? user.color : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-4">
                  <span className="text-lg font-black w-6 text-center">{user.rank}</span>
                  <div className="w-10 h-10 bg-white/50 rounded-full flex items-center justify-center border border-black/5 font-black text-sm">
                    {user.name.charAt(0)}
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

      {/* ─── 3. FAST2SMS OTP LOGIN POPUP MODAL (With "Skip" & "Close (X)" UX) ─── */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 overflow-hidden">
            
            {/* Clear Close (X) Button */}
            <button 
              onClick={handleDismissModal}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
              title="Close and continue browsing"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center text-center mb-6 pt-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
                <Recycle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {modalStep === "phone" && "Login to Scrap Pay"}
                {modalStep === "otp" && "Verify 6-Digit OTP"}
                {modalStep === "role" && "Choose Your Profile"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {modalStep === "phone" && "Enter your 10-digit number to receive a secure OTP."}
                {modalStep === "otp" && `Enter the 6-digit code sent to +91 ${modalPhone}`}
                {modalStep === "role" && "Select how you'll use Scrap Pay"}
              </p>
            </div>

            {/* Error & Notice Banners */}
            {modalError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalNotice && (
              <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                {modalNotice}
              </div>
            )}

            {/* MODAL STEP 1: Phone */}
            {modalStep === "phone" && (
              <form onSubmit={handleModalPhoneSubmit} className="space-y-4">
                <div className="flex bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <div className="flex items-center justify-center px-3.5 border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-sm">
                    🇮🇳 +91
                  </div>
                  <input 
                    type="tel"
                    maxLength={10}
                    value={modalPhone}
                    onChange={(e) => {
                      setModalPhone(e.target.value.replace(/\D/g, ""));
                      setModalError("");
                    }}
                    placeholder="Enter 10-digit number"
                    className="flex-1 py-3 px-3 text-slate-900 font-bold tracking-widest placeholder-slate-400 focus:outline-none text-base"
                    autoFocus
                  />
                </div>

                <button 
                  type="submit"
                  disabled={modalPhone.length !== 10 || isSendingOtp}
                  className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? "Sending OTP via Fast2SMS..." : "Send OTP"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* MODAL STEP 2: 6-Digit OTP */}
            {modalStep === "otp" && (
              <form onSubmit={handleModalOtpSubmit} className="space-y-5">
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={modalOtp[i]}
                      onChange={(e) => handleModalOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleModalOtpKeyDown(i, e)}
                      onPaste={i === 0 ? handleModalOtpPaste : undefined}
                      className="w-full h-12 bg-white border border-slate-300 rounded-xl text-center text-lg font-black text-slate-900 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <button 
                    type="button" 
                    onClick={() => setModalStep("phone")}
                    className="text-slate-600 hover:underline"
                  >
                    Edit Number
                  </button>
                  {canResend ? (
                    <button 
                      type="button" 
                      onClick={() => handleModalPhoneSubmit({ preventDefault: () => {} } as React.FormEvent)}
                      className="text-emerald-600 font-bold flex items-center gap-1 hover:underline"
                    >
                      <RotateCcw className="w-3 h-3" /> Resend
                    </button>
                  ) : (
                    <span className="text-slate-400">Resend in {resendTimer}s</span>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={!modalOtp.every((d) => d.trim().length === 1) || isVerifyingOtp}
                  className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Proceed"}
                </button>
              </form>
            )}

            {/* MODAL STEP 3: Role Selection */}
            {modalStep === "role" && (
              <div className="space-y-3">
                <button 
                  onClick={() => handleModalRoleSelect("household")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left ${modalRole === "household" ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white">
                      <HomeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Household</h4>
                      <p className="text-[11px] text-slate-500">Sell scrap from your home</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </button>

                <button 
                  onClick={() => handleModalRoleSelect("business")}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all text-left ${modalRole === "business" ? "border-emerald-600 bg-emerald-50" : "border-slate-200 bg-white hover:border-emerald-300 shadow-sm"}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Business Owner</h4>
                      <p className="text-[11px] text-slate-500">Shop, office or factory</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
            )}

            {/* Crucial UX: Skip Button */}
            <div className="mt-5 text-center pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={handleDismissModal}
                className="text-xs text-slate-500 hover:text-emerald-700 font-bold transition-colors py-1 px-3 rounded-lg hover:bg-slate-50"
              >
                Skip for now & Continue Browsing &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Fixed Bottom Navigation Bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center py-3 pb-6 md:pb-3 z-40 shadow-lg">
        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <Home className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Home</span>
        </button>
        
        <Link href="/scrap-rates" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Tag className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Scrap Rates</span>
        </Link>
        
        <button onClick={() => handleProtectedAction("/my-pickups")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Truck className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">My Pickups</span>
        </button>
        
        <button onClick={() => handleProtectedAction("/wallet")} className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Wallet className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Wallet</span>
        </button>

        <Link href="/profile" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <User className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </nav>
    </div>
    </>
  );
}
