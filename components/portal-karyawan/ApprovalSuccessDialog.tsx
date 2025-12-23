// File: components/portal-karyawan/ApprovalSuccessDialog.tsx
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
import { CheckCircle, XCircle, FileText, X } from "lucide-react";

interface ApprovalSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: "approve" | "reject";
  data?: {
    id: number;
    user_name: string;
    jenis_izin: string;
    status?: string;
  } | null;
  pdfPath?: string | null;
  onViewPDF?: () => void;
}

export default function ApprovalSuccessDialog({
  open,
  onOpenChange,
  action,
  data,
  pdfPath,
  onViewPDF,
}: ApprovalSuccessDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  const isApproved = action === "approve";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">
              {isApproved ? "Permohonan Disetujui" : "Permohonan Ditolak"}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={`p-4 rounded-full ${
                isApproved ? "bg-green-100" : "bg-red-100"
              }`}
            >
              {isApproved ? (
                <CheckCircle className="h-12 w-12 text-green-600" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
          </div>

          {/* Message */}
          <div className="text-center space-y-2">
            <p className="text-lg font-semibold">
              {isApproved
                ? "Permohonan Berhasil Disetujui"
                : "Permohonan Telah Ditolak"}
            </p>
            <DialogDescription className="text-center">
              {isApproved
                ? "Persetujuan Anda telah tersimpan dan akan dilanjutkan ke tahap berikutnya."
                : "Penolakan Anda telah tersimpan dan karyawan akan menerima notifikasi."}
            </DialogDescription>
          </div>

          {/* Info Box */}
          {data && (
            <div
              className={`border rounded-lg p-4 space-y-2 ${
                isApproved
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >

              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Karyawan:</span>
                <span className="font-semibold text-gray-900">{data.user_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-900">Jenis:</span>
                <span className="font-semibold capitalize text-gray-900">
                  {data.jenis_izin}
                </span>
              </div>
              {data.status && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-900">Status:</span>
                  <span
                    className={`font-semibold ${
                      isApproved ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {isApproved ? "Disetujui" : "Ditolak"}
                  </span>
                </div>
              )}
            </div>
          )}


        </div>

        <DialogFooter className="sm:flex-col sm:space-y-2 gap-2">
          {pdfPath && onViewPDF && isApproved && (
            <Button variant="outline" className="w-full" onClick={onViewPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Lihat PDF Persetujuan
            </Button>
          )}
          <Button className="w-full" onClick={handleClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}