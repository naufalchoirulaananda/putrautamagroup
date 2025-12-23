"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

export default function AvatarMenu() {
  const { data: session } = useSession();
  const [openLogoutModal, setOpenLogoutModal] = useState(false);
  const [userFoto, setUserFoto] = useState<string>("");

  const userName = session?.user?.name || "User";
  const userRole = session?.user?.role || "Role";
  const userKode = session?.user?.kode_pegawai || "Kode";

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const initials = getInitials(userName);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const router = useRouter();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="p-0 cursor-pointer"
          >
            <Avatar className="h-9 w-9 rounded-lg">
              <AvatarImage src={userFoto} alt={userName} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-auto mt-4">
          <div className="flex flex-row items-center gap-4 px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className=" p-0 cursor-pointer"
            >
              <Avatar className="h-9 w-9 rounded-lg">
                <AvatarImage src={userFoto} alt={userName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
            <div>
              <p className="text-sm font-medium">{userName}</p>
              <p className="text-xs text-muted-foreground">{userRole}</p>
              <p className="text-xs text-muted-foreground">{userKode}</p>
            </div>
          </div>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => {
              router.push("/dashboard/portal-karyawan/settings-profile");
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="cursor-pointer"
            onSelect={(e) => {
              e.preventDefault();
              setOpenLogoutModal(true);
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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