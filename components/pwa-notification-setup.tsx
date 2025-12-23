// File: components/pwa-notification-setup.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export function PWANotificationSetup() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user) return;

    // Check if service worker and notifications are supported
    if ("serviceWorker" in navigator && "Notification" in window) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("✅ Service Worker registered:", registration);
        })
        .catch((error) => {
          console.error("❌ Service Worker registration failed:", error);
        });

      // Request notification permission
      if (Notification.permission === "default") {
        Notification.requestPermission().then((permission) => {
          console.log("Notification permission:", permission);
        });
      }
    }
  }, [session]);

  return null; // This component doesn't render anything
}