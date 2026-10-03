"use client";

import { useState } from "react";
import Image from "next/image";
import { Recycle, ArrowRight, Building2, Home as HomeIcon, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp" | "role">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState<"household" | "business" | null>(null);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length === 10) setStep("otp");
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length === 4) setStep("role");
  };

  const handleRoleSelect = (selectedRole: "household" | "business") => {
    setRole(selectedRole);
    // Simulate API call and redirect
    setTimeout(() => {
      router.push("/");
    }, 600);
  };

  return (
    <div className="w-full min-h-screen bg-white relative  flex flex-col font-sans overflow-hidden">
      
      {/* Dynamic Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-50 rounded-b-[4rem] -z-10"></div>
      
      <div className="flex-1 flex flex-col px-6 pt-16 pb-6">
        
        <div className="flex flex-col items-center mb-10">
          <Image src="/logo-stacked-transparent.png" alt="Scrap Pay" width={120} height={120} className="mb-4 object-contain" />
          <p className="text-sm font-medium text-gray-500 mt-1 text-center">India's smartest recycling platform</p>
        </div>

        {/* View Transitions Container */}
        <div className="flex-1 flex flex-col justify-center relative">
          
          {/* STEP 1: Phone */}
          <div className={`transition-all duration-500 absolute w-full ${step === "phone" ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 -translate-x-full pointer-events-none"}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Enter your phone number</h2>
            <p className="text-sm text-gray-500 mb-6">We'll send you an OTP to verify your account.</p>
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="flex bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all">
                <div className="flex items-center justify-center px-4 border-r border-gray-200 bg-gray-50 text-gray-600 font-bold text-sm">
                  +91
                </div>
                <input 
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="99999 99999"
                  className="flex-1 py-4 px-4 text-gray-900 font-bold tracking-widest placeholder-gray-300 focus:outline-none"
                  autoFocus
                />
              </div>
              <button 
                disabled={phone.length !== 10}
                className="w-full bg-brand-600 disabled:bg-brand-300 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
              >
                Continue <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

          {/* STEP 2: OTP */}
          <div className={`transition-all duration-500 absolute w-full ${step === "otp" ? "opacity-100 translate-x-0 pointer-events-auto" : step === "phone" ? "opacity-0 translate-x-full pointer-events-none" : "opacity-0 -translate-x-full pointer-events-none"}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Verify OTP</h2>
            <p className="text-sm text-gray-500 mb-6">Enter the 4-digit code sent to +91 {phone}</p>
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-between gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <input 
                    key={i}
                    type="text"
                    maxLength={1}
                    value={otp[i] || ""}
                    onChange={(e) => {
                      const newOtp = otp.split("");
                      newOtp[i] = e.target.value;
                      setOtp(newOtp.join(""));
                      if (e.target.value && e.target.nextElementSibling) {
                        (e.target.nextElementSibling as HTMLInputElement).focus();
                      }
                    }}
                    className="w-16 h-16 bg-white border border-gray-200 rounded-xl text-center text-2xl font-black text-gray-900 shadow-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                  />
                ))}
              </div>
              <button 
                disabled={otp.length !== 4}
                className="w-full bg-brand-600 disabled:bg-brand-300 text-white py-4 rounded-xl font-bold text-lg shadow-md hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
              >
                Verify & Proceed
              </button>
            </form>
          </div>

          {/* STEP 3: Role */}
          <div className={`transition-all duration-500 absolute w-full ${step === "role" ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 translate-x-full pointer-events-none"}`}>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Who are you?</h2>
            <p className="text-sm text-gray-500 mb-6">Select your profile type to personalize your experience.</p>
            <div className="space-y-4">
              <button 
                onClick={() => handleRoleSelect("household")}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${role === "household" ? "border-brand-600 bg-brand-50" : "border-gray-100 bg-white hover:border-brand-200 hover:bg-gray-50 shadow-sm"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "household" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    <HomeIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Household / Common</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Recycle from your home</p>
                  </div>
                </div>
                {role === "household" && <CheckCircle2 className="w-6 h-6 text-brand-600" />}
              </button>

              <button 
                onClick={() => handleRoleSelect("business")}
                className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${role === "business" ? "border-brand-600 bg-brand-50" : "border-gray-100 bg-white hover:border-brand-200 hover:bg-gray-50 shadow-sm"}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${role === "business" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-500"}`}>
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Business Owner</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Small or Big enterprise</p>
                  </div>
                </div>
                {role === "business" && <CheckCircle2 className="w-6 h-6 text-brand-600" />}
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
