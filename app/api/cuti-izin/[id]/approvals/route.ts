// File: app/api/cuti-izin/[id]/approvals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cutiIzinId = parseInt(id);

    const connection = await pool.getConnection();

    // Get all approval records for this cuti_izin
    const [approvals] = await connection.execute(
      `SELECT 
        id,
        approver_id,
        approver_name,
        approver_role,
        approval_level,
        status,
        notes,
        approved_at
       FROM cuti_izin_approval
       WHERE cuti_izin_id = ?
       ORDER BY approval_level ASC`,
      [cutiIzinId]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: approvals,
    });
  } catch (error) {
    console.error("Error fetching approval messages:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}