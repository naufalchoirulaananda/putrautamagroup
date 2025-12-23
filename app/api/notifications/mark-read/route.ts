// File: app/api/notifications/mark-read/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function PATCH(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, mark_all } = body;

    if (mark_all) {
      // Mark all notifications as read
      await connection.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`,
        [session.user.id]
      );
    } else if (notification_id) {
      // Mark specific notification as read
      await connection.execute(
        `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
        [notification_id, session.user.id]
      );
    }

    connection.release();

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil ditandai sebagai dibaca",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}
