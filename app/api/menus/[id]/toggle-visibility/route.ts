// File: app/api/menus/[id]/toggle-visibility/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// PATCH - Toggle menu visibility (show/hide)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const menuId = parseInt(id);

    await connection.beginTransaction();

    // Get current status
    const [currentMenu] = await connection.execute(
      "SELECT is_active FROM menus WHERE id = ?",
      [menuId]
    );

    if ((currentMenu as any[]).length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Menu tidak ditemukan" },
        { status: 404 }
      );
    }

    const currentStatus = (currentMenu as any[])[0].is_active;
    const newStatus = !currentStatus;

    // Toggle menu visibility
    await connection.execute(
      "UPDATE menus SET is_active = ? WHERE id = ?",
      [newStatus, menuId]
    );

    // Toggle submenu visibility juga
    await connection.execute(
      "UPDATE sub_menus SET is_active = ? WHERE parent_menu_id = ?",
      [newStatus, menuId]
    );

    // Log activity
    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `toggle_menu_visibility:${menuId}:${newStatus}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: `Menu berhasil ${newStatus ? 'ditampilkan' : 'disembunyikan'}`,
      is_active: newStatus
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error toggling menu visibility:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}