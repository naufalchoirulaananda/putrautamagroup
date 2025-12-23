// File: app/api/divisi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

// GET - Fetch all divisi
export async function GET() {
  try {
    const divisi = await query(
      "SELECT id, kode_divisi, nama_divisi FROM divisi ORDER BY kode_divisi ASC"
    );

    return NextResponse.json({
      success: true,
      data: divisi
    });
  } catch (error) {
    console.error("Error fetching divisi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new divisi
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
    const { kode_divisi, nama_divisi } = body;

    // Validasi input
    if (!kode_divisi || !nama_divisi) {
      return NextResponse.json(
        { error: "Kode divisi dan nama divisi harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah kode_divisi sudah ada
    const existingDivisi = await query(
      "SELECT id FROM divisi WHERE kode_divisi = ?",
      [kode_divisi]
    );

    if (existingDivisi.length > 0) {
      return NextResponse.json(
        { error: "Kode divisi sudah digunakan" },
        { status: 400 }
      );
    }

    // Insert divisi baru
    const result = await query(
      `INSERT INTO divisi (kode_divisi, nama_divisi) VALUES (?, ?)`,
      [kode_divisi, nama_divisi]
    );

    const insertId = (result as any).insertId;

    // Log activity
    await query(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `create_divisi:${kode_divisi}`]
    );

    // Ambil data divisi yang baru dibuat
    const newDivisi = await query(
      `SELECT id, kode_divisi, nama_divisi FROM divisi WHERE id = ?`,
      [insertId]
    );

    return NextResponse.json({
      success: true,
      message: "Divisi berhasil ditambahkan",
      data: newDivisi[0]
    });
  } catch (error) {
    console.error("Error creating divisi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}