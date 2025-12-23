// File: app/api/notifications/delete/route.ts
// API untuk menghapus notifikasi (single atau bulk)

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function DELETE(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { notification_id, delete_all_read } = body;

    await connection.beginTransaction();

    if (delete_all_read) {
      // Delete all READ notifications for current user
      await connection.execute(
        `DELETE FROM notifications WHERE user_id = ? AND is_read = 1`,
        [session.user.id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Semua notifikasi yang sudah dibaca berhasil dihapus",
      });
    } else if (notification_id) {
      // Delete specific notification
      // Make sure the notification belongs to the current user
      const [checkResult] = await connection.execute(
        `SELECT id FROM notifications WHERE id = ? AND user_id = ?`,
        [notification_id, session.user.id]
      );

      if ((checkResult as any[]).length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "Notifikasi tidak ditemukan" },
          { status: 404 }
        );
      }

      await connection.execute(
        `DELETE FROM notifications WHERE id = ? AND user_id = ?`,
        [notification_id, session.user.id]
      );

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: "Notifikasi berhasil dihapus",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Parameter tidak valid" },
        { status: 400 }
      );
    }
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting notification:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}