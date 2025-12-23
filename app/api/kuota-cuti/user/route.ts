// File: app/api/kuota-cuti/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

import { updateKuotaAfterApproval } from "@/lib/updateKuotaAfterApproval";

// GET - Fetch user's kuota cuti
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("user_id") || session.user.id;
    const tahun = searchParams.get("tahun") || new Date().getFullYear();

    const connection = await pool.getConnection();

    // Get or create kuota for this year
    const [kuota] = await connection.execute(
      `SELECT * FROM v_kuota_cuti_detail 
       WHERE user_id = ? AND tahun = ?`,
      [userId, tahun]
    );

    // If no kuota exists, create one based on config
    if ((kuota as any[]).length === 0) {
      // Get default kuota from config
      const [config] = await connection.execute(
        `SELECT jumlah_hari FROM kuota_cuti_config WHERE tahun = ?`,
        [tahun]
      );

      const defaultKuota = (config as any[])[0]?.jumlah_hari || 12;

      // Create kuota for user
      await connection.execute(
        `INSERT INTO kuota_cuti_user (user_id, tahun, kuota_total, kuota_sisa)
         VALUES (?, ?, ?, ?)`,
        [userId, tahun, defaultKuota, defaultKuota]
      );

      // Fetch the newly created kuota
      const [newKuota] = await connection.execute(
        `SELECT * FROM v_kuota_cuti_detail 
         WHERE user_id = ? AND tahun = ?`,
        [userId, tahun]
      );

      connection.release();

      return NextResponse.json({
        success: true,
        data: (newKuota as any[])[0] || null,
      });
    }

    connection.release();

    return NextResponse.json({
      success: true,
      data: (kuota as any[])[0],
    });
  } catch (error) {
    console.error("Error fetching user kuota:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
