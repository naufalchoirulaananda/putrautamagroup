"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Download,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Search,
  Info,
  FileSpreadsheet,
  Filter,
  User,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { id } from "date-fns/locale";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  format,
  isWithinInterval,
  addDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
} from "date-fns";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { type DateRange } from "react-day-picker";

interface AuditStock {
  KodeItem: string;
  NamaItem: string;
  Qty: number;
  stockReal: number;
  KodeCabang: string;
  NamaCabang: string;
  selisih: number;
  NamaLokasi: string;
  HargaJual: number;
  tanggal: string;
  LokasiRak: string;
  petugas_id?: number;
  petugas_nama?: string;
  petugas_kode?: string;
}

const ADMIN_ROLES = [
  "SUPERADMIN",
  "PROGRAMMER",
  "PROGRAMMER JUNIOR",
  "OWNER",
  "DIREKTUR UTAMA",
  "DIREKTUR KEUANGAN",
  "DIREKTUR KSP",
  "DIREKTUR OTOMOTIF",
  "DIREKTUR MPU",
  "MANAGER GMART",
  "STAFF KEUANGAN GMART",
  "SPV LOGISTIK GMART",
  "SPV KEUANGAN GMART",
  "SPV PENGUNJUNG GMART",
  "HRD GMART",
  "PERSONALIA",
];

type PeriodType = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const CABANG_LIST = [
  { kode: "01", nama: "Cabang Nguter" },
  { kode: "02", nama: "Cabang Combongan" },
  { kode: "03", nama: "Cabang Klaten" },
  { kode: "04", nama: "Cabang Plumbon" },
  { kode: "05", nama: "Cabang Wirun" },
  { kode: "06", nama: "Cabang Karanganyar" },
  { kode: "07", nama: "Cabang Sragen" },
  { kode: "08", nama: "Cabang Jatisumo" },
  { kode: "09", nama: "Cabang Ponorogo" },
  { kode: "10", nama: "Cabang Gubug" },
  { kode: "11", nama: "Cabang Weleri" },
];

