"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AttendanceRecord {
  id: number;
  date: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
}

interface TableKehadiranProps {
  refreshTrigger?: number; // ✅ Tambahan props
}

function TableKehadiran({ refreshTrigger }: TableKehadiranProps) {
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendanceHistory();
  }, [refreshTrigger]); // ✅ Tambahkan dependency

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/attendance/history");
      const result = await response.json();

      if (result.success) {
        setAttendances(result.data);
      } else {
        setError(result.error || "Gagal mengambil data");
      }
    } catch (err) {
      setError("Terjadi kesalahan saat mengambil data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format tanggal dari YYYY-MM-DD ke DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format waktu dari HH:MM:SS ke HH.MM.SS WIB
  const formatTime = (timeString: string | null) => {
    if (!timeString) return "-";
    const [hours, minutes, seconds] = timeString.split(":");
    return `${hours}.${minutes}.${seconds} WIB`;
  };

  // Format durasi dari menit ke jam
  const formatDuration = (durasiMenit: number | null) => {
    if (!durasiMenit) return "-";
    const hours = Math.floor(durasiMenit / 60);
    const minutes = durasiMenit % 60;

    if (minutes > 0) {
      return `${hours} Jam ${minutes} Menit`;
    }
    return `${hours} Jam`;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <p>Memuat data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <div className="text-center py-4">
        <p>Belum ada riwayat kehadiran</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jam Masuk</TableHead>
            <TableHead>Jam Pulang</TableHead>
            <TableHead>Durasi Kerja</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendances.map((attendance, index) => (
            <TableRow key={attendance.id}>
              <TableCell className="font-medium">{index + 1}</TableCell>
              <TableCell>{formatDate(attendance.date)}</TableCell>
              <TableCell>{formatTime(attendance.jam_masuk)}</TableCell>
              <TableCell>{formatTime(attendance.jam_pulang)}</TableCell>
              <TableCell>{formatDuration(attendance.durasi)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

export default TableKehadiran;