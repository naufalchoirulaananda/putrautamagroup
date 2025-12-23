// File: app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export const revalidate = 60; // Cache 1 menit

// GET - Fetch notifications for current user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread_only") === "true";

    const connection = await pool.getConnection();

    let query = `
      SELECT 
        n.id,
        n.user_id,
        n.type,
        n.title,
        n.message,
        n.reference_id,
        n.reference_type,
        n.is_read,
        n.created_at,
        ci.user_name as requester_name,
        ci.jenis_izin
      FROM notifications n
      LEFT JOIN v_cuti_izin_detail ci ON n.reference_id = ci.id AND n.reference_type = 'cuti_izin'
      WHERE n.user_id = ?
    `;

    const params: any[] = [session.user.id];

    if (unreadOnly) {
      query += " AND n.is_read = 0";
    }

    query += " ORDER BY n.created_at DESC LIMIT 50";

    const [notifications] = await connection.execute(query, params);
    connection.release();

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create notification
export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { user_id, type, title, message, reference_id, reference_type } = body;

    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [user_id, type, title, message, reference_id || null, reference_type || null]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: "Notifikasi berhasil dibuat",
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    if (connection) connection.release();
  }
}