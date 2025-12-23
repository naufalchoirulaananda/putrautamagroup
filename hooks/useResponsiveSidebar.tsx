// File: hooks/useResponsiveSidebar.ts
"use client"

import { useEffect } from "react"
import { useSidebar } from "@/components/ui/sidebar"

/**
 * Custom hook untuk handle responsive sidebar behavior
 * Mengatasi masalah:
 * 1. Sidebar stuck saat resize dari desktop → tablet → desktop
 * 2. Sidebar jadi overlay saat transition breakpoint
 * 3. State conflict antara mobile dan desktop mode
 */
export function useResponsiveSidebar() {
  const sidebar = useSidebar()
  const { open, setOpen, openMobile, setOpenMobile } = sidebar

  useEffect(() => {
    let resizeTimer: NodeJS.Timeout
    let previousWidth = window.innerWidth
    const MOBILE_BREAKPOINT = 768
    const DEBOUNCE_DELAY = 200

    const handleResize = () => {
      clearTimeout(resizeTimer)

      resizeTimer = setTimeout(() => {
        const currentWidth = window.innerWidth
        const wasMobile = previousWidth < MOBILE_BREAKPOINT
        const isMobile = currentWidth < MOBILE_BREAKPOINT
        const wasDesktop = previousWidth >= MOBILE_BREAKPOINT
        const isDesktop = currentWidth >= MOBILE_BREAKPOINT

        console.log("📐 Resize:", {
          from: wasMobile ? "mobile" : "desktop",
          to: isMobile ? "mobile" : "desktop",
          width: currentWidth,
          states: { open, openMobile }
        })

        // Transition: Desktop → Mobile
        if (wasDesktop && isMobile) {
          console.log("📱 Switching to mobile mode")
          if (open) setOpen(false) // Tutup desktop sidebar
          if (openMobile) setOpenMobile(false) // Tutup mobile sidebar juga
        }

        // Transition: Mobile → Desktop
        if (wasMobile && isDesktop) {
          console.log("🖥️ Switching to desktop mode")
          if (openMobile) setOpenMobile(false) // Tutup mobile sidebar
          // Biarkan desktop sidebar dalam state terakhirnya
          // Atau uncomment baris berikut untuk selalu buka saat ke desktop:
          // setOpen(true)
        }

        // Update previous width
        previousWidth = currentWidth
      }, DEBOUNCE_DELAY)
    }

    // Initial setup
    const initialIsMobile = window.innerWidth < MOBILE_BREAKPOINT
    if (initialIsMobile && open) {
      setOpen(false)
    }
    if (!initialIsMobile && openMobile) {
      setOpenMobile(false)
    }

    // Listen resize
    window.addEventListener("resize", handleResize)

    // Listen orientation change (mobile rotate)
    const handleOrientationChange = () => {
      setTimeout(handleResize, 100)
    }
    window.addEventListener("orientationchange", handleOrientationChange)

    return () => {
      window.removeEventListener("resize", handleResize)
      window.removeEventListener("orientationchange", handleOrientationChange)
      clearTimeout(resizeTimer)
    }
  }, [open, setOpen, openMobile, setOpenMobile])

  return sidebar
}

/**
 * Usage:
 * 
 * // Di component yang butuh sidebar state
 * const sidebar = useResponsiveSidebar()
 * 
 * // Atau jika hanya butuh auto-fix tanpa return value
 * useResponsiveSidebar()
 */