import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface Absensi {
  id: number;
  user_id: number;
  date: string;
  subjek_masuk: string;
  subjek_pulang: string;
  jam_masuk: string;
  jam_pulang: string;
  durasi: number;
  foto_masuk_1: string;
  foto_masuk_2: string;
  foto_masuk_3: string;
  foto_pulang_1: string;
  foto_pulang_2: string;
  foto_pulang_3: string;
  keterangan_masuk: string;
  keterangan_pulang: string;
  created_at: string;
  user_name: string;
  kode_pegawai: string;
  role_name: string;
  divisi_kode: string;
  nama_divisi: string;
}

// GET - Fetch absensi with search & filters
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const roleId = searchParams.get("role_id") || "";
    const divisiKode = searchParams.get("divisi_kode") || "";

    let sqlQuery = `
      SELECT 
        a.id,
        a.user_id,
        a.date,
        a.subjek_masuk,
        a.subjek_pulang,
        a.jam_masuk,
        a.jam_pulang,
        a.durasi,
        a.foto_masuk_1,
        a.foto_masuk_2,
        a.foto_masuk_3,
        a.foto_pulang_1,
        a.foto_pulang_2,
        a.foto_pulang_3,
        a.latitude_masuk,
        a.longitude_masuk,
        a.alamat_masuk,
        a.latitude_pulang,
        a.longitude_pulang,
        a.alamat_pulang,
        a.keterangan_masuk,
        a.keterangan_pulang,
        a.created_at,
        u.name AS user_name,
        u.kode_pegawai,
        r.name AS role_name,
        u.divisi_kode,
        d.nama_divisi
      FROM absensi a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
      WHERE 1=1
    `;

    const params: any[] = [];

    // Filter by search (nama karyawan / kode pegawai)
    if (search) {
      sqlQuery += ` AND (u.name LIKE ? OR u.kode_pegawai LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    // Filter by role
    if (roleId) {
      sqlQuery += ` AND u.role_id = ?`;
      params.push(roleId);
    }

    // Filter by divisi_kode
    if (divisiKode) {
      sqlQuery += ` AND u.divisi_kode = ?`;
      params.push(divisiKode);
    }

    sqlQuery += ` ORDER BY a.date DESC, a.created_at DESC`;

    const absensi = await query<Absensi>(sqlQuery, params);

    return NextResponse.json({
      success: true,
      data: absensi,
    });
  } catch (error) {
    console.error("Error fetching absensi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
