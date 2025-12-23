// File: components/portal-karyawan/TableCuti.tsx
// Updated: Menggunakan PDFButtonGroup untuk konsistensi

"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge-cuti-izin";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileIcon, ImageIcon, List, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PDFButtonGroup, PDFStatusInfo } from "./PDFButtonGroup";

interface CutiIzin {
  id: number;
  jenis_izin: string;
  jenis_izin_nama: string;
  tanggal_izin: string | null;
  tanggal_cuti_mulai: string | null;
  tanggal_cuti_selesai: string | null;
  status: string;
  alasan: string;
  bukti_file_path: string | null;
  rejection_reason: string | null;
  pdf_pengajuan_path: string | null;
  pdf_level1_path: string | null;
  pdf_final_path: string | null;
  created_at: string;
  jumlah_hari_cuti: number;
  progress_percentage: number;
  user_name: string;
  role_name: string;
  divisi_name: string;
  current_approver_name: string | null;
}

function TableCuti() {
  const { data: session } = useSession();
  const [data, setData] = useState<CutiIzin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuti, setSelectedCuti] = useState<CutiIzin | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [approvalMessages, setApprovalMessages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageDialog, setShowImageDialog] = useState(false);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/cuti-izin?user_id=${session?.user?.id}`
      );
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error("Error fetching cuti data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
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

  const handleViewDetail = async (cuti: CutiIzin) => {
    setSelectedCuti(cuti);
    setShowDetail(true);

    try {
      const response = await fetch(`/api/cuti-izin/${cuti.id}/approvals`);
      const result = await response.json();
      if (result.success) {
        setApprovalMessages(result.data);
      }
    } catch (error) {
      console.error("Error fetching approval messages:", error);
    }
  };

  const handleViewBukti = (buktiPath: string) => {
    const fileExtension = buktiPath.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'pdf') {
      // Open PDF in new tab
      window.open(buktiPath, "_blank");
    } else {
      // Show image in dialog
      setSelectedImage(buktiPath);
      setShowImageDialog(true);
    }
  };

  const getBuktiIcon = (buktiPath: string | null) => {
    if (!buktiPath) return null;
    
    const fileExtension = buktiPath.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'pdf') {
      return <FileIcon className="h-4 w-4" />;
    } else if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension || '')) {
      return <ImageIcon className="h-4 w-4" />;
    }
    
    return <FileIcon className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Belum ada riwayat pengajuan cuti/izin</p>
      </div>
    );
  }

  return (
    <>
      <div className="sm:p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal Cuti/Izin</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bukti</TableHead>
              <TableHead className="text-center">Dokumen PDF</TableHead>
              <TableHead className="text-center">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => (
              <TableRow key={item.id}>
                <TableCell className="py-6">{index + 1}</TableCell>
                <TableCell>
                  <div className="font-medium">
                    {item.jenis_izin_nama || item.jenis_izin}
                  </div>
                </TableCell>
                <TableCell>
                  {item.jenis_izin === "cuti"
                    ? `${formatDate(item.tanggal_cuti_mulai)} - ${formatDate(
                        item.tanggal_cuti_selesai
                      )}`
                    : formatDate(item.tanggal_izin)}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {getStatusBadge(item.status)}
                    <PDFStatusInfo
                      pdfPengajuanPath={item.pdf_pengajuan_path}
                      pdfLevel1Path={item.pdf_level1_path}
                      pdfFinalPath={item.pdf_final_path}
                      status={item.status}
                    />
                  </div>
                </TableCell>
                <TableCell>
                  {item.bukti_file_path ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewBukti(item.bukti_file_path!)}
                      className="gap-2 text-xs"
                    >
                      {getBuktiIcon(item.bukti_file_path)}
                      Lihat Bukti
                    </Button>
                  ) : (
                    <span className="text-xs text-gray-400">Tidak ada bukti</span>
                  )}
                </TableCell>
                <TableCell>
                  <PDFButtonGroup
                    pdfPengajuanPath={item.pdf_pengajuan_path}
                    pdfLevel1Path={item.pdf_level1_path}
                    pdfFinalPath={item.pdf_final_path}
                    layout="compact"
                    showLabels={true}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetail(item)}
                    className="text-xs"
                  >
                    <List className="h-4 w-4 mr-1" />
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Detail */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Detail Permohonan</DialogTitle>
          </DialogHeader>
          {selectedCuti && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Jenis Izin</p>
                  <p className="text-sm font-medium">
                    {selectedCuti.jenis_izin_nama || selectedCuti.jenis_izin}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  {getStatusBadge(selectedCuti.status)}
                </div>
                <div>
                  <p className="text-sm font-medium">Tanggal</p>
                  <p className="text-sm">
                    {selectedCuti.jenis_izin === "cuti"
                      ? `${formatDate(
                          selectedCuti.tanggal_cuti_mulai
                        )} - ${formatDate(selectedCuti.tanggal_cuti_selesai)}`
                      : formatDate(selectedCuti.tanggal_izin)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Tanggal Pengajuan</p>
                  <p className="text-sm">
                    {formatDate(selectedCuti.created_at)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Alasan</p>
                <p className="text-sm border text-justify p-3 rounded-md ">
                  {selectedCuti.alasan}
                </p>
              </div>

              {selectedCuti.rejection_reason && (
                <div>
                  <p className="text-sm font-medium text-red-600 mb-2">
                    Alasan Penolakan
                  </p>
                  <p className="text-sm bg-red-10 p-3 rounded-md text-red-700">
                    {selectedCuti.rejection_reason}
                  </p>
                </div>
              )}

              {/* Approval Messages */}
              {approvalMessages.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">
                    Riwayat Persetujuan
                  </p>
                  <div className="space-y-2">
                    {approvalMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-md border ${
                          msg.status === "approved"
                            ? "bg-green-10 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="space-y-1">
                            <p className="text-xs font-medium">
                              {msg.approver_name} - {msg.approver_role}
                            </p>
                            <p className="text-xs">
                              {new Date(msg.approved_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </p>
                          </div>
                          <Badge
                            variant={
                              msg.status === "approved"
                                ? "success"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {msg.status === "approved"
                              ? "Disetujui"
                              : "Ditolak"}
                          </Badge>
                        </div>
                        {msg.notes && (
                          <p className="text-sm mt-2">
                            "{msg.notes}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Downloads - Vertical Layout */}
              <div>
                <p className="text-sm font-medium mb-2">Dokumen PDF</p>
                <PDFButtonGroup
                  pdfPengajuanPath={selectedCuti.pdf_pengajuan_path}
                  pdfLevel1Path={selectedCuti.pdf_level1_path}
                  pdfFinalPath={selectedCuti.pdf_final_path}
                  layout="vertical"
                  size="md"
                  showLabels={true}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Bukti Cuti/Izin</DialogTitle>
          </DialogHeader>
          <div className="relative">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Bukti cuti/izin"
                className="w-full h-auto rounded-lg"
              />
            )}
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => selectedImage && window.open(selectedImage, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Buka di Tab Baru
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TableCuti;