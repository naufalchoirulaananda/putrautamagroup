// File: app/api/approvers/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch users that can be approvers
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'divisi' or 'hrd'

    const connection = await pool.getConnection();

    let query = `
      SELECT 
        u.id,
        u.name,
        u.kode_pegawai,
        u.role_id,
        u.divisi_kode,
        u.cabang_id,
        u.status,
        r.name as role_name,
        d.nama_divisi as divisi_name,
        c.nama_cabang as cabang_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       WHERE u.status = 'active'
    `;

    if (type === 'hrd') {
      // For HRD Approver Management - Only HRD/Personalia/Direktur
      query += `
        AND (
          UPPER(r.name) LIKE '%HRD%' OR
          UPPER(r.name) LIKE '%PERSONALIA%' OR
          UPPER(r.name) LIKE '%DIREKTUR%' OR
          UPPER(r.name) LIKE '%DIRECTOR%'
        )
      `;
    } else {
      // For Divisi Approver Management - Exclude HRD/Personalia
      query += `
        AND (
          UPPER(r.name) LIKE '%KOORDINATOR%' OR
          UPPER(r.name) LIKE '%MANAGER%' OR
          UPPER(r.name) LIKE '%SPV%' OR
          UPPER(r.name) LIKE '%SUPERVISOR%' OR
          UPPER(r.name) LIKE '%DIREKTUR%' OR
          UPPER(r.name) LIKE '%DIRECTOR%'
        )
        AND UPPER(r.name) NOT LIKE '%HRD%'
        AND UPPER(r.name) NOT LIKE '%PERSONALIA%'
      `;
    }

    query += ` ORDER BY r.name, u.name`;

    const [users] = await connection.execute(query);

    connection.release();

    return NextResponse.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}