// File: components/portal-karyawan/SuccessSubmitDialog.tsx
"use client";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, FileText, X } from "lucide-react";

interface SuccessSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: {
    id: number;
    status: string;
    pdf_path: string;
    jumlah_hari?: number;
    bukti_file_path?: string;
  } | null;
  onViewRiwayat: () => void;
}

export default function SuccessSubmitDialog({
  open,
  onOpenChange,
  data,
  onViewRiwayat,
}: SuccessSubmitDialogProps) {
  const handleViewPDF = () => {
    if (data?.pdf_path) {
      window.open(data.pdf_path, "_blank");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Permohonan Berhasil!</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              Permohonan Anda Telah Diterima
            </p>
            <DialogDescription className="text-center">
              Data permohonan izin/cuti Anda telah tersimpan dan menunggu
              persetujuan dari atasan.
            </DialogDescription>
          </div>

          {/* Info Box */}
          {data && (
            <div className="border rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <span className="font-semibold text-amber-600">
                  Menunggu Persetujuan
                </span>
              </div>
              {data.jumlah_hari && data.jumlah_hari > 1 && (
                <div className="flex justify-between text-sm">
                  <span>Durasi:</span>
                  <span className="font-semibold">{data.jumlah_hari} hari</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="sm:flex-col sm:space-y-2 gap-2">
          {data?.pdf_path && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewPDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              Lihat PDF Pengajuan
            </Button>
          )}
          {data?.bukti_file_path && (
            <Button
              variant="outline"
              onClick={() => window.open(data.bukti_file_path, "_blank")}
              className="w-full"
            >
              <FileText className="h-4 w-4 mr-2" />
              Lihat Bukti Upload
            </Button>
          )}
          <Button className="w-full" onClick={onViewRiwayat}>
            Lihat Riwayat Pengajuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
