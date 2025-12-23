"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Loader2, Bell, CheckCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";

/* =======================
   TYPES
======================= */
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

/* =======================
   PAGE
======================= */
export default function NotificationsPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all");

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteType, setDeleteType] = useState<"single" | "all">("all");
  const [selectedNotificationId, setSelectedNotificationId] = useState<
    number | null
  >(null);
  const [deleting, setDeleting] = useState(false);

  /* =======================
     FETCH DATA
  ======================= */
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const result = await res.json();

      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Gagal memuat notifikasi");
    } finally {
      setLoading(false);
    }
  };

  /* =======================
     ACTIONS
  ======================= */
  const markAsRead = async (id: number) => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_id: id }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-read", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mark_all: true }),
      });

      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

      toast.success("Semua notifikasi ditandai sebagai dibaca");
    } catch (error) {
      console.error(error);
      toast.error("Gagal menandai notifikasi");
    }
  };

  const handleDeleteClick = (
    type: "single" | "all",
    notificationId?: number
  ) => {
    setDeleteType(type);
    setSelectedNotificationId(notificationId ?? null);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      setDeleting(true);

      const res = await fetch("/api/notifications/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          deleteType === "all"
            ? { delete_all_read: true }
            : { notification_id: selectedNotificationId }
        ),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.error || "Gagal menghapus notifikasi");
        return;
      }

      toast.success(result.message);

      if (deleteType === "all") {
        setNotifications((prev) => prev.filter((n) => !n.is_read));
      } else {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== selectedNotificationId)
        );
      }
    } catch (error) {
      console.error(error);
      toast.error("Terjadi kesalahan");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  /* =======================
     HELPERS
  ======================= */
  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);

    if (
      notification.reference_type === "cuti_izin" &&
      notification.reference_id
    ) {
      if (notification.type === "cuti_request") {
        router.push("/dashboard/portal-karyawan/daftar-permohonan-cuti");
      } else if (notification.type === "cuti_waiting_hrd") {
        router.push("/dashboard/portal-hr/daftar-permohonan-cuti");
      } else {
        router.push("/dashboard/portal-karyawan/cuti-karyawan?tab=riwayat");
      }
    }
  };

  const formatDate = (date: string) =>
    new Date(date).toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getIcon = (type: string) => {
    switch (type) {
      case "cuti_request":
        return "📋";
      case "cuti_approved":
        return "✅";
      case "cuti_rejected":
        return "❌";
      case "cuti_waiting_hrd":
        return "⏳";
      case "cuti_submitted":
        return "📤";
      case "cuti_progress":
        return "📊";
      default:
        return "";
    }
  };

  const filteredNotifications =
    activeTab === "unread"
      ? notifications.filter((n) => !n.is_read)
      : activeTab === "read"
      ? notifications.filter((n) => n.is_read)
      : notifications;

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const readCount = notifications.filter((n) => n.is_read).length;

  /* =======================
     LOADING
  ======================= */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  /* =======================
     RENDER
  ======================= */
  return (
    <div className="@container mx-auto p-4">
      {/* HEADER */}
      <header className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifikasi</h1>
          <p className="text-gray-500 mt-2">
            Kelola dan lihat semua notifikasi Anda
          </p>
        </div>

        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Baca Semua
            </Button>
          )}
          {readCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="text-red-600"
              onClick={() => handleDeleteClick("all")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Riwayat
            </Button>
          )}
        </div>
      </header>

      {/* TABS */}
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "all" | "unread" | "read")
        }
      >
        <TabsList>
          <TabsTrigger value="all">Semua ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Belum Dibaca ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Sudah Dibaca ({readCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4 space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 flex flex-col items-center">
                <Bell className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">Tidak ada notifikasi</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((n) => (
              <Card
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`cursor-pointer hover:shadow-md group ${
                  !n.is_read
                    ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                    : ""
                }`}
              >
                <CardContent className="p-4 flex gap-4">
                  <div className="text-3xl">{getIcon(n.type)}</div>

                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-semibold">{n.title}</h3>
                      <div className="flex items-center gap-2">
                        {!n.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick("single", n.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>

                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(n.created_at)}</span>
                      {n.jenis_izin && (
                        <Badge variant="outline">{n.jenis_izin}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* DELETE DIALOG */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteType === "all"
                ? "Hapus Semua Riwayat?"
                : "Hapus Notifikasi?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
