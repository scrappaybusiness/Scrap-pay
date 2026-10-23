"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Interface for coordinates
export interface Coordinates {
  lat: number;
  lng: number;
}

interface LeafletMapInnerProps {
  position: Coordinates;
  onPositionChange: (newPos: Coordinates) => void;
  zoom?: number;
}

// Controller component to smoothly center/fly map when position prop changes externally
function MapController({ position }: { position: Coordinates }) {
  const map = useMap();
  const prevPosRef = useRef<Coordinates>(position);

  useEffect(() => {
    // Only fly if coordinates moved by more than a tiny threshold
    const latDiff = Math.abs(prevPosRef.current.lat - position.lat);
    const lngDiff = Math.abs(prevPosRef.current.lng - position.lng);
    if (latDiff > 0.0001 || lngDiff > 0.0001) {
      map.flyTo([position.lat, position.lng], map.getZoom() || 16, {
        duration: 1.2,
      });
      prevPosRef.current = position;
    }
  }, [position, map]);

  return null;
}

// Map event listener for clicking to place the pin
function MapEventsHandler({ onPositionChange }: { onPositionChange: (newPos: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onPositionChange({
        lat: Number(e.latlng.lat.toFixed(6)),
        lng: Number(e.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

export default function LeafletMapInner({
  position,
  onPositionChange,
  zoom = 16,
}: LeafletMapInnerProps) {
  // Custom Scrap Pay emerald marker icon using L.divIcon
  const scrapPayIcon = useMemo(() => {
    return L.divIcon({
      className: "scrap-pay-custom-marker",
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; width: 48px; height: 56px;">
          <!-- Pulse animation ring -->
          <div style="position: absolute; top: 3px; width: 38px; height: 38px; background-color: rgba(16, 185, 129, 0.35); border-radius: 50%; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          
          <!-- Teardrop Pin Shape -->
          <div style="position: relative; z-index: 10; width: 40px; height: 40px; background: linear-gradient(135deg, #059669, #10b981); border-radius: 50% 50% 50% 0; transform: rotate(-45deg); display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 25px -3px rgba(5, 150, 105, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.1); border: 2.5px solid #ffffff;">
            <!-- Recycling Truck/Leaf Icon rotated back to horizontal -->
            <svg style="transform: rotate(45deg); width: 20px; height: 20px; color: #ffffff;" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          
          <!-- Ground shadow -->
          <div style="position: relative; z-index: 5; width: 14px; height: 5px; background: rgba(0, 0, 0, 0.3); border-radius: 50%; margin-top: -3px; filter: blur(1.5px);"></div>
        </div>
      `,
      iconSize: [48, 56],
      iconAnchor: [24, 52],
      popupAnchor: [0, -50],
    });
  }, []);

  const markerRef = useRef<L.Marker | null>(null);

  // Marker drag handler
  const eventHandlers = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker != null) {
          const newLatLng = marker.getLatLng();
          onPositionChange({
            lat: Number(newLatLng.lat.toFixed(6)),
            lng: Number(newLatLng.lng.toFixed(6)),
          });
        }
      },
    }),
    [onPositionChange]
  );

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={[position.lat, position.lng]}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
        style={{ minHeight: "100%", width: "100%" }}
      >
        {/* Free OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Dynamic Map Events & Center Controller */}
        <MapEventsHandler onPositionChange={onPositionChange} />
        <MapController position={position} />

        {/* Draggable Interactive Scrap Pay Marker */}
        <Marker
          draggable={true}
          eventHandlers={eventHandlers}
          position={[position.lat, position.lng]}
          ref={markerRef}
          icon={scrapPayIcon}
        />
      </MapContainer>
    </div>
  );
}
