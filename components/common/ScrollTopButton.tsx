"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Jangan tampilkan button jika berada di halaman dashboard
  if (
    pathname?.startsWith("/dashboard") ||
    pathname === "/login" ||
    pathname?.startsWith("/verify")
  ) {
    return null;
  }

  const scrollToTop = () => {
    const scrollDuration = 800; // durasi dalam ms
    const scrollStep = -window.scrollY / (scrollDuration / 16); // 16ms per frame ~60fps

    const scrollInterval = () => {
      if (window.scrollY !== 0) {
        window.scrollBy(0, scrollStep);
        requestAnimationFrame(scrollInterval);
      }
    };
    requestAnimationFrame(scrollInterval);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          key="scrollToTop"
          initial={{ opacity: 0, y: 30, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.8 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          onClick={scrollToTop}
          className="fixed z-50 bottom-6 right-6 flex items-center justify-center w-11 h-11 rounded-md bg-white backdrop-blur-md shadow-lg cursor-pointer text-gray-950 hover:shadow-xl transition-all duration-300 group"
          aria-label="Scroll to top"
        >
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <ArrowUp size={20} className="group-hover:text-blue-600" />
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
