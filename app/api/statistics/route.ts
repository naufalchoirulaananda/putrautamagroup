import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Hitung total karyawan dari tabel users
    const karyawanResult = await query<{ total: number }>(
      "SELECT COUNT(*) as total FROM users WHERE status = 'active'"
    );

    // Hitung total perusahaan dari tabel divisi (kecuali HEAD OFFICE)
    const perusahaanResult = await query<{ total: number }>(
      "SELECT COUNT(*) as total FROM divisi WHERE nama_divisi != 'HEAD OFFICE'"
    );

    // Hitung total cabang dari tabel cabang_perusahaan
    const cabangResult = await query<{ total: number }>(
      "SELECT COUNT(*) as total FROM cabang_perusahaan"
    );

    return NextResponse.json({
      success: true,
      data: {
        totalKaryawan: karyawanResult[0]?.total || 0,
        totalPerusahaan: perusahaanResult[0]?.total || 0,
        totalCabang: cabangResult[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data statistik",
        error: (error as Error).message,
      },
      { status: 500 }
    );
  }
}