"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Search,
  Clock,
  MapPin,
  Download,
  Filter,
  X,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import * as XLSX from "xlsx";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Absensi {
  id: number;
  user_id: number;
  date: string;
  subjek_masuk: string;
  subjek_pulang: string;
  jam_masuk: string;
  jam_pulang: string;
  durasi: number;
  foto_masuk_1: string;
  foto_masuk_2: string;
  foto_masuk_3: string;
  foto_pulang_1: string;
  foto_pulang_2: string;
  foto_pulang_3: string;
  latitude_masuk: string;
  longitude_masuk: string;
  alamat_masuk: string;
  latitude_pulang: string;
  longitude_pulang: string;
  alamat_pulang: string;
  keterangan_masuk: string;
  keterangan_pulang: string;
  user_name: string;
  kode_pegawai: string;
  role_name: string;
  divisi_id: number;
  nama_divisi: string;
  divisi_kode: string;
}

interface Role {
  id: number;
  name: string;
}

interface Divisi {
  id: number;
  kode_divisi: string;
  nama_divisi: string;
}

function Page() {
  const [absensiData, setAbsensiData] = useState<Absensi[]>([]);
  const [filteredData, setFilteredData] = useState<Absensi[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisiList, setDivisiList] = useState<Divisi[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedAbsensi, setSelectedAbsensi] = useState<Absensi | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter states
  const [filterName, setFilterName] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>(
    undefined
  );
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>(
    undefined
  );
  const [filterRole, setFilterRole] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("");

  // Handler untuk membuka image zoom
  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setIsImageDialogOpen(true);
  };

  // Fetch roles
  useEffect(() => {
    async function fetchRoles() {
      try {
        const response = await fetch("/api/roles");
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    }
    fetchRoles();
  }, []);

  useEffect(() => {
    async function fetchDivisi() {
      try {
        const response = await fetch("/api/divisi");
        const result = await response.json();
        setDivisiList(result.data || []);
      } catch (error) {
        console.error("Error fetching divisi:", error);
        setDivisiList([]);
      }
    }
    fetchDivisi();
  }, []);

  // Fetch absensi data
  useEffect(() => {
    async function fetchAbsensi() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (filterRole && filterRole !== "all")
          params.append("role_id", filterRole);
        if (filterDivisi && filterDivisi !== "all")
          params.append("divisi_kode", filterDivisi);

        const response = await fetch(
          `/api/attendance/absensi?${params.toString()}`
        );

        const result = await response.json();

        if (result.success) {
          setAbsensiData(result.data);
          setFilteredData(result.data);
        }
      } catch (error) {
        console.error("Error fetching absensi:", error);
      } finally {
        setLoading(false);
      }
    }

    const debounce = setTimeout(() => {
      fetchAbsensi();
    }, 300);

    return () => clearTimeout(debounce);
  }, [search]);

  // Normalize date to YYYY-MM-DD format
  const normalizeDate = (dateString: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Apply filters
  useEffect(() => {
    let filtered = [...absensiData];

    // Filter by name
    if (filterName) {
      filtered = filtered.filter(
        (item) =>
          item.user_name.toLowerCase().includes(filterName.toLowerCase()) ||
          item.kode_pegawai.toLowerCase().includes(filterName.toLowerCase())
      );
    }

    // Filter by date range
    if (filterStartDate) {
      const startDateStr = format(filterStartDate, "yyyy-MM-dd");
      filtered = filtered.filter((item) => {
        const itemDate = normalizeDate(item.date);
        return itemDate >= startDateStr;
      });
    }
    if (filterEndDate) {
      const endDateStr = format(filterEndDate, "yyyy-MM-dd");
      filtered = filtered.filter((item) => {
        const itemDate = normalizeDate(item.date);
        return itemDate <= endDateStr;
      });
    }

    // Filter by role
    if (filterRole && filterRole !== "all") {
      filtered = filtered.filter((item) => item.role_name === filterRole);
    }

    // Filter by divisi
    if (filterDivisi && filterDivisi !== "all") {
      filtered = filtered.filter((item) => item.divisi_kode === filterDivisi);
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [
    filterName,
    filterStartDate,
    filterEndDate,
    filterRole,
    filterDivisi,
    absensiData,
  ]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatDuration = (minutes: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}j ${mins}m`;
  };

  const handleViewDetail = (absensi: Absensi) => {
    setSelectedAbsensi(absensi);
    setIsDetailDialogOpen(true);
  };

  const getPhotoUrl = (photoPath: string | null) => {
    if (!photoPath) return null;
    if (photoPath.startsWith("/uploads/") || photoPath.startsWith("uploads/")) {
      return photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
    }
    return `/uploads/attendance/${photoPath}`;
  };

  const handleClearFilters = () => {
    setFilterName("");
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setFilterRole("");
    setFilterDivisi("");
  };

  const handleDownloadExcel = () => {
    const wb = XLSX.utils.book_new();

    // Jika ada filter divisi spesifik, buat single sheet
    if (filterDivisi && filterDivisi !== "all") {
      const sheetData = filteredData.map((item) => ({
        Tanggal: formatDate(item.date),
        "Nama Karyawan": item.user_name,
        "Kode Karyawan": item.kode_pegawai,
        Divisi: item.nama_divisi || "-",
        "Posisi/Jabatan": item.role_name,
        "Jam Masuk": item.jam_masuk || "-",
        "Jam Pulang": item.jam_pulang || "-",
        Durasi: formatDuration(item.durasi),
        Status: item.jam_pulang ? "Selesai" : "Sedang Bekerja",
        "Subjek Masuk": item.subjek_masuk || "-",
        "Subjek Pulang": item.subjek_pulang || "-",
        "Alamat Masuk": item.alamat_masuk || "-",
        "Alamat Pulang": item.alamat_pulang || "-",
      }));

      const ws = XLSX.utils.json_to_sheet(sheetData);

      ws["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 30 },
        { wch: 30 },
      ];

      XLSX.utils.book_append_sheet(wb, ws, filterDivisi.substring(0, 31));
    } else {
      // Tanpa filter divisi: Buat sheet per divisi

      const summaryData = filteredData.map((item) => ({
        Tanggal: formatDate(item.date),
        "Nama Karyawan": item.user_name,
        "Kode Karyawan": item.kode_pegawai,
        Divisi: item.nama_divisi || "-",
        "Posisi/Jabatan": item.role_name,
        "Jam Masuk": item.jam_masuk || "-",
        "Jam Pulang": item.jam_pulang || "-",
        Durasi: formatDuration(item.durasi),
        Status: item.jam_pulang ? "Selesai" : "Sedang Bekerja",
      }));

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary["!cols"] = [
        { wch: 15 },
        { wch: 20 },
        { wch: 15 },
        { wch: 20 },
        { wch: 20 },
        { wch: 12 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
      ];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const groupedByDivisi: { [key: string]: Absensi[] } = {};
      filteredData.forEach((item) => {
        const divisi = item.nama_divisi || "Tanpa Divisi";
        if (!groupedByDivisi[divisi]) {
          groupedByDivisi[divisi] = [];
        }
        groupedByDivisi[divisi].push(item);
      });

      Object.keys(groupedByDivisi)
        .sort()
        .forEach((divisiName) => {
          const divisiData = groupedByDivisi[divisiName].map((item) => ({
            Tanggal: formatDate(item.date),
            "Nama Karyawan": item.user_name,
            "Kode Karyawan": item.kode_pegawai,
            "Posisi/Jabatan": item.role_name,
            "Jam Masuk": item.jam_masuk || "-",
            "Jam Pulang": item.jam_pulang || "-",
            Durasi: formatDuration(item.durasi),
            Status: item.jam_pulang ? "Selesai" : "Sedang Bekerja",
            "Subjek Masuk": item.subjek_masuk || "-",
            "Subjek Pulang": item.subjek_pulang || "-",
            "Alamat Masuk": item.alamat_masuk || "-",
            "Alamat Pulang": item.alamat_pulang || "-",
          }));

          const ws = XLSX.utils.json_to_sheet(divisiData);
          ws["!cols"] = [
            { wch: 15 },
            { wch: 20 },
            { wch: 15 },
            { wch: 20 },
            { wch: 12 },
            { wch: 12 },
            { wch: 10 },
            { wch: 15 },
            { wch: 20 },
            { wch: 20 },
            { wch: 30 },
            { wch: 30 },
          ];

          const sheetName = divisiName.substring(0, 31);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
    }

    const fileName = `Absensi_${new Date().getTime()}.xlsx`;
    XLSX.writeFile(wb, fileName);

    setIsFilterDialogOpen(false);
  };

  const hasActiveFilters =
    filterName ||
    filterStartDate ||
    filterEndDate ||
    (filterRole && filterRole !== "all") ||
    (filterDivisi && filterDivisi !== "all");

  // Pagination logic
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Daftar Absensi Karyawan</h1>
        <p className="text-gray-500 mt-2">
          Lihat dan kelola data absensi karyawan
        </p>
      </header>

      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col p-4 gap-4 border-b">
          <div className="flex flex-col lg:flex-row w-full gap-3 items-end">
            {/* Search */}
            <div className="relative w-full sm:flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari nama karyawan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 max-w-xl bg-white"
              />
            </div>

            {/* Filter Button */}
            <Button
              onClick={() => setIsFilterDialogOpen(true)}
              className="gap-2 whitespace-nowrap text-sm w-full sm:w-auto"
              variant={hasActiveFilters ? "default" : "outline"}
            >
              <Filter className="w-4 h-4" />
              Filter & Download
              {hasActiveFilters && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-white text-primary"
                >
                  {
                    [
                      filterName,
                      filterStartDate,
                      filterEndDate,
                      filterRole && filterRole !== "all",
                      filterDivisi && filterDivisi !== "all",
                    ].filter(Boolean).length
                  }
                </Badge>
              )}
            </Button>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="px-4 pt-4 flex flex-wrap gap-2 items-center">
              <span className="text-sm text-gray-600">Filter aktif:</span>
              {filterName && (
                <Badge variant="secondary" className="gap-1">
                  Nama: {filterName}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilterName("")}
                  />
                </Badge>
              )}
              {filterStartDate && (
                <Badge variant="secondary" className="gap-1">
                  Dari:{" "}
                  {format(filterStartDate, "dd MMMM yyyy", { locale: id })}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilterStartDate(undefined)}
                  />
                </Badge>
              )}
              {filterEndDate && (
                <Badge variant="secondary" className="gap-1">
                  Sampai:{" "}
                  {format(filterEndDate, "dd MMMM yyyy", { locale: id })}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilterEndDate(undefined)}
                  />
                </Badge>
              )}
              {filterRole && filterRole !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Jabatan: {filterRole}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilterRole("")}
                  />
                </Badge>
              )}
              {filterDivisi && filterDivisi !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  Divisi: {filterDivisi}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFilterDivisi("")}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-6 px-2 text-xs"
              >
                Reset Semua
              </Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead className="w-[150px]">Tanggal</TableHead>
                <TableHead className="w-[150px]">Nama Karyawan</TableHead>
                <TableHead>Divisi</TableHead>
                <TableHead className="text-center w-[70px]">Posisi/Jabatan</TableHead>
                <TableHead className="text-center w-[70px]">Jam Masuk</TableHead>
                <TableHead className="text-center w-[70px]">Jam Pulang</TableHead>
                <TableHead className="text-center w-[70px]">Durasi</TableHead>
                <TableHead className="text-center w-[70px]">Status</TableHead>
                <TableHead className="text-center w-[70px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : currentData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    Tidak ada data absensi
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell className="py-6">
                      {startIndex + index + 1}
                    </TableCell>
                    <TableCell className="py-6">
                      <span className="text-sm whitespace-nowrap">
                        {formatDate(item.date)}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap">
                      {item.user_name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.nama_divisi || "-"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {item.role_name.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">
                        {item.jam_masuk || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm whitespace-nowrap">
                        {item.jam_pulang || "-"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {formatDuration(item.durasi)}
                    </TableCell>
                    <TableCell>
                      {item.jam_pulang ? (
                        <p className="text-green-500 whitespace-nowrap">
                          Selesai
                        </p>
                      ) : (
                        <p className="text-yellow-500 whitespace-nowrap">
                          Sedang Bekerja
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="default"
                        size="sm"
                        className="text-xs cursor-pointer whitespace-nowrap"
                        onClick={() => handleViewDetail(item)}
                      >
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-center sm:justify-between">
            <div className="hidden sm:block text-xs text-muted-foreground">
              Menampilkan <span className="font-medium">{startIndex + 1}</span>{" "}
              sampai{" "}
              <span className="font-medium">
                {Math.min(endIndex, filteredData.length)}
              </span>{" "}
              dari <span className="font-medium">{filteredData.length}</span>{" "}
              hasil
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="text-xs text-muted-foreground">
                Halaman {currentPage} dari {totalPages}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="w-full sm:max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              Filter & Download Data Absensi
            </DialogTitle>

            <DialogDescription className="text-sm text-left">
              Gunakan filter di bawah untuk menyaring data absensi, kemudian
              download hasilnya dalam format Excel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Filter Nama */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Nama Karyawan</Label>
              <Input
                placeholder="Cari nama atau kode karyawan..."
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>

            {/* Filter Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Mulai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? (
                        format(filterStartDate, "dd MMMM yyyy", {
                          locale: id,
                        })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterStartDate}
                      onSelect={setFilterStartDate}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tanggal Akhir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !filterEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? (
                        format(filterEndDate, "dd MMMM yyyy", { locale: id })
                      ) : (
                        <span>Pilih tanggal</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterEndDate}
                      onSelect={setFilterEndDate}
                      initialFocus
                      locale={id}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Filter Divisi */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Divisi</Label>
              <Select value={filterDivisi} onValueChange={setFilterDivisi}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih divisi..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Divisi</SelectItem>
                  {Array.isArray(divisiList) &&
                    divisiList.map((divisi) => (
                      <SelectItem
                        key={divisi.kode_divisi}
                        value={divisi.kode_divisi}
                      >
                        {divisi.nama_divisi}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Role */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Posisi/Jabatan</Label>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih jabatan..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jabatan</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Result Info */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  Data yang akan didownload:
                </span>
                <span className="font-semibold text-lg">
                  {filteredData.length} data
                </span>
              </div>

              {!hasActiveFilters && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Tanpa filter: Excel akan dibuat dengan sheet per divisi
                </p>
              )}

              {filterDivisi !== "all" && (
                <p className="text-xs text-blue-600 dark:text-blue-400">
                  💡 Filter divisi aktif: Excel akan dibuat single sheet
                </p>
              )}

              {hasActiveFilters && (
                <p className="text-xs text-gray-500 mt-2">
                  Filter aktif:{" "}
                  {[
                    filterName && "Nama",
                    filterStartDate && "Tanggal Mulai",
                    filterEndDate && "Tanggal Akhir",
                    filterDivisi !== "all" && "Divisi",
                    filterRole !== "all" && "Jabatan",
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              disabled={!hasActiveFilters}
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <X className="w-4 h-4" />
              Reset Filter
            </Button>

            <Button
              onClick={handleDownloadExcel}
              disabled={filteredData.length === 0}
              className="gap-2 cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-4 h-4" />
              Download Excel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Detail Absensi</DialogTitle>
            <DialogDescription>
              Detail lengkap data absensi karyawan
            </DialogDescription>
          </DialogHeader>

          {selectedAbsensi && (
            <div className="space-y-6">
              {/* Info Karyawan */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nama Karyawan</p>
                  <p className="font-medium">{selectedAbsensi.user_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Kode Karyawan</p>
                  <p className="font-medium">{selectedAbsensi.kode_pegawai}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Divisi</p>
                  <Badge
                    className="px-4 py-2 rounded-lg mt-2"
                    variant="secondary"
                  >
                    {selectedAbsensi.nama_divisi || "-"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Posisi/Jabatan</p>
                  <Badge
                    className="px-4 py-2 rounded-lg mt-2"
                    variant="secondary"
                  >
                    {selectedAbsensi.role_name}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium">
                    {formatDate(selectedAbsensi.date)}
                  </p>
                </div>
              </div>

              {/* Absensi Masuk */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-green-500" />
                  Absensi Masuk
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Jam Masuk</p>
                    <p className="font-medium">
                      {selectedAbsensi.jam_masuk || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subjek</p>
                    <p className="font-medium">
                      {selectedAbsensi.subjek_masuk || "-"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Keterangan</p>
                    <p className="font-medium">
                      {selectedAbsensi.keterangan_masuk || "-"}
                    </p>
                  </div>
                </div>

                {/* Lokasi Masuk */}
                {selectedAbsensi.latitude_masuk &&
                  selectedAbsensi.longitude_masuk && (
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-green-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Lokasi Masuk</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedAbsensi.alamat_masuk ||
                                "Alamat tidak tersedia"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Lat:{" "}
                              {parseFloat(
                                selectedAbsensi.latitude_masuk
                              ).toFixed(6)}
                              , Lng:{" "}
                              {parseFloat(
                                selectedAbsensi.longitude_masuk
                              ).toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Foto Masuk */}
                {(selectedAbsensi.foto_masuk_1 ||
                  selectedAbsensi.foto_masuk_2 ||
                  selectedAbsensi.foto_masuk_3) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Foto Masuk</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAbsensi.foto_masuk_1 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_masuk_1) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_masuk_1) || ""
                            }
                            alt="Foto Masuk 1"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {selectedAbsensi.foto_masuk_2 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_masuk_2) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_masuk_2) || ""
                            }
                            alt="Foto Masuk 2"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {selectedAbsensi.foto_masuk_3 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_masuk_3) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_masuk_3) || ""
                            }
                            alt="Foto Masuk 3"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Absensi Pulang */}
              <div className="space-y-3">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5 text-red-500" />
                  Absensi Pulang
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Jam Pulang</p>
                    <p className="font-medium">
                      {selectedAbsensi.jam_pulang || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Subjek</p>
                    <p className="font-medium">
                      {selectedAbsensi.subjek_pulang || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Durasi Kerja</p>
                    <p className="font-medium">
                      {formatDuration(selectedAbsensi.durasi)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-gray-500">Keterangan</p>
                    <p className="font-medium">
                      {selectedAbsensi.keterangan_pulang || "-"}
                    </p>
                  </div>
                </div>

                {/* Lokasi Pulang */}
                {selectedAbsensi.latitude_pulang &&
                  selectedAbsensi.longitude_pulang && (
                    <Card>
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-start gap-2">
                          <MapPin className="w-5 h-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">Lokasi Pulang</p>
                            <p className="text-sm text-gray-600 mt-1">
                              {selectedAbsensi.alamat_pulang ||
                                "Alamat tidak tersedia"}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Lat:{" "}
                              {parseFloat(
                                selectedAbsensi.latitude_pulang
                              ).toFixed(6)}
                              , Lng:{" "}
                              {parseFloat(
                                selectedAbsensi.longitude_pulang
                              ).toFixed(6)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {/* Foto Pulang - sama seperti foto masuk */}
                {(selectedAbsensi.foto_pulang_1 ||
                  selectedAbsensi.foto_pulang_2 ||
                  selectedAbsensi.foto_pulang_3) && (
                  <div>
                    <p className="text-sm text-gray-500 mb-2">Foto Pulang</p>
                    <div className="grid grid-cols-3 gap-2">
                      {selectedAbsensi.foto_pulang_1 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_pulang_1) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_pulang_1) || ""
                            }
                            alt="Foto Pulang 1"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {selectedAbsensi.foto_pulang_2 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_pulang_2) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_pulang_2) || ""
                            }
                            alt="Foto Pulang 2"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      {selectedAbsensi.foto_pulang_3 && (
                        <div
                          className="relative aspect-square rounded-lg overflow-hidden border cursor-pointer hover:opacity-80 transition-opacity group"
                          onClick={() =>
                            handleImageClick(
                              getPhotoUrl(selectedAbsensi.foto_pulang_3) || ""
                            )
                          }
                        >
                          <img
                            src={
                              getPhotoUrl(selectedAbsensi.foto_pulang_3) || ""
                            }
                            alt="Foto Pulang 3"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Zoom Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent className="flex flex-col justify-center items-center sm:max-w-4xl p-4 overflow-hidden">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-full object-cover"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default Page;
