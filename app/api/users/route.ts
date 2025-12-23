// File: app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface User {
  id: number;
  name: string;
  kode_pegawai: string;
  role_id: number;
  status: string;
  created_at: string;
  tanggal_nonaktif: string | null; // TAMBAH INI
  role_name: string;
  divisi_kode: string;
  divisi_name: string;
  cabang_id: string | null;
  cabang_name: string | null;
}

// GET - Fetch all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all users with their role, divisi, and cabang information
    const users = await query<User>(
      `SELECT u.id, u.name, u.kode_pegawai, u.password, u.role_id, u.status, u.created_at, u.tanggal_nonaktif,
              r.name as role_name, u.divisi_kode, d.nama_divisi as divisi_name,
              u.cabang_id, c.nama_cabang as cabang_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new user
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
    const { name, kode_pegawai, role_id, status, password, divisi_kode, cabang_id } = body;

    // Validasi input
    if (!name || !kode_pegawai || !role_id || !status || !password) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah kode_pegawai sudah ada
    const existingUser = await query<{ id: number }>(
      "SELECT id FROM users WHERE kode_pegawai = ?",
      [kode_pegawai]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Kode pegawai sudah digunakan" },
        { status: 400 }
      );
    }

    // TAMBAH INI: Tentukan tanggal_nonaktif jika status inactive
    const tanggalNonaktif = status === 'inactive' ? new Date() : null;

    // Insert user baru dengan tanggal_nonaktif
    const result = await query(
      `INSERT INTO users (name, kode_pegawai, role_id, status, password, divisi_kode, cabang_id, tanggal_nonaktif, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, kode_pegawai, role_id, status, password, divisi_kode || null, cabang_id || null, tanggalNonaktif]
    );

    const insertId = (result as any).insertId;

    // Log activity
    await query(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `create_user:${insertId}`]
    );

    // Ambil data user yang baru dibuat
    const newUser = await query<User>(
      `SELECT u.id, u.name, u.kode_pegawai, u.password, u.role_id, u.status, u.created_at, u.tanggal_nonaktif,
              r.name as role_name, u.divisi_kode, d.nama_divisi as divisi_name,
              u.cabang_id, c.nama_cabang as cabang_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       WHERE u.id = ?`,
      [insertId]
    );

    return NextResponse.json({
      success: true,
      message: "User berhasil ditambahkan",
      data: newUser[0]
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}