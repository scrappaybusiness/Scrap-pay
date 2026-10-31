"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { 
  X, 
  MapPin, 
  Navigation, 
  Search, 
  Loader2, 
  Check, 
  Home, 
  Building,
  Route,
  Zap,
  CheckCircle2
} from "lucide-react";
import type { Coordinates } from "./MapboxMapInner";
import { optimizeScrapPickupRoute, PickupStop } from "@/lib/mapboxOptimization";

// Dynamically load MapboxMapInner with SSR disabled to prevent `window is not defined`
const MapboxMapInner = dynamic(() => import("./MapboxMapInner"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-emerald-50/40 flex flex-col items-center justify-center text-emerald-800">
      <div className="w-10 h-10 border-4 border-emerald-300 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-black text-slate-800">Loading Mapbox Vector Map...</p>
      <p className="text-[11px] text-slate-500 mt-0.5">High-Precision Scrap Pickup Locator</p>
    </div>
  ),
});

export interface PickupAddressData {
  fullAddress: string;
  street: string;
  area: string;
  city: string;
  state: string;
  pincode: string;
  houseNo?: string;
  landmark?: string;
  lat: number;
  lng: number;
}

interface MapboxPickupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmAddress: (addressData: PickupAddressData) => void;
  initialAddress?: string;
  initialCoordinates?: { lat: number; lng: number };
}

// Default fallback location: Jamui, Bihar (Scrap Pay Central Hub)
const DEFAULT_COORDS: Coordinates = {
  lat: 24.9213,
  lng: 86.2235,
};

// Sample multi-stop pickups for Future-Ready Route Optimization Demo
const SAMPLE_JAMUI_PICKUPS: PickupStop[] = [
  { id: 1, name: "Scrap Pay Jamui Depot (Start)", lat: 24.9213, lng: 86.2235, scrapWeightKg: 0 },
  { id: 2, name: "Customer 1: Ramesh Ji (Iron 30kg)", lat: 24.9255, lng: 86.2280, scrapWeightKg: 30 },
  { id: 3, name: "Customer 2: Pooja Store (Cardboard 45kg)", lat: 24.9180, lng: 86.2190, scrapWeightKg: 45 },
  { id: 4, name: "Customer 3: Vikas Electronic (E-waste 15kg)", lat: 24.9290, lng: 86.2210, scrapWeightKg: 15 },
];

