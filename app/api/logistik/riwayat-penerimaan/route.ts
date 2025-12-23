// app/api/logistik/riwayat-penerimaan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface LogistikData {
  id_penerimaan: number;
  namaItem: string;
  tanggalPembelian: string;
  lokasi: string;
  periode: string;
  qty: string;
  keterangan: string;
  foto_1: string;
  foto_2: string;
  foto_3: string;
  foto_4: string;
  foto_5: string;
  foto_6: string;
  foto_7: string;
  foto_8: string;
  foto_9: string;
  foto_10: string;
  created_at: string;
  updated_at: string;
}

interface CountResult {
  total: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const search = searchParams.get("search") || "";
    const lokasi = searchParams.get("lokasi") || "";
    const namaItem = searchParams.get("namaItem") || "";
    const tanggal = searchParams.get("tanggal") || "";

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      whereClause += " AND (namaItem LIKE ? OR keterangan LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (lokasi) {
      whereClause += " AND lokasi = ?";
      params.push(lokasi);
    }

    if (namaItem) {
      whereClause += " AND namaItem = ?";
      params.push(namaItem);
    }

    if (tanggal) {
      const selectedDate = new Date(tanggal);
      // Format: YYYY-MM-DD untuk memastikan tidak ada masalah timezone
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      
      const startOfDay = `${year}-${month}-${day} 00:00:00`;
      const endOfDay = `${year}-${month}-${day} 23:59:59`;
      
      whereClause += " AND tanggalPembelian BETWEEN ? AND ?";
      params.push(startOfDay, endOfDay);
    }

    const countResult = await query<CountResult>(
      `SELECT COUNT(*) as total FROM logistik ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const sql = `
      SELECT 
        id_penerimaan,
        namaItem,
        tanggalPembelian,
        lokasi,
        periode,
        qty,
        keterangan,
        foto_1, foto_2, foto_3, foto_4, foto_5,
        foto_6, foto_7, foto_8, foto_9, foto_10,
        created_at,
        updated_at
      FROM logistik 
      ${whereClause}
      ORDER BY id_penerimaan DESC
      LIMIT ? OFFSET ?
    `;

    const results = await query<LogistikData>(sql, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data riwayat penerimaan", details: error },
      { status: 500 }
    );
  }
}