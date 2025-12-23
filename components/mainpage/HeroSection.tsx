"use client";

import React, { useState, useEffect } from "react";
import { Button } from "../ui/button";

interface SlideContent {
  id: number;
  type: "image" | "video";
  src: string;
  title: string;
  subtitle: string;
  cta?: string;
  buttonLink: string;
}

const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [progress, setProgress] = useState(0);
  const [slides, setSlides] = useState<SlideContent[]>([]);

  // Fetch data dari database
  useEffect(() => {
    const fetchHeroSections = async () => {
      try {
        const response = await fetch("/api/hero-section?visible=true");
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
          // Ambil maksimal 5 data terbaru yang visible
          const formattedSlides = result.data.slice(0, 5).map((item: any) => ({
            id: item.id,
            type: item.type,
            src: item.file_name,
            title: item.title,
            subtitle: item.subtitle || "",
            cta: item.cta || "",
            buttonLink: item.button_link,
          }));

          setSlides(formattedSlides);
        }
      } catch (error) {
        console.error("Error fetching hero sections:", error);
      }
    };

    fetchHeroSections();
  }, []);

  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;

    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev >= 100 ? 100 : prev + 100 / (10000 / 50)));
    }, 50);

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
      setProgress(0);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(progressInterval);
    };
  }, [isAutoPlay, slides.length, currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(true);
    setProgress(0);
  };

  // Jika belum ada data, jangan render apa-apa
  if (slides.length === 0) {
    return null;
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Slide Section */}
      <div className="relative flex-1 overflow-hidden">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? "opacity-100" : "opacity-0"
            }`}
          >
            {slide.type === "image" ? (
              <img
                src={slide.src}
                alt={slide.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <video
                src={slide.src}
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full object-cover"
              />
            )}

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-linear-to-b from-black/40 via-black/30 to-black/60" />

            {/* Text Content */}
            <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-[70px] mb-[150px]">
              <h1 className="text-2xl md:text-4xl font-semibold text-white mb-4 animate-fade-in">
                {slide.title}
              </h1>
              <p className="text-base sm:text-xl md:text-base text-white/90 mb-8 animate-fade-in-delay">
                {slide.subtitle}
              </p>
              {slide.cta && (
                <Button
                  className="cursor-pointer rounded-full bg-transparent border py-6 px-6 max-w-auto sm:max-w-max hover:bg-white hover:text-black pointer-events-auto z-10"
                  onClick={() =>
                    (window.location.href = slide.buttonLink || "#")
                  }
                >
                  {slide.cta}
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress Bar Section */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full z-10 h-16 px-6 sm:px-[70px] flex flex-col sm:flex-row items-center gap-2">
        {/* Mobile: Single Progress Bar with Label */}
        <div className="sm:hidden w-full flex flex-col mb-2">
          <div className="text-left text-white/80 text-xs sm:text-sm font-medium mb-2">
            {slides[currentSlide].title}
          </div>
          <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Desktop: Multiple Progress Bars */}
        <div className="hidden sm:flex gap-2 w-full">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              onClick={() => goToSlide(index)}
              className="flex-1 cursor-pointer group"
            >
              <div className="text-left text-white/80 text-sm font-medium mb-2 group-hover:text-white transition-colors">
                {slide.title}
              </div>
              <div
                className={`h-1 bg-white/30 rounded-full overflow-hidden group-hover:bg-white/40 transition-colors ${
                  index === currentSlide ? "block" : "hidden sm:block"
                }`}
              >
                <div
                  className="h-full transition-all duration-100 ease-linear"
                  style={{
                    width: index === currentSlide ? `${progress}%` : "0%",
                    backgroundColor:
                      index === currentSlide ? "#ef4444" : "transparent",
                  }}
                />
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-fade-in-delay {
          animation: fade-in 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
