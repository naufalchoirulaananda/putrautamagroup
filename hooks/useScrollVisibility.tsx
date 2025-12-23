import { useState, useEffect } from "react";

export function useScrollVisibility(timeoutDuration = 1000) {
  const [lastScrollTop, setLastScrollTop] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollTimeout, setScrollTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollTop = window.pageYOffset;
      setIsVisible(currentScrollTop < lastScrollTop || currentScrollTop <= 0);
      setLastScrollTop(currentScrollTop);

      if (scrollTimeout) clearTimeout(scrollTimeout);

      setScrollTimeout(
        setTimeout(() => {
          setIsVisible(true);
        }, timeoutDuration)
      );
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };
  }, [lastScrollTop, scrollTimeout, timeoutDuration]);

  return isVisible;
}
