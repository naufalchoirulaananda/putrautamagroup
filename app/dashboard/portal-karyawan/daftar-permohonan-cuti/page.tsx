// File: app/dashboard/portal-karyawan/daftar-permohonan-cuti/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge-cuti-izin";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/portal-karyawan-tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  XCircle,
  FileText,
  Loader2,
  Clock,
  History,
} from "lucide-react";
import { toast } from "sonner";
import ApprovalSuccessDialog from "@/components/portal-karyawan/ApprovalSuccessDialog";

interface PendingCuti {
  id: number;
  user_name: string;
  kode_pegawai: string;
  role_name: string;
  nama_divisi: string;
  jenis_izin: string;
  tanggal_izin: string | null;
  tanggal_cuti_mulai: string | null;
  bukti_file_path: string | null;
  tanggal_cuti_selesai: string | null;
  jumlah_hari_cuti: number;
  alasan: string;
  pic_pengganti: string | null;
  pic_phone: string | null;
  nomor_telepon_karyawan: string;
  status: string;
  pdf_pengajuan_path: string | null;
  pdf_level1_path: string | null;
  pdf_final_path: string | null;
  created_at: string;
  progress_percentage: number;
}

function DaftarPermohonanCutiPage() {
  const { data: session } = useSession();
  const [pendingData, setPendingData] = useState<PendingCuti[]>([]);
  const [historyData, setHistoryData] = useState<PendingCuti[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuti, setSelectedCuti] = useState<PendingCuti | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<"approve" | "reject">(
    "approve"
  );
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [approvalResult, setApprovalResult] = useState<{
    action: "approve" | "reject";
    data: any;
    pdfPath?: string | null;
  } | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
    fetchHistoryApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "/api/cuti-izin/pending-approvals?type=manager"
      );
      const result = await response.json();

      if (result.success) {
        setPendingData(result.data);
      }
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryApprovals = async () => {
    try {
      // Fetch approvals that current user has processed
      const response = await fetch("/api/cuti-izin/history-approvals");
      const result = await response.json();

      if (result.success) {
        setHistoryData(result.data);
      }
    } catch (error) {
      console.error("Error fetching history approvals:", error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatJenisIzin = (jenis: string) => {
    const mapping: { [key: string]: string } = {
      cuti: "Cuti",
      sakit: "Sakit",
      izin: "Izin",
      datang_terlambat: "Datang Terlambat",
      meninggalkan_pekerjaan: "Meninggalkan Pekerjaan",
    };
    return mapping[jenis] || jenis;
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: {
      [key: string]: {
        label: string;
        variant:
          | "default"
          | "secondary"
          | "destructive"
          | "outline"
          | "success"
          | "warning";
      };
    } = {
      pending: { label: "Pending", variant: "secondary" },
      waiting_manager: { label: "Menunggu Manager", variant: "warning" },
      waiting_hrd: { label: "Menunggu HRD", variant: "warning" },
      approved: { label: "Disetujui", variant: "success" },
      rejected_manager: { label: "Ditolak Manager", variant: "destructive" },
      rejected_hrd: { label: "Ditolak HRD", variant: "destructive" },
    };

    const config = statusConfig[status] || {
      label: status,
      variant: "default",
    };
    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const handleOpenApprovalDialog = (
    cuti: PendingCuti,
    action: "approve" | "reject"
  ) => {
    setSelectedCuti(cuti);
    setApprovalAction(action);
    setNotes("");
    setShowApprovalDialog(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedCuti) return;

    if (approvalAction === "reject" && !notes.trim()) {
      toast.error("Alasan penolakan harus diisi");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(
        `/api/cuti-izin/${selectedCuti.id}/approve`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: approvalAction,
            notes: notes.trim(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Tutup dialog approval
        setShowApprovalDialog(false);

        // Set data untuk success dialog
        setApprovalResult({
          action: approvalAction,
          data: {
            id: selectedCuti.id,
            user_name: selectedCuti.user_name,
            jenis_izin: selectedCuti.jenis_izin,
            status: result.data?.new_status,
          },
          pdfPath: selectedCuti.pdf_level1_path,
        });

        // Tampilkan success dialog
        setShowSuccessDialog(true);

        // Refresh data
        fetchPendingApprovals();
        fetchHistoryApprovals();
      } else {
        toast.error(result.error || "Gagal memproses persetujuan");
      }
    } catch (error) {
      console.error("Error submitting approval:", error);
      toast.error("Terjadi kesalahan saat memproses persetujuan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewPDF = (pdfPath: string) => {
    window.open(pdfPath, "_blank");
  };

  if (loading && pendingData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const handleViewPDFFromDialog = () => {
    if (approvalResult?.pdfPath) {
      handleViewPDF(approvalResult.pdfPath);
    }
  };

  return (
    <div className="@container mx-auto p-4 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">Permohonan Cuti & Izin</h1>
        <p className="text-gray-500 mt-2">
          Setujui atau tolak permohonan cuti dan izin dari karyawan
        </p>
      </header>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Menunggu Persetujuan ( {pendingData.length} )
          </TabsTrigger>
          <TabsTrigger value="history">Riwayat Persetujuan</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Permohonan Menunggu Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada permohonan yang menunggu persetujuan
                  </p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Divisi</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Bukti</TableHead>
                        <TableHead>Durasi</TableHead>
                        <TableHead className="text-right">Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-6">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.user_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{item.nama_divisi}</TableCell>
                          <TableCell>
                            {formatJenisIzin(item.jenis_izin)}
                          </TableCell>
                          <TableCell>
                            {item.jenis_izin === "cuti"
                              ? `${formatDate(
                                  item.tanggal_cuti_mulai
                                )} - ${formatDate(item.tanggal_cuti_selesai)}`
                              : formatDate(item.tanggal_izin)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.bukti_file_path ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (item.bukti_file_path) {
                                    window.open(item.bukti_file_path, "_blank");
                                  }
                                }}
                                className="w-full"
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Lihat Bukti
                              </Button>
                            ) : (
                              <span className="text-xs text-gray-400">
                                Tidak ada
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.jenis_izin === "cuti"
                              ? `${item.jumlah_hari_cuti} hari`
                              : "1 hari"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              {item.pdf_pengajuan_path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="cursor-pointer"
                                  onClick={() =>
                                    handleViewPDF(item.pdf_pengajuan_path!)
                                  }
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() =>
                                  handleOpenApprovalDialog(item, "approve")
                                }
                                className="cursor-pointer"
                              >
                                Setuju
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() =>
                                  handleOpenApprovalDialog(item, "reject")
                                }
                                className="cursor-pointer"
                              >
                                Tolak
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card className="shadow-none">
            <CardHeader>
              <CardTitle>Permohonan yang Sudah Diproses</CardTitle>
            </CardHeader>
            <CardContent>
              {historyData.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Belum ada riwayat approval</p>
                </div>
              ) : (
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Karyawan</TableHead>
                        <TableHead>Jenis</TableHead>
                        <TableHead>Tanggal</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal Proses</TableHead>
                        <TableHead className="text-center">
                          Dokumen PDF
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {historyData.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="py-6">{index + 1}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{item.user_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {formatJenisIzin(item.jenis_izin)}
                          </TableCell>
                          <TableCell>
                            {item.jenis_izin === "cuti"
                              ? `${formatDate(
                                  item.tanggal_cuti_mulai
                                )} - ${formatDate(item.tanggal_cuti_selesai)}`
                              : formatDate(item.tanggal_izin)}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>{formatDate(item.created_at)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col items-center gap-2">
                              {item.bukti_file_path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewPDF(item.bukti_file_path!)
                                  }
                                  className="w-full bg-amber-50 border-amber-200 hover:bg-amber-100"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Bukti Upload
                                </Button>
                              )}

                              {/* PDF Pengajuan Awal */}
                              {item.pdf_pengajuan_path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewPDF(item.pdf_pengajuan_path!)
                                  }
                                  className="w-full"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  PDF Pengajuan
                                </Button>
                              )}

                              {/* PDF Level 1 (Manager Approved) */}
                              {item.pdf_level1_path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewPDF(item.pdf_level1_path!)
                                  }
                                  className="w-full bg-blue-50 border-blue-200 hover:bg-blue-100"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  PDF Persetujuan Atasan
                                </Button>
                              )}

                              {/* PDF Final (All Approved) */}
                              {item.pdf_final_path && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    handleViewPDF(item.pdf_final_path!)
                                  }
                                  className="w-full bg-green-50 border-green-200 hover:bg-green-100"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  PDF Final HRD
                                </Button>
                              )}

                              {/* Jika tidak ada PDF sama sekali */}
                              {!item.pdf_pengajuan_path &&
                                !item.pdf_level1_path &&
                                !item.pdf_final_path && (
                                  <span className="text-xs text-gray-400">
                                    Tidak ada PDF
                                  </span>
                                )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent
          className="sm:max-w-3xl p-4"
          aria-describedby={undefined}
        >
          <DialogHeader>
            <DialogTitle>
              {approvalAction === "approve"
                ? "Setujui Permohonan"
                : "Tolak Permohonan"}
            </DialogTitle>
          </DialogHeader>

          {selectedCuti && (
            <div className="space-y-4">
              <div className="rounded-md space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Karyawan
                    </p>
                    <p className="text-sm">{selectedCuti.user_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Jenis Izin
                    </p>
                    <p className="text-sm">
                      {formatJenisIzin(selectedCuti.jenis_izin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Tanggal</p>
                    <p className="text-sm">
                      {selectedCuti.jenis_izin === "cuti"
                        ? `${formatDate(
                            selectedCuti.tanggal_cuti_mulai
                          )} - ${formatDate(selectedCuti.tanggal_cuti_selesai)}`
                        : formatDate(selectedCuti.tanggal_izin)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Durasi</p>
                    <p className="text-sm">
                      {selectedCuti.jenis_izin === "cuti"
                        ? `${selectedCuti.jumlah_hari_cuti} hari`
                        : "1 hari"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Alasan
                  </p>
                  <p className="text-sm">{selectedCuti.alasan}</p>
                </div>
              </div>

              {selectedCuti.bukti_file_path && (
                <div className="mt-4 p-3 border rounded-lg">
                  <p className="text-sm font-medium mb-2">
                    Bukti Pendukung
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      window.open(selectedCuti.bukti_file_path!, "_blank")
                    }
                    className="w-full"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Lihat Bukti Upload
                  </Button>
                </div>
              )}

              <div>
                <Label htmlFor="notes">
                  {approvalAction === "approve"
                    ? "Catatan untuk Karyawan (Opsional)"
                    : "Alasan Penolakan *"}
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={
                    approvalAction === "approve"
                      ? "Tambahkan catatan jika diperlukan..."
                      : "Masukkan alasan penolakan yang jelas..."
                  }
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Pesan ini akan ditampilkan ke karyawan
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={submitting}
              className="cursor-pointer"
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={submitting}
              className="cursor-pointer"
              variant={approvalAction === "approve" ? "default" : "destructive"}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : approvalAction === "approve" ? (
                "Setujui"
              ) : (
                "Tolak"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApprovalSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        action={approvalResult?.action || "approve"}
        data={approvalResult?.data}
        pdfPath={approvalResult?.pdfPath}
        onViewPDF={handleViewPDFFromDialog}
      />
    </div>
  );
}

export default DaftarPermohonanCutiPage;
