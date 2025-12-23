"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, RefreshCcw } from "lucide-react";

interface LocationMapProps {
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationMap({ onLocationChange }: LocationMapProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setLocation({ lat: latitude, lng: longitude });
        onLocationChange(latitude, longitude);
        setLoading(false);
      },
      (error) => {
        let msg = "Tidak dapat mengakses lokasi Anda";
      
        if (error.code === error.PERMISSION_DENIED) {
          msg = "Akses lokasi ditolak. Mohon izinkan lokasi di browser Anda.";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          msg = "Lokasi tidak tersedia. Coba nyalakan GPS atau wifi.";
        } else if (error.code === error.TIMEOUT) {
          msg = "Waktu request lokasi habis. Coba ulangi.";
        }
      
        setError(msg);
        console.error("Geolocation error:", {
          code: error.code,
          message: error.message
        });
      
        setLoading(false);
      }
      ,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    getLocation();
  }, []);

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
          <div className="p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">Koordinat:</p>
                <p className="text-sm">
                  Lat: {location.lat.toFixed(6)}, Lng: {location.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>

          {/* Simple Map Preview using OpenStreetMap */}
          <div className="rounded-lg overflow-hidden border">
            <iframe
              width="100%"
              height="300"
              frameBorder="0"
              scrolling="no"
              marginHeight={0}
              marginWidth={0}
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.lng - 0.01},${location.lat - 0.01},${location.lng + 0.01},${location.lat + 0.01}&layer=mapnik&marker=${location.lat},${location.lng}`}
            />
          </div>
        </div>
      )}

      {!location && !error && loading && (
        <div className="p-4 rounded-lg text-center text-sm text-gray-600">
          Mengambil lokasi Anda...
        </div>
      )}
    </div>
  );
}