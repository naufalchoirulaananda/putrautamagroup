"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface Section {
  section_type: "heading" | "text" | "image";
  title: string | null;
  content: string | null;
  image: string | null;
}

/* =======================
   Helper Functions
======================= */

function stripHtml(html?: string | null) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

function firstSentence(text: string) {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return match ? match[0] : text;
}

/* =======================
   Component
======================= */

function CompanyProfileSection() {
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    fetch("/api/about/hero")
      .then((res) => res.json())
      .then(setSections);
  }, []);

  const heading = sections.find((s) => s.section_type === "heading");
  const text = sections.find((s) => s.section_type === "text");
  const image = sections.find((s) => s.section_type === "image");

  return (
    <section className="relative w-full h-[400px] sm:h-[500px]">
      {/* Background Image */}
      <Image
        src={image?.image || "/images/image-after-hero.webp"}
        alt="Sekilas Putra Utama Group"
        fill
        priority
        className="object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center h-full px-6 lg:px-[70px] text-white">
        {/* Small Heading */}
        <p className="text-xs tracking-wide uppercase font-semibold mb-4">
          {heading?.title}
        </p>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-4">Tentang Kami</h2>

        {/* DESKTOP: HTML paragraph */}
        <div
          className="hidden sm:block max-w-3xl text-base leading-relaxed mb-6 text-justify"
          dangerouslySetInnerHTML={{ __html: text?.content || "" }}
        />

        {/* MOBILE: 1 sentence only */}
        <p className="block sm:hidden max-w-3xl text-base leading-relaxed mb-6 text-justify">
          {firstSentence(stripHtml(text?.content))}
        </p>

        {/* CTA */}
        <Link
          href="/tentang-kami"
          className="group inline-flex text-sm font-medium items-center self-start gap-2 px-6 py-3 rounded-full border border-white text-white 
             hover:bg-white hover:text-black transition-all duration-300"
        >
          Selengkapnya →
        </Link>
      </div>
    </section>
  );
}

export default CompanyProfileSection;
