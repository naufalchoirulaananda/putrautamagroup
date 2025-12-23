"use client";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/about-tabs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";
import { useEffect, useState } from "react";

interface TentangKamiProps {
  tab: string;
}

interface HeaderData {
  id: number;
  title: string;
  description: string;
  background_image: string;
  is_active: boolean;
}

interface Tab {
  id: number;
  slug: string;
  title: string;
  sort_order: number;
  is_active: boolean;
}

interface Section {
  id: number | null;
  tab_id: number | null;
  section_type:
    | "heading"
    | "text"
    | "image"
    | "list"
    | "two-column"
    | "two-column-separator"
    | "separator";

  title: string;
  content: string;
  image: string;
  sort_order: number;
}

export default function TentangKami({ tab }: TentangKamiProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [header, setHeader] = useState<HeaderData | null>(null);
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [sections, setSections] = useState<{ [key: number]: Section[] }>({});

  const activeTab =
    tabs.find((t) => t.slug === tab && t.is_active)?.slug ||
    tabs[0]?.slug ||
    "";

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load header
      const headerRes = await fetch("/api/about/header");
      const headerData = await headerRes.json();
      if (headerData.success && headerData.data) {
        setHeader(headerData.data);
      }

      // Load tabs (only active tabs)
      const tabsRes = await fetch("/api/about/tabs");
      const tabsData = await tabsRes.json();
      if (tabsData.success) {
        const activeTabs = tabsData.data.filter((t: Tab) => t.is_active);
        setTabs(activeTabs);

        // Load sections for each tab
        const sectionsData: { [key: number]: Section[] } = {};
        for (const tab of activeTabs) {
          const sectionsRes = await fetch(
            `/api/about/sections?tab_id=${tab.id}`
          );
          const data = await sectionsRes.json();
          if (data.success) {
            sectionsData[tab.id] = data.data;
          }
        }
        setSections(sectionsData);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    }
    setLoading(false);
  };

  const renderSection = (section: Section) => {
    switch (section.section_type) {
      case "heading":
        return (
          <div key={section.id} className="w-full flex justify-start">
            <h2 className="text-left text-2xl md:text-3xl font-semibold mb-6">
              {section.title}
            </h2>
          </div>
        );

      case "text":
        return (
          <div key={section.id} className="mb-6">
            {section.title && (
              <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
            )}
            <div
              className="text-gray-700 leading-loose prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content || "" }}
            />
          </div>
        );

      case "image":
        return (
          <div key={section.id} className="mb-6">
            {section.title && (
              <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
            )}

            {section.image && (
              <img
                src={section.image}
                alt={section.title || "Image"}
                className="
      w-full
      max-h-64
      object-contain
      bg-red-500
    "
              />
            )}
          </div>
        );

      case "list":
        return (
          <div key={section.id} className="mb-6">
            {section.title && (
              <h3 className="text-xl font-semibold mb-3">{section.title}</h3>
            )}
            <div
              className="text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content || "" }}
            />
          </div>
        );

      case "two-column-separator":
        return (
          <div
            key={section.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-center"
          >
            <div className="font-semibold text-base md:text-lg text-gray-900">
              {section.title}
            </div>
            <div className="flex items-center">
              <hr className="w-full border-t mb-2 sm:mb-4 border-gray-300" />
            </div>
          </div>
        );

      case "two-column":
        return (
          <div
            key={section.id}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-start"
          >
            <div className="font-semibold text-base mt-3 md:text-lg text-gray-900">
              {section.title}
            </div>
            <div
              className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: section.content || "" }}
            />
          </div>
        );

      case "separator":
        return (
          <div key={section.id} className="my-4 sm:my-8">
            <hr className="border-t border-gray-300" />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <div className="w-full flex flex-col scroll-smooth">
        {/* Header - Dynamic */}
        {header && (
          <div className="w-full h-[380px] md:h-[450px] relative">
            <img
              src={header.background_image || "/images/section.svg"}
              alt="Hero"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex flex-col justify-end pb-16 px-6 md:px-20">
              <h1 className="text-white text-3xl md:text-5xl font-bold mb-3">
                {header.title}
              </h1>
              <p className="text-white text-sm leading-loose md:text-base max-w-2xl">
                {header.description}
              </p>
            </div>
          </div>
        )}

        {/* Tabs - Dynamic */}
        <div className="flex w-full flex-col gap-6">
          <Tabs
            value={activeTab}
            onValueChange={(v) => router.push(`/tentang-kami/${v}`)}
          >
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.slug}>
                  {tab.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.id}
                value={tab.slug}
                className="py-16 sm:py-24 mx-auto px-6 lg:px-40"
              >
                {sections[tab.id]?.map((section) => renderSection(section))}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      {/* Custom Styles for WYSIWYG Content */}
      <style jsx global>{`
        .prose {
          color: #374151;
        }
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          text-align: left;
          color: #111827;
          font-weight: 600;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        .prose p {
          margin-bottom: 1em;
          text-align: justify;
        }
        .prose strong {
          font-weight: 600;
          color: #111827;
        }
        .prose ul,
        .prose ol {
          margin: 1em 0;
          padding-left: 1.5em;
        }
        .prose li {
          margin-bottom: 0.5em;
        }
        .prose a {
          color: #2563eb;
          text-decoration: underline;
        }
        .prose a:hover {
          color: #1d4ed8;
        }
        .prose blockquote {
          border-left: 4px solid #e5e7eb;
          padding-left: 1em;
          margin: 1em 0;
          font-style: italic;
          color: #6b7280;
        }
        .prose img {
          border-radius: 0.5rem;
          margin: 1.5em 0;
        }
        .prose code {
          background: #f3f4f6;
          padding: 0.2em 0.4em;
          border-radius: 0.25rem;
          font-size: 0.875em;
        }
        .prose pre {
          background: #1f2937;
          color: #f9fafb;
          padding: 1em;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1em 0;
        }
      `}</style>
    </>
  );
}
