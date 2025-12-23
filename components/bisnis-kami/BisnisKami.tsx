"use client";
import { Separator } from "../ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/bisnis-tabs";

function BisnisKami() {
  return (
    <>
      <div className="w-full flex flex-col scroll-smooth">
        <div className="w-full h-[380px] md:h-[450px] relative">
          <img
            src="/images/section.svg"
            alt="Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-0 left-0 w-full h-full bg-black/50 flex flex-col justify-end pb-16 px-6 md:px-20">
            <h1 className="text-white text-3xl md:text-5xl font-bold mb-3">
              Bisnis Kami
            </h1>
            <p className="text-white text-sm leading-loose md:text-base max-w-2xl">
              #
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-6">
          <Tabs defaultValue="sekilas-perusahaan">
            <TabsList>
              <TabsTrigger value="sekilas-perusahaan">
                Retail, Perdagangan & Energi
              </TabsTrigger>
              <TabsTrigger value="visi-misi">Visi & Misi</TabsTrigger>
              <TabsTrigger value="makna-logo">
                Makna Logo Perusahaan
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="sekilas-perusahaan"
              className="py-16 sm:py-24 mx-auto px-6 lg:px-40"
            >
              p
            </TabsContent>

            <TabsContent
              value="visi-misi"
              className="py-16 sm:py-24 mx-auto px-6 lg:px-40"
            >
              p
            </TabsContent>

            <TabsContent
              value="makna-logo"
              className="py-16 sm:py-24 mx-auto px-6 lg:px-40"
            >
              p
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default BisnisKami;
