'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function ScrapPayOnboardingPage() {
  // Session State (Persistence via localStorage)
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [sessionToast, setSessionToast] = useState(null);

  // Multi-Step Navigation & Form State
  const [currentStep, setCurrentStep] = useState(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState(''); // 'customer' or 'partner'
  const [subtype, setSubtype] = useState('');
  
  // Real Fast2SMS & Verification States
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpNotice, setOtpNotice] = useState('');
  const [otpError, setOtpError] = useState('');
  const [mobileError, setMobileError] = useState('');
  
  // Final Submission to /api/register
  const [showModal, setShowModal] = useState(false);
  const [isRegisteringOdoo, setIsRegisteringOdoo] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  // Refs for OTP inputs
  const otpRefs = useRef([]);

  // =========================================================================
  // 1. SESSION MANAGEMENT: Check localStorage on page load (F5 / refresh)
  // =========================================================================
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const sessionActive = localStorage.getItem('scrap_pay_session');
        const savedUserData = localStorage.getItem('scrap_pay_user');

        if (sessionActive === 'true' && savedUserData) {
          const parsedUser = JSON.parse(savedUserData);
          if (parsedUser && parsedUser.name) {
            console.log('[Scrap Pay Session] Active session found for:', parsedUser.name);
            setCurrentUser(parsedUser);
            setIsLoggedIn(true);
          }
        }
      }
    } catch (err) {
      console.error('[Scrap Pay Session] Error reading from localStorage:', err);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Resend OTP countdown effect
  useEffect(() => {
    let interval = null;
    if (currentStep === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, resendTimer]);

  // Validation helpers
  const isMobileValid = /^[6-9]\d{9}$/.test(mobile);
  const isOtpComplete = otp.every((digit) => digit.trim().length === 1);
  const isStep3Valid = fullName.trim().length >= 2 && (role === 'customer' || role === 'partner');
  const isStep4Valid = isMobileValid && isOtpComplete && isStep3Valid && Boolean(subtype);

  // Handlers
  const handleMobileChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
    setMobile(val);
    setMobileError('');
  };

  // =========================================================================
  // 2. REAL FAST2SMS OTP DISPATCH: POST /api/send-otp
  // =========================================================================
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isMobileValid) return;

    setIsSendingOtp(true);
    setMobileError('');
    setOtpError('');
    setOtpNotice('');

    try {
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ mobile }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtp(['', '', '', '', '', '']);
        setCurrentStep(2);
        setResendTimer(30);
        setCanResend(false);

        if (data.dev_otp) {
          setOtpNotice(`Fast2SMS Dispatch Triggered. (Dev Verification Code: ${data.dev_otp})`);
        } else if (data.gateway === 'fast2sms') {
          setOtpNotice('✅ OTP SMS dispatched to your mobile number via Fast2SMS.');
        } else if (data.fast2sms_notice) {
          setOtpNotice(data.fast2sms_notice);
        }

        setTimeout(() => otpRefs.current[0]?.focus(), 150);
      } else {
        setMobileError(data.error || 'Failed to dispatch OTP. Please check your connection and try again.');
      }
    } catch (err) {
      setMobileError(`Network Error: ${err.message}`);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanVal ? cleanVal[0] : '';
    setOtp(newOtp);
    setOtpError('');

    if (cleanVal && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newOtp = [...otp];
      for (let i = 0; i < pasted.length; i++) {
        newOtp[i] = pasted[i];
      }
      setOtp(newOtp);
      setOtpError('');
      const targetIndex = Math.min(pasted.length, 5);
      otpRefs.current[targetIndex]?.focus();
    }
  };

  // =========================================================================
  // 3. REAL OTP VERIFICATION: POST /api/verify-otp
  // =========================================================================
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!isOtpComplete) return;

    setIsVerifyingOtp(true);
    setOtpError('');

    const enteredOtp = otp.join('');

    try {
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mobile,
          otp: enteredOtp,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtpError('');
        setCurrentStep(3);
      } else {
        setOtpError(data.error || 'Invalid OTP. Please check the code received via SMS.');
        // Refocus first OTP digit
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      setOtpError(`Verification Request Error: ${err.message}`);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    await handleSendOtp();
  };

  const handleRoleSelect = (selectedRole) => {
    setRole(selectedRole);
    setSubtype('');
  };

  const handleStep3Submit = (e) => {
    if (e) e.preventDefault();
    if (!isStep3Valid) return;
    setCurrentStep(4);
  };

  const handleOpenSummaryModal = (e) => {
    if (e) e.preventDefault();
    if (!isStep4Valid) return;
    setSubmissionResult(null);
    setShowModal(true);
  };

  // =========================================================================
  // 4. SUBMIT TO /api/register -> Save Session in localStorage
  // =========================================================================
  const handlePostToOdoo = async () => {
    setIsRegisteringOdoo(true);
    setSubmissionResult(null);

    const payload = {
      mobile: `+91${mobile}`,
      fullName: fullName.trim(),
      role: role,
      subtype: subtype,
    };

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Construct User Session Profile
        const userSessionData = {
          id: data.partner_id || (data.user && data.user.id) || Math.floor(1000 + Math.random() * 9000),
          name: (data.user && data.user.name) || fullName.trim(),
          mobile: (data.user && data.user.mobile) || `+91${mobile}`,
          role: (data.user && data.user.role) || role,
          subtype: (data.user && data.user.subtype) || subtype,
          action: data.action || (data.isNewUser ? 'signup' : 'login'),
          source: data.user?.source || 'odoo',
          loggedInAt: new Date().toISOString()
        };

        // SAVE SESSION TO LOCALSTORAGE
        if (typeof window !== 'undefined') {
          localStorage.setItem('scrap_pay_session', 'true');
          localStorage.setItem('scrap_pay_user', JSON.stringify(userSessionData));
        }

        // Set React State
        setCurrentUser(userSessionData);
        setIsLoggedIn(true);
        setShowModal(false);

        // Flash message toast
        setSessionToast({
          type: userSessionData.action,
          title: userSessionData.action === 'login' ? 'Welcome Back!' : 'Registration Successful!',
          message: data.message || `Account ready for ${userSessionData.name}.`
        });

      } else {
        setSubmissionResult({
          success: false,
          error: data.error || 'Failed to sync with Odoo.',
          details: data.details,
        });
      }
    } catch (err) {
      setSubmissionResult({
        success: false,
        error: `Network Error: ${err.message}`,
        details: 'Could not connect to /api/register endpoint.',
      });
    } finally {
      setIsRegisteringOdoo(false);
    }
  };

  // =========================================================================
  // 5. LOGOUT: Clears localStorage & restores onboarding form
  // =========================================================================
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('scrap_pay_session');
      localStorage.removeItem('scrap_pay_user');
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setCurrentStep(1);
    setMobile('');
    setOtp(['', '', '', '', '', '']);
    setFullName('');
    setRole('');
    setSubtype('');
    setShowModal(false);
    setSubmissionResult(null);
    setOtpNotice('');
    setOtpError('');
    setMobileError('');
    setSessionToast({
      type: 'info',
      title: 'Logged Out',
      message: 'You have been successfully logged out.'
    });
  };

  // Loading state during hydration
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-500 tracking-wider">Loading Scrap Pay...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 text-slate-800 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white p-4 sm:p-6">
      
      {/* Background accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-teal-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-32 right-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-4xl mx-auto pt-2 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-600/25">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5"/>
                <path d="M11 19h8.2a1.8 1.8 0 0 0 1.583-.914.87.87 0 0 0-.174-1.017l-4.315-4.364"/>
                <path d="m15.5 13.5-3.5 3.5 3.5 3.5"/>
                <path d="M17 5h2.185a1.83 1.83 0 0 1 1.57.881 1.785 1.785 0 0 1 .004 1.784L16.804 14.5"/>
                <path d="m8.5 10.5 3.5-3.5-3.5-3.5"/>
                <circle cx="12" cy="12" r="2" fill="currentColor" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-slate-900 font-display">
                  Scrap<span className="text-emerald-600">Pay</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {isLoggedIn ? 'Online' : 'Odoo & Fast2SMS Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">कबाड़ बेचो, तुरंत पैसे पाओ</p>
            </div>
          </div>

          {/* Header Action Button: Dynamic based on Login status */}
          <div className="flex items-center gap-2.5">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm text-xs font-bold text-slate-700">
                  <span>{currentUser?.role === 'customer' ? '👤 Customer' : '🛺 Partner'}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600">{currentUser?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold border border-slate-200 transition-colors flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-white/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-200/80 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Fast2SMS Secure OTP</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Area */}
      <main className="relative z-10 w-full max-w-xl mx-auto flex-1 flex flex-col justify-center">

        {/* Global Toast Alert */}
        {sessionToast && (
          <div className="mb-4 p-4 rounded-2xl bg-white border border-emerald-200 shadow-lg shadow-emerald-500/10 flex items-start justify-between animate-fadeIn">
            <div className="flex items-start gap-3">
              <span className="text-xl">
                {sessionToast.type === 'login' ? '🎉' : (sessionToast.type === 'signup' ? '🚀' : 'ℹ️')}
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">{sessionToast.title}</h4>
                <p className="text-xs text-slate-600 mt-0.5">{sessionToast.message}</p>
              </div>
            </div>
            <button
              onClick={() => setSessionToast(null)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* ===================================================================
            VIEW A: LOGGED-IN USER DASHBOARD / MY PROFILE (Modal/Form Hidden)
           =================================================================== */}
        {isLoggedIn && currentUser ? (
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden p-6 sm:p-8 animate-fadeIn">
            
            {/* Top User Greeting Card */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl p-5 mb-6 shadow-md shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute right-2 -bottom-4 opacity-15 text-7xl select-none">
                {currentUser.role === 'customer' ? '👤' : '🛺'}
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-[11px] font-bold tracking-wide uppercase">
                    {currentUser.role === 'customer' ? '👤 Customer Account' : '🛺 Pickup Partner Account'}
                  </span>
                  <span className="text-xs font-bold text-emerald-100">
                    ID: #{currentUser.id}
                  </span>
                </div>
                <h2 className="text-2xl font-bold font-display tracking-tight">
                  Welcome, {currentUser.name}!
                </h2>
                <p className="text-xs text-emerald-100 mt-1">
                  {currentUser.role === 'customer' 
                    ? 'कबाड़ बेचें और तुरंत बैंक/UPI में भुगतान पाएं।' 
                    : 'पिकअप ऑर्डर्स स्वीकार करें और दैनिक कमाई बढ़ाएं।'}
                </p>
              </div>
            </div>

            {/* Account Details Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Mobile Number</span>
                <span className="font-mono font-bold text-slate-800">{currentUser.mobile}</span>
              </div>
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/70">
                <span className="font-bold text-slate-500 uppercase tracking-wider">
                  {currentUser.role === 'customer' ? 'Customer Type' : 'Registered Vehicle'}
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {currentUser.subtype || 'Active'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Odoo Sync Status</span>
                <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Connected (res.partner #{currentUser.id})
                </span>
              </div>
            </div>

            {/* Role-Specific Quick Actions */}
            <div className="space-y-3 mb-6">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Quick Actions (त्वरित सेवाएं)
              </h3>

              {currentUser.role === 'customer' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => alert('📦 Doorstep Scrap Pickup flow will open here.')}
                    className="p-3.5 rounded-2xl border-2 border-emerald-600 bg-emerald-50/50 hover:bg-emerald-50 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1">📦</span>
                    <span className="text-xs font-extrabold text-slate-900 block">Sell Scrap Now</span>
                    <span className="text-[10px] text-slate-500">पिकअप शेड्यूल करें</span>
                  </button>

                  <button
                    onClick={() => alert('📈 Live Scrap Rates:\n• Iron (लोहा): ₹28/kg\n• Paper (रद्दी): ₹14/kg\n• Plastic (प्लास्टिक): ₹18/kg\n• Copper (तांबा): ₹710/kg')}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-emerald-400 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1">📈</span>
                    <span className="text-xs font-extrabold text-slate-900 block">Today\'s Rates</span>
                    <span className="text-[10px] text-slate-500">आज का भाव देखें</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => alert('📍 8 Pickup Requests available within 3 km of your current location.')}
                    className="p-3.5 rounded-2xl border-2 border-teal-600 bg-teal-50/50 hover:bg-teal-50 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1">📍</span>
                    <span className="text-xs font-extrabold text-slate-900 block">Nearby Pickups</span>
                    <span className="text-[10px] text-slate-500">आसपास के ऑर्डर्स (8)</span>
                  </button>

                  <button
                    onClick={() => alert('💵 Total Today: ₹1,450\nSettled to UPI: +91 ' + currentUser.mobile)}
                    className="p-3.5 rounded-2xl border border-slate-200 bg-white hover:border-teal-400 text-left transition-all"
                  >
                    <span className="text-2xl block mb-1">💵</span>
                    <span className="text-xs font-extrabold text-slate-900 block">My Earnings</span>
                    <span className="text-[10px] text-slate-500">दैनिक कमाई & भुगतान</span>
                  </button>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => alert('Scrap Pay Full Operations Dashboard')}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all text-center"
              >
                Go to Full Dashboard &rarr;
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs transition-all"
              >
                Logout / Switch
              </button>
            </div>

          </div>
        ) : (
          /* ===================================================================
              VIEW B: MULTI-STEP LOGIN / ONBOARDING WIZARD
             =================================================================== */
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden p-6 sm:p-8">
            
            {/* Stepper Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full z-0"></div>
                <div 
                  className="absolute left-4 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-300"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                ></div>

                {[1, 2, 3, 4].map((stepNum) => {
                  const isCompleted = currentStep > stepNum;
                  const isCurrent = currentStep === stepNum;
                  return (
                    <div
                      key={stepNum}
                      className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-200 ${
                        isCompleted
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : isCurrent
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-4 ring-emerald-100'
                          : 'bg-slate-100 text-slate-400 border border-slate-200'
                      }`}
                    >
                      {isCompleted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        stepNum
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between text-[11px] font-semibold text-slate-500 mt-2.5 px-0.5">
                <span className={currentStep >= 1 ? 'text-emerald-700 font-bold' : ''}>मोबाइल</span>
                <span className={currentStep >= 2 ? 'text-emerald-700 font-bold' : ''}>ओटीपी</span>
                <span className={currentStep >= 3 ? 'text-emerald-700 font-bold' : ''}>प्रोफाइल</span>
                <span className={currentStep >= 4 ? 'text-emerald-700 font-bold' : ''}>कैटेगरी</span>
              </div>
            </div>

            {/* STEP 1: MOBILE NUMBER INPUT */}
            {currentStep === 1 && (
              <div className="animate-fadeIn">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Login / Onboarding</h1>
                  <p className="text-sm text-slate-500 mt-1">अपना 10 अंकों का मोबाइल नंबर दर्ज करें</p>
                </div>

                <form onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <label htmlFor="mobile" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Mobile Number (मोबाइल नंबर) <span className="text-emerald-600">*</span>
                    </label>
                    <div className="relative flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all bg-white overflow-hidden shadow-sm">
                      <div className="flex items-center gap-1.5 pl-4 pr-3 py-3.5 bg-slate-50 border-r border-slate-200 text-slate-700 font-semibold select-none">
                        <span className="text-base">🇮🇳</span>
                        <span className="text-sm font-bold">+91</span>
                      </div>
                      <input
                        type="tel"
                        id="mobile"
                        value={mobile}
                        onChange={handleMobileChange}
                        maxLength={10}
                        inputMode="numeric"
                        placeholder="e.g. 9876543210"
                        className="w-full px-4 py-3.5 text-slate-900 text-base font-semibold placeholder:text-slate-400 focus:outline-none tracking-wider bg-transparent"
                        required
                        autoFocus
                      />
                      {isMobileValid && (
                        <div className="pr-4 text-emerald-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {mobileError && (
                      <p className="text-xs text-rose-500 mt-2 flex items-center gap-1 font-semibold animate-fadeIn">
                        <span>⚠️ {mobileError}</span>
                      </p>
                    )}

                    {mobile.length === 10 && !isMobileValid && (
                      <p className="text-xs text-rose-500 mt-1.5 flex items-center gap-1">
                        <span>⚠️ कृपया सही 10 अंकों का मोबाइल नंबर दर्ज करें (शुरुआत 6-9 से)</span>
                      </p>
                    )}

                    <p className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Fast2SMS गेटवे के जरिए आपके नंबर पर 6-अंकों का ओटीपी भेजा जाएगा।
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={!isMobileValid || isSendingOtp}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Sending SMS OTP via Fast2SMS...</span>
                      </>
                    ) : (
                      <>
                        <span>Send OTP (ओटीपी भेजें)</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 2: OTP VERIFICATION (Fast2SMS Gateway) */}
            {currentStep === 2 && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    नंबर बदलें
                  </button>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Step 2 of 4
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">OTP Verification</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    ओटीपी भेजा गया है: <span className="font-bold text-slate-800">+91 {mobile}</span>
                  </p>
                </div>

                {/* Fast2SMS Gateway Status Banner (Clean, no dummy 1234) */}
                {otpNotice && (
                  <div className="bg-emerald-50/90 border border-emerald-200 rounded-2xl p-3.5 mb-5 flex items-start gap-2.5 text-xs text-emerald-950 animate-fadeIn">
                    <span className="text-base select-none">📱</span>
                    <div className="flex-1">
                      <p className="font-bold text-emerald-900">Fast2SMS Gateway Active</p>
                      <p className="mt-0.5 text-slate-600 leading-relaxed">{otpNotice}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                      Enter 6-Digit OTP (एसएमएस ओटीपी दर्ज करें) <span className="text-emerald-600">*</span>
                    </label>

                    <div className="flex justify-center items-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <React.Fragment key={index}>
                          <input
                            ref={(el) => (otpRefs.current[index] = el)}
                            type="text"
                            maxLength={1}
                            inputMode="numeric"
                            value={digit}
                            onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="w-11 h-14 sm:w-12 sm:h-14 text-center text-xl font-extrabold text-slate-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all shadow-sm"
                          />
                          {index === 2 && <span className="text-slate-300 font-bold">-</span>}
                        </React.Fragment>
                      ))}
                    </div>

                    {otpError && (
                      <p className="text-xs text-rose-500 mt-3 text-center font-bold animate-fadeIn flex items-center justify-center gap-1">
                        <span>⚠️ {otpError}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <span>ओटीपी नहीं मिला?</span>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend || isSendingOtp}
                      className="font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      {canResend ? 'Resend OTP via Fast2SMS' : `Resend OTP in ${resendTimer}s`}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={!isOtpComplete || isVerifyingOtp}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isVerifyingOtp ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Verifying with Fast2SMS Gateway...</span>
                      </>
                    ) : (
                      <>
                        <span>Verify OTP & Proceed (वेरिफाई करें)</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* STEP 3: USER DETAILS & ROLE SELECTION */}
            {currentStep === 3 && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    पीछे जाएं
                  </button>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Step 3 of 4
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">User Details & Role</h2>
                  <p className="text-sm text-slate-500 mt-1">अपना नाम और अपना रोल (भूमिका) चुनें</p>
                </div>

                <form onSubmit={handleStep3Submit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Full Name (पूरा नाम) <span className="text-emerald-600">*</span>
                    </label>
                    <div className="relative flex items-center rounded-2xl border-2 border-slate-200 focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 transition-all bg-white overflow-hidden shadow-sm">
                      <div className="pl-4 text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="उदा. राहुल शर्मा (Rahul Sharma)"
                        className="w-full px-3.5 py-3.5 text-slate-900 text-base font-semibold placeholder:text-slate-400 focus:outline-none bg-transparent"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                      Select Your Role (आप क्या करना चाहते हैं?) <span className="text-emerald-600">*</span>
                    </label>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Customer Card */}
                      <div
                        onClick={() => handleRoleSelect('customer')}
                        className={`cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                          role === 'customer'
                            ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 shadow-md ring-4 ring-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-600'
                        }`}
                      >
                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          role === 'customer'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-transparent border border-slate-200'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>

                        <div>
                          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-2xl mb-3">
                            👤
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Customer</h3>
                          <p className="text-xs font-bold text-emerald-700 mt-0.5">मैं कबाड़ बेचना चाहता हूँ</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            घर, दुकान या फैक्ट्री का कबाड़ बेचें और तुरंत बैंक/UPI में पेमेंट पाएं।
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <span>घर बैठे पिकअप</span>
                          <span>•</span>
                          <span>तुरंत भुगतान</span>
                        </div>
                      </div>

                      {/* Pickup Partner Card */}
                      <div
                        onClick={() => handleRoleSelect('partner')}
                        className={`cursor-pointer relative p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between ${
                          role === 'partner'
                            ? 'border-emerald-600 bg-emerald-50/70 text-slate-900 shadow-md ring-4 ring-emerald-500/10'
                            : 'border-slate-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-600'
                        }`}
                      >
                        <div className={`absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                          role === 'partner'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-transparent border border-slate-200'
                        }`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>

                        <div>
                          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-2xl mb-3">
                            🛺
                          </div>
                          <h3 className="text-base font-extrabold text-slate-900">Pickup Partner</h3>
                          <p className="text-xs font-bold text-teal-700 mt-0.5">मैं कबाड़ उठाना चाहता हूँ</p>
                          <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                            अपने इलाके में कबाड़ पिकअप करें, पार्टनर बनें और रोज़ाना अच्छी कमाई करें।
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
                          <span>डेली ऑर्डर्स</span>
                          <span>•</span>
                          <span>ज्यादा कमाई</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!isStep3Valid}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>अगला कदम (Next Step)</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
              </div>
            )}

            {/* STEP 4: DYNAMIC SUB-TYPE SELECTION */}
            {currentStep === 4 && (
              <div className="animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-emerald-700 py-1 px-2.5 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    रोल बदलें
                  </button>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Step 4 of 4 (Final)
                  </span>
                </div>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 mb-3 shadow-inner">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-display">Final Details</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {role === 'customer' ? 'अपनी प्राथमिक श्रेणी चुनें' : 'पिकअप के लिए अपना वाहन चुनें'}
                  </p>
                </div>

                {/* Summary Mini Card */}
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-xl">
                      {role === 'customer' ? '👤' : '🛺'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{fullName}</p>
                      <p className="text-[11px] text-slate-500 font-medium">+91 {mobile}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                    role === 'customer'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-teal-100 text-teal-800 border-teal-200'
                  }`}>
                    {role === 'customer' ? 'Customer (कस्टमर)' : 'Pickup Partner (पार्टनर)'}
                  </span>
                </div>

                <form onSubmit={handleOpenSummaryModal} className="space-y-6">
                  {/* Condition 1: Customer Subtypes */}
                  {role === 'customer' && (
                    <div className="space-y-3">
                      <label htmlFor="customerType" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        आप किस तरह के कस्टमर हैं? <span className="text-emerald-600">*</span>
                      </label>

                      <div className="relative">
                        <select
                          id="customerType"
                          value={subtype}
                          onChange={(e) => setSubtype(e.target.value)}
                          className="w-full appearance-none px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 font-semibold text-sm focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all cursor-pointer pr-10 shadow-sm"
                          required
                        >
                          <option value="" disabled>-- कृपया चुनें (Select Customer Type) --</option>
                          <option value="Normal Household (घर)">🏠 Normal Household (घर)</option>
                          <option value="Small Business (दुकान)">🏪 Small Business (दुकान)</option>
                          <option value="Large Business (फैक्ट्री)">🏢 Large Business (फैक्ट्री)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2.5 pt-1">
                        {[
                          { label: 'घर', sub: 'Household', icon: '🏠', val: 'Normal Household (घर)' },
                          { label: 'दुकान', sub: 'Small Business', icon: '🏪', val: 'Small Business (दुकान)' },
                          { label: 'फैक्ट्री', sub: 'Large Business', icon: '🏢', val: 'Large Business (फैक्ट्री)' },
                        ].map((item) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSubtype(item.val)}
                            className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                              subtype === item.val
                                ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                                : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-700'
                            }`}
                          >
                            <span className="text-2xl">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                            <span className="text-[10px] text-slate-400">{item.sub}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Condition 2: Partner Vehicle Subtypes */}
                  {role === 'partner' && (
                    <div className="space-y-3">
                      <label htmlFor="partnerVehicle" className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                        पिकअप के लिए आपके पास कौन सा वाहन है? <span className="text-emerald-600">*</span>
                      </label>

                      <div className="relative">
                        <select
                          id="partnerVehicle"
                          value={subtype}
                          onChange={(e) => setSubtype(e.target.value)}
                          className="w-full appearance-none px-4 py-3.5 rounded-2xl border-2 border-slate-200 bg-white text-slate-800 font-semibold text-sm focus:border-emerald-600 focus:ring-4 focus:ring-emerald-500/10 focus:outline-none transition-all cursor-pointer pr-10 shadow-sm"
                          required
                        >
                          <option value="" disabled>-- वाहन चुनें (Select Vehicle) --</option>
                          <option value="साइकिल">🚲 साइकिल (Bicycle)</option>
                          <option value="स्कूटी / बाइक">🛵 स्कूटी / बाइक (Scooter / Bike)</option>
                          <option value="ठेला गाड़ी">🛒 ठेला गाड़ी (Hand Cart)</option>
                          <option value="थ्री-व्हीलर / टोटो">🛺 थ्री-व्हीलर / टोटो (3-Wheeler / Toto)</option>
                          <option value="फोर-व्हीलर / पिकअप">🚚 फोर-व्हीलर / पिकअप (4-Wheeler / Pickup)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                        {[
                          { label: 'साइकिल', icon: '🚲', val: 'साइकिल' },
                          { label: 'स्कूटी / बाइक', icon: '🛵', val: 'स्कूटी / बाइक' },
                          { label: 'ठेला गाड़ी', icon: '🛒', val: 'ठेला गाड़ी' },
                          { label: 'थ्री-व्हीलर / टोटो', icon: '🛺', val: 'थ्री-व्हीलर / टोटो' },
                          { label: 'फोर-व्हीलर / पिकअप', icon: '🚚', val: 'फोर-व्हीलर / पिकअप' },
                        ].map((item, idx) => (
                          <button
                            key={item.val}
                            type="button"
                            onClick={() => setSubtype(item.val)}
                            className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                              idx === 4 ? 'col-span-2 sm:col-span-1' : ''
                            } ${
                              subtype === item.val
                                ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-sm'
                                : 'border-slate-200 bg-white hover:border-emerald-400 hover:bg-emerald-50/30 text-slate-700'
                            }`}
                          >
                            <span className="text-xl">{item.icon}</span>
                            <span className="text-xs font-bold">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!isStep4Valid}
                      className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-base shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>Submit & Start (सबमिट करें और शुरू करें)</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </button>
                    <p className="text-center text-[11px] text-slate-400 mt-2">
                      {isStep4Valid ? 'बहुत बढ़िया! सबमिट बटन पर क्लिक करें।' : 'सभी आवश्यक फ़ील्ड भरने के बाद यह बटन सक्रिय हो जाएगा।'}
                    </p>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full text-center py-4 text-xs text-slate-400">
        <p>&copy; 2026 Scrap Pay. Clean Green India Initiative. All Rights Reserved.</p>
      </footer>

      {/* ===================================================================
          MODAL: CONFIRMATION & SESSION CREATION
         =================================================================== */}
      {showModal && !isLoggedIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-emerald-100 relative overflow-hidden">
            
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600"></div>

            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 font-display">Confirm & Sign In</h3>
              <p className="text-sm font-semibold text-emerald-700">Scrap Pay में आपका स्वागत है!</p>
            </div>

            {/* Error Notification */}
            {submissionResult && !submissionResult.success && (
              <div className="mb-4 p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="font-bold text-amber-900">Notice</p>
                  <p className="mt-0.5">{submissionResult.error}</p>
                  {submissionResult.details && (
                    <p className="mt-1 text-slate-500">{submissionResult.details}</p>
                  )}
                </div>
              </div>
            )}

            {/* Collected Details */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 mb-5 text-sm space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Number</span>
                <span className="font-extrabold text-slate-900 font-mono">+91 {mobile}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</span>
                <span className="font-bold text-slate-900">{fullName}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Role Selected</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  role === 'customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-teal-100 text-teal-800'
                }`}>
                  {role === 'customer' ? 'Customer (कस्टमर)' : 'Pickup Partner (पार्टनर)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {role === 'customer' ? 'Customer Type' : 'Vehicle'}
                </span>
                <span className="font-bold text-emerald-700">{subtype}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handlePostToOdoo}
                disabled={isRegisteringOdoo}
                className="flex-1 py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all text-center flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isRegisteringOdoo ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Connecting to Odoo ERP...</span>
                  </>
                ) : (
                  <span>Start Using Scrap Pay (शुरू करें)</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={isRegisteringOdoo}
                className="py-3.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-sm transition-all text-center"
              >
                Edit Details
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
