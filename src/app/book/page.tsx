"use client";

import { useState, useEffect } from "react";
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
  ChevronLeft
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function BookPickupPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [vehicle, setVehicle] = useState<"small" | "large" | null>(null);
  const [scrapTypes, setScrapTypes] = useState<string[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const SCRAP_OPTIONS = [
    "Normal Recyclables", "Large Appliances", "Small Appliances", 
    "IT/E-waste", "Vehicle Scrap", "Others"
  ];

  const toggleScrapType = (type: string) => {
    if (scrapTypes.includes(type)) {
      setScrapTypes(scrapTypes.filter(t => t !== type));
    } else {
      setScrapTypes([...scrapTypes, type]);
    }
  };

  const handleConfirm = () => {
    if (!vehicle || scrapTypes.length === 0) {
      toast.error("Please select a vehicle and at least one scrap type.");
      return;
    }
    toast.success("Pickup Confirmed! Partner is assigned.");
    router.push("/");
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
                <p className="text-[10px] text-gray-500 mt-0.5">Requires Truck/Tempo</p>
              </button>
            </div>
          </section>

          {/* Scrap Type Selection */}
          <section className="px-5 py-6 bg-white mb-2">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Select Your Scrap Type</h2>
            <div className="flex flex-wrap gap-2">
              {SCRAP_OPTIONS.map(type => {
                const isSelected = scrapTypes.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleScrapType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${isSelected ? "bg-gray-900 text-white border-gray-900 shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}`}
                  >
                    {type}
                    {isSelected && <Check className="w-3.5 h-3.5 inline ml-1.5" />}
                  </button>
                )
              })}
            </div>
          </section>

          {/* Address Section */}
          <section className="px-5 py-6 bg-white mb-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Pickup Address</h2>
              <button onClick={() => setIsMapOpen(true)} className="text-[11px] font-bold text-brand-600 hover:text-brand-700 bg-brand-50 px-3 py-1 rounded-full">
                Change/Select
              </button>
            </div>
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <div className="mt-0.5 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 shrink-0">
                <MapPin className="w-4 h-4 text-brand-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 mb-0.5">Amrath, Bihar</p>
                <p className="text-xs text-gray-500">Amrath Village, Near Main Market, Jamui, Bihar 811305, India</p>
              </div>
            </div>
          </section>

          {/* Date & Time (Optional) */}
          <section className="px-5 py-6 bg-white">
            <h2 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Preferred Slot <span className="text-gray-300 normal-case">(Optional)</span></h2>
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
            className="w-full bg-[#25D366] text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-[#25D366]/30 hover:bg-[#20b858] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
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

        {/* Visual Map Placeholder */}
        <div className="flex-1 bg-blue-50 relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent bg-[length:20px_20px]"></div>
          {/* Map Grid effect */}
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

    </div>
  );
}
