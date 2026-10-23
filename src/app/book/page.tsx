"use client";

import { useState, useEffect, useRef } from "react";
import { 
  X, 
  Bike, 
  Truck, 
  MapPin, 
  Navigation, 
  Calendar, 
  Clock, 
  Check, 
  Search,
  ChevronLeft,
  Loader2,
  Recycle,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  Building2,
  Home as HomeIcon,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getScrapProducts, OdooProduct } from "@/lib/odoo";

const DEFAULT_SCRAP_OPTIONS = [
  "Normal Recyclables", "Large Appliances", "Small Appliances", 
  "IT/E-waste", "Vehicle Scrap", "Others"
];

export default function BookPickupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [vehicle, setVehicle] = useState<"small" | "large" | null>(null);
  const [scrapTypes, setScrapTypes] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [scrapOptions, setScrapOptions] = useState<string[]>(DEFAULT_SCRAP_OPTIONS);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Mandatory Checkout Fast2SMS Login Modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authStep, setAuthStep] = useState<"phone" | "otp" | "role">("phone");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState(["", "", "", "", "", ""]);
  const [authRole, setAuthRole] = useState<"household" | "business" | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setMounted(true);

    // Fetch live products/categories from Odoo
    getScrapProducts()
      .then((products: OdooProduct[]) => {
        if (products && products.length > 0) {
          const names = Array.from(new Set(products.map(p => p.name)));
          setScrapOptions(names);
        }
      })
      .catch(() => {
        setScrapOptions(DEFAULT_SCRAP_OPTIONS);
      })
      .finally(() => {
        setLoadingOptions(false);
      });
  }, []);

  // Resend OTP countdown inside checkout modal
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (showAuthModal && authStep === "otp" && resendTimer > 0) {
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
  }, [showAuthModal, authStep, resendTimer]);

  const toggleScrapType = (type: string) => {
    if (scrapTypes.includes(type)) {
      setScrapTypes(scrapTypes.filter(t => t !== type));
    } else {
      setScrapTypes([...scrapTypes, type]);
    }
  };

  // ─── Final Step Confirmation (Mandatory Login Enforced Here Only) ───
  const handleConfirm = () => {
    if (!vehicle || scrapTypes.length === 0) {
      toast.error("Please select a vehicle and at least one scrap type.");
      return;
    }

    const token = typeof window !== "undefined" && (localStorage.getItem("bottelpay_token") || localStorage.getItem("scrap_pay_session"));
    if (!token) {
      // User is a guest -> Mandatory login required only at final checkout!
      toast.info("Please login with mobile OTP to confirm your pickup.");
      setShowAuthModal(true);
      return;
    }

    finalizePickup();
  };

  const finalizePickup = () => {
    toast.success("Pickup Confirmed! Partner is assigned.");
    router.push("/");
  };

  // Checkout Fast2SMS Modal Handlers
  const handleAuthPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthNotice("");

    const cleanPhone = authPhone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setAuthError("Please enter a valid 10-digit Indian mobile number.");
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
        setAuthOtp(["", "", "", "", "", ""]);
        setAuthStep("otp");
        setResendTimer(30);
        setCanResend(false);

        if (data.dev_otp) {
          setAuthNotice(`OTP dispatched via Fast2SMS. (Dev Code: ${data.dev_otp})`);
        } else {
          setAuthNotice("✅ 6-digit OTP sent to your phone via Fast2SMS.");
        }
        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setAuthError(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      setAuthError(`Network error: ${err.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleAuthOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...authOtp];
    newOtp[index] = digit;
    setAuthOtp(newOtp);
    setAuthError("");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleAuthOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    const fullOtp = authOtp.join("");
    if (fullOtp.length !== 6) {
      setAuthError("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: authPhone,
          otp: fullOtp,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setAuthError("");
        setAuthNotice("");
        setAuthStep("role");
      } else {
        setAuthError(data.error || "Invalid OTP. Please check the code.");
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setAuthError(`Verification error: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleAuthRoleSelect = (selectedRole: "household" | "business") => {
    setAuthRole(selectedRole);

    const generatedName = `User ${authPhone.slice(-4)}`;
    const userObj = {
      id: Math.floor(1000 + Math.random() * 9000),
      name: generatedName,
      mobile: `+91 ${authPhone}`,
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

    setShowAuthModal(false);
    toast.success(`Account verified! Finalizing your pickup...`);
    finalizePickup();
  };

  return (
    <div className="w-full min-h-screen bg-gray-900 md:bg-transparent relative flex flex-col font-sans overflow-hidden md:py-8">
      
      {/* ─── Slide-over Container ─── */}
      <div className={`w-full min-h-screen md:min-h-0 bg-gray-50 flex flex-col transition-transform duration-500 ease-out md:max-w-4xl md:mx-auto md:rounded-3xl md:shadow-2xl md:overflow-hidden ${mounted ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
        
        {/* Header */}
        <header className="px-4 pt-6 pb-4 bg-white sticky top-0 z-20 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-xl font-black text-gray-900">Schedule Pickup</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto hide-scrollbar pb-32">
          
          {/* Vehicle Selection */}
          <section className="px-5 py-6 bg-white mb-2">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Select Vehicle Quantity</h2>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setVehicle("small")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${vehicle === "small" ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-brand-200 shadow-sm"}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${vehicle === "small" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  <Bike className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Small Quantity</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Fits in Scooty/Bike</p>
              </button>

              <button 
                onClick={() => setVehicle("large")}
                className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center text-center ${vehicle === "large" ? "border-brand-600 bg-brand-50" : "border-gray-100 hover:border-brand-200 shadow-sm"}`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${vehicle === "large" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Large Quantity</h3>
                <p className="text-[10px] text-gray-500 mt-0.5">Requires Pickup Van</p>
              </button>
            </div>
          </section>

          {/* Scrap Types Selection */}
          <section className="px-5 py-6 bg-white mb-2">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Select Scrap Items</h2>
            {loadingOptions ? (
              <div className="flex items-center justify-center p-8 text-gray-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading scrap items...
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {scrapOptions.map((type) => {
                  const isSelected = scrapTypes.includes(type);
                  return (
                    <button
                      key={type}
                      onClick={() => toggleScrapType(type)}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${isSelected ? "bg-emerald-600 border-emerald-600 text-white shadow-sm" : "bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300"}`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {type}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Address & Time Slot */}
          <section className="px-5 py-6 bg-white mb-2">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Pickup Details</h2>
            <div 
              onClick={() => setIsMapOpen(true)}
              className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between cursor-pointer hover:border-gray-300 transition-colors mb-3"
            >
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-gray-500">Pickup Location</p>
                  <p className="text-sm font-black text-gray-900">Amrath Village, Jamui</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600">Change</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Today" className="bg-transparent text-sm font-bold text-gray-900 w-full outline-none placeholder-gray-500" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <Clock className="w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Anytime" className="bg-transparent text-sm font-bold text-gray-900 w-full outline-none placeholder-gray-500" />
              </div>
            </div>
          </section>

        </main>

        {/* Floating Action Button */}
        <div className="absolute bottom-0 left-0 w-full p-5 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-20">
          <button 
            onClick={handleConfirm}
            className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-[#25D366]/30 hover:bg-[#20b858] hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            Confirm Pickup
          </button>
        </div>
      </div>

      {/* ─── Map & Location UI Modal ─── */}
      <div className={`fixed inset-0 z-50 flex flex-col bg-white transition-transform duration-300 ease-in-out ${isMapOpen ? 'translate-y-0' : 'translate-y-full'}`}>
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
          <button className="flex items-center gap-2 text-brand-600 font-bold text-sm bg-brand-50 px-4 py-3 rounded-xl w-full justify-center">
            <Navigation className="w-4 h-4" /> Use Current Location
          </button>
        </div>

        <div className="flex-1 bg-blue-50 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent bg-[length:20px_20px]"></div>
          <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.3 }}></div>
          
          <div className="absolute z-10 flex flex-col items-center">
            <div className="bg-gray-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full mb-1 shadow-lg">Move pin to adjust</div>
            <MapPin className="w-10 h-10 text-brand-600 drop-shadow-md -mt-2" />
            <div className="w-2 h-1 bg-black/20 rounded-full mt-1 blur-[1px]"></div>
          </div>
        </div>

        <div className="p-5 bg-white border-t border-gray-100 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)] z-10">
          <button onClick={() => setIsMapOpen(false)} className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-[16px] shadow-lg shadow-brand-600/30">
            Confirm Location
          </button>
        </div>
      </div>

      {/* ─── MANDATORY CHECKOUT LOGIN MODAL (Triggered only on Confirm Pickup) ─── */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl relative border border-slate-100 overflow-hidden">
            
            {/* Close Button */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center text-center mb-6 pt-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3 text-emerald-600">
                <Recycle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900">
                {authStep === "phone" && "Verify to Confirm Pickup"}
                {authStep === "otp" && "Enter 6-Digit OTP"}
                {authStep === "role" && "Confirm Profile"}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authStep === "phone" && "Enter your 10-digit number to receive order updates."}
                {authStep === "otp" && `Enter the 6-digit code sent to +91 ${authPhone}`}
                {authStep === "role" && "Select account type"}
              </p>
            </div>

            {authError && (
              <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authNotice && (
              <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
                {authNotice}
              </div>
            )}

            {authStep === "phone" && (
              <form onSubmit={handleAuthPhoneSubmit} className="space-y-4">
                <div className="flex bg-white rounded-xl border border-slate-300 shadow-sm overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                  <div className="flex items-center justify-center px-3.5 border-r border-slate-200 bg-slate-50 text-slate-700 font-bold text-sm">
                    🇮🇳 +91
                  </div>
                  <input 
                    type="tel"
                    maxLength={10}
                    value={authPhone}
                    onChange={(e) => {
                      setAuthPhone(e.target.value.replace(/\D/g, ""));
                      setAuthError("");
                    }}
                    placeholder="Enter 10-digit number"
                    className="flex-1 py-3 px-3 text-slate-900 font-bold tracking-widest placeholder-slate-400 focus:outline-none text-base"
                    autoFocus
                  />
                </div>

                <button 
                  type="submit"
                  disabled={authPhone.length !== 10 || isSendingOtp}
                  className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isSendingOtp ? "Sending OTP via Fast2SMS..." : "Send OTP"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {authStep === "otp" && (
              <form onSubmit={handleAuthOtpSubmit} className="space-y-5">
                <div className="grid grid-cols-6 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={authOtp[i]}
                      onChange={(e) => handleAuthOtpChange(i, e.target.value)}
                      className="w-full h-12 bg-white border border-slate-300 rounded-xl text-center text-lg font-black text-slate-900 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                  <button type="button" onClick={() => setAuthStep("phone")} className="text-slate-600 hover:underline">
                    Edit Number
                  </button>
                  {canResend ? (
                    <button 
                      type="button" 
                      onClick={() => handleAuthPhoneSubmit({ preventDefault: () => {} } as React.FormEvent)}
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
                  disabled={!authOtp.every((d) => d.trim().length === 1) || isVerifyingOtp}
                  className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-3.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
                >
                  {isVerifyingOtp ? "Verifying..." : "Verify & Confirm Pickup"}
                </button>
              </form>
            )}

            {authStep === "role" && (
              <div className="space-y-3">
                <button 
                  onClick={() => handleAuthRoleSelect("household")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white">
                      <HomeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Household</h4>
                      <p className="text-[11px] text-slate-500">Recycle from home</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </button>

                <button 
                  onClick={() => handleAuthRoleSelect("business")}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-slate-200 bg-white hover:border-emerald-300 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-600 text-white">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Business</h4>
                      <p className="text-[11px] text-slate-500">Shop or enterprise</p>
                    </div>
                  </div>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </button>
              </div>
            )}

            {/* Skip Button */}
            <div className="mt-5 text-center pt-3 border-t border-slate-100">
              <button 
                type="button" 
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-slate-500 hover:text-emerald-700 font-bold transition-colors py-1 px-3 rounded-lg hover:bg-slate-50"
              >
                Cancel & Review Order
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
