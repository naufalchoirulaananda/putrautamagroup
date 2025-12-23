// File: app/api/cuti-izin/pending-approvals/route.ts
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

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'manager' or 'hrd'

    const connection = await pool.getConnection();

    // ✅ FIX: Gunakan query lengkap dengan JOIN untuk mendapatkan nama_divisi
    let query = `
      SELECT 
        ci.*,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi,
        d.kode_divisi as divisi_kode,
        CASE 
          WHEN ci.jenis_izin = 'cuti' THEN DATEDIFF(ci.tanggal_cuti_selesai, ci.tanggal_cuti_mulai) + 1
          ELSE 1
        END as jumlah_hari_cuti
      FROM cuti_izin ci
      LEFT JOIN users u ON ci.user_id = u.id
      LEFT JOIN roles r ON ci.role_id = r.id
      LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
      WHERE ci.current_approver_id = ?
    `;
    
    const params: any[] = [session.user.id];

    if (type === "manager") {
      query += " AND ci.status = 'waiting_manager'";
    } else if (type === "hrd") {
      query += " AND ci.status = 'waiting_hrd'";
    } else {
      // Show all pending for this approver (only waiting statuses)
      query += " AND ci.status IN ('waiting_manager', 'waiting_hrd')";
    }

    query += " ORDER BY ci.created_at ASC";

    const [results] = await connection.execute(query, params);
    connection.release();

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching pending approvals:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}