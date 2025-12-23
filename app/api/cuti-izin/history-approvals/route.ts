// File: app/api/cuti-izin/history-approvals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();

    // ✅ FIX: Gunakan query lengkap dengan JOIN untuk mendapatkan nama_divisi
    const query = `
      SELECT DISTINCT
        ci.id,
        ci.user_id,
        ci.nama_lengkap,
        ci.role_id,
        ci.divisi_kode,
        ci.jenis_izin,
        ci.tanggal_izin,
        ci.tanggal_cuti_mulai,
        ci.tanggal_cuti_selesai,
        ci.alasan,
        ci.pic_pengganti,
        ci.pic_phone,
        ci.nomor_telepon_karyawan,
        ci.bukti_file_path,
        ci.pdf_pengajuan_path,
        ci.pdf_level1_path,
        ci.pdf_final_path,
        ci.status,
        ci.created_at,
        ci.updated_at,
        CASE 
          WHEN ci.jenis_izin = 'cuti' THEN DATEDIFF(ci.tanggal_cuti_selesai, ci.tanggal_cuti_mulai) + 1
          ELSE 1
        END as jumlah_hari_cuti,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi
      FROM cuti_izin ci
      INNER JOIN cuti_izin_approval cia ON ci.id = cia.cuti_izin_id
      LEFT JOIN users u ON ci.user_id = u.id
      LEFT JOIN roles r ON ci.role_id = r.id
      LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
      WHERE cia.approver_id = ?
      ORDER BY ci.updated_at DESC
    `;

    const [results] = await connection.execute(query, [session.user.id]);
    connection.release();

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching history approvals:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}