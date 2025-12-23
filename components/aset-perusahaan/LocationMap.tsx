"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCcw } from "lucide-react";

interface LocationMapProps {
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationMapAP({ onLocationChange }: LocationMapProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  const getLocation = () => {
    setLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Geolocation tidak didukung oleh browser Anda");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateLocation(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        let errorMessage = "Tidak dapat mengakses lokasi Anda";
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMessage = "Permintaan lokasi timeout. Silakan coba lagi.";
            break;
          default:
            errorMessage = "Terjadi kesalahan saat mengambil lokasi.";
        }
        
        setError(errorMessage);
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message,
          PERMISSION_DENIED: error.PERMISSION_DENIED,
          POSITION_UNAVAILABLE: error.POSITION_UNAVAILABLE,
          TIMEOUT: error.TIMEOUT
        });
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const updateLocation = (lat: number, lng: number) => {
    setLocation({ lat, lng });
    onLocationChange(lat, lng);
    
    // Update marker position if map is already initialized
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapRef.current.setView([lat, lng], 16);
    }
  };

  useEffect(() => {
    getLocation();
  }, []);

  useEffect(() => {
    if (!location) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.async = true;
    
    script.onload = () => {
      const L = (window as any).L;
      
      // Initialize map
      if (!mapRef.current) {
        const map = L.map('map').setView([location.lat, location.lng], 16);
        
        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19
        }).addTo(map);

        // Add draggable marker
        const marker = L.marker([location.lat, location.lng], {
          draggable: true,
          autoPan: true
        }).addTo(map);

        // Update location when marker is dragged
        marker.on('dragend', function(e: any) {
          const position = e.target.getLatLng();
          updateLocation(position.lat, position.lng);
        });

        mapRef.current = map;
        markerRef.current = marker;
      }
    };

    document.body.appendChild(script);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [location?.lat, location?.lng]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium">Lokasi Anda</label>
        <Button
          type="button"
          onClick={getLocation}
          size="sm"
          variant="outline"
          disabled={loading}
        >
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Lokasi
        </Button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {location && (
        <div className="space-y-2">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              💡 <strong>Tip:</strong> Drag marker untuk menyesuaikan lokasi
            </p>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Koordinat:</p>
                <p className="text-sm text-gray-600">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Leaflet Map */}
          <div 
            id="map" 
            className="rounded-lg overflow-hidden border"
            style={{ height: '300px', width: '100%' }}
          />
        </div>
      )}

      {!location && !error && loading && (
        <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
          Mengambil lokasi Anda...
        </div>
      )}
    </div>
  );
}