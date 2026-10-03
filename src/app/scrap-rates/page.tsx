"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Search,
  Home, 
  Tag, 
  Truck,
  Wallet,
  UserPlus,
  Shirt,
  Newspaper,
  FileText,
  Book,
  Box,
  Recycle,
  Hammer,
  GlassWater,
  Coins,
  Wind,
  Refrigerator,
  MonitorPlay,
  Waves,
  Zap,
  Laptop,
  Cpu,
  Printer,
  Monitor,
  Tv,
  Tablet,
  Car,
  Bike,
  Archive,
  Speaker,
  Fan,
  Battery
} from "lucide-react";

const CATEGORIES = [
  "All", 
  "Normal Recyclables", 
  "Large Appliances", 
  "Small Appliances", 
  "IT/E-Waste", 
  "Vehicle Scrap"
];

// Helper to get random-ish realistic prices for the mockup
const getPrice = (base: number) => ({
  oldPrice: Math.floor(base * 0.8),
  newPrice: base
});

const SCRAP_DATA = [
  {
    category: "Normal Recyclables",
    items: [
      { name: "Clothes", unit: "kg", icon: Shirt, ...getPrice(5) },
      { name: "Newspaper", unit: "kg", icon: Newspaper, ...getPrice(14) },
      { name: "Office Paper", unit: "kg", icon: FileText, ...getPrice(15) },
      { name: "Books", unit: "kg", icon: Book, ...getPrice(12) },
      { name: "Cardboard", unit: "kg", icon: Box, ...getPrice(8) },
      { name: "Plastic", unit: "kg", icon: Recycle, ...getPrice(12) },
      { name: "Iron", unit: "kg", icon: Hammer, ...getPrice(26) },
      { name: "Glass", unit: "kg", icon: GlassWater, ...getPrice(3) },
      { name: "Steel", unit: "kg", icon: Hammer, ...getPrice(35) },
      { name: "Aluminium Can", unit: "kg", icon: Coins, ...getPrice(110) },
      { name: "Aluminium", unit: "kg", icon: Coins, ...getPrice(105) },
      { name: "Brass", unit: "kg", icon: Coins, ...getPrice(300) },
      { name: "Copper", unit: "kg", icon: Coins, ...getPrice(420) },
    ]
  },
  {
    category: "Large Appliances",
    items: [
      { name: "Window/Split AC (2 Ton)", unit: "piece", icon: Wind, ...getPrice(4000) },
      { name: "Window/Split AC (1.5 Ton)", unit: "piece", icon: Wind, ...getPrice(3000) },
      { name: "Window/Split AC (1 Ton)", unit: "piece", icon: Wind, ...getPrice(2000) },
      { name: "Fridge (Side by Side)", unit: "piece", icon: Box, ...getPrice(1500) },
      { name: "Fridge (Double Door)", unit: "piece", icon: Box, ...getPrice(1000) },
      { name: "Fridge (Single Door)", unit: "piece", icon: Box, ...getPrice(800) },
      { name: "Washing Machine (Front Load)", unit: "piece", icon: Waves, ...getPrice(900) },
      { name: "Washing Machine (Top Load)", unit: "piece", icon: Waves, ...getPrice(700) },
      { name: "Washing Machine (Semi-Auto)", unit: "piece", icon: Waves, ...getPrice(500) },
      { name: "Microwave", unit: "piece", icon: Box, ...getPrice(200) },
    ]
  },
  {
    category: "Small Appliances",
    items: [
      { name: "Light (Metal)", unit: "piece", icon: Zap, ...getPrice(20) },
      { name: "DVD/VCR/Blu-ray Player", unit: "piece", icon: MonitorPlay, ...getPrice(50) },
      { name: "Cloth Press", unit: "piece", icon: Zap, ...getPrice(30) },
      { name: "Set Top Box", unit: "piece", icon: Tv, ...getPrice(25) },
      { name: "Iron Exhaust Fan", unit: "piece", icon: Fan, ...getPrice(60) },
      { name: "Chimney", unit: "piece", icon: Wind, ...getPrice(150) },
      { name: "Motor with Ceiling Fan", unit: "piece", icon: Fan, ...getPrice(100) },
      { name: "Iron Cooler", unit: "piece", icon: Wind, ...getPrice(250) },
      { name: "Plastic Cooler", unit: "piece", icon: Wind, ...getPrice(150) },
      { name: "Vacuum Cleaner", unit: "piece", icon: Zap, ...getPrice(80) },
      { name: "Mixer", unit: "piece", icon: Zap, ...getPrice(40) },
      { name: "Induction Cooktop", unit: "piece", icon: Zap, ...getPrice(60) },
      { name: "Router/Modem", unit: "piece", icon: Zap, ...getPrice(15) },
      { name: "Geyser", unit: "piece", icon: Zap, ...getPrice(180) },
      { name: "Stabilizer/Inverter", unit: "piece", icon: Zap, ...getPrice(300) },
      { name: "UPS", unit: "piece", icon: Battery, ...getPrice(150) },
      { name: "Gym Equipments", unit: "kg", icon: Hammer, ...getPrice(20) },
      { name: "Battery", unit: "kg", icon: Battery, ...getPrice(80) },
    ]
  },
  {
    category: "IT/E-Waste",
    items: [
      { name: "Laptop", unit: "piece", icon: Laptop, ...getPrice(300) },
      { name: "Computer CPU", unit: "piece", icon: Cpu, ...getPrice(250) },
      { name: "Printer", unit: "piece", icon: Printer, ...getPrice(100) },
      { name: "CRT Monitor", unit: "piece", icon: Monitor, ...getPrice(150) },
      { name: "CRT TV", unit: "piece", icon: Tv, ...getPrice(200) },
      { name: "Tablet", unit: "piece", icon: Tablet, ...getPrice(50) },
    ]
  },
  {
    category: "Vehicle Scrap",
    items: [
      { name: "Scooty/Scooter", unit: "piece", icon: Bike, ...getPrice(3000) },
      { name: "Bike", unit: "piece", icon: Bike, ...getPrice(3500) },
      { name: "Car", unit: "piece", icon: Car, ...getPrice(25000) },
    ]
  }
];

