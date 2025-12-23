// File: app/api/verify/cuti/[id]/[level]/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; level: string }> }
) {
  try {
    const { id, level } = await params;
    const cutiId = parseInt(id);
    const approvalLevel = parseInt(level);

    const connection = await pool.getConnection();

    // Get cuti data
    const [cutiData] = await connection.execute(
      `SELECT 
        ci.*,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi
       FROM cuti_izin ci
       LEFT JOIN users u ON ci.user_id = u.id
       LEFT JOIN roles r ON ci.role_id = r.id
       LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
       WHERE ci.id = ?`,
      [cutiId]
    );

    if ((cutiData as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, error: "Data tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get approval data for this level
    const [approvalData] = await connection.execute(
      `SELECT 
        approver_name,
        approver_role,
        approval_level,
        status,
        notes,
        approved_at
       FROM cuti_izin_approval
       WHERE cuti_izin_id = ? AND approval_level = ?`,
      [cutiId, approvalLevel]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: {
        cuti: (cutiData as any[])[0],
        approval: (approvalData as any[])[0] || null,
      },
    });
  } catch (error) {
    console.error("Error fetching verification data:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}