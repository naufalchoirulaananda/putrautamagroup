// File: lib/pdf-generator.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { formatDateIndonesia } from "./date-utils";

interface CutiData {
  id: number;
  nama_lengkap: string;
  role_name: string;
  nama_divisi: string;
  jenis_izin: string;
  tanggal_izin: string | null;
  tanggal_cuti_mulai: string | null;
  tanggal_cuti_selesai: string | null;
  tanggal_pengajuan: string;
  alasan: string;
  pic_pengganti: string | null;
  pic_phone: string | null;
  nomor_telepon_karyawan: string;
  bukti_file_path: string | null;
}

// Use utility function for consistent date formatting
function formatDate(dateString: string | null): string {
  return formatDateIndonesia(dateString);
}

function formatJenisIzin(jenis: string): string {
  const mapping: { [key: string]: string } = {
    cuti: "Cuti",
    sakit: "Sakit",
    izin: "Izin",
    datang_terlambat: "Izin Datang Terlambat",
    meninggalkan_pekerjaan: "Izin Meninggalkan Pekerjaan",
  };
  return mapping[jenis] || jenis;
}

/**
 * Add company letterhead to PDF
 * Jika Anda punya logo, ganti logoPath dengan path logo Anda
 */
function addLetterhead(doc: jsPDF) {
  const pageWidth = doc.internal.pageSize.width;
  
  // Logo Path - Ganti dengan path logo Anda
  const logoPath = '/logo-company.png'; // Simpan logo di public/logo-company.png
  const hasLogo = false; // Set true jika sudah ada logo
  
  // Logo (jika ada)
  if (hasLogo) {
    try {
      doc.addImage(logoPath, 'PNG', 14, 10, 25, 25);
    } catch (error) {
      console.log('Logo not found, using text only');
    }
  }
  
  // Company Info
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("PT PUTRA UTAMA GROUP", pageWidth / 2, 15, { align: "center" });
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Jl. Contoh Alamat No. 123, Jakarta Selatan", pageWidth / 2, 21, { align: "center" });
  doc.text("Telp: (021) 1234-5678 | Email: info@putrautamagroup.com", pageWidth / 2, 26, { align: "center" });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(14, 32, pageWidth - 14, 32);
  
  doc.setLineWidth(0.2);
  doc.line(14, 33, pageWidth - 14, 33);
}

