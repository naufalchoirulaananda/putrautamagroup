"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  timestamp: string;
  user_name: string | null;
  kode_pegawai: string | null;
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [deleting, setDeleting] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => {
    fetchLogs();
    // Jalankan auto-delete setiap kali component mount
    autoDeleteOldLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const response = await fetch("/api/activity-logs");
      const data = await response.json();
      setLogs(data);
    } catch (error) {
      console.error("Error fetching logs:", error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-delete logs older than 2 months
  const autoDeleteOldLogs = async () => {
    try {
      await fetch("/api/activity-logs/auto-delete", {
        method: "DELETE",
      });
    } catch (error) {
      console.error("Error auto-deleting old logs:", error);
    }
  };

  // Delete all logs manually
  const handleDeleteAll = async () => {
    setDeleting(true);
    try {
      const response = await fetch("/api/activity-logs", {
        method: "DELETE",
      });

      if (response.ok) {
        setLogs([]);
        setCurrentPage(1);
      } else {
        console.error("Failed to delete logs");
      }
    } catch (error) {
      console.error("Error deleting logs:", error);
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (timestamp: any) => {
    const date = new Date(timestamp);

    const formattedDate = date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const formattedTime = date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    return `${formattedDate} | ${formattedTime}`;
  };

  // FILTER: Search + Date
  const filteredLogs = logs.filter((log) => {
    const term = searchTerm.toLowerCase();
    const logDate = new Date(log.timestamp);

    const matchSearch =
      log.user_name?.toLowerCase().includes(term) ||
      log.kode_pegawai?.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term);

    if (!startDate && !endDate) return matchSearch;

    const inRange =
      (!startDate || logDate >= startDate) &&
      (!endDate || logDate <= new Date(endDate.setHours(23, 59, 59)));

    return matchSearch && inRange;
  });

  // PAGINATION
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentLogs = filteredLogs.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Activity Logs</h1>
        <p className="text-gray-500 mt-2">
          Riwayat aktivitas pengguna dalam sistem
        </p>
      </header>

      <div className="dark:bg-transparent border rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-b">
          <div className="flex flex-col sm:flex-row w-full gap-4">
            <div className="flex flex-col gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {startDate
                      ? startDate.toLocaleDateString("id-ID")
                      : "Pilih tanggal mulai"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(value) => {
                      setStartDate(value ?? undefined);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    {endDate
                      ? endDate.toLocaleDateString("id-ID")
                      : "Pilih tanggal akhir"}
                  </Button>
                </PopoverTrigger>

                <PopoverContent className="p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(value) => {
                      setEndDate(value ?? undefined);
                      setCurrentPage(1);
                    }}
                    className="w-full"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button
              variant="default"
              onClick={() => {
                setStartDate(undefined);
                setEndDate(undefined);
                setCurrentPage(1);
              }}
              className="cursor-pointer"
            >
              Reset
            </Button>

            {/* Delete All Button with Dialog */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2 cursor-pointer"
                  disabled={logs.length === 0}
                >
                  Hapus Semua
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus semua data activity logs secara
                    permanen. Data yang telah dihapus tidak dapat dikembalikan.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">
                    Batal
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAll}
                    disabled={deleting}
                    className="bg-red-600 cursor-pointer hover:bg-red-700"
                  >
                    {deleting ? "Menghapus..." : "Ya, Hapus Semua"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <Input
            placeholder="Cari activity log..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="max-w-sm text-sm bg-white"
          />
        </div>

        {/* TABLE */}
        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto max-w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pengguna</TableHead>
                <TableHead>Kode Karyawan</TableHead>
                <TableHead>Aktifitas</TableHead>
                <TableHead>Tanggal & Waktu</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-6 text-center">
                    Tidak ada data activity logs
                  </TableCell>
                </TableRow>
              ) : (
                currentLogs.map((log) => (
                  <TableRow key={log.id} className="transition-colors">
                    <TableCell className="py-6">
                      {log.user_name || "-"}
                    </TableCell>
                    <TableCell className="py-6">
                      {log.kode_pegawai || "-"}
                    </TableCell>
                    <TableCell className="py-6">{log.action}</TableCell>
                    <TableCell className="py-6">
                      {formatDate(log.timestamp)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINATION */}
        {filteredLogs.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-center sm:justify-between">
            <div className="hidden sm:block text-xs">
              Menampilkan <span className="font-medium">{startIndex + 1}</span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(endIndex, filteredLogs.length)}
              </span>{" "}
              dari <span className="font-medium">{filteredLogs.length}</span>{" "}
              hasil
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="text-xs">
                Page <span className="font-medium">{currentPage}</span> dari{" "}
                <span className="font-medium">{totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