export default function ScrapRatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = SCRAP_DATA.map(group => {
    // Filter by search query
    const filteredItems = group.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...group, items: filteredItems };
  }).filter(group => {
    // Filter out empty groups after search
    if (group.items.length === 0) return false;
    // Filter by active category tab
    if (activeCategory === "All") return true;
    return group.category === activeCategory;
  });

  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8    relative  flex flex-col font-sans md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Static Header Section ─── */}
      <header className="px-6 pt-10 pb-4 bg-gray-50">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-4">
          Scrap Rates
        </h1>
        
        {/* Primary CTA */}
        <Link 
          href="/book"
          className="w-full flex justify-center items-center gap-1 bg-brand-600 text-white py-3.5 rounded-full font-bold text-[17px] shadow-lg shadow-brand-600/30 hover:bg-brand-700 hover:scale-[1.02] transition-all"
        >
          Schedule Pickup <span className="text-xl leading-none font-medium ml-0.5">+</span>
        </Link>
      </header>

      {/* ─── Search & Filter Area (Sticky) ─── */}
      <div className="sticky top-0 z-40 bg-gray-50/95 backdrop-blur-sm px-6 pt-2 pb-4 border-b border-gray-200 shadow-sm">
        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search for items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-shadow shadow-sm"
          />
        </div>

        {/* Horizontal Scrolling Category Selector */}
        <div className="flex overflow-x-auto hide-scrollbar gap-2 -mx-2 px-2 snap-x">
          {CATEGORIES.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-bold transition-colors snap-start ${
                activeCategory === category 
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/20" 
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main Content Area (Vertical Scrolling List) ─── */}
      <main className="flex-1 px-6 py-4 overflow-y-auto hide-scrollbar">
        {filteredData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold mb-1">No items found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or category.</p>
          </div>
        ) : (
          filteredData.map((group, groupIdx) => (
            <div key={group.category} className={groupIdx > 0 ? "mt-8" : ""}>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                {group.category}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {group.items.map((item, index) => (
                  <div 
                    key={item.name} 
                    className={`flex items-center justify-between p-4 ${
                      index !== group.items.length - 1 ? "border-b border-gray-100" : ""
                    } hover:bg-gray-50 transition-colors cursor-default`}
                  >
                    {/* Left & Middle: Icon and Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100/50">
                        <item.icon className="w-5 h-5 text-brand-600" />
                      </div>
                      <span className="font-bold text-[14px] text-gray-800 leading-tight pr-4">
                        {item.name}
                      </span>
                    </div>

                    {/* Right: Pricing Strategy */}
                    <div className="flex flex-col items-end shrink-0">
                      <span className="text-[11px] font-bold text-gray-400 line-through">
                        ₹{item.oldPrice}/{item.unit}
                      </span>
                      <span className="text-[15px] font-black text-brand-600">
                        ₹{item.newPrice}/{item.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

      {/* ─── Fixed Bottom Navigation Bar ─── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 w-full max-w-md mx-auto bg-white border-t border-gray-200 flex justify-around items-center py-3 pb-6 md:pb-3 z-50 rounded-b-[2rem] md:rounded-b-[2.5rem]">
        <Link href="/" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Home className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        
        <button className="flex flex-col items-center gap-1 text-brand-600 w-16">
          <Tag className="w-6 h-6 stroke-[2.5]" />
          <span className="text-[10px] font-bold">Scrap Rates</span>
        </button>
        
        <Link href="/my-pickups" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Truck className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">My Pickups</span>
        </Link>
        
        <Link href="/wallet" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <Wallet className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Wallet</span>
        </Link>

        <Link href="/referral" className="flex flex-col items-center gap-1 text-gray-400 hover:text-gray-900 transition-colors w-16">
          <UserPlus className="w-6 h-6 stroke-[2]" />
          <span className="text-[10px] font-medium">Referral</span>
        </Link>
      </nav>
      
    </div>
  );
}