export async function generatePDFPengajuan(data: CutiData): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add Letterhead
  addLetterhead(doc);

  // Title (tanpa nomor pengajuan)
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULIR PERMOHONAN IZIN & CUTI", pageWidth / 2, yPos, { align: "center" });

  // Info Karyawan
  yPos = 58;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI KARYAWAN", 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoKaryawan = [
    ["Nama Lengkap", data.nama_lengkap],
    ["Posisi/Jabatan", data.role_name],
    ["Divisi", data.nama_divisi],
    ["No. Telepon", data.nomor_telepon_karyawan],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoKaryawan,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 140 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Info Izin
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL PERMOHONAN", 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const detailPermohonan: any[] = [
    ["Jenis Izin", formatJenisIzin(data.jenis_izin)],
    ["Tanggal Pengajuan", formatDate(data.tanggal_pengajuan)],
  ];

  if (data.jenis_izin === "cuti") {
    detailPermohonan.push(
      ["Tanggal Cuti Mulai", formatDate(data.tanggal_cuti_mulai)],
      ["Tanggal Cuti Selesai", formatDate(data.tanggal_cuti_selesai)]
    );
    if (data.pic_pengganti) {
      detailPermohonan.push(
        ["PIC Pengganti", data.pic_pengganti],
        ["No. Telp PIC", data.pic_phone || "-"]
      );
    }
  } else {
    detailPermohonan.push(["Tanggal Izin", formatDate(data.tanggal_izin)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: detailPermohonan,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 140 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Alasan
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ALASAN", 14, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const splitAlasan = doc.splitTextToSize(data.alasan, 180);
  doc.text(splitAlasan, 14, yPos);

  yPos += splitAlasan.length * 5 + 10;

  // Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.text("Status: Menunggu Persetujuan", 14, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Dokumen ini dibuat secara otomatis pada ${new Date().toLocaleString("id-ID")}`,
    pageWidth / 2,
    280,
    { align: "center" }
  );

  // Save PDF
  const pdfBytes = doc.output("arraybuffer");
  const buffer = Buffer.from(pdfBytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "pdf-cuti");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const fileName = `pengajuan_${data.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/pdf-cuti/${fileName}`;
}

export async function generatePDFWithQR(
  data: CutiData,
  approvals: Array<{
    approver_name: string;
    approver_role: string;
    signature_code: string;
    approval_level: number;
    approved_at: string;
  }>,
  level: "level1" | "final"
): Promise<string> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;

  // Add Letterhead
  addLetterhead(doc);

  // Title (tanpa nomor pengajuan)
  let yPos = 45;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULIR PERMOHONAN IZIN & CUTI", pageWidth / 2, yPos, { align: "center" });

  // Info Karyawan
  yPos = 58;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMASI KARYAWAN", 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const infoKaryawan = [
    ["Nama Lengkap", data.nama_lengkap],
    ["Posisi/Jabatan", data.role_name],
    ["Divisi", data.nama_divisi],
    ["No. Telepon", data.nomor_telepon_karyawan],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: infoKaryawan,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 140 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Info Izin
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("DETAIL PERMOHONAN", 14, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const detailPermohonan: any[] = [
    ["Jenis Izin", formatJenisIzin(data.jenis_izin)],
    ["Tanggal Pengajuan", formatDate(data.tanggal_pengajuan)],
  ];

  if (data.jenis_izin === "cuti") {
    detailPermohonan.push(
      ["Tanggal Cuti Mulai", formatDate(data.tanggal_cuti_mulai)],
      ["Tanggal Cuti Selesai", formatDate(data.tanggal_cuti_selesai)]
    );
    if (data.pic_pengganti) {
      detailPermohonan.push(
        ["PIC Pengganti", data.pic_pengganti],
        ["No. Telp PIC", data.pic_phone || "-"]
      );
    }
  } else {
    detailPermohonan.push(["Tanggal Izin", formatDate(data.tanggal_izin)]);
  }

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: detailPermohonan,
    theme: "plain",
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 40, fontStyle: "bold" },
      1: { cellWidth: 140 },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;

  // Alasan
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("ALASAN", 14, yPos);

  yPos += 6;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const splitAlasan = doc.splitTextToSize(data.alasan, 180);
  doc.text(splitAlasan, 14, yPos);

  yPos += splitAlasan.length * 5 + 15;

  // ========== QR CODE SECTION - CENTERED ==========
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PERSETUJUAN", 14, yPos);

  yPos += 10;

  // QR Settings
  const qrSize = 40; // Ukuran QR
  const spacing = 60; // Jarak horizontal antar QR
  const totalWidth = (approvals.length * qrSize) + ((approvals.length - 1) * (spacing - qrSize));
  const startX = (pageWidth - totalWidth) / 2; // Center horizontal
  
  for (let i = 0; i < approvals.length; i++) {
    const approval = approvals[i];
    
    // Extract base64 from data URL
    let base64Image = approval.signature_code;
    if (base64Image.includes('base64,')) {
      base64Image = base64Image.split('base64,')[1];
    }
    
    // Calculate position (centered)
    const xPos = startX + (i * spacing);
    
    try {
      // Add QR Code
      doc.addImage(
        `data:image/png;base64,${base64Image}`, 
        "PNG", 
        xPos, 
        yPos, 
        qrSize, 
        qrSize,
        undefined,
        'FAST'
      );

      // Add border around QR
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(xPos, yPos, qrSize, qrSize);

      // Add label below QR (centered)
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text(approval.approver_name, xPos + (qrSize/2), yPos + qrSize + 5, { align: 'center', maxWidth: qrSize + 10 });
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(approval.approver_role, xPos + (qrSize/2), yPos + qrSize + 9, { align: 'center', maxWidth: qrSize + 10 });
      
      // Add approval date
      const approvalDate = new Date(approval.approved_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
      doc.text(approvalDate, xPos + (qrSize/2), yPos + qrSize + 13, { align: 'center' });
      
    } catch (error) {
      console.error('Error adding QR to PDF:', error);
      doc.setFontSize(9);
      doc.setTextColor(255, 0, 0);
      doc.text('QR Error', xPos, yPos + 15);
    }
  }

  yPos += qrSize + 20;

  // Status
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 128, 0);
  const statusText = level === "final" 
    ? "✓ Status: DISETUJUI" 
    : `✓ Status: Disetujui Atasan (Menunggu HRD)`;
  doc.text(statusText, 14, yPos);

  // Footer
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(128, 128, 128);
  doc.text(
    `Dokumen ini dibuat secara otomatis pada ${new Date().toLocaleString("id-ID")}`,
    pageWidth / 2,
    280,
    { align: "center" }
  );

  // Save PDF
  const pdfBytes = doc.output("arraybuffer");
  const buffer = Buffer.from(pdfBytes);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "pdf-cuti");
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }

  const fileName = `${level}_${data.id}_${Date.now()}.pdf`;
  const filePath = path.join(uploadDir, fileName);

  await writeFile(filePath, buffer);

  return `/uploads/pdf-cuti/${fileName}`;
}