"use client"

import { useEffect, useRef } from "react"
import { useSidebar } from "@/components/ui/sidebar"

export default function SwipeHandler() {
  const { openMobile, setOpenMobile, open, setOpen } = useSidebar()
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchEndX = useRef(0)
  const touchEndY = useRef(0)
  const isSwiping = useRef(false)
  const isSwipeFromEdge = useRef(false)
  const isScrollableElement = useRef(false)

  // Handle resize: reset sidebar state saat transition antara mobile/desktop
  useEffect(() => {
    let resizeTimer: NodeJS.Timeout

    const handleResize = () => {
      clearTimeout(resizeTimer)
      
      resizeTimer = setTimeout(() => {
        const isMobile = window.innerWidth < 768
        
        console.log("Resize detected:", { 
          width: window.innerWidth, 
          isMobile, 
          openMobile, 
          open 
        })

        if (!isMobile) {
          // Transisi ke desktop: tutup mobile sidebar, reset desktop sidebar
          if (openMobile) {
            console.log("✅ Closing mobile sidebar on desktop resize")
            setOpenMobile(false)
          }
          // Force reset desktop sidebar state agar tidak stuck
          // Biarkan user control desktop sidebar secara manual
        } else {
          // Transisi ke mobile: pastikan desktop sidebar tidak menggangu
          if (open) {
            console.log("✅ Ensuring desktop sidebar closed on mobile resize")
            setOpen(false)
          }
        }
      }, 150) // Debounce 150ms
    }

    window.addEventListener('resize', handleResize)
    
    // Initial check saat mount
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(resizeTimer)
    }
  }, [openMobile, open, setOpenMobile, setOpen])

  // Auto-close sidebar saat klik menu di mobile
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Cek apakah yang diklik adalah link menu di dalam sidebar
      const isMenuLink = target.closest('[data-sidebar="menu"]') && 
                        (target.closest('a') || target.tagName === 'A')
      
      if (isMenuLink && window.innerWidth < 768 && openMobile) {
        console.log("✅ Menu clicked, closing sidebar on mobile")
        // Delay sedikit agar navigasi sempat diproses
        setTimeout(() => {
          setOpenMobile(false)
        }, 150)
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [openMobile, setOpenMobile])

  useEffect(() => {
    // Cek apakah sedang di mobile view
    const checkMobile = () => window.innerWidth < 768

    const minSwipeDistance = 70 // Minimal jarak swipe dalam pixel
    const edgeThreshold = 50 // Area tepi kiri untuk membuka sidebar (dalam pixel)

    // Fungsi untuk cek apakah element bisa di-scroll horizontal
    const hasHorizontalScroll = (element: HTMLElement | null): boolean => {
      if (!element) return false
      
      // Cek apakah element ini atau parent-nya memiliki overflow-x-auto/scroll
      let current: HTMLElement | null = element
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current)
        const overflowX = style.overflowX
        
        // Jika ada overflow-x auto/scroll DAN konten lebih lebar dari container
        if ((overflowX === 'auto' || overflowX === 'scroll') && 
            current.scrollWidth > current.clientWidth) {
          return true
        }
        
        current = current.parentElement
      }
      return false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (!checkMobile()) return
      
      touchStartX.current = e.touches[0].clientX
      touchStartY.current = e.touches[0].clientY
      isSwiping.current = false
      
      // Cek apakah swipe dimulai dari tepi kiri layar (untuk buka sidebar)
      isSwipeFromEdge.current = touchStartX.current <= edgeThreshold
      
      // Cek apakah touch dimulai dari element yang bisa di-scroll horizontal
      const target = e.target as HTMLElement
      isScrollableElement.current = hasHorizontalScroll(target)
      
      console.log("Touch start X:", touchStartX.current)
      console.log("From edge:", isSwipeFromEdge.current)
      console.log("Scrollable element:", isScrollableElement.current)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!checkMobile()) return
      
      touchEndX.current = e.touches[0].clientX
      touchEndY.current = e.touches[0].clientY
      
      const diffX = touchEndX.current - touchStartX.current
      const diffY = touchEndY.current - touchStartY.current
      
      // Jika dimulai dari scrollable element, jangan intercept
      if (isScrollableElement.current) {
        return
      }
      
      // Deteksi horizontal swipe (gerakan horizontal lebih dominan dari vertikal)
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 15) {
        // Hanya prevent default jika:
        // 1. Sidebar terbuka dan swipe kiri (untuk tutup)
        // 2. Swipe dari edge kanan (untuk buka)
        if ((openMobile && diffX < 0) || (!openMobile && isSwipeFromEdge.current && diffX > 0)) {
          isSwiping.current = true
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = () => {
      if (!checkMobile() || !isSwiping.current) {
        isSwiping.current = false
        isSwipeFromEdge.current = false
        isScrollableElement.current = false
        return
      }
      
      const diffX = touchEndX.current - touchStartX.current
      const diffY = touchEndY.current - touchStartY.current
      
      console.log("Swipe distance X:", diffX)
      console.log("Sidebar open:", openMobile)
      
      // Pastikan gerakan horizontal lebih dominan dari vertikal
      if (Math.abs(diffX) > Math.abs(diffY)) {
        
        // SWIPE KANAN (kiri ke kanan) - BUKA SIDEBAR
        // HANYA jika dimulai dari tepi kiri layar
        if (!openMobile && isSwipeFromEdge.current && diffX > minSwipeDistance) {
          console.log("✅ Opening sidebar - swipe right from edge detected")
          setOpenMobile(true)
        }
        
        // SWIPE KIRI (kanan ke kiri) - TUTUP SIDEBAR
        // Hanya jika sidebar sedang terbuka
        if (openMobile && diffX < -minSwipeDistance) {
          console.log("✅ Closing sidebar - swipe left detected")
          setOpenMobile(false)
        }
      }
      
      // Reset
      isSwiping.current = false
      isSwipeFromEdge.current = false
      isScrollableElement.current = false
    }

    // Tambahkan event listeners
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchmove", handleTouchMove, { passive: false })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [openMobile, setOpenMobile])

  return null
}