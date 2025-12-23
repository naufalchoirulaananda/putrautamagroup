import { NextResponse } from "next/server";
import pool from "@/lib/db_gmart_post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
  "SPV PENGUNJUNG GMART",
  "SPV LOGISTIK GMART",
  "SPV KEUANGAN GMART",
  "HRD GMART",
  "PERSONALIA",
];

// Rate limiter
const scanLimiter = new Map<string, number>();

function cleanupScanLimiter() {
  const now = Date.now();
  const cutoff = now - 10000;

  for (const [key, timestamp] of scanLimiter.entries()) {
    if (timestamp < cutoff) {
      scanLimiter.delete(key);
    }
  }
}

export async function POST(req: Request) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const data = await req.json();
    const {
      kodeitem,
      namaitem,
      qty,
      stockreal,
      selisih,
      lokasi,
      harga,
      kodecabang,
      lokasirak,
      tanggal, // Tambahkan parameter tanggal dari client
    } = data;

    // Rate limiting check
    const userId = session.user.id;
    const limiterKey = `${userId}-${kodeitem}`;
    const now = Date.now();
    const lastScan = scanLimiter.get(limiterKey) || 0;

    if (now - lastScan < 2000) {
      return NextResponse.json(
        {
          success: false,
          error: "Mohon tunggu 2 detik sebelum scan item yang sama",
        },
        { status: 429 }
      );
    }

    scanLimiter.set(limiterKey, now);

    if (scanLimiter.size > 1000) {
      cleanupScanLimiter();
    }

    // Validasi input
    if (!kodeitem || stockreal === undefined) {
      return NextResponse.json(
        { success: false, error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    const userRole = session.user.role;
    const isAdmin = ADMIN_ROLES.includes(userRole || "");

    let finalCabangId;

    if (isAdmin && kodecabang) {
      finalCabangId = kodecabang;
    } else {
      finalCabangId = session.user.cabang_id;

      if (!finalCabangId) {
        return NextResponse.json(
          { success: false, error: "Cabang tidak ditemukan" },
          { status: 400 }
        );
      }
    }

    // Ambil data petugas
    const petugasId = session.user.id;
    const petugasNama = session.user.name || "";
    const petugasKode = session.user.kode_pegawai || "";

    // Mulai transaction
    await connection.beginTransaction();

    // Cek apakah data audit sudah ada dengan ROW LOCK
    const [existingAudit] = await connection.query(
      `SELECT KodeItem, Qty FROM audit_stock 
       WHERE KodeItem = ? AND KodeCabang = ?
       FOR UPDATE`,
      [kodeitem, finalCabangId]
    );

    if ((existingAudit as any[]).length > 0) {
      // UPDATE: Stock Real, Selisih, LokasiRak, Tanggal, dan Petugas
      const qtyLama = (existingAudit as any[])[0].Qty;
      const selisihBaru = stockreal - qtyLama;

      await connection.query(
        `UPDATE audit_stock
         SET 
           stockReal = ?,
           selisih = ?,
           LokasiRak = ?,
           petugas_id = ?,
           petugas_nama = ?,
           petugas_kode = ?,
           tanggal = ?
         WHERE KodeItem = ? AND KodeCabang = ?`,
        [
          stockreal,
          selisihBaru,
          (lokasirak || "").toUpperCase(),
          petugasId,
          petugasNama,
          petugasKode,
          tanggal || new Date(), // Gunakan tanggal dari client atau fallback ke NOW()
          kodeitem,
          finalCabangId,
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Data audit berhasil diupdate",
        isUpdate: true,
        qtyTetap: qtyLama,
      });
    } else {
      // INSERT data baru
      const selisihBaru = stockreal - qty;

      await connection.query(
        `INSERT INTO audit_stock
           (KodeItem, NamaItem, Qty, stockReal, selisih, KodeCabang, NamaLokasi, HargaJual, LokasiRak, petugas_id, petugas_nama, petugas_kode, tanggal)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          kodeitem,
          namaitem,
          qty,
          stockreal,
          selisihBaru,
          finalCabangId,
          lokasi,
          harga || 0,
          (lokasirak || "").toUpperCase(),
          petugasId,
          petugasNama,
          petugasKode,
          tanggal || new Date(), // Gunakan tanggal dari client atau fallback ke NOW()
        ]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Data audit berhasil disimpan",
        isUpdate: false,
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error saving to server:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}