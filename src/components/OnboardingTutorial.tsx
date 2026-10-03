"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, Truck, Coins, ArrowRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    title: "Sell Your Old Scrap",
    description: "Declutter your home and responsibly recycle your e-waste, old appliances, and general scrap.",
    icon: <Image src="/icon-transparent.png" alt="Scrap Pay Icon" width={100} height={100} className="rounded-full shadow-lg" />,
    color: "bg-green-50"
  },
  {
    id: 2,
    title: "Free Home Pickups",
    description: "Schedule a convenient pickup. Choose a Scooty for small items or a Truck for large quantities.",
    icon: <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center shadow-lg"><Truck className="w-12 h-12 text-brand-600" /></div>,
    color: "bg-brand-50"
  },
  {
    id: 3,
    title: "Earn Instant Cash",
    description: "Get paid instantly for your scrap and earn Green Points for contributing to a sustainable planet.",
    icon: <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center shadow-lg"><Coins className="w-12 h-12 text-amber-600" /></div>,
    color: "bg-amber-50"
  }
];

export function OnboardingTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const hasSeen = localStorage.getItem("scrappay_tutorial_seen");
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem("scrappay_tutorial_seen", "true");
    setIsOpen(false);
  };

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  if (!isOpen) return null;

  const slide = SLIDES[currentSlide];

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col md:max-w-md md:mx-auto md:border-x md:border-gray-200 shadow-2xl">
      <div className={`flex-1 flex flex-col transition-colors duration-500 ${slide.color}`}>
        
        {/* Top Header & Skip */}
        <div className="flex justify-between items-center p-6">
          <Image src="/logo-horizontal-transparent.png" alt="Scrap Pay" width={120} height={40} className="h-8 w-auto object-contain" />
          <button 
            onClick={handleComplete}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            Skip
          </button>
        </div>

        {/* Carousel Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 key={currentSlide}">
          <div className="mb-10 scale-110">
            {slide.icon}
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">{slide.title}</h2>
          <p className="text-gray-600 leading-relaxed font-medium">
            {slide.description}
          </p>
        </div>

        {/* Bottom Navigation */}
        <div className="p-8 bg-white rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
          
          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mb-8">
            {SLIDES.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? 'w-8 bg-brand-600' : 'w-2 bg-gray-200'}`}
              />
            ))}
          </div>

          {/* Action Button */}
          <button 
            onClick={handleNext}
            className="w-full bg-brand-600 text-white font-bold text-lg py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-brand-700 active:scale-95 transition-all shadow-lg shadow-brand-600/25"
          >
            {currentSlide === SLIDES.length - 1 ? (
              <>Get Started <ArrowRight className="w-5 h-5" /></>
            ) : (
              <>Next <ChevronRight className="w-5 h-5" /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
