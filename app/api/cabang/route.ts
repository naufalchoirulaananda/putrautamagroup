// File: app/api/cabang/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Fetch all cabang
export async function GET() {
  try {
    const cabang = await query(
      `SELECT kode_cabang, nama_cabang, divisi_id 
       FROM cabang_perusahaan 
       ORDER BY kode_cabang ASC`
    );

    return NextResponse.json({
      success: true,
      data: cabang
    });
  } catch (error) {
    console.error("Error fetching cabang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new cabang
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { kode_cabang, nama_cabang, divisi_id } = body;

    // Validasi input
    if (!kode_cabang || !nama_cabang) {
      return NextResponse.json(
        { error: "Kode cabang dan nama cabang harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah kode_cabang sudah ada
    const existingCabang = await query(
      "SELECT kode_cabang FROM cabang_perusahaan WHERE kode_cabang = ?",
      [kode_cabang]
    );

    if (existingCabang.length > 0) {
      return NextResponse.json(
        { error: "Kode cabang sudah digunakan" },
        { status: 400 }
      );
    }

    // Insert cabang baru
    await query(
      `INSERT INTO cabang_perusahaan (kode_cabang, nama_cabang, divisi_id) 
       VALUES (?, ?, ?)`,
      [kode_cabang, nama_cabang, divisi_id || null]
    );

    // Log activity
    await query(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `create_cabang:${kode_cabang}`]
    );

    // Ambil data cabang yang baru dibuat
    const newCabang = await query(
      `SELECT kode_cabang, nama_cabang, divisi_id 
       FROM cabang_perusahaan 
       WHERE kode_cabang = ?`,
      [kode_cabang]
    );

    return NextResponse.json({
      success: true,
      message: "Cabang berhasil ditambahkan",
      data: newCabang[0]
    });
  } catch (error) {
    console.error("Error creating cabang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}