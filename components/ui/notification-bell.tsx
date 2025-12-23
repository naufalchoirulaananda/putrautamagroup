// File: components/dashboard/notification-bell.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  reference_id: number | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
  requester_name: string | null;
  jenis_izin: string | null;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // ✅ Fetch hanya saat dropdown dibuka
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("/api/notifications/count");
      const result = await response.json();

      if (result.success) {
        setUnreadCount(result.count);
      }
    } catch (error) {
      console.error("Error fetching count:", error);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch("/api/notifications?unread_only=false");
      const result = await response.json();

      if (result.success) {
        const allNotifications = result.data;
        setNotifications(allNotifications.slice(0, 5));
        setUnreadCount(allNotifications.filter((n: Notification) => !n.is_read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notification_id: notificationId }),
      });

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    markAsRead(notification.id);

    if (notification.reference_type === "cuti_izin" && notification.reference_id) {
      if (notification.type === "cuti_request") {
        router.push("/dashboard/portal-karyawan/daftar-permohonan-cuti");
      } else if (notification.type === "cuti_waiting_hrd") {
        router.push("/dashboard/portal-hr/daftar-permohonan-cuti");
      } else {
        router.push("/dashboard/portal-karyawan/cuti-karyawan");
      }
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Baru saja";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
    
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "cuti_request": return "";
      case "cuti_approved": return "";
      case "cuti_rejected": return "";
      case "cuti_waiting_hrd": return "";
      case "cuti_submitted": return "";
      default: return "";
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon" className="relative cursor-pointer hover:bg-gray-200/50">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80 mx-8 mt-2">
        <DropdownMenuLabel className="font-semibold">
          Notifikasi
          {unreadCount > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({unreadCount} belum dibaca)
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-[400px]">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Tidak ada notifikasi
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start mx-2 my-2 p-3 cursor-pointer ${
                  !notification.is_read ? "bg-blue-50 dark:bg-blue-950/20" : ""
                }`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="text-2xl shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium line-clamp-2">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimeAgo(notification.created_at)}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>

        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center text-sm text-primary cursor-pointer justify-center"
          onClick={() => router.push("/dashboard/notifications")}
        >
          Detail Notifikasi
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}