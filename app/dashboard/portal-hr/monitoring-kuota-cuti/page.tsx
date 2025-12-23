// File: app/dashboard/portal-hr/monitoring-kuota-cuti/page.tsx
"use client";
import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Calendar,
  Users,
  TrendingDown,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge-cuti-izin";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface KuotaUser {
  id: number;
  user_id: number;
  tahun: number;
  kuota_total: number;
  kuota_terpakai: number;
  kuota_pending: number;
  kuota_sisa: number;
  user_name: string;
  kode_pegawai: string;
  role_name: string;
  divisi_name: string;
  created_at: string;
  updated_at: string;
}

interface StatistikKuota {
  total_karyawan: number;
  total_kuota_terpakai: number;
  total_kuota_pending: number;
  total_kuota_sisa: number;
  rata_rata_penggunaan: number;
}

export default function MonitoringKuotaCutiPage() {
  const [data, setData] = useState<KuotaUser[]>([]);
  const [filteredData, setFilteredData] = useState<KuotaUser[]>([]);
  const [statistik, setStatistik] = useState<StatistikKuota | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDivisi, setFilterDivisi] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Edit kuota states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<KuotaUser | null>(null);
  const [editKuotaTotal, setEditKuotaTotal] = useState(0);
  const [editAlasan, setEditAlasan] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedYear]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterDivisi, filterStatus, data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/kuota-cuti/monitoring?tahun=${selectedYear}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setStatistik(result.statistik);
      } else {
        toast.error(result.error || "Gagal memuat data");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...data];

    // Filter by search term (name or kode_pegawai)
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.kode_pegawai.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by divisi
    if (filterDivisi !== "all") {
      filtered = filtered.filter((item) => item.divisi_name === filterDivisi);
    }

    // Filter by status (sisa kuota)
    if (filterStatus === "habis") {
      filtered = filtered.filter((item) => item.kuota_sisa === 0);
    } else if (filterStatus === "hampir_habis") {
      filtered = filtered.filter(
        (item) =>
          item.kuota_sisa > 0 &&
          item.kuota_sisa <= Math.ceil(item.kuota_total * 0.25)
      );
    } else if (filterStatus === "tersedia") {
      filtered = filtered.filter(
        (item) => item.kuota_sisa > Math.ceil(item.kuota_total * 0.25)
      );
    }

    setFilteredData(filtered);
  };

  const handleExportExcel = () => {
    try {
      // Create a new workbook
      const wb = XLSX.utils.book_new();
  
      // Prepare headers
      const headers = [
        "No",
        "Nama Karyawan",
        "Kode Pegawai",
        "Divisi",
        "Role",
        "Total Kuota",
        "Terpakai",
        "Pending",
        "Sisa",
        "% Terpakai",
        "Status",
      ];
  
      // Function to create worksheet data
      const createWorksheetData = (dataToExport: KuotaUser[]) => {
        const wsData: any[][] = [headers];
        dataToExport.forEach((item, index) => {
          const percentage = (
            ((item.kuota_terpakai + item.kuota_pending) / item.kuota_total) *
            100
          ).toFixed(1);
          const sisaPercentage = (item.kuota_sisa / item.kuota_total) * 100;
  
          let status = "Tersedia";
          if (item.kuota_sisa === 0) status = "Habis";
          else if (sisaPercentage <= 25) status = "Hampir Habis";
          else if (sisaPercentage <= 50) status = "Sedang";
  
          wsData.push([
            index + 1,
            item.user_name,
            item.kode_pegawai,
            item.divisi_name || "Tidak ada divisi",
            item.role_name,
            item.kuota_total,
            item.kuota_terpakai,
            item.kuota_pending,
            item.kuota_sisa,
            percentage + "%",
            status,
          ]);
        });
  
        return wsData;
      };
  
      // 1. Create "ALL" sheet with all data
      const allData = createWorksheetData(data);
      const wsAll = XLSX.utils.aoa_to_sheet(allData);
  
      // Set column widths for better readability
      wsAll["!cols"] = [
        { wch: 5 },  // No
        { wch: 25 }, // Nama
        { wch: 15 }, // Kode Pegawai
        { wch: 20 }, // Divisi
        { wch: 20 }, // Role
        { wch: 12 }, // Total Kuota
        { wch: 10 }, // Terpakai
        { wch: 10 }, // Pending
        { wch: 10 }, // Sisa
        { wch: 12 }, // % Terpakai
        { wch: 15 }, // Status
      ];
  
      XLSX.utils.book_append_sheet(wb, wsAll, "ALL");
  
      // 2. Create sheets per divisi
      const divisiGroups = data.reduce((acc, item) => {
        const divisi = item.divisi_name || "Tidak ada divisi";
        if (!acc[divisi]) {
          acc[divisi] = [];
        }
        acc[divisi].push(item);
        return acc;
      }, {} as Record<string, KuotaUser[]>);
  
      // Sort divisi names alphabetically
      const sortedDivisi = Object.keys(divisiGroups).sort();
  
      sortedDivisi.forEach((divisi) => {
        const divisiData = createWorksheetData(divisiGroups[divisi]);
        const ws = XLSX.utils.aoa_to_sheet(divisiData);
  
        // Set column widths
        ws["!cols"] = [
          { wch: 5 },
          { wch: 25 },
          { wch: 15 },
          { wch: 20 },
          { wch: 20 },
          { wch: 12 },
          { wch: 10 },
          { wch: 10 },
          { wch: 10 },
          { wch: 12 },
          { wch: 15 },
        ];
  
        // Sanitize sheet name (Excel has limitations on sheet names)
        const sheetName = divisi
          .replace(/[\\\/\?\*\[\]]/g, "") // Remove invalid characters
          .substring(0, 31); // Max 31 characters
  
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      });
  
      // 3. Add summary/statistik sheet
      if (statistik) {
        const summaryData: any[][] = [
          ["RINGKASAN KUOTA CUTI", ""],
          ["Tahun", selectedYear],
          ["Tanggal Export", new Date().toLocaleString("id-ID")],
          [""],
          ["STATISTIK"],
          ["Total Karyawan", statistik.total_karyawan],
          ["Total Kuota Terpakai", statistik.total_kuota_terpakai],
          ["Total Kuota Pending", statistik.total_kuota_pending],
          ["Total Kuota Sisa", statistik.total_kuota_sisa],
          [
            "Rata-rata Penggunaan",
            statistik.rata_rata_penggunaan.toFixed(2) + " hari/orang",
          ],
          [""],
          ["BREAKDOWN PER DIVISI"],
        ];
  
        // Add breakdown per divisi
        sortedDivisi.forEach((divisi) => {
          const divisiData = divisiGroups[divisi];
          const totalTerpakai = divisiData.reduce(
            (sum, item) => sum + item.kuota_terpakai,
            0
          );
          const totalPending = divisiData.reduce(
            (sum, item) => sum + item.kuota_pending,
            0
          );
          const totalSisa = divisiData.reduce(
            (sum, item) => sum + item.kuota_sisa,
            0
          );
  
          summaryData.push([
            divisi,
            `${divisiData.length} karyawan | Terpakai: ${totalTerpakai} | Pending: ${totalPending} | Sisa: ${totalSisa}`,
          ]);
        });
  
        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        wsSummary["!cols"] = [{ wch: 30 }, { wch: 50 }];
  
        // Insert summary sheet at the beginning
        XLSX.utils.book_append_sheet(wb, wsSummary, "RINGKASAN");
  
        // Reorder sheets: RINGKASAN, ALL, then divisi sheets
        const sheets = wb.SheetNames;
        const ringkasanSheet = sheets.pop(); // Remove RINGKASAN from end
        wb.SheetNames = [ringkasanSheet!, "ALL", ...sheets.slice(1)];
      }
  
      // Generate filename
      const filename = `monitoring-kuota-cuti-${selectedYear}-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
  
      // Write the file
      XLSX.writeFile(wb, filename);
  
      toast.success(
        `File berhasil didownload dengan ${
          Object.keys(divisiGroups).length + 2
        } sheet (Ringkasan, ALL, dan ${Object.keys(divisiGroups).length} divisi)`
      );
    } catch (error) {
      console.error("Error exporting Excel:", error);
      toast.error("Gagal mengexport file Excel");
    }
  };

  const handleOpenEditDialog = (user: KuotaUser) => {
    setSelectedUser(user);
    setEditKuotaTotal(user.kuota_total);
    setEditAlasan("");
    setShowEditDialog(true);
  };

  const handleSubmitEdit = async () => {
    if (!selectedUser) return;

    if (!editAlasan.trim()) {
      toast.error("Alasan perubahan harus diisi");
      return;
    }

    if (
      editKuotaTotal <
      selectedUser.kuota_terpakai + selectedUser.kuota_pending
    ) {
      toast.error(
        `Kuota total tidak boleh kurang dari ${
          selectedUser.kuota_terpakai + selectedUser.kuota_pending
        } hari (terpakai + pending)`
      );
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/kuota-cuti/user/${selectedUser.user_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tahun: selectedUser.tahun,
            kuota_total: editKuotaTotal,
            alasan: editAlasan.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success("Kuota berhasil diperbarui");
        setShowEditDialog(false);
        setSelectedUser(null);
        setEditAlasan("");
        fetchData(); // Refresh data
      } else {
        toast.error(result.error || "Gagal memperbarui kuota");
      }
    } catch (error) {
      console.error("Error updating kuota:", error);
      toast.error("Terjadi kesalahan saat memperbarui kuota");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (kuotaSisa: number, kuotaTotal: number) => {
    const percentage = (kuotaSisa / kuotaTotal) * 100;

    if (kuotaSisa === 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Habis
        </Badge>
      );
    } else if (percentage <= 25) {
      return (
        <Badge variant="warning" className="text-xs">
          Hampir Habis
        </Badge>
      );
    } else if (percentage <= 50) {
      return (
        <Badge variant="secondary" className="text-xs">
          Sedang
        </Badge>
      );
    } else {
      return (
        <Badge variant="success" className="text-xs">
          Tersedia
        </Badge>
      );
    }
  };

  const getProgressColor = (kuotaSisa: number, kuotaTotal: number) => {
    const percentage = (kuotaSisa / kuotaTotal) * 100;
    if (percentage <= 25) return "bg-red-500";
    if (percentage <= 50) return "bg-amber-500";
    return "bg-green-500";
  };

  // Get unique divisi for filter
  const uniqueDivisi = Array.from(
    new Set(data.map((item) => item.divisi_name).filter(Boolean))
  );

  // Generate years for dropdown (current year ± 2 years)
  const years = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Monitoring Kuota Cuti Karyawan</h1>
          <p className="text-gray-500 mt-1">
            Pantau penggunaan kuota cuti semua karyawan
          </p>
        </div>
       
      </div>

      <div className="flex items-center gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      {/* Info Footer */}
      <div className="p-4 dark:bg-blue-50/10 bg-blue-50 border border-blue-400 rounded-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 dark:text-white text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm dark:text-white text-blue-800">
            <p className="font-medium mb-1">Keterangan Status:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>
                <strong>Tersedia:</strong> Sisa kuota lebih dari 50% (hijau)
              </li>
              <li>
                <strong>Sedang:</strong> Sisa kuota 25-50% (kuning)
              </li>
              <li>
                <strong>Hampir Habis:</strong> Sisa kuota kurang dari 25%
                (orange)
              </li>
              <li>
                <strong>Habis:</strong> Tidak ada sisa kuota (merah)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Statistik Cards */}
      {statistik && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Total Karyawan
                </p>
                <Users className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">
                {statistik.total_karyawan}
              </p>
              <p className="text-xs text-gray-500 mt-1">Karyawan terdaftar</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Total Kuota Sisa
                </p>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {statistik.total_kuota_sisa}
              </p>
              <p className="text-xs text-gray-500 mt-1">Hari tersedia</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Total Pending
                </p>
                <Calendar className="w-5 h-5 text-amber-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-amber-600">
                {statistik.total_kuota_pending}
              </p>
              <p className="text-xs text-gray-500 mt-1">Hari dalam proses</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">
                  Total Terpakai
                </p>
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">
                {statistik.total_kuota_terpakai}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Rata-rata: {statistik.rata_rata_penggunaan.toFixed(1)}{" "}
                hari/orang
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filter & Pencarian
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari nama atau kode pegawai..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={filterDivisi} onValueChange={setFilterDivisi}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Divisi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Divisi</SelectItem>
                {uniqueDivisi.map((divisi) => (
                  <SelectItem key={divisi} value={divisi}>
                    {divisi}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="tersedia">Kuota Tersedia</SelectItem>
                <SelectItem value="hampir_habis">
                  Hampir Habis (≤25%)
                </SelectItem>
                <SelectItem value="habis">Kuota Habis</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="default"
              onClick={handleExportExcel}
              disabled={filteredData.length === 0}
              className="w-full"
            >
              Export Excel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="shadow-none">
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              Memuat data...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">
                {data.length === 0
                  ? "Belum ada data kuota cuti"
                  : "Tidak ada data yang sesuai dengan filter"}
              </p>
            </div>
          ) : (
            <div className="p-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Nama Karyawan</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Total Kuota</TableHead>
                    <TableHead>Terpakai</TableHead>
                    <TableHead>Pending</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item, index) => {
                    const usagePercentage =
                      ((item.kuota_terpakai + item.kuota_pending) /
                        item.kuota_total) *
                      100;

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.user_name}</p>
                            <p className="text-xs text-gray-500">
                              {item.kode_pegawai}
                            </p>
                            <p className="text-xs text-gray-400">
                              {item.role_name}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{item.divisi_name}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-blue-600">
                            {item.kuota_total}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-red-600">
                              {item.kuota_terpakai}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(
                                (item.kuota_terpakai / item.kuota_total) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-amber-600">
                              {item.kuota_pending}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(
                                (item.kuota_pending / item.kuota_total) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-green-600">
                              {item.kuota_sisa}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(
                                (item.kuota_sisa / item.kuota_total) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="w-full mx-auto">
                            <Progress value={usagePercentage} className="h-2" />
                            <p className="text-xs text-center text-gray-500 mt-1">
                              {usagePercentage.toFixed(0)}% digunakan
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.kuota_sisa, item.kuota_total)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEditDialog(item)}
                            disabled={loading}
                          >
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit Kuota */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Kuota Cuti Manual</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">
                  {selectedUser.user_name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedUser.kode_pegawai}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedUser.divisi_name}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kuota_total_edit">
                  Kuota Total (Hari) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="kuota_total_edit"
                  type="number"
                  min={selectedUser.kuota_terpakai + selectedUser.kuota_pending}
                  value={editKuotaTotal}
                  onChange={(e) => setEditKuotaTotal(parseInt(e.target.value))}
                />
                <p className="text-xs text-gray-500">
                  Minimal:{" "}
                  {selectedUser.kuota_terpakai + selectedUser.kuota_pending}{" "}
                  hari (terpakai + pending)
                </p>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
                <p className="font-medium text-blue-900 mb-1">
                  Preview Perubahan:
                </p>
                <div className="space-y-1 text-blue-800">
                  <p>
                    Kuota Total: {selectedUser.kuota_total} → {editKuotaTotal}
                  </p>
                  <p>
                    Kuota Sisa: {selectedUser.kuota_sisa} →{" "}
                    {editKuotaTotal -
                      selectedUser.kuota_terpakai -
                      selectedUser.kuota_pending}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alasan_edit">
                  Alasan Perubahan <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="alasan_edit"
                  value={editAlasan}
                  onChange={(e) => setEditAlasan(e.target.value)}
                  placeholder="Jelaskan alasan perubahan kuota..."
                  rows={3}
                />
              </div>

              <div className="p-3 bg-amber-50 border-l-4 border-amber-400 rounded-md">
                <p className="text-xs text-amber-800">
                  ⚠️ Perubahan ini akan langsung mempengaruhi kuota cuti
                  karyawan. Pastikan alasan perubahan sudah jelas dan tercatat.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmitEdit} disabled={submitting}>
              {submitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
