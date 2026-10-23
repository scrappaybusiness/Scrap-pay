"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Recycle, ArrowRight, Building2, Home as HomeIcon, CheckCircle2, RotateCcw, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "role">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [role, setRole] = useState<"household" | "business" | null>(null);

  // Loading & error states
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [noticeMessage, setNoticeMessage] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resending OTP
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === "otp" && resendTimer > 0) {
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
  }, [step, resendTimer]);

  // STEP 1: Send real Fast2SMS OTP
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setNoticeMessage("");

    const cleanPhone = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
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
        setOtp(["", "", "", "", "", ""]);
        setStep("otp");
        setResendTimer(30);
        setCanResend(false);

        if (data.dev_otp) {
          setNoticeMessage(`OTP dispatched via Fast2SMS. (Dev Code: ${data.dev_otp})`);
        } else {
          setNoticeMessage("✅ 6-digit OTP sent to your phone via Fast2SMS.");
        }

        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setErrorMessage(data.error || "Failed to send OTP. Please try again.");
      }
    } catch (err: any) {
      setErrorMessage(`Network error: ${err.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // STEP 2: Verify 6-digit OTP
  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setErrorMessage("");

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      const targetIndex = Math.min(pasted.length, 5);
      otpRefs.current[targetIndex]?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the OTP.");
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mobile: phone,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setErrorMessage("");
        setNoticeMessage("");
        setStep("role");
      } else {
        setErrorMessage(data.error || "Invalid OTP. Please check the code and try again.");
        otpRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setErrorMessage(`Verification error: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMessage("");
    await handlePhoneSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  // STEP 3: Select Role & Save Authenticated Session
  const handleRoleSelect = (selectedRole: "household" | "business") => {
    setRole(selectedRole);

    const userObj = {
      id: Math.floor(1000 + Math.random() * 9000),
      name: `User ${phone.slice(-4)}`,
      mobile: `+91 ${phone}`,
      role: selectedRole,
    };
    const token = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Set authenticated session in storage & cookie
    if (typeof window !== "undefined") {
      localStorage.setItem("bottelpay_token", token);
      localStorage.setItem("bottelpay_user", JSON.stringify(userObj));
      localStorage.setItem("scrap_pay_session", "true");
      localStorage.setItem("scrap_pay_user", JSON.stringify(userObj));
      document.cookie = `bottelpay_token=${token}; path=/; max-age=2592000`;
    }

    // Redirect to dashboard
    setTimeout(() => {
      router.replace("/");
    }, 400);
  };

  const isOtpComplete = otp.every((d) => d.trim().length === 1);

  return (
    <div className="w-full min-h-screen bg-white relative flex flex-col font-sans overflow-hidden">
      
      {/* Background Gradient */}
      <div className="absolute top-0 left-0 w-full h-64 bg-emerald-50 rounded-b-[4rem] -z-10"></div>
      
      <div className="flex-1 flex flex-col px-6 pt-16 pb-6 max-w-md mx-auto w-full">
        
        <div className="flex flex-col items-center mb-8">
          <Image src="/logo-stacked-transparent.png" alt="Scrap Pay" width={110} height={110} className="mb-3 object-contain" />
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Scrap Pay</h1>
          <p className="text-sm font-medium text-slate-500 mt-0.5 text-center">India's smartest recycling platform</p>
        </div>

        {/* Notices & Errors */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {noticeMessage && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold">
            {noticeMessage}
          </div>
        )}

        {/* Multi-Step Flow */}
        <div className="flex-1 flex flex-col justify-center relative min-h-[340px]">
          
          {/* STEP 1: Mobile Number Input */}
          <div className={`transition-all duration-300 ${step === "phone" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none hidden"}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Enter Mobile Number</h2>
            <p className="text-sm text-gray-500 mb-6">We will send a 6-digit OTP to verify your account.</p>
            
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex bg-white rounded-xl border border-gray-300 shadow-sm overflow-hidden focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
                <div className="flex items-center justify-center px-4 border-r border-gray-200 bg-gray-50 text-gray-700 font-bold text-sm">
                  🇮🇳 +91
                </div>
                <input 
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ""));
                    setErrorMessage("");
                  }}
                  placeholder="Enter 10-digit number"
                  className="flex-1 py-4 px-4 text-gray-900 font-bold tracking-widest placeholder-gray-400 focus:outline-none text-base"
                  autoFocus
                />
              </div>

              <button 
                type="submit"
                disabled={phone.length !== 10 || isSendingOtp}
                className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isSendingOtp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Sending OTP via Fast2SMS...
                  </>
                ) : (
                  <>
                    Send OTP <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* STEP 2: Real 6-Digit OTP Verification */}
          <div className={`transition-all duration-300 ${step === "otp" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none hidden"}`}>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-gray-900">Verify 6-Digit OTP</h2>
              <button 
                type="button" 
                onClick={() => {
                  setStep("phone");
                  setErrorMessage("");
                  setNoticeMessage("");
                }} 
                className="text-xs text-emerald-600 font-bold hover:underline"
              >
                Change Number
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-6">Enter the 6-digit code sent to +91 {phone}</p>
            
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="grid grid-cols-6 gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <input 
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i]}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className="w-full h-14 bg-white border border-gray-300 rounded-xl text-center text-xl font-black text-gray-900 shadow-sm focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 outline-none transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
                <span>Didn't receive the SMS?</span>
                {canResend ? (
                  <button 
                    type="button" 
                    onClick={handleResendOtp}
                    className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resend OTP
                  </button>
                ) : (
                  <span className="text-gray-400">Resend in {resendTimer}s</span>
                )}
              </div>

              <button 
                type="submit"
                disabled={!isOtpComplete || isVerifyingOtp}
                className="w-full bg-emerald-600 disabled:bg-emerald-300 text-white py-4 rounded-xl font-bold text-base shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isVerifyingOtp ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Verifying OTP...
                  </>
                ) : (
                  "Verify & Proceed"
                )}
              </button>
            </form>
          </div>

          {/* STEP 3: Role Selection */}
          <div className={`transition-all duration-300 ${step === "role" ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none hidden"}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Select Profile Type</h2>
            <p className="text-sm text-gray-500 mb-6">Choose how you plan to use Scrap Pay.</p>
            
            <div className="space-y-4">
              <button 
                onClick={() => handleRoleSelect("household")}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${role === "household" ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50 shadow-sm"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "household" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <HomeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Household / Common</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Sell scrap from your home</p>
                  </div>
                </div>
                {role === "household" && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </button>

              <button 
                onClick={() => handleRoleSelect("business")}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${role === "business" ? "border-emerald-600 bg-emerald-50" : "border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50 shadow-sm"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "business" ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600"}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Business Owner</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Shop, warehouse or factory</p>
                  </div>
                </div>
                {role === "business" && <CheckCircle2 className="w-6 h-6 text-emerald-600" />}
              </button>
            </div>
          </div>
          
        </div>

        {/* Crucial UX: Skip & Browse as Guest Button */}
        <div className="mt-8 text-center pt-4 border-t border-slate-100">
          <button 
            type="button" 
            onClick={() => router.push("/")}
            className="text-xs text-slate-500 hover:text-emerald-700 font-bold transition-colors py-2 px-4 rounded-xl hover:bg-slate-50 flex items-center justify-center gap-1.5 mx-auto"
          >
            <span>Skip for now & Browse as Guest</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
