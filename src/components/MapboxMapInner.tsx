"use client";

import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

export interface Coordinates {
  lat: number;
  lng: number;
}

interface MapboxMapInnerProps {
  position: Coordinates;
  onPositionChange: (newPos: Coordinates) => void;
  zoom?: number;
  routeCoordinates?: [number, number][]; // Optional GeoJSON LineString coordinates [[lng, lat], ...]
  pickupWaypoints?: { lat: number; lng: number; label: string }[];
}

export default function MapboxMapInner({
  position,
  onPositionChange,
  zoom = 15.5,
  routeCoordinates,
  pickupWaypoints,
}: MapboxMapInnerProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const waypointMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const [tokenMissing, setTokenMissing] = useState(false);

  // Retrieve Mapbox token from environment
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Check if a valid token is provided
    if (!mapboxToken || mapboxToken.includes("placeholder") || !mapboxToken.startsWith("pk.")) {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = mapboxToken;

    // Create custom Scrap Pay emerald pin DOM element
    const pinEl = document.createElement("div");
    pinEl.className = "scrap-pay-mapbox-marker";
    pinEl.innerHTML = `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 44px; height: 54px; cursor: grab;">
        <!-- Pulsing Radar Glow -->
        <div style="position: absolute; top: 2px; width: 38px; height: 38px; background-color: rgba(16, 185, 129, 0.4); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        
        <!-- Teardrop Emerald Pin -->
        <div style="position: relative; z-index: 10; width: 38px; height: 38px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -3px rgba(5, 150, 105, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.15); border: 2.5px solid #ffffff;">
          <!-- Recycling Eco Icon -->
          <svg style="transform: rotate(45deg); width: 18px; height: 18px; color: #ffffff;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </div>

        <!-- Shadow anchor -->
        <div style="position: relative; z-index: 5; width: 14px; height: 4px; background: rgba(0, 0, 0, 0.35); border-radius: 50%; margin-top: -3px; filter: blur(1.5px);"></div>
      </div>
    `;

    // Initialize Mapbox map instance
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [position.lng, position.lat], // Note: Mapbox takes [lng, lat]
      zoom: zoom,
      attributionControl: true,
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    // Initialize interactive draggable marker
    const marker = new mapboxgl.Marker({
      element: pinEl,
      draggable: true,
      anchor: "bottom",
    })
      .setLngLat([position.lng, position.lat])
      .addTo(map);

    // Marker drag end event
    marker.on("dragend", () => {
      const lngLat = marker.getLngLat();
      onPositionChange({
        lat: Number(lngLat.lat.toFixed(6)),
        lng: Number(lngLat.lng.toFixed(6)),
      });
    });

    // Map click event (moves pin to clicked location)
    map.on("click", (e) => {
      marker.setLngLat(e.lngLat);
      onPositionChange({
        lat: Number(e.lngLat.lat.toFixed(6)),
        lng: Number(e.lngLat.lng.toFixed(6)),
      });
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, [mapboxToken]);

  // Smoothly update marker position and camera when position prop changes externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;

    const currentLngLat = markerRef.current.getLngLat();
    const latDiff = Math.abs(currentLngLat.lat - position.lat);
    const lngDiff = Math.abs(currentLngLat.lng - position.lng);

    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      markerRef.current.setLngLat([position.lng, position.lat]);
      mapRef.current.flyTo({
        center: [position.lng, position.lat],
        zoom: zoom,
        duration: 1200,
        essential: true,
      });
    }
  }, [position, zoom]);

  // Draw Future-Ready Mapbox Optimized Route Polyline if provided
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const sourceId = "scrap-pickup-route";
    const layerId = "scrap-route-line";
    const casingId = "scrap-route-casing";

    const updateRoute = () => {
      if (!map.isStyleLoaded()) return;

      if (!routeCoordinates || routeCoordinates.length < 2) {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getLayer(casingId)) map.removeLayer(casingId);
        if (map.getSource(sourceId)) map.removeSource(sourceId);
        return;
      }

      const geojsonData: GeoJSON.Feature<GeoJSON.LineString> = {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
      };

      if (map.getSource(sourceId)) {
        (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geojsonData);
      } else {
        map.addSource(sourceId, {
          type: "geojson",
          data: geojsonData,
        });

        // Add glow casing
        map.addLayer({
          id: casingId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#064e3b",
            "line-width": 8,
            "line-opacity": 0.35,
          },
        });

        // Add main route line in Scrap Pay brand green
        map.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: { "line-join": "round", "line-cap": "round" },
          paint: {
            "line-color": "#10b981",
            "line-width": 4.5,
            "line-opacity": 0.95,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      updateRoute();
    } else {
      map.once("style.load", updateRoute);
    }
  }, [routeCoordinates]);

  // Render optional multi-stop waypoints (for future route optimization preview)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear old waypoint markers
    waypointMarkersRef.current.forEach((m) => m.remove());
    waypointMarkersRef.current = [];

    if (!pickupWaypoints || pickupWaypoints.length === 0) return;

    pickupWaypoints.forEach((wp, index) => {
      const el = document.createElement("div");
      el.className = "scrap-stop-waypoint-badge";
      el.innerHTML = `
        <div style="background-color: #0f172a; color: #ffffff; border: 2px solid #10b981; border-radius: 9999px; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
          ${index + 1}
        </div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([wp.lng, wp.lat])
        .setPopup(new mapboxgl.Popup({ offset: 15 }).setHTML(`<strong>${wp.label}</strong>`))
        .addTo(map);

      waypointMarkersRef.current.push(marker);
    });
  }, [pickupWaypoints]);

  return (
    <div className="w-full h-full relative z-0">
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[350px]"
        style={{ height: "100%", width: "100%" }}
      />

      {/* Helpful Token Setup Banner if Token is missing */}
      {tokenMissing && (
        <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl font-bold border border-emerald-500/30">
            🗺️
          </div>
          <div className="max-w-md space-y-1">
            <h4 className="text-sm font-black text-white">Mapbox Public Token Required</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              To render the high-resolution vector map and real-time routing, add your Mapbox API key to <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded text-[11px] font-mono">.env.local</code>:
            </p>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-4 py-2 text-[11px] font-mono text-emerald-300 select-all">
            NEXT_PUBLIC_MAPBOX_TOKEN=&quot;pk.eyJ1...&quot;
          </div>
          <p className="text-[10px] text-slate-400">
            Get your free access token at <span className="text-emerald-400 font-bold">mapbox.com</span> (includes 50,000 free map loads/mo).
          </p>
        </div>
      )}
    </div>
  );
}
