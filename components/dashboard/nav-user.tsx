"use client";

import { useState, useEffect } from "react";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function NavUser() {
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [userFoto, setUserFoto] = useState<string>("");

  const { data: session } = useSession();

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  // Fetch foto profil dari API setiap kali komponen di-mount atau session berubah
  useEffect(() => {
    const fetchUserPhoto = async () => {
      try {
        const response = await fetch("/api/profile");
        const data = await response.json();
        if (data.success && data.data.foto_profil) {
          setUserFoto(data.data.foto_profil);
        }
      } catch (error) {
        console.error("Error fetching user photo:", error);
      }
    };

    if (session?.user) {
      fetchUserPhoto();
    }
  }, [session]);

  // Listen untuk event custom yang di-trigger dari page settings
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      if (event.detail.foto_profil) {
        setUserFoto(event.detail.foto_profil);
      }
    };

    window.addEventListener("profileUpdated" as any, handleProfileUpdate);

    return () => {
      window.removeEventListener("profileUpdated" as any, handleProfileUpdate);
    };
  }, []);

  // Ambil inisial dari nama untuk avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role || "Role";
  const userKode = session?.user?.kode_pegawai || "Kode";
  const userInitials = getInitials(userName);

  return (
    <>
      {/* SIDEBAR USER */}
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
              >
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={userFoto} alt={userName} />
                  <AvatarFallback className="rounded-lg">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{userName}</span>
                  <span className="truncate text-xs">{userRole}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg cursor-pointer"
              side="bottom"
              align="end"
              sideOffset={4}
            >
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={userFoto} alt={userName} />
                    <AvatarFallback className="rounded-lg">
                      {userInitials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm gap-1">
                    <span className="truncate font-medium">{userName}</span>
                    <span className="truncate text-xs">{userRole}</span>

                    <span className="truncate text-xs">{userKode}</span>
                  </div>
                </div>
              </DropdownMenuLabel>

              <DropdownMenuSeparator />

              <Link href={"/dashboard/portal-karyawan/settings-profile"}>
                <DropdownMenuItem className="cursor-pointer gap-2">
                  <Settings className="w-4 h-4 cursor-pointer" />
                  <span>Settings</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onSelect={(e) => {
                  e.preventDefault();
                  setOpenLogoutModal(true);
                }}
              >
                <LogOut className="w-4 h-4 cursor-pointer" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      {/* LOGOUT CONFIRM MODAL */}
      <Dialog open={openLogoutModal} onOpenChange={setOpenLogoutModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Konfirmasi Logout</DialogTitle>
            <DialogDescription>
              Anda yakin ingin keluar dari aplikasi?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              className="cursor-pointer"
              onClick={() => setOpenLogoutModal(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              className="cursor-pointer"
              onClick={handleLogout}
            >
              Ya, Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
