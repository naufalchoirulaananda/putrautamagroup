// File: components/portal-karyawan/PDFButtonGroup.tsx
// Komponen reusable untuk menampilkan semua PDF dengan konsisten

import React from "react";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

interface PDFButtonGroupProps {
  pdfPengajuanPath?: string | null;
  pdfLevel1Path?: string | null;
  pdfFinalPath?: string | null;
  layout?: "horizontal" | "vertical" | "compact";
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
}

export function PDFButtonGroup({
  pdfPengajuanPath,
  pdfLevel1Path,
  pdfFinalPath,
  layout = "horizontal",
  size = "sm",
  showLabels = true,
}: PDFButtonGroupProps) {
  const handleViewPDF = (pdfPath: string) => {
    window.open(pdfPath, "_blank");
  };

  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default";

  // Jika tidak ada PDF sama sekali
  if (!pdfPengajuanPath && !pdfLevel1Path && !pdfFinalPath) {
    return (
      <div className="text-center text-xs text-gray-400 py-2">
        Tidak ada PDF
      </div>
    );
  }

  // Layout Compact (untuk tabel dengan space terbatas)
  if (layout === "compact") {
    return (
      <div className="flex items-center justify-center gap-1">
        {pdfPengajuanPath && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewPDF(pdfPengajuanPath)}
            className="h-8 px-2"
            title="PDF Pengajuan Awal"
          >
            <FileText className="h-3 w-3" />
            {showLabels && <span className="ml-1 text-xs">Pengajuan</span>}
          </Button>
        )}

        {pdfLevel1Path && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewPDF(pdfLevel1Path)}
            className="h-8 px-2 bg-blue-50 text-blue-700 hover:bg-blue-100"
            title="PDF dengan Persetujuan Manager"
          >
            <FileText className="h-3 w-3" />
            {showLabels && <span className="ml-1 text-xs">Persetujuan Atasan</span>}
          </Button>
        )}

        {pdfFinalPath && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleViewPDF(pdfFinalPath)}
            className="h-8 px-2 bg-green-50 text-green-700 hover:bg-green-100 font-semibold"
            title="PDF Final - Sah untuk digunakan"
          >
            <FileText className="h-3 w-3" />
            {showLabels && <span className="ml-1 text-xs">Persetujuan Final (HRD)</span>}
          </Button>
        )}
      </div>
    );
  }

  // Layout Vertical
  if (layout === "vertical") {
    return (
      <div className="flex flex-col gap-2 w-full">
        {pdfPengajuanPath && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => handleViewPDF(pdfPengajuanPath)}
            className="w-full justify-start"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showLabels ? "PDF Pengajuan" : "PDF Pengajuan"}
          </Button>
        )}

        {pdfLevel1Path && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => handleViewPDF(pdfLevel1Path)}
            className="w-full justify-start bg-blue-50 border-blue-200  hover:bg-blue-100"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showLabels ? "Persetujuan Atasan" : "Atasan"}
          </Button>
        )}

        {pdfFinalPath && (
          <Button
            size={buttonSize}
            variant="outline"
            onClick={() => handleViewPDF(pdfFinalPath)}
            className="w-full justify-start bg-green-50 border-green-200 hover:bg-green-100 font-semibold"
          >
            <FileText className="h-4 w-4 mr-2" />
            {showLabels ? "PDF Final HRD" : "PDF Final HRD"}
          </Button>
        )}
      </div>
    );
  }

  // Layout Horizontal (default)
  return (
    <div className="flex items-center gap-2 flex-wrap justify-center">
      {pdfPengajuanPath && (
        <Button
          size={buttonSize}
          variant="outline"
          onClick={() => handleViewPDF(pdfPengajuanPath)}
        >
          <FileText className="h-4 w-4 mr-2" />
          {showLabels && "Pengajuan"}
        </Button>
      )}

      {pdfLevel1Path && (
        <Button
          size={buttonSize}
          variant="outline"
          onClick={() => handleViewPDF(pdfLevel1Path)}
          className="bg-blue-50 border-blue-200 hover:bg-blue-100"
        >
          <FileText className="h-4 w-4 mr-2" />
          {showLabels && "Manager"}
        </Button>
      )}

      {pdfFinalPath && (
        <Button
          size={buttonSize}
          variant="outline"
          onClick={() => handleViewPDF(pdfFinalPath)}
          className="bg-green-50 border-green-200 hover:bg-green-100 font-semibold"
        >
          <FileText className="h-4 w-4 mr-2" />
          {showLabels && "Final"}
        </Button>
      )}
    </div>
  );
}

// Komponen untuk info status PDF
export function PDFStatusInfo({
  pdfPengajuanPath,
  pdfLevel1Path,
  pdfFinalPath,
  status,
}: {
  pdfPengajuanPath?: string | null;
  pdfLevel1Path?: string | null;
  pdfFinalPath?: string | null;
  status: string;
}) {
  if (pdfFinalPath) {
    return (
      <div className="text-xs text-green-600 font-medium mt-1">
        PDF Final Tersedia (Dokumen Sah)
      </div>
    );
  }

  return null;
}
