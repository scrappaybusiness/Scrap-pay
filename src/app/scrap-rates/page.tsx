"use client";

import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
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
  Fan, 
  Battery,
  Loader2,
  RefreshCw
} from "lucide-react";
import { getScrapProducts, OdooProduct } from "@/lib/odoo";

// Helper to determine Lucide icon dynamically from product name
function getIconForScrapItem(name: string) {
  const n = name.toLowerCase();
  if (n.includes("cloth") || n.includes("shirt") || n.includes("fabric")) return Shirt;
  if (n.includes("news") || n.includes("paper")) return Newspaper;
  if (n.includes("book") || n.includes("magazine")) return Book;
  if (n.includes("office") || n.includes("document")) return FileText;
  if (n.includes("cardboard") || n.includes("carton")) return Box;
  if (n.includes("plastic") || n.includes("bottle") || n.includes("pet")) return Recycle;
  if (n.includes("iron") || n.includes("steel") || n.includes("metal") || n.includes("gym")) return Hammer;
  if (n.includes("glass")) return GlassWater;
  if (n.includes("aluminium") || n.includes("copper") || n.includes("brass") || n.includes("can")) return Coins;
  if (n.includes("ac") || n.includes("cooler") || n.includes("chimney")) return Wind;
  if (n.includes("fan")) return Fan;
  if (n.includes("fridge") || n.includes("refrigerator")) return Refrigerator;
  if (n.includes("washing") || n.includes("machine")) return Waves;
  if (n.includes("tv") || n.includes("television") || n.includes("monitor")) return Tv;
  if (n.includes("laptop")) return Laptop;
  if (n.includes("cpu") || n.includes("computer")) return Cpu;
  if (n.includes("printer")) return Printer;
  if (n.includes("tablet") || n.includes("ipad")) return Tablet;
  if (n.includes("battery") || n.includes("ups") || n.includes("inverter")) return Battery;
  if (n.includes("scooty") || n.includes("bike") || n.includes("scooter")) return Bike;
  if (n.includes("car") || n.includes("auto") || n.includes("vehicle")) return Car;
  if (n.includes("light") || n.includes("wire") || n.includes("geyser") || n.includes("press")) return Zap;
  return Recycle;
}

// Format unit from Odoo uom_id
function formatUnit(uom?: [number, string] | false): string {
  if (!uom || !uom[1]) return "kg";
  const str = uom[1].toLowerCase();
  if (str.includes("unit") || str.includes("piece") || str.includes("pc")) return "piece";
  if (str.includes("kg") || str.includes("kilo")) return "kg";
  if (str.includes("gram") || str.includes("gm")) return "gm";
  if (str.includes("ton")) return "ton";
  return uom[1];
}

interface FormattedScrapItem {
  id: number;
  name: string;
  category: string;
  unit: string;
  standardPrice: number; // Cost Price (what we pay users)
  listPrice: number; // Sales Price
  image: string | null;
  Icon: React.ElementType;
}

export default function ScrapRatesPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [rawProducts, setRawProducts] = useState<OdooProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getScrapProducts();
      setRawProducts(data);
    } catch (err: any) {
      console.error("Failed to load Odoo scrap products:", err);
      setError(err.message || "Failed to connect to Odoo backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  // Format products and group by category
  const formattedItems: FormattedScrapItem[] = useMemo(() => {
    return rawProducts.map((p) => {
      // Determine category name
      let category = "Normal Recyclables";
      if (p.categ_id && p.categ_id[1] && p.categ_id[1] !== "All") {
        category = p.categ_id[1];
      } else {
        // Classify standard categories by keyword if Odoo category is "All"
        const lower = p.name.toLowerCase();
        if (lower.includes("ac") || lower.includes("fridge") || lower.includes("washing machine") || lower.includes("microwave")) {
          category = "Large Appliances";
        } else if (lower.includes("laptop") || lower.includes("cpu") || lower.includes("printer") || lower.includes("monitor") || lower.includes("tv")) {
          category = "IT/E-Waste";
        } else if (lower.includes("bike") || lower.includes("scooty") || lower.includes("car")) {
          category = "Vehicle Scrap";
        } else if (lower.includes("cooler") || lower.includes("fan") || lower.includes("geyser") || lower.includes("mixer")) {
          category = "Small Appliances";
        }
      }

      return {
        id: p.id,
        name: p.name,
        category,
        unit: formatUnit(p.uom_id),
        standardPrice: p.standard_price,
        listPrice: p.list_price,
        image: p.image_1920 ? `data:image/png;base64,${p.image_1920}` : null,
        Icon: getIconForScrapItem(p.name),
      };
    });
  }, [rawProducts]);

  // Dynamic Categories based on live products
  const categories = useMemo(() => {
    const defaultCategories = [
      "All",
      "Normal Recyclables",
      "Large Appliances",
      "Small Appliances",
      "IT/E-Waste",
      "Vehicle Scrap",
    ];

    if (formattedItems.length === 0) return defaultCategories;

    const liveCats = Array.from(new Set(formattedItems.map((item) => item.category)));
    const merged = ["All", ...liveCats];
    return Array.from(new Set(merged));
  }, [formattedItems]);

  // Group items by category after filtering by search and activeCategory
  const groupedData = useMemo(() => {
    const filtered = formattedItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = activeCategory === "All" || item.category === activeCategory;
      return matchesSearch && matchesCat;
    });

    const groups: { [cat: string]: FormattedScrapItem[] } = {};
    filtered.forEach((item) => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });

    return Object.entries(groups).map(([category, items]) => ({
      category,
      items,
    }));
  }, [formattedItems, searchQuery, activeCategory]);

  return (
    <div className="w-full min-h-screen bg-gray-50 md:bg-transparent pb-24 md:pb-8 relative flex flex-col font-sans md:max-w-6xl md:mx-auto md:px-8 md:pt-6">
      
      {/* ─── Static Header Section ─── */}
      <header className="px-6 pt-10 pb-4 bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Scrap Rates
            </h1>
            <p className="text-xs font-semibold text-gray-400 mt-0.5">
              Live pricing verified with Odoo ERP
            </p>
          </div>
          <button 
            onClick={fetchRates}
            disabled={loading}
            className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-brand-600 hover:border-brand-200 shadow-sm active:scale-95 transition-all"
            title="Refresh Rates from Odoo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-600" : ""}`} />
          </button>
        </div>
        
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
          {categories.map((category) => (
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
        {loading ? (
          // Loading Skeletons
          <div className="space-y-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-32 mb-4"></div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-xl"></div>
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          // Error State
          <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-3">
              <RefreshCw className="w-6 h-6" />
            </div>
            <p className="text-gray-900 font-bold mb-1">Odoo Connection Issue</p>
            <p className="text-gray-500 text-xs mb-4 max-w-xs">{error}</p>
            <button
              onClick={fetchRates}
              className="bg-brand-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md hover:bg-brand-700 active:scale-95 transition-all"
            >
              Retry Connection
            </button>
          </div>
        ) : groupedData.length === 0 ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-900 font-bold mb-1">No items found</p>
            <p className="text-gray-500 text-sm">Try adjusting your search or category filter.</p>
          </div>
        ) : (
          // Live items grouped by category
          groupedData.map((group, groupIdx) => (
            <div key={group.category} className={groupIdx > 0 ? "mt-8" : ""}>
              <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">
                {group.category}
              </h2>
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {group.items.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`flex items-center justify-between p-4 ${
                      index !== group.items.length - 1 ? "border-b border-gray-100" : ""
                    } hover:bg-gray-50 transition-colors cursor-default`}
                  >
                    {/* Left & Middle: Image/Icon and Name */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 shrink-0 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100/50 overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <item.Icon className="w-5 h-5 text-brand-600" />
                        )}
                      </div>
                      <span className="font-bold text-[14px] text-gray-800 leading-tight pr-4">
                        {item.name}
                      </span>
                    </div>

                    {/* Right: Pricing Strategy */}
                    <div className="flex flex-col items-end shrink-0">
                      {/* Show Sales Price crossed out if higher than Cost Price */}
                      {item.listPrice > 0 && item.listPrice !== item.standardPrice && (
                        <span className="text-[11px] font-bold text-gray-400 line-through">
                          ₹{item.listPrice}/{item.unit}
                        </span>
                      )}
                      {/* Cost Price (what we pay users) in bold green */}
                      <span className="text-[15px] font-black text-brand-600">
                        ₹{item.standardPrice}/{item.unit}
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
