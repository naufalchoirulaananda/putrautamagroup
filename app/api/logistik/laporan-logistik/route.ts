// app/api/logistik/laporan-logistik/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface StokLogistik {
  id: number;
  nama_item: string;
  lokasi: string;
  qty_total: string;
  tanggal_terakhir: string;
  periode_terakhir: string;
  keterangan_terakhir: string;
  foto_terakhir_1: string;
  foto_terakhir_2: string;
  foto_terakhir_3: string;
  foto_terakhir_4: string;
  foto_terakhir_5: string;
  foto_terakhir_6: string;
  foto_terakhir_7: string;
  foto_terakhir_8: string;
  foto_terakhir_9: string;
  foto_terakhir_10: string;
  created_at: string;
  updated_at: string;
}

interface CountResult {
  total: number;
}

interface PhotoHistory {
  tanggalPembelian: string;
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
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "5");
    const search = searchParams.get("search") || "";
    const lokasi = searchParams.get("lokasi") || "";
    const tanggal = searchParams.get("tanggal") || "";
    const id = searchParams.get("id") || "";

    // Jika ada parameter id, ambil detail history foto
    if (id) {
      const stokData = await query<StokLogistik>(
        `SELECT * FROM stok_logistik WHERE id = ?`,
        [id]
      );

      if (stokData.length === 0) {
        return NextResponse.json(
          { error: "Data tidak ditemukan" },
          { status: 404 }
        );
      }

      const item = stokData[0];

      // Ambil history foto dari tabel logistik (penerimaan)
      const photoHistory = await query<PhotoHistory>(
        `SELECT 
          tanggalPembelian,
          foto_1, foto_2, foto_3, foto_4, foto_5,
          foto_6, foto_7, foto_8, foto_9, foto_10
         FROM logistik 
         WHERE namaItem = ? AND lokasi = ?
         ORDER BY tanggalPembelian DESC`,
        [item.nama_item, item.lokasi]
      );

      return NextResponse.json({
        success: true,
        data: item,
        photoHistory: photoHistory,
      });
    }

    const offset = (page - 1) * limit;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];

    if (search) {
      whereClause += " AND (nama_item LIKE ? OR keterangan_terakhir LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    if (lokasi) {
      whereClause += " AND lokasi = ?";
      params.push(lokasi);
    }

    if (tanggal) {
      const dateOnly = new Date(tanggal).toISOString().slice(0, 10);
      whereClause += " AND DATE(tanggal_terakhir) = ?";
      params.push(dateOnly);
    }

    const countResult = await query<CountResult>(
      `SELECT COUNT(*) as total FROM stok_logistik ${whereClause}`,
      params
    );
    const total = countResult[0]?.total || 0;

    const sql = `
      SELECT 
        id,
        nama_item,
        lokasi,
        qty_total,
        tanggal_terakhir,
        periode_terakhir,
        keterangan_terakhir,
        foto_terakhir_1, foto_terakhir_2, foto_terakhir_3, foto_terakhir_4, foto_terakhir_5,
        foto_terakhir_6, foto_terakhir_7, foto_terakhir_8, foto_terakhir_9, foto_terakhir_10,
        created_at,
        updated_at
      FROM stok_logistik 
      ${whereClause}
      ORDER BY updated_at DESC
      LIMIT ? OFFSET ?
    `;

    const results = await query<StokLogistik>(sql, [...params, limit, offset]);

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
      { error: "Gagal mengambil data stok", details: error },
      { status: 500 }
    );
  }
}