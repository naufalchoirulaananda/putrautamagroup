import Link from "next/link";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/group-bisnis-tabs";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

// Komponen Placeholder Card
interface PlaceholderCardProps {
  title: string;
  gradientFrom?: string;
  gradientTo?: string;
  icon?: React.ReactNode;
}

function PlaceholderCard({
  title,
  gradientFrom = "from-blue-600",
  gradientTo = "to-blue-900",
  icon,
}: PlaceholderCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-2xl h-[300px] group">
      {/* Gradient Background */}
      <div
        className={`absolute inset-0 bg-linear-to-br ${gradientFrom} ${gradientTo}`}
      />

      {/* Pattern Overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Icon - Centered */}
      {icon && (
        <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-30 transition-opacity duration-300">
          {icon}
        </div>
      )}

      {/* Content Overlay - Centered */}
      <CardContent className="absolute inset-0 flex flex-col items-center justify-center text-white">
        <p className="text-xs opacity-70 mb-3 font-medium uppercase tracking-wider">
          Divisi
        </p>
        <h3 className="text-3xl font-bold">{title}</h3>
      </CardContent>

      {/* Hover Effect */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
    </Card>
  );
}

// Data divisi untuk setiap kategori
const businessData = {
  retail: [
    {
      title: "GMART",
      gradient: { from: "from-emerald-600", to: "to-teal-900" },
    },
    {
      title: "SPBU",
      gradient: { from: "from-green-600", to: "to-emerald-900" },
    },
    {
      title: "KOPERASI",
      gradient: { from: "from-lime-600", to: "to-green-900" },
    },
  ],
  automotive: [
    {
      title: "OTOMOTIF",
      gradient: { from: "from-blue-600", to: "to-indigo-900" },
    },
    {
      title: "LEHA-LEHA",
      gradient: { from: "from-blue-700", to: "to-indigo-800" },
    },
  ],
  mining: [
    {
      title: "DEPO",
      gradient: { from: "from-orange-600", to: "to-red-900" },
    },
    {
      title: "MPU",
      gradient: { from: "from-indigo-600", to: "to-blue-900" },
    },
    {
      title: "JPMS",
      gradient: { from: "from-cyan-600", to: "to-blue-900" },
    },
  ],
};

// Icon components
const ShoppingIcon = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);

const CarIcon = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" />
  </svg>
);

const IndustryIcon = () => (
  <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 10v10H2V10l7-3v2l5-2v3h8zM12 9.95l-5 2V10l-3 1.32V20h16v-8h-8v-.05zM11 18H9v-4h2v4zm4 0h-2v-4h2v4zm4 0h-2v-4h2v4z" />
  </svg>
);

function CompanyGroup() {
  return (
    <>
      <div className="flex flex-col lg:flex-row gap-8 py-16 sm:py-24 mx-auto px-6 lg:px-[70px]">
        <div className="flex-[0.8]">
          <p className="text-xs tracking-wide uppercase font-semibold mb-2">
            Putra Utama Group
          </p>
          <p className="text-3xl lg:text-3xl max-w-2xl font-bold leading-snug">
            Group Bisnis Kami
          </p>
        </div>

        <div className="flex-1 lg:flex-1">
          <p className="text-base leading-relaxed text-justify">
            Putra Utama Group terus memperkuat perannya di berbagai sektor
            strategis yang berperan penting bagi kemajuan ekonomi daerah. Dengan
            semangat inovasi, kerja keras, dan kebersamaan.
          </p>
        </div>

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

      <div className="flex w-full flex-col px-6 lg:px-[70px] gap-6 py-16 bg-[#f2f2f6]">
        <Tabs defaultValue="tabs1">
          <TabsList>
            <TabsTrigger value="tabs1">
              Retail, Perdagangan & Energi
            </TabsTrigger>
            <TabsTrigger value="tabs2">Otomotif & Layanan Konsumen</TabsTrigger>
            <TabsTrigger value="tabs3">
              Pertambangan & Material Konstruksi
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Retail */}
          <TabsContent value="tabs1" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessData.retail.map((item, index) => (
                <PlaceholderCard
                  key={index}
                  title={item.title}
                  gradientFrom={item.gradient.from}
                  gradientTo={item.gradient.to}
                  icon={<ShoppingIcon />}
                />
              ))}
            </div>
          </TabsContent>

          {/* Tab 2: Automotive */}
          <TabsContent value="tabs2" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessData.automotive.map((item, index) => (
                <PlaceholderCard
                  key={index}
                  title={item.title}
                  gradientFrom={item.gradient.from}
                  gradientTo={item.gradient.to}
                  icon={<CarIcon />}
                />
              ))}
            </div>
          </TabsContent>

          {/* Tab 3: Mining */}
          <TabsContent value="tabs3" className="mt-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {businessData.mining.map((item, index) => (
                <PlaceholderCard
                  key={index}
                  title={item.title}
                  gradientFrom={item.gradient.from}
                  gradientTo={item.gradient.to}
                  icon={<IndustryIcon />}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default CompanyGroup;
