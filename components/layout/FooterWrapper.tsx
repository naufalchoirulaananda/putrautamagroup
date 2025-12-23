"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function FooterWrapper() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname.startsWith("/verify")
  )
    return null;
  return <Footer />;
}