export default function Page() {
  const { data: session, status } = useSession();
  const [allData, setAllData] = useState<AuditStock[]>([]);
  const [filteredData, setFilteredData] = useState<AuditStock[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCabang, setSelectedCabang] = useState("all");
  const [selectedLokasiRak, setSelectedLokasiRak] = useState("all");
  const [periodType, setPeriodType] = useState<PeriodType>("daily");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lokasiRakList, setLokasiRakList] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [openLokasiRak, setOpenLokasiRak] = useState(false);
  const [downloadGroupByCabang, setDownloadGroupByCabang] = useState(true);
  const [downloadGroupByRak, setDownloadGroupByRak] = useState(false);
  const [downloadGroupByMonth, setDownloadGroupByMonth] = useState(false);
  const [showPanduanFilterDialog, setShowPanduanFilterDialog] = useState(false);
  const [showPanduanDownloadDialog, setShowPanduanDownloadDialog] =
    useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const isAutoRefreshingRef = useRef(false);

  // Initial load
  useEffect(() => {
    if (status === "loading") return;
    if (!session?.user) {
      redirect("/login");
    }
    const userRole = session.user.role?.toUpperCase().trim();
    const adminStatus = ADMIN_ROLES.includes(userRole || "");
    setIsAdmin(adminStatus);

    fetchAllData().then(() => setLoading(false));
  }, [session, status]);

  // Auto-refresh (tanpa loading)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      isAutoRefreshingRef.current = true; // Flag bahwa ini auto-refresh
      fetchAllData();
      // Hapus: setLastUpdate(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  useEffect(() => {
    filterData();

    // Reset page HANYA jika bukan auto-refresh
    if (!isAutoRefreshingRef.current) {
      setCurrentPage(1);
    }

    // Reset flag setelah filtering selesai
    isAutoRefreshingRef.current = false;
  }, [
    searchQuery,
    selectedCabang,
    selectedLokasiRak,
    periodType,
    dateRange,
    allData,
  ]);

  useEffect(() => {
    if (allData.length > 0) {
      let dataForRak = allData;
      if (selectedCabang !== "all") {
        dataForRak = allData.filter(
          (item) => item.KodeCabang === selectedCabang
        );
      }
      const uniqueLokasiRak = Array.from(
        new Set(
          dataForRak
            .map((item) => item.LokasiRak)
            .filter((lok) => lok && lok.trim() !== "")
        )
      ).sort();
      setLokasiRakList(uniqueLokasiRak as string[]);
    }
  }, [allData, selectedCabang]);

  const fetchAllData = async () => {
    try {
      const params = new URLSearchParams({
        page: "1",
        limit: "999999",
        search: "",
        cabang: "all",
        lokasiRak: "all",
        tanggal: "",
      });
      const response = await fetch(`/api/gmart/audit-stock?${params}`);
      const result = await response.json();
      setAllData(result.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const filterData = () => {
    let filtered = [...allData];

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.KodeItem.toLowerCase().includes(query) ||
          item.NamaItem.toLowerCase().includes(query) ||
          item.LokasiRak.toLowerCase().includes(query)
      );
    }

    if (selectedCabang !== "all") {
      filtered = filtered.filter((item) => item.KodeCabang === selectedCabang);
    }

    if (selectedLokasiRak !== "all") {
      filtered = filtered.filter(
        (item) => item.LokasiRak === selectedLokasiRak
      );
    }

    if (dateRange?.from && dateRange?.to) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.tanggal);
        const start = startOfDay(dateRange.from!);
        const end = endOfDay(dateRange.to!);
        return isWithinInterval(itemDate, { start, end });
      });
    } else if (dateRange?.from && !dateRange?.to && periodType === "daily") {
      filtered = filtered.filter((item) => {
        const itemDateStr = format(new Date(item.tanggal), "yyyy-MM-dd");
        const startDateStr = format(dateRange.from!, "yyyy-MM-dd");
        return itemDateStr === startDateStr;
      });
    }

    setFilteredData(filtered);
  };

  const hasActiveFilters = () => {
    return (
      searchQuery.trim() !== "" ||
      selectedCabang !== "all" ||
      selectedLokasiRak !== "all" ||
      dateRange?.from !== undefined ||
      dateRange?.to !== undefined
    );
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setSelectedCabang("all");
    setSelectedLokasiRak("all");
    setPeriodType("daily");
    setDateRange(undefined);
  };

  const getPeriodInfoText = () => {
    switch (periodType) {
      case "daily":
        return "Pilih 1 tanggal untuk melihat data hari tersebut";
      case "weekly":
        return "Pilih tanggal mulai, sistem akan otomatis set 7 hari kedepan";
      case "monthly":
        return "Pilih tanggal mulai, sistem akan otomatis set 30 hari kedepan";
      case "yearly":
        return "Pilih tanggal mulai, sistem akan otomatis set 365 hari kedepan";
      case "custom":
        return "Pilih range tanggal dengan 2 kalender side by side";
      default:
        return "";
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range?.from) {
      setDateRange(undefined);
      return;
    }

    switch (periodType) {
      case "daily":
        setDateRange({ from: range.from, to: undefined });
        break;
      case "weekly":
        setDateRange({ from: range.from, to: addDays(range.from, 6) });
        break;
      case "monthly":
        setDateRange({ from: range.from, to: addDays(range.from, 29) });
        break;
      case "yearly":
        setDateRange({ from: range.from, to: addDays(range.from, 364) });
        break;
      case "custom":
        setDateRange(range);
        break;
    }
  };

  const getPeriodLabel = () => {
    if (!dateRange?.from && !dateRange?.to) return "Pilih periode";
    if (dateRange.from && !dateRange.to) {
      return format(dateRange.from, "dd MMM yyyy", { locale: id });
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, "dd MMM yyyy", {
        locale: id,
      })} - ${format(dateRange.to, "dd MMM yyyy", { locale: id })}`;
    }
    return "Pilih periode";
  };

  const handleDownloadClick = () => {
    setDownloadGroupByCabang(selectedCabang === "all");
    setDownloadGroupByRak(false);
    setDownloadGroupByMonth(false);
    setShowDownloadDialog(true);
  };

  const getDownloadOptions = () => {
    const isSingleCabang = selectedCabang !== "all";
    const hasDateFilter = dateRange?.from !== undefined;
    const isYearly =
      periodType === "yearly" && dateRange?.from && dateRange?.to;
    return {
      isSingleCabang,
      hasDateFilter,
      isYearly,
      showRakOption: isSingleCabang,
      showMonthOption: isYearly,
    };
  };

  const performDownload = async () => {
    if (!isAdmin) return;
    setIsDownloading(true);
    setShowDownloadDialog(false);

    try {
      const dataToExport = filteredData.length > 0 ? filteredData : allData;
      const wb = XLSX.utils.book_new();

      // ============================================
      // 🎯 SHEET 1: SUMMARY PERFORMA PETUGAS + MONITORING
      // ============================================
      const createSummarySheet = (data: AuditStock[]) => {
        // Group data per cabang
        const cabangStats: Record<
          string,
          {
            totalProduk: number;
            petugas: Record<
              string,
              {
                nama: string;
                kode: string;
                jumlahSO: number;
              }
            >;
          }
        > = {};

        // Get unique rak per cabang untuk menghitung total rak (DISTINCT)
        const rakPerCabang: Record<string, Set<string>> = {};

        data.forEach((item) => {
          const cabang = item.NamaCabang || "Unknown";

          // Initialize cabang stats
          if (!cabangStats[cabang]) {
            cabangStats[cabang] = {
              totalProduk: 0,
              petugas: {},
            };
          }

          // Track unique rak (DISTINCT - no duplicates)
          if (!rakPerCabang[cabang]) {
            rakPerCabang[cabang] = new Set();
          }
          if (item.LokasiRak && item.LokasiRak.trim() !== "") {
            rakPerCabang[cabang].add(item.LokasiRak.trim().toUpperCase());
          }

          // Hitung total produk
          cabangStats[cabang].totalProduk++;

          // Group per petugas
          if (item.petugas_id && item.petugas_nama) {
            const petugasKey = `${item.petugas_id}`;

            if (!cabangStats[cabang].petugas[petugasKey]) {
              cabangStats[cabang].petugas[petugasKey] = {
                nama: item.petugas_nama,
                kode: item.petugas_kode || "-",
                jumlahSO: 0,
              };
            }

            cabangStats[cabang].petugas[petugasKey].jumlahSO++;
          }
        });

        // Group data per tanggal per cabang untuk monitoring harian
        const dailyProgress: Record<string, Record<string, Set<string>>> = {};

        data.forEach((item) => {
          const dateStr = format(new Date(item.tanggal), "yyyy-MM-dd");
          const cabang = item.NamaCabang || "Unknown";

          if (!dailyProgress[dateStr]) {
            dailyProgress[dateStr] = {};
          }

          if (!dailyProgress[dateStr][cabang]) {
            dailyProgress[dateStr][cabang] = new Set();
          }

          if (item.LokasiRak && item.LokasiRak.trim() !== "") {
            dailyProgress[dateStr][cabang].add(
              item.LokasiRak.trim().toUpperCase()
            );
          }
        });

        // Format data untuk Excel
        const summaryData: any[] = [];

        // Header utama
        summaryData.push({
          A: "MONITORING PELAKSANAAN SO",
          B: "",
          C: "",
          D: "",
          E: "",
        });
        summaryData.push({
          A: `Update: ${format(new Date(), "dd MMM yyyy HH:mm", {
            locale: id,
          })}`,
          B: "",
          C: "",
          D: "",
          E: "",
        });
        summaryData.push({}); // Empty row

        // ===== TABEL 1: MONITORING JUMLAH RAK PER CABANG =====
        summaryData.push({
          A: "CABANG",
          B: "JUMLAH RAK",
          C: "",
          D: "",
          E: "",
        });

        Object.keys(cabangStats)
          .sort()
          .forEach((cabangName) => {
            const jumlahRakUnique = rakPerCabang[cabangName]
              ? rakPerCabang[cabangName].size
              : 0;

            summaryData.push({
              A: cabangName,
              B: jumlahRakUnique,
              C: "",
              D: "",
              E: "",
            });
          });

        summaryData.push({}); // Empty row
        summaryData.push({}); // Empty row

        // ===== TABEL 2: JUMLAH SHELVING TER-SO HARIAN =====
        summaryData.push({
          A: "JUMLAH SHELVING TER SO",
          B: "",
          C: "",
          D: "",
          E: "",
        });

        const cabangNames = Object.keys(cabangStats).sort();
        const headerRow: any = { A: "TANGGAL" };
        cabangNames.forEach((name, idx) => {
          const col = String.fromCharCode(66 + idx); // B, C, D, ...
          headerRow[col] = name;
        });
        summaryData.push(headerRow);

        // Get sorted dates
        const sortedDates = Object.keys(dailyProgress).sort();

        sortedDates.forEach((dateStr) => {
          const rowData: any = {
            A: format(new Date(dateStr), "dd-MMM-yy", { locale: id }),
          };

          cabangNames.forEach((cabang, idx) => {
            const col = String.fromCharCode(66 + idx);
            const count = dailyProgress[dateStr][cabang]
              ? dailyProgress[dateStr][cabang].size
              : 0;
            rowData[col] = count > 0 ? count : "";
          });

          summaryData.push(rowData);
        });

        summaryData.push({}); // Empty row
        summaryData.push({}); // Empty row

        // ===== SECTION: PERFORMA PETUGAS PER CABANG =====
        Object.keys(cabangStats)
          .sort()
          .forEach((cabangName) => {
            const stats = cabangStats[cabangName];

            summaryData.push({
              A: `📍 ${cabangName}`,
              B: "",
              C: "",
              D: "",
              E: "",
            });

            summaryData.push({
              A: "Total Produk di-SO",
              B: stats.totalProduk,
              C: "",
              D: "",
              E: "",
            });

            summaryData.push({}); // Empty row

            // Header tabel petugas
            summaryData.push({
              A: "No",
              B: "Kode Petugas",
              C: "Nama Petugas",
              D: "Jumlah SO",
              E: "Persentase",
            });

            // Data petugas
            const petugasList = Object.values(stats.petugas).sort(
              (a, b) => b.jumlahSO - a.jumlahSO
            );

            petugasList.forEach((petugas, index) => {
              const persentase = (
                (petugas.jumlahSO / stats.totalProduk) *
                100
              ).toFixed(1);

              summaryData.push({
                A: index + 1,
                B: petugas.kode,
                C: petugas.nama,
                D: petugas.jumlahSO,
                E: `${persentase}%`,
              });
            });

            summaryData.push({}); // Empty row
            summaryData.push({}); // Empty row
          });

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(summaryData, {
          skipHeader: true,
        });

        // Styling & column width
        const maxCabang = Object.keys(cabangStats).length;
        const cols = [
          { wch: 20 }, // A: Tanggal/Label
          { wch: 15 }, // B
          { wch: 15 }, // C
          { wch: 15 }, // D
          { wch: 15 }, // E
        ];

        // Add more columns if needed for daily progress table
        for (let i = 5; i < maxCabang + 1; i++) {
          cols.push({ wch: 15 });
        }

        ws["!cols"] = cols;

        return ws;
      };

      // ============================================
      // 📊 CREATE SUMMARY SHEET (First Sheet)
      // ============================================
      const summarySheet = createSummarySheet(dataToExport);
      XLSX.utils.book_append_sheet(wb, summarySheet, "📊 Summary");

      // ============================================
      // 📋 FORMAT DATA UNTUK SHEET DETAIL
      // ============================================
      const formatDataForExcel = (data: AuditStock[]) => {
        return data.map((item) => ({
          "Lokasi Rak": item.LokasiRak,
          "Kode Item": item.KodeItem,
          "Nama Item": item.NamaItem,
          QTY: item.Qty,
          "Stok Real": item.stockReal,
          Selisih: item.selisih,
          "Nama Lokasi": item.NamaLokasi,
          Cabang: item.NamaCabang,
          "Harga Jual": item.HargaJual,
          "Petugas SO": item.petugas_nama || "-",
          "Kode Petugas": item.petugas_kode || "-",
          Tanggal: format(new Date(item.tanggal), "dd/MM/yyyy HH:mm"),
        }));
      };

      const createSheet = (data: any[]) => {
        const ws = XLSX.utils.json_to_sheet(data);
        ws["!cols"] = [
          { wch: 15 }, // Lokasi Rak
          { wch: 15 }, // Kode Item
          { wch: 30 }, // Nama Item
          { wch: 10 }, // QTY
          { wch: 10 }, // Stok Real
          { wch: 10 }, // Selisih
          { wch: 20 }, // Nama Lokasi
          { wch: 20 }, // Cabang
          { wch: 15 }, // Harga Jual
          { wch: 25 }, // Petugas SO
          { wch: 15 }, // Kode Petugas
          { wch: 20 }, // Tanggal
        ];
        return ws;
      };

      const sanitizeSheetName = (name: string) => {
        return name.substring(0, 31).replace(/[:\\/?*\[\]]/g, "");
      };

      // ============================================
      // 📁 CREATE DETAIL SHEETS
      // ============================================
      if (
        downloadGroupByMonth &&
        periodType === "yearly" &&
        dateRange?.from &&
        dateRange?.to
      ) {
        const months = eachMonthOfInterval({
          start: dateRange.from,
          end: dateRange.to,
        });
        months.forEach((month) => {
          const monthStart = startOfMonth(month);
          const monthEnd = endOfMonth(month);
          const monthData = dataToExport.filter((item) => {
            const itemDate = new Date(item.tanggal);
            return isWithinInterval(itemDate, {
              start: monthStart,
              end: monthEnd,
            });
          });
          if (monthData.length > 0) {
            if (downloadGroupByCabang) {
              const groupedByCabang = monthData.reduce(
                (acc: any, item: AuditStock) => {
                  const cabang = item.NamaCabang || "Unknown";
                  if (!acc[cabang]) acc[cabang] = [];
                  acc[cabang].push(item);
                  return acc;
                },
                {}
              );
              Object.keys(groupedByCabang).forEach((cabangName) => {
                const sheetData = formatDataForExcel(
                  groupedByCabang[cabangName]
                );
                const ws = createSheet(sheetData);
                const monthName = format(month, "MMM yyyy", { locale: id });
                const sheetName = sanitizeSheetName(
                  `${monthName} - ${cabangName}`
                );
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
              });
            } else {
              const sheetData = formatDataForExcel(monthData);
              const ws = createSheet(sheetData);
              const monthName = format(month, "MMMM yyyy", { locale: id });
              const sheetName = sanitizeSheetName(monthName);
              XLSX.utils.book_append_sheet(wb, ws, sheetName);
            }
          }
        });
      } else if (downloadGroupByRak && selectedCabang !== "all") {
        const groupedByRak = dataToExport.reduce(
          (acc: any, item: AuditStock) => {
            const rak = item.LokasiRak || "Tanpa Rak";
            if (!acc[rak]) acc[rak] = [];
            acc[rak].push(item);
            return acc;
          },
          {}
        );
        Object.keys(groupedByRak)
          .sort()
          .forEach((rakName) => {
            const sheetData = formatDataForExcel(groupedByRak[rakName]);
            const ws = createSheet(sheetData);
            const sheetName = sanitizeSheetName(`Rak ${rakName}`);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
          });
      } else if (downloadGroupByCabang) {
        const groupedByCabang = dataToExport.reduce(
          (acc: any, item: AuditStock) => {
            const cabang = item.NamaCabang || "Unknown";
            if (!acc[cabang]) acc[cabang] = [];
            acc[cabang].push(item);
            return acc;
          },
          {}
        );
        Object.keys(groupedByCabang).forEach((cabangName) => {
          const sheetData = formatDataForExcel(groupedByCabang[cabangName]);
          const ws = createSheet(sheetData);
          const sheetName = sanitizeSheetName(cabangName);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
      } else {
        const sheetData = formatDataForExcel(dataToExport);
        const ws = createSheet(sheetData);
        XLSX.utils.book_append_sheet(wb, ws, "Laporan SO");
      }

      // ============================================
      // 💾 SAVE FILE
      // ============================================
      const fileName = `laporan-hasil-so-${format(
        new Date(),
        "dd-MM-yyyy"
      )}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error("Error downloading XLSX:", error);
      alert("Gagal mengunduh file. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const downloadOptions = getDownloadOptions();

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Laporan Hasil SO</h1>
        <p className="text-gray-500 mt-2">
          Laporan hasil update stok item produk
        </p>
      </header>

      {/* Buttons untuk membuka panduan */}
      {isAdmin && (
        <div className="flex flex-wrap gap-3 mb-6">
          <Button
            variant="outline"
            onClick={() => setShowPanduanFilterDialog(true)}
            className="flex items-center gap-2 border-blue-200 hover:bg-blue-50"
          >
            <Filter className="w-4 h-4" />
            Panduan Filter Data
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowPanduanDownloadDialog(true)}
            className="flex items-center gap-2 border-green-200 hover:bg-green-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Panduan Download Excel
          </Button>
        </div>
      )}

      <div className="border rounded-lg shadow-none overflow-hidden">
        <div className="flex flex-col p-4 gap-4 border-b">
          
          <div className="flex flex-col lg:flex-row w-full gap-3 items-end">
            {isAdmin && (
              <>
                <div className="flex flex-col gap-1 w-full lg:w-auto">
                  <Label className="text-xs font-medium">Cabang</Label>
                  <Select
                    value={selectedCabang}
                    onValueChange={(value) => {
                      setSelectedCabang(value);
                      setSelectedLokasiRak("all");
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Pilih Cabang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Cabang</SelectItem>
                      {CABANG_LIST.map((cabang) => (
                        <SelectItem key={cabang.kode} value={cabang.kode}>
                          {cabang.nama}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1 w-full lg:w-auto">
                  <Label className="text-xs font-medium">Lokasi Rak</Label>
                  <Popover open={openLokasiRak} onOpenChange={setOpenLokasiRak}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openLokasiRak}
                        className="w-full font-normal justify-between"
                      >
                        {selectedLokasiRak === "all"
                          ? "Semua Lokasi Rak"
                          : `Rak ${selectedLokasiRak}`}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="Cari lokasi rak..." />
                        <CommandEmpty>Lokasi rak tidak ditemukan.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          <CommandItem
                            value="all"
                            onSelect={() => {
                              setSelectedLokasiRak("all");
                              setOpenLokasiRak(false);
                            }}
                          >
                            Semua Lokasi Rak
                          </CommandItem>
                          {lokasiRakList.map((lok) => (
                            <CommandItem
                              key={lok}
                              value={lok}
                              onSelect={(currentValue) => {
                                setSelectedLokasiRak(currentValue);
                                setOpenLokasiRak(false);
                              }}
                            >
                              Rak {lok}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1 w-full lg:w-auto">
                  <Label className="text-xs font-medium">Tipe Periode</Label>
                  <Select
                    value={periodType}
                    onValueChange={(value: PeriodType) => {
                      setPeriodType(value);
                      setDateRange(undefined);
                    }}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                      <SelectItem value="custom">Custom Periode</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-1 w-full lg:w-auto">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    Pilih Periode
                  </Label>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        <span className="truncate">{getPeriodLabel()}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-4" align="start">
                      <div className="p-3 bg-blue-50 rounded-md">
                        <p className="text-xs text-blue-800 flex items-start gap-2">
                          <Info className="w-4 h-4 mt-0.5 shrink-0" />
                          <span>{getPeriodInfoText()}</span>
                        </p>
                      </div>

                      {periodType === "custom" ? (
                        <div className="pt-3">
                          <Calendar
                            mode="range"
                            defaultMonth={dateRange?.from}
                            selected={dateRange}
                            onSelect={handleDateRangeChange}
                            numberOfMonths={2}
                            locale={id}
                            className="rounded-md w-full"
                          />
                        </div>
                      ) : (
                        <div className="pt-3">
                          <p className="text-xs font-semibold mb-2">
                            Pilih Tanggal
                          </p>
                          <Calendar
                            mode="single"
                            selected={dateRange?.from}
                            onSelect={(date) =>
                              handleDateRangeChange(
                                date ? { from: date } : undefined
                              )
                            }
                            initialFocus
                            locale={id}
                            className="w-full"
                          />
                        </div>
                      )}

                      {periodType !== "custom" &&
                        periodType !== "daily" &&
                        dateRange?.from &&
                        dateRange?.to && (
                          <div className="p-3 border-t bg-green-50">
                            <p className="text-xs text-green-800">
                              ✓ Periode otomatis:{" "}
                              <strong>
                                {format(dateRange.from, "dd MMM", {
                                  locale: id,
                                })}
                              </strong>{" "}
                              sampai{" "}
                              <strong>
                                {format(dateRange.to, "dd MMM yyyy", {
                                  locale: id,
                                })}
                              </strong>
                            </p>
                          </div>
                        )}

                      {(dateRange?.from || dateRange?.to) && (
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => setDateRange(undefined)}
                          >
                            Reset Periode
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-1 w-full lg:w-auto">
                  <Label className="text-xs font-medium text-gray-700 opacity-0">
                    Action
                  </Label>
                  <Button
                    onClick={handleDownloadClick}
                    disabled={isDownloading || filteredData.length === 0}
                    className="flex w-full lg:w-auto cursor-pointer text-sm items-center gap-2 whitespace-nowrap"
                  >
                    <Download className="w-4 h-4" />
                    {isDownloading ? "Downloading..." : "Download XLSX"}
                  </Button>
                </div>
              </>
            )}

            <div className="flex flex-col gap-1 w-full lg:flex-1 lg:max-w-full">
              <label className="text-xs font-medium">Pencarian</label>
              <Input
                placeholder="Cari kode, nama item, atau lokasi rak..."
                className="w-full text-sm bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {periodType !== "daily" && dateRange?.from && dateRange?.to && (
            <div className="flex items-start gap-2 px-2 py-2 bg-blue-50 rounded-lg text-xs text-blue-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <p>
                Menampilkan data dari{" "}
                <strong>
                  {format(dateRange.from, "dd MMMM yyyy", { locale: id })}
                </strong>{" "}
                sampai{" "}
                <strong>
                  {format(dateRange.to, "dd MMMM yyyy", { locale: id })}
                </strong>{" "}
                (
                {Math.ceil(
                  (dateRange.to.getTime() - dateRange.from.getTime()) /
                    (1000 * 60 * 60 * 24)
                ) + 1}{" "}
                hari)
              </p>
            </div>
          )}

          {hasActiveFilters() && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
              <span className="text-xs font-medium text-gray-600">
                Filter Aktif:
              </span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-md text-xs">
                  Pencarian: "{searchQuery}"
                </span>
              )}
              {selectedCabang !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-md text-xs">
                  {CABANG_LIST.find((c) => c.kode === selectedCabang)?.nama}
                </span>
              )}
              {selectedLokasiRak !== "all" && (
                <span className="inline-flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-800 rounded-md text-xs">
                  Rak {selectedLokasiRak}
                </span>
              )}
              {(dateRange?.from || dateRange?.to) && (
                <span className="inline-flex items-center gap-1 px-3 py-2 bg-amber-100 text-amber-800 rounded-md text-xs">
                  {periodType === "daily" && "Harian: "}
                  {periodType === "weekly" && "Mingguan: "}
                  {periodType === "monthly" && "Bulanan: "}
                  {periodType === "yearly" && "Tahunan: "}
                  {periodType === "custom" && "Custom: "}
                  {getPeriodLabel()}
                </span>
              )}
              <Button
                onClick={clearAllFilters}
                variant={"destructive"}
                size="sm"
                className="w-full mt-4 ml-auto  cursor-pointer"
              >
                Hapus Semua Filter
              </Button>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-transparent overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Lokasi Rak</TableHead>
                <TableHead className="w-[150px]">Kode Item</TableHead>
                <TableHead>Nama Item</TableHead>
                <TableHead className="text-center w-[70px]">QTY</TableHead>
                <TableHead className="text-center w-[90px]">
                  Stok Real
                </TableHead>
                <TableHead className="text-center w-20">Selisih</TableHead>
                <TableHead className="w-[180px]">Nama Lokasi</TableHead>
                {isAdmin && <TableHead className="w-[180px]">Cabang</TableHead>}
                <TableHead className="w-[120px]">Harga Jual</TableHead>
                {isAdmin && (
                  <TableHead className="w-[200px]">Petugas SO</TableHead>
                )}
                <TableHead className="text-right w-[150px]">Tanggal</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y">
              {currentData.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isAdmin ? 11 : 9}
                    className="text-center py-8 text-sm text-gray-500"
                  >
                    {loading ? "Memuat data..." : "Tidak ada data"}
                  </TableCell>
                </TableRow>
              ) : (
                currentData.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell className="py-6 uppercase">
                      {row.LokasiRak}
                    </TableCell>
                    <TableCell className="py-6 font-mono">
                      {row.KodeItem}
                    </TableCell>
                    <TableCell>{row.NamaItem}</TableCell>
                    <TableCell className="text-center">{row.Qty}</TableCell>
                    <TableCell className="text-center">
                      {row.stockReal}
                    </TableCell>
                    <TableCell
                      className={`text-center font-semibold ${
                        row.selisih > 0
                          ? "text-green-600"
                          : row.selisih < 0
                          ? "text-red-600"
                          : "text-gray-600"
                      }`}
                    >
                      {row.selisih}
                    </TableCell>
                    <TableCell>{row.NamaLokasi}</TableCell>
                    {isAdmin && <TableCell>{row.NamaCabang}</TableCell>}
                    <TableCell>
                      Rp {Number(row.HargaJual).toLocaleString("id-ID")}
                    </TableCell>
                    {/* 👇 Cell Baru: Petugas SO (hanya untuk Admin) */}
                    {isAdmin && (
                      <TableCell>
                        {row.petugas_nama ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-sm font-medium">
                                {row.petugas_nama}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {format(new Date(row.tanggal), "dd/MM/yyyy HH:mm", {
                        locale: id,
                      })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center sm:justify-between px-4 py-3 border-t">
            <div className="text-xs hidden sm:block">
              Menampilkan {startIndex + 1} -{" "}
              {Math.min(endIndex, filteredData.length)} dari{" "}
              {filteredData.length} data
              {searchQuery && ` (dari ${allData.length} total)`}
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs">
                Page {currentPage} dari {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Download Dialog */}
      <Dialog open={showDownloadDialog} onOpenChange={setShowDownloadDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Opsi Download Excel
            </DialogTitle>
            <DialogDescription>
              Pilih bagaimana Anda ingin mengelompokkan data dalam file Excel
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {/* Info Filter Aktif */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Filter yang akan didownload:
              </p>
              <div className="space-y-2 text-sm">
                {selectedCabang !== "all" ? (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">
                      Cabang:
                    </span>
                    <span className="text-gray-900">
                      {CABANG_LIST.find((c) => c.kode === selectedCabang)
                        ?.nama || selectedCabang}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">
                      Cabang:
                    </span>
                    <span className="text-gray-900">Semua Cabang</span>
                  </div>
                )}

                {selectedLokasiRak !== "all" && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">
                      Lokasi Rak:
                    </span>
                    <span className="text-gray-900 uppercase">
                      Rak {selectedLokasiRak}
                    </span>
                  </div>
                )}

                {dateRange?.from && (
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">
                      Periode:
                    </span>
                    <span className="text-gray-900">{getPeriodLabel()}</span>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t border-blue-200">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-gray-700 min-w-[100px]">
                      Total Data:
                    </span>
                    <span className="text-blue-600 font-bold">
                      {filteredData.length > 0
                        ? filteredData.length
                        : allData.length}{" "}
                      item
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Download Options */}
            <div className="space-y-4">
              <p className="text-sm font-semibold">
                Pilih cara pengelompokan data:
              </p>

              {/* Option 1: Group by Cabang */}
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <Checkbox
                  id="groupByCabang"
                  checked={downloadGroupByCabang}
                  onCheckedChange={(checked) => {
                    setDownloadGroupByCabang(checked as boolean);
                    if (checked && downloadOptions.isSingleCabang) {
                      setDownloadGroupByRak(false);
                    }
                  }}
                  disabled={downloadOptions.isSingleCabang}
                />
                <div className="flex-1">
                  <Label
                    htmlFor="groupByCabang"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Kelompokkan per Cabang
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">
                    {downloadOptions.isSingleCabang
                      ? "Tidak tersedia (hanya 1 cabang dipilih)"
                      : "Setiap cabang akan menjadi tab terpisah dalam Excel"}
                  </p>
                </div>
              </div>

              {/* Option 2: Group by Rak */}
              {downloadOptions.showRakOption && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id="groupByRak"
                    checked={downloadGroupByRak}
                    onCheckedChange={(checked) => {
                      setDownloadGroupByRak(checked as boolean);
                      if (checked) setDownloadGroupByCabang(false);
                    }}
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="groupByRak"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Kelompokkan per Lokasi Rak
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Setiap lokasi rak akan menjadi tab terpisah dalam Excel
                    </p>
                  </div>
                </div>
              )}

              {/* Option 3: Group by Month */}
              {downloadOptions.showMonthOption && (
                <div className="flex items-start gap-3 p-3 border rounded-lg">
                  <Checkbox
                    id="groupByMonth"
                    checked={downloadGroupByMonth}
                    onCheckedChange={(checked) =>
                      setDownloadGroupByMonth(checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label
                      htmlFor="groupByMonth"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Kelompokkan per Bulan
                    </Label>
                    <p className="text-xs text-gray-500 mt-1">
                      Data tahunan akan dipisah per bulan dalam tab berbeda
                    </p>
                    {downloadGroupByMonth && downloadGroupByCabang && (
                      <p className="text-xs text-amber-600 mt-1">
                        ℹ️ Akan membuat tab per bulan + cabang (kombinasi)
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Info jika tidak ada grouping */}
              {!downloadGroupByCabang &&
                !downloadGroupByRak &&
                !downloadGroupByMonth && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-semibold">Tanpa Pengelompokan</p>
                      <p className="text-xs mt-1">
                        Semua data akan disimpan dalam satu tab Excel
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <DialogFooter className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDownloadDialog(false)}
              disabled={isDownloading}
            >
              Batal
            </Button>
            <Button
              onClick={performDownload}
              disabled={
                isDownloading ||
                (filteredData.length === 0 && allData.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isDownloading ? (
                <span className="flex items-center gap-2">
                  <Download className="w-4 h-4 animate-bounce" />
                  Downloading...
                </span>
              ) : (
                <span className="flex items-center text-white gap-2">
                  <Download className="w-4 h-4" />
                  Download Excel
                </span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Panduan Filter */}
      <Dialog
        open={showPanduanFilterDialog}
        onOpenChange={setShowPanduanFilterDialog}
      >
        <DialogContent className="sm:max-w-4xl  max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Panduan Filter Data
            </DialogTitle>
            <DialogDescription>
              Pelajari cara menggunakan fitur filter untuk menyaring data
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              {/* Filter Cabang */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Filter Cabang
                    </h4>
                    <p className="text-sm text-gray-700">
                      Pilih cabang tertentu untuk melihat data spesifik cabang,
                      atau pilih "Semua Cabang" untuk melihat seluruh data dari
                      semua lokasi.
                    </p>
                  </div>
                </div>
              </div>

              {/* Filter Lokasi Rak */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Filter Lokasi Rak
                    </h4>
                    <p className="text-sm text-gray-700">
                      Cari dan filter data berdasarkan nomor rak penyimpanan.
                      Gunakan search box untuk menemukan rak dengan cepat.
                    </p>
                    <div className="mt-2 p-2 bg-white rounded border border-purple-200">
                      <p className="text-xs text-purple-800">
                        💡 <strong>Tips:</strong> Filter lokasi rak akan
                        otomatis menyesuaikan dengan cabang yang dipilih
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Periode */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Filter Periode
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Pilih rentang waktu untuk melihat data dalam periode
                      tertentu:
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-amber-700">
                          📅 Harian:
                        </span>
                        <span>Pilih 1 tanggal untuk data hari tersebut</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-amber-700">
                          📆 Mingguan:
                        </span>
                        <span>Otomatis menampilkan data 7 hari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-amber-700">
                          🗓️ Bulanan:
                        </span>
                        <span>Otomatis menampilkan data 30 hari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-amber-700">
                          📊 Tahunan:
                        </span>
                        <span>Otomatis menampilkan data 365 hari</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-semibold text-amber-700">
                          🎯 Custom:
                        </span>
                        <span>
                          Pilih tanggal mulai dan akhir sendiri dengan 2
                          kalender
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Filter Pencarian */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Pencarian</h4>
                    <p className="text-sm text-gray-700">
                      Gunakan kolom pencarian untuk mencari data berdasarkan:
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-gray-700">
                      <li>• Kode Item (contoh: BRG001)</li>
                      <li>• Nama Item (contoh: Sabun Mandi)</li>
                      <li>• Lokasi Rak (contoh: A-01)</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Tips Kombinasi */}
              <div className="p-4 bg-linear-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-300">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      💡 Tips Kombinasi Filter
                    </h4>
                    <p className="text-sm text-gray-700">
                      Anda dapat menggabungkan beberapa filter sekaligus untuk
                      hasil yang lebih spesifik. Misalnya: pilih cabang tertentu
                      + lokasi rak + periode mingguan untuk melihat data detail.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Filter yang aktif akan ditampilkan sebagai badge berwarna
                      di bawah form filter.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowPanduanFilterDialog(false)}
              className="w-full sm:w-auto"
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Panduan Download */}
      <Dialog
        open={showPanduanDownloadDialog}
        onOpenChange={setShowPanduanDownloadDialog}
      >
        <DialogContent className="sm:max-w-4xl  max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Panduan Download Excel
            </DialogTitle>
            <DialogDescription>
              Pelajari berbagai opsi download dan pengelompokan data dalam Excel
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-4">
              {/* Download Tanpa Filter */}
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Download Tanpa Filter (Semua Data)
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Ketika tidak ada filter aktif, data akan dikelompokkan per
                      cabang dalam tab berbeda.
                    </p>
                    <div className="mt-2 p-3 bg-white rounded-lg border border-green-300">
                      <p className="text-xs text-green-800 font-semibold mb-1">
                        Hasil Excel:
                      </p>
                      <p className="text-xs text-gray-700">
                        Tab 1: Cabang Nguter
                        <br />
                        Tab 2: Cabang Combongan
                        <br />
                        Tab 3: Cabang Klaten
                        <br />
                        ... dan seterusnya
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download 1 Cabang */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Download Filter 1 Cabang
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Ketika memilih 1 cabang saja, Anda mendapat opsi tambahan:
                    </p>
                    <div className="space-y-2">
                      <div className="p-2 bg-white rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800">
                          ✓ Kelompokkan per Lokasi Rak
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Setiap lokasi rak akan menjadi tab terpisah (Tab: Rak
                          A-01, Rak A-02, dll)
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-blue-200">
                        <p className="text-xs font-semibold text-blue-800">
                          ✓ Semua dalam 1 Tab
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Jika tidak dicentang, semua data cabang dalam 1 tab
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Download dengan Periode */}
              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Download dengan Filter Periode
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Untuk semua tipe periode (Harian, Mingguan, Bulanan):
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>
                        • <strong>Kelompokkan per Cabang:</strong> Tab terpisah
                        per cabang
                      </li>
                      <li>
                        • <strong>Tanpa pengelompokan:</strong> Semua data dalam
                        1 tab
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Download Tahunan */}
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                    4
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      Download Filter Tahunan (Spesial)
                    </h4>
                    <p className="text-sm text-gray-700 mb-2">
                      Filter tahunan memiliki opsi ekstra:
                    </p>
                    <div className="space-y-2">
                      <div className="p-2 bg-white rounded border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800">
                          ⭐ Kelompokkan per Bulan
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Data dipisah per bulan dalam tab berbeda (Tab: Jan
                          2024, Feb 2024, dll)
                        </p>
                      </div>
                      <div className="p-2 bg-white rounded border border-amber-200">
                        <p className="text-xs font-semibold text-amber-800">
                          ⭐ Kombinasi Bulan + Cabang
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          Jika kedua opsi dicentang: Tab per bulan per cabang
                          (Tab: Jan 2024 - Cabang Nguter, Jan 2024 - Cabang
                          Klaten, dll)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips Download */}
              <div className="p-4 bg-linear-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-300">
                <div className="flex items-start gap-3">
                  <Download className="w-6 h-6 text-green-600 shrink-0 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">
                      💡 Tips Download
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>
                        • File Excel akan otomatis dinamai dengan tanggal
                        download
                      </li>
                      <li>
                        • Semua tab memiliki format kolom yang sama dan rapi
                      </li>
                      <li>
                        • Pilih opsi pengelompokan sesuai kebutuhan analisis
                        Anda
                      </li>
                      <li>
                        • Untuk data besar, pertimbangkan filter terlebih dahulu
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowPanduanDownloadDialog(false)}
              className="w-full sm:w-auto"
            >
              Mengerti
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
