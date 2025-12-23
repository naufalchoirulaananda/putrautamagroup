// File: app/api/notifications/count/route.ts
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

    const [result] = await connection.execute(
      `SELECT COUNT(*) as unread_count 
         FROM notifications 
         WHERE user_id = ? AND is_read = 0`,
      [session.user.id]
    );

    connection.release();

    const unreadCount = (result as any[])[0]?.unread_count || 0;

    return NextResponse.json({
      success: true,
      count: unreadCount,
    });
  } catch (error) {
    console.error("Error counting notifications:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