export default function MapboxPickupModal({
  isOpen,
  onClose,
  onConfirmAddress,
  initialAddress = "",
  initialCoordinates,
}: MapboxPickupModalProps) {
  const [position, setPosition] = useState<Coordinates>(
    initialCoordinates || DEFAULT_COORDS
  );

  // Address state populated from Mapbox Reverse Geocoding
  const [addressData, setAddressData] = useState<PickupAddressData>({
    fullAddress: initialAddress || "Detecting address via Mapbox...",
    street: "",
    area: "",
    city: "Jamui",
    state: "Bihar",
    pincode: "",
    houseNo: "",
    landmark: "",
    lat: initialCoordinates?.lat || DEFAULT_COORDS.lat,
    lng: initialCoordinates?.lng || DEFAULT_COORDS.lng,
  });

  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Mapbox Forward Geocoding Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Additional detail inputs
  const [houseNo, setHouseNo] = useState("");
  const [landmark, setLandmark] = useState("");
  const [internalToast, setInternalToast] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Future-Ready Route Optimization State
  const [isRouteOptimized, setIsRouteOptimized] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][] | undefined>(undefined);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMins: number } | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  const showToast = (text: string, type: "success" | "error" | "info" = "info") => {
    setInternalToast({ text, type });
    setTimeout(() => {
      setInternalToast((curr) => (curr?.text === text ? null : curr));
    }, 3200);
  };

  // Debounce timers
  const reverseGeocodeTimer = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  // ─── 1. Mapbox Reverse Geocoding API (Coordinates -> Text Address) ───
  const fetchMapboxAddress = useCallback(
    async (coords: Coordinates) => {
      setIsLoadingAddress(true);
      setAddressError("");

      if (!mapboxToken || mapboxToken.includes("placeholder")) {
        // Fallback geocode format when token is not yet configured
        const fallback = `Lat: ${coords.lat.toFixed(4)}, Lng: ${coords.lng.toFixed(4)}, Jamui, Bihar`;
        setAddressData({
          fullAddress: fallback,
          street: "Main Road",
          area: "Amrath",
          city: "Jamui",
          state: "Bihar",
          pincode: "811305",
          houseNo,
          landmark,
          lat: coords.lat,
          lng: coords.lng,
        });
        setIsLoadingAddress(false);
        return;
      }

      try {
        // Mapbox Geocoding endpoint takes [longitude, latitude]
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${coords.lng},${coords.lat}.json?access_token=${mapboxToken}&country=IN&types=address,poi,neighborhood,locality,place,postcode`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error("Unable to fetch location details from Mapbox Geocoding API.");
        }

        const data = await res.json();
        const features = data.features || [];

        if (features.length > 0) {
          const primary = features[0];
          const context = primary.context || [];

          // Parse Mapbox hierarchy context
          let street = primary.text || "";
          let area = "";
          let city = "Jamui";
          let state = "Bihar";
          let pincode = "";

          context.forEach((item: any) => {
            const id = item.id || "";
            if (id.startsWith("neighborhood") || id.startsWith("locality")) {
              area = item.text;
            } else if (id.startsWith("place") || id.startsWith("district")) {
              city = item.text;
            } else if (id.startsWith("region")) {
              state = item.text;
            } else if (id.startsWith("postcode")) {
              pincode = item.text;
            }
          });

          const fullFormatted = primary.place_name || [street, area, city, state, pincode].filter(Boolean).join(", ");

          setAddressData({
            fullAddress: fullFormatted,
            street,
            area: area || street || "Local Area",
            city,
            state,
            pincode,
            houseNo,
            landmark,
            lat: coords.lat,
            lng: coords.lng,
          });
        } else {
          setAddressData((prev) => ({
            ...prev,
            fullAddress: `Selected Pin (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
            lat: coords.lat,
            lng: coords.lng,
          }));
        }
      } catch (err: any) {
        console.warn("[Mapbox Reverse Geocoding Warning]", err.message);
        setAddressError("Mapbox geocoding unavailable. You can still confirm the pin location.");
        setAddressData((prev) => ({
          ...prev,
          fullAddress: `Selected Location (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
          lat: coords.lat,
          lng: coords.lng,
        }));
      } finally {
        setIsLoadingAddress(false);
      }
    },
    [mapboxToken, houseNo, landmark]
  );

  // Position change handler with 350ms debounce
  const handlePositionChange = useCallback(
    (newPos: Coordinates) => {
      setPosition(newPos);

      if (reverseGeocodeTimer.current) {
        clearTimeout(reverseGeocodeTimer.current);
      }

      reverseGeocodeTimer.current = setTimeout(() => {
        fetchMapboxAddress(newPos);
      }, 350);
    },
    [fetchMapboxAddress]
  );

  // Initial geocoding when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchMapboxAddress(position);
    }
    return () => {
      if (reverseGeocodeTimer.current) clearTimeout(reverseGeocodeTimer.current);
      if (searchDebounceTimer.current) clearTimeout(searchDebounceTimer.current);
    };
  }, [isOpen]);

  // ─── 2. Mapbox Forward Geocoding Search ───
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val || val.trim().length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceTimer.current) {
      clearTimeout(searchDebounceTimer.current);
    }

    searchDebounceTimer.current = setTimeout(async () => {
      setIsSearching(true);
      if (!mapboxToken || mapboxToken.includes("placeholder")) {
        // Mock fallback results for local testing
        setSearchResults([
          {
            place_name: `${val.trim()}, Main Market, Jamui, Bihar`,
            center: [86.2235, 24.9213],
          },
          {
            place_name: `${val.trim()}, Station Road, Jamui, Bihar`,
            center: [86.2310, 24.9280],
          },
        ]);
        setIsSearching(false);
        return;
      }

      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          val.trim()
        )}.json?access_token=${mapboxToken}&country=IN&autocomplete=true&limit=5`;

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.features || []);
        }
      } catch (err) {
        console.warn("[Mapbox Search Warning]", err);
      } finally {
        setIsSearching(false);
      }
    }, 380);
  };

  const handleSelectSearchResult = (item: any) => {
    // Mapbox center is [longitude, latitude]
    const center = item.center;
    if (Array.isArray(center) && center.length === 2) {
      const newPos: Coordinates = {
        lat: Number(center[1].toFixed(6)),
        lng: Number(center[0].toFixed(6)),
      };
      setPosition(newPos);
      setSearchQuery("");
      setSearchResults([]);
      fetchMapboxAddress(newPos);
      showToast("Moved map to selected location", "info");
    }
  };

  // ─── 3. GPS "Use Current Location" ───
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    setIsLocatingUser(true);
    showToast("Detecting GPS coordinates...", "info");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const newPos = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setPosition(newPos);
        fetchMapboxAddress(newPos);
        showToast("Pin centered at your current GPS location!", "success");
      },
      (err) => {
        setIsLocatingUser(false);
        console.warn("[Mapbox Geolocation Error]", err.message);
        showToast("Could not access GPS. Please verify location permissions.", "error");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ─── 4. Future-Ready Mapbox Route Optimization Demo ───
  const handleToggleRouteOptimization = async () => {
    if (isRouteOptimized) {
      // Toggle off
      setIsRouteOptimized(false);
      setRouteCoordinates(undefined);
      setRouteStats(null);
      showToast("Returned to single pickup view", "info");
      return;
    }

    setIsCalculatingRoute(true);
    showToast("Calculating shortest multi-stop pickup route via Mapbox Optimization API...", "info");

    try {
      // Include current selected pin as one of the stops
      const activeStops: PickupStop[] = [
        SAMPLE_JAMUI_PICKUPS[0],
        { id: "current-pin", name: "Your Pickup Spot", lat: position.lat, lng: position.lng, scrapWeightKg: 20 },
        SAMPLE_JAMUI_PICKUPS[1],
        SAMPLE_JAMUI_PICKUPS[2],
      ];

      const optResult = await optimizeScrapPickupRoute(activeStops, mapboxToken);

      if (optResult.success && optResult.routeGeoJson?.geometry?.coordinates) {
        setRouteCoordinates(optResult.routeGeoJson.geometry.coordinates);
        setRouteStats({
          distanceKm: optResult.totalDistanceKm,
          durationMins: optResult.totalDurationMinutes,
        });
        setIsRouteOptimized(true);
        showToast(`Route optimized: ${optResult.totalDistanceKm} km (${optResult.totalDurationMinutes} mins)`, "success");
      } else {
        showToast(optResult.error || "Could not calculate optimized route", "error");
      }
    } catch (e: any) {
      showToast("Route optimization failed: " + e.message, "error");
    } finally {
      setIsCalculatingRoute(false);
    }
  };

  // ─── 5. Auto-Fill Form & Confirm Address ───
  const handleConfirmLocation = () => {
    const combinedAddress = [
      houseNo.trim(),
      landmark.trim() ? `Near ${landmark.trim()}` : "",
      addressData.fullAddress,
    ]
      .filter(Boolean)
      .join(", ");

    const finalAddressPayload: PickupAddressData = {
      ...addressData,
      houseNo: houseNo.trim(),
      landmark: landmark.trim(),
      fullAddress: combinedAddress || addressData.fullAddress,
    };

    // Save to localStorage for instant auto-fill across app
    if (typeof window !== "undefined") {
      localStorage.setItem("scrap_pay_pickup_address", JSON.stringify(finalAddressPayload));
    }

    onConfirmAddress(finalAddressPayload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col md:items-center md:justify-center bg-slate-950/70 backdrop-blur-md animate-fadeIn"
      style={{ overscrollBehavior: "contain" }}
    >
      {/* Modal Container */}
      <div 
        className="w-full h-full md:h-[90vh] md:max-w-3xl bg-white flex flex-col relative md:rounded-3xl md:shadow-2xl overflow-hidden border border-slate-100"
        style={{ overscrollBehavior: "contain" }}
      >
        
        {/* Floating Notification Toast */}
        {internalToast && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 max-w-sm w-[90%] pointer-events-none animate-fadeIn">
            <div className={`px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold text-center flex items-center justify-center gap-2 border ${
              internalToast.type === "success" 
                ? "bg-emerald-600 text-white border-emerald-500" 
                : internalToast.type === "error"
                ? "bg-rose-600 text-white border-rose-500"
                : "bg-slate-900 text-white border-slate-800"
            }`}>
              <span>{internalToast.text}</span>
            </div>
          </div>
        )}

        {/* ─── Header & Mapbox Search ─── */}
        <header className="px-4 pt-4 pb-3 bg-white border-b border-slate-100 shrink-0 z-20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm shadow-emerald-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">Mapbox Pickup Locator</h3>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Live Vector Map
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Drag the emerald pin or search your scrap pickup address
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
              title="Close Map"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mapbox Geocoding Search Input */}
          <div className="relative">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search area, market, or landmark via Mapbox (e.g. Main Market, Jamui)"
                className="w-full bg-transparent text-xs font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
              />
              {isSearching && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin shrink-0" />}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchResults([]);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Mapbox Autocomplete Suggestions */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl z-30 max-h-56 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectSearchResult(item)}
                    className="w-full text-left p-3 hover:bg-emerald-50/70 transition-colors flex items-start gap-2.5"
                  >
                    <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.text || item.place_name?.split(",")[0]}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {item.place_name}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {/* ─── Interactive Mapbox View ─── */}
        <div className="flex-1 relative w-full h-full min-h-[280px]">
          <MapboxMapInner
            position={position}
            onPositionChange={handlePositionChange}
            zoom={15.5}
            routeCoordinates={routeCoordinates}
            pickupWaypoints={
              isRouteOptimized
                ? SAMPLE_JAMUI_PICKUPS.map((p) => ({ lat: p.lat, lng: p.lng, label: p.name }))
                : undefined
            }
          />

          {/* Floating Actions on Map */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            {/* GPS Locate Me Button */}
            <button
              type="button"
              onClick={handleLocateMe}
              disabled={isLocatingUser}
              className="bg-white/95 backdrop-blur-sm hover:bg-white text-slate-800 text-xs font-bold px-3 py-2 rounded-xl shadow-lg border border-slate-200/80 flex items-center gap-1.5 active:scale-95 transition-all"
              title="Locate my position via GPS"
            >
              {isLocatingUser ? (
                <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4 text-emerald-600" />
              )}
              <span className="hidden sm:inline">Use My Location</span>
            </button>

            {/* Future-Ready Route Optimization Demo Toggle */}
            <button
              type="button"
              onClick={handleToggleRouteOptimization}
              disabled={isCalculatingRoute}
              className={`text-xs font-black px-3 py-2 rounded-xl shadow-lg border flex items-center gap-1.5 active:scale-95 transition-all ${
                isRouteOptimized 
                  ? "bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/30" 
                  : "bg-white/95 backdrop-blur-sm hover:bg-white text-slate-800 border-slate-200/80"
              }`}
              title="Toggle Mapbox Route Optimization API demo"
            >
              {isCalculatingRoute ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <Route className={`w-4 h-4 ${isRouteOptimized ? "text-white" : "text-emerald-600"}`} />
              )}
              <span className="hidden sm:inline">
                {isRouteOptimized ? "Route Active" : "Optimize Route"}
              </span>
            </button>
          </div>

          {/* Active Route Stats Badge */}
          {isRouteOptimized && routeStats && (
            <div className="absolute bottom-3 left-3 z-10">
              <div className="bg-slate-950/90 backdrop-blur-md text-white text-[11px] font-bold px-3 py-2 rounded-xl shadow-xl border border-emerald-500/40 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Shortest Picker Path: <strong>{routeStats.distanceKm} km</strong></span>
                <span className="text-slate-400">|</span>
                <span className="text-emerald-300">~{routeStats.durationMins} mins</span>
              </div>
            </div>
          )}

          {/* Pin Drag Instructions Pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Drag pin or click map to set location</span>
            </div>
          </div>
        </div>

        {/* ─── Bottom Address & Confirmation Sheet ─── */}
        <div className="bg-white border-t border-slate-100 p-4 md:p-5 shrink-0 z-20 shadow-lg">
          {/* Detected Address Display */}
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Mapbox Geocoded Address
              </span>
              {isLoadingAddress ? (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" /> Fetching address...
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 font-mono">
                  {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
                </span>
              )}
            </div>

            <p className="text-sm font-extrabold text-slate-900 line-clamp-2 mt-1">
              {addressData.fullAddress || "Drag pin on the map to detect address"}
            </p>
          </div>

          {/* Optional Micro-inputs for Pickup precision */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Home className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={houseNo}
                onChange={(e) => setHouseNo(e.target.value)}
                placeholder="House / Flat / Shop No."
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Nearby Landmark"
                className="w-full bg-transparent text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 rounded-xl font-bold text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmLocation}
              disabled={isLoadingAddress}
              className="flex-[2] bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white py-3.5 rounded-xl font-black text-sm shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              Confirm Pickup Address
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
