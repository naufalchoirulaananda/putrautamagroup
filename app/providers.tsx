"use client";

import { PWANotificationSetup } from "@/components/pwa-notification-setup";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PWANotificationSetup />
      {children}
    </SessionProvider>
  );
}
