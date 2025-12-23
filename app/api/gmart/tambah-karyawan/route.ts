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
  cabang_id: string;
  created_at: string;
  role_name: string;
  cabang_name: string;
}

// Daftar role yang diperbolehkan (HARUS SAMA dengan frontend)
const ALLOWED_ROLES = [
  "ASS KEPALA TOKO GMART",
  "HELPER GMART",
  "HRD GMART",
  "PERSONALIA",
  "KASIR GMART",
  "KEPALA TOKO GMART",
  "MANAGER GMART",
  "MERCHANDISING GMART",
  "PRAMU-KASIR GMART",
  "KASIR  GMART",
  "PRAMUNIAGA GMART",
  "SPV CABANG GMART",
  "SPV LOGISTIK GMART",
  "SPV KEUANGAN GMART",
  "STAFF KEUANGAN GMART",
  "SPV PENGUNJUNG GMART",
];

// GET - Fetch all users
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const placeholders = ALLOWED_ROLES.map(() => "?").join(",");

    // UPDATED: Tambahkan JOIN dengan tabel divisi
    const users = await query<User>(
      `SELECT u.id, u.name, u.kode_pegawai, u.role_id, u.status, u.cabang_id, u.divisi_kode, u.created_at,
              r.name as role_name, 
              c.nama_cabang as cabang_name,
              d.nama_divisi as divisi_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       WHERE u.cabang_id IS NOT NULL 
         AND u.cabang_id != '' 
         AND r.name IN (${placeholders})
       ORDER BY u.created_at DESC`,
      ALLOWED_ROLES
    );

    return NextResponse.json({
      success: true,
      data: users,
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // UPDATED: Tambahkan divisi_kode
    const {
      name,
      kode_pegawai,
      role_id,
      status,
      password,
      cabang_id,
      divisi_kode,
    } = body;

    // UPDATED: Validasi input termasuk divisi_kode
    if (
      !name ||
      !kode_pegawai ||
      !role_id ||
      !status ||
      !password ||
      !cabang_id ||
      !divisi_kode
    ) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Validasi role
    const roleCheck = await query<{ name: string }>(
      "SELECT name FROM roles WHERE id = ?",
      [role_id]
    );

    if (roleCheck.length === 0 || !ALLOWED_ROLES.includes(roleCheck[0].name)) {
      return NextResponse.json(
        { error: "Role tidak diperbolehkan" },
        { status: 400 }
      );
    }

    // Cek kode_pegawai sudah ada
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

    // UPDATED: Insert user baru dengan divisi_kode
    const result = await query(
      `INSERT INTO users (name, kode_pegawai, role_id, status, password, cabang_id, divisi_kode, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [name, kode_pegawai, role_id, status, password, cabang_id, divisi_kode]
    );

    const insertId = (result as any).insertId;

    // Log activity (optional)
    try {
      await query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [
        session.user.id,
        `create_user:${insertId}`,
      ]);
    } catch (logError) {
      console.warn("Failed to log activity (non-critical):", logError);
    }

    // UPDATED: Ambil data user dengan JOIN divisi
    const newUser = await query<User>(
      `SELECT u.id, u.name, u.kode_pegawai, u.role_id, u.status, u.cabang_id, u.divisi_kode, u.created_at,
              r.name as role_name, 
              c.nama_cabang as cabang_name,
              d.nama_divisi as divisi_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       WHERE u.id = ?`,
      [insertId]
    );

    return NextResponse.json({
      success: true,
      message: "User berhasil ditambahkan",
      data: newUser[0],
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Terjadi kesalahan server",
        details:
          process.env.NODE_ENV === "development"
            ? (error as Error).message
            : undefined,
      },
      { status: 500 }
    );
  }
}
