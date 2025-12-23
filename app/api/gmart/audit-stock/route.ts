import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db_gmart_post";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Role yang bisa melihat semua cabang
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

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userRole = session.user.role;
    const isAdmin = ADMIN_ROLES.includes(userRole || "");
    const cabangId = session.user.cabang_id;

    // Get query parameters dari URL
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const searchQuery = searchParams.get("search") || "";
    const cabangFilter = searchParams.get("cabang") || "";
    const lokasiRakFilter = searchParams.get("lokasiRak") || "";
    const tanggalFilter = searchParams.get("tanggal") || "";

    const offset = (page - 1) * limit;

    // Build WHERE conditions dynamically
    let whereConditions: string[] = [];
    let params: any[] = [];

    // Filter cabang
    if (!isAdmin) {
      // User biasa hanya lihat cabangnya
      if (!cabangId) {
        return NextResponse.json(
          { error: "Cabang tidak ditemukan" },
          { status: 403 }
        );
      }
      whereConditions.push("KodeCabang = ?");
      params.push(cabangId);
    } else if (cabangFilter && cabangFilter !== "all") {
      // Admin filter berdasarkan cabang tertentu
      whereConditions.push("KodeCabang = ?");
      params.push(cabangFilter);
    }

    // Filter lokasi rak
    if (lokasiRakFilter && lokasiRakFilter !== "all") {
      whereConditions.push("LokasiRak = ?");
      params.push(lokasiRakFilter);
    }

    // Filter tanggal
    if (tanggalFilter) {
      whereConditions.push("DATE(tanggal) = ?");
      params.push(tanggalFilter);
    }

    // Filter search (KodeItem atau NamaItem)
    if (searchQuery) {
      whereConditions.push("(KodeItem LIKE ? OR NamaItem LIKE ?)");
      params.push(`%${searchQuery}%`, `%${searchQuery}%`);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Get total count untuk pagination
    const countQuery = `SELECT COUNT(*) as total FROM audit_stock ${whereClause}`;
    const [countResult] = await query<{ total: number }>(countQuery, params);
    const total = countResult.total;

    // Get paginated data
    const dataQuery = `
      SELECT 
        KodeItem,
        NamaItem,
        Qty,
        stockReal,
        KodeCabang,
        CASE 
          WHEN KodeCabang = '01' THEN 'Cabang Nguter'
          WHEN KodeCabang = '02' THEN 'Cabang Combongan'
          WHEN KodeCabang = '03' THEN 'Cabang Klaten'
          WHEN KodeCabang = '04' THEN 'Cabang Plumbon'
          WHEN KodeCabang = '05' THEN 'Cabang Wirun'
          WHEN KodeCabang = '06' THEN 'Cabang Karanganyar'
          WHEN KodeCabang = '07' THEN 'Cabang Sragen'
          WHEN KodeCabang = '08' THEN 'Cabang Jatisumo'
          WHEN KodeCabang = '09' THEN 'Cabang Ponorogo'
          WHEN KodeCabang = '10' THEN 'Cabang Gubug'
          WHEN KodeCabang = '11' THEN 'Cabang Weleri'
          ELSE 'Cabang Lainnya'
        END AS NamaCabang,
        selisih,
        NamaLokasi,
        HargaJual,
        tanggal,
        LokasiRak,
        petugas_id,
        petugas_nama,
        petugas_kode
      FROM audit_stock
      ${whereClause}
      ORDER BY tanggal DESC
      LIMIT ? OFFSET ?
    `;

    const result = await query(dataQuery, [...params, limit, offset]);

    return NextResponse.json({
      data: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      isAdmin, // Tambahkan info role untuk frontend
    });
  } catch (error) {
    console.error("Error fetching audit stock:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}