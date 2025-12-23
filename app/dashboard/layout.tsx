// app/dashboard/layout.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import DynamicBreadcrumb from "@/components/dashboard/dynamic-breadcrumb";
import AvatarMenu from "@/components/dashboard/avatar-dropdown";
import { Toaster } from "@/components/ui/sonner";
import { Metadata } from "next";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import ThemeInitializer from "@/components/dashboard/theme-initializer";
import SwipeHandler from "@/components/dashboard/SwipeHandler";
import { NotificationBell } from "@/components/ui/notification-bell";

export const metadata: Metadata = {
  title: "Putra Utama Group | Dashboard",
  description: "Putra Utama Group Company Profile",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  return (
    <SidebarProvider>
      <ThemeInitializer />
      <SwipeHandler />
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 justify-between shrink-0 items-center gap-2 px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <DynamicBreadcrumb />
          </div>
          <div className="flex justify-center items-center gap-2">
            <NotificationBell />
            <AnimatedThemeToggler />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-6"
            />
            <AvatarMenu />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="bg-muted/50 min-h-screen flex-1 rounded-xl md:min-h-min">
            {children}
            <Toaster />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
