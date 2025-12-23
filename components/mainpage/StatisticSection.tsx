"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Separator } from "../ui/separator";

interface Statistics {
  totalKaryawan: number;
  totalPerusahaan: number;
  totalCabang: number;
}

// Custom hook untuk animasi counting
function useCountAnimation(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => {
      if (countRef.current) {
        observer.unobserve(countRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible || end === 0) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = (currentTime - startTime) / duration;

      if (progress < 1) {
        // Easing function untuk animasi yang lebih smooth
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration, isVisible]);

  return { count, ref: countRef };
}

function StatisticSection() {
  const [stats, setStats] = useState<Statistics>({
    totalKaryawan: 0,
    totalPerusahaan: 0,
    totalCabang: 0,
  });
  const [loading, setLoading] = useState(true);

  const perusahaanCounter = useCountAnimation(stats.totalPerusahaan, 2000);
  const karyawanCounter = useCountAnimation(stats.totalKaryawan, 2500);
  const cabangCounter = useCountAnimation(stats.totalCabang, 2000);

  useEffect(() => {
    async function fetchStatistics() {
      try {
        const response = await fetch("/api/statistics");
        const result = await response.json();

        if (result.success) {
          setStats(result.data);
        }
      } catch (error) {
        console.error("Error fetching statistics:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStatistics();
  }, []);

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 py-16 sm:py-24 mx-auto px-6 lg:px-[70px]">
        {/* Bagian 1 */}
        <div className="flex-[0.8]">
          <p className="text-xs tracking-wide uppercase font-semibold mb-2">
            Putra Utama Group (2025)
          </p>
          <p className="text-3xl lg:text-3xl max-w-2xl font-bold leading-snug">
            Putra Utama Group Kembangkan Jaringan Usaha Baru di Sektor Energi
            dan Otomotif
          </p>
        </div>

        {/* Bagian 6 */}
        <div className="flex-1 lg:flex-1">
          <p className="text-base leading-relaxed text-justify">
            PT Putra Utama Group terus memperluas lini bisnisnya dengan membuka
            unit usaha baru di sektor energi dan otomotif, sebagai langkah
            strategis memperkuat kontribusi terhadap pembangunan ekonomi
            nasional.
          </p>
        </div>

        {/* Bagian 5 */}
        <div className="flex-[0.3] flex justify-end">
          <Link
            href="#"
            className="group inline-flex text-sm font-medium items-center self-start gap-2 px-6 py-3 rounded-full border border-black text-black 
             hover:bg-yellow-500 hover:text-black transition-all duration-300"
          >
            Selengkapnya
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="currentColor"
              viewBox="0 0 256 256"
              className="transition-colors duration-300 group-hover:text-black"
            >
              <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path>
            </svg>
          </Link>
        </div>
      </div>

      <div className="px-6 lg:px-[70px]">
        <Separator />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-4 py-16 sm:py-24 mx-auto px-6 lg:px-[70px]">
        {/* Total Perusahaan */}
        <div className="flex flex-col gap-4" ref={perusahaanCounter.ref}>
          <p className="text-xs tracking-wide text-[#0b2f9f] uppercase font-semibold">
            Total Perusahaan
          </p>
          <p className="text-[60px] leading-none font-bold tabular-nums">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              perusahaanCounter.count
            )}
          </p>
          <p className="text-4xl leading-none">Perusahaan</p>
          <p className="text-base">
            Mendukung pertumbuhan ekonomi dan membuka lebih banyak peluang kerja
            di Indonesia.
          </p>
        </div>

        {/* Total Karyawan */}
        <div className="flex flex-col gap-4" ref={karyawanCounter.ref}>
          <p className="text-xs tracking-wide text-[#0b2f9f] uppercase font-semibold">
            Total Karyawan
          </p>
          <p className="text-[60px] leading-none font-bold tabular-nums">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              `${karyawanCounter.count}+`
            )}
          </p>
          <p className="text-4xl leading-none">Karyawan</p>
          <p className="text-base">
            Kami berkomitmen menghadirkan layanan terbaik di setiap lini bisnis.
          </p>
        </div>

        {/* Total Cabang */}
        <div className="flex flex-col gap-4" ref={cabangCounter.ref}>
          <p className="text-xs tracking-wide text-[#0b2f9f] uppercase font-semibold">
            Total Cabang Perusahaan
          </p>
          <p className="text-[60px] leading-none font-bold tabular-nums">
            {loading ? (
              <span className="animate-pulse">...</span>
            ) : (
              cabangCounter.count
            )}
          </p>
          <p className="text-4xl leading-none">Cabang Perusahaan</p>
          <p className="text-base">
            Memastikan layanan dan distribusi yang optimal bagi pelanggan dan
            mitra.
          </p>
        </div>
      </div>

      <div className="px-6 lg:px-[70px]">
        <Separator />
      </div>
    </>
  );
}

export default StatisticSection;