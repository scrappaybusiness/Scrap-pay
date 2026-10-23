"use client";

import React, { useState, useEffect } from "react";

export function OnboardingTutorial() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const seen = localStorage.getItem("scrap_pay_tutorial_seen");
        if (!seen) {
          setShow(true);
        }
      }
    } catch (e) {}
  }, []);

  const handleDismiss = () => {
    setShow(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("scrap_pay_tutorial_seen", "true");
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
          ♻️
        </div>
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900">Welcome to Scrap Pay</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Sell scrap from your doorstep, get verified digital weighing, and receive instant cash or UPI payout!
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 text-[11px] font-bold text-slate-600">
          <div className="bg-slate-50 rounded-xl p-2.5">
            <span className="block text-base mb-1">📍</span>
            <span>Pin Location</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <span className="block text-base mb-1">🛺</span>
            <span>Doorstep Pickup</span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2.5">
            <span className="block text-base mb-1">💸</span>
            <span>Instant Cash</span>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-lg shadow-emerald-600/25 transition-all"
        >
          Got It, Let&apos;s Start!
        </button>
      </div>
    </div>
  );
}
