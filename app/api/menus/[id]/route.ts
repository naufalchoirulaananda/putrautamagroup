// app/api/menus/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { RowDataPacket } from "mysql2";

export async function PUT(
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

    if (isNaN(menuId)) {
      return NextResponse.json(
        { error: "ID menu tidak valid" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { menuName, menuRoute, menuIcon, subMenus } = body;

    if (!menuName?.trim()) {
      return NextResponse.json(
        { error: "Nama menu harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // ===== VALIDASI ROUTE MENU =====
    if (menuRoute?.trim()) {
      const [existingMenu] = await connection.execute<RowDataPacket[]>(
        "SELECT id FROM menus WHERE route = ? AND id != ?",
        [menuRoute.trim(), menuId]
      );

      if (existingMenu.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { error: "Route menu sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // ===== UPDATE MENU UTAMA =====
    await connection.execute(
      `UPDATE menus 
       SET name = ?, route = ?, icon = ?
       WHERE id = ?`,
      [
        menuName.trim(),
        menuRoute?.trim() || "",
        menuIcon || "LayoutDashboard",
        menuId,
      ]
    );

    // ===== AMBIL SUBMENU YANG ADA SAAT INI =====
    const [existingSubMenus] = await connection.execute<RowDataPacket[]>(
      "SELECT id, route FROM sub_menus WHERE parent_menu_id = ?",
      [menuId]
    );

    const validSubMenus = Array.isArray(subMenus)
      ? subMenus.filter((s: any) => s.name?.trim() && s.route?.trim())
      : [];

    // ===== VALIDASI DUPLIKASI ROUTE SUBMENU =====
    if (validSubMenus.length > 0) {
      const routesToCheck = validSubMenus
        .filter((s: any) => !s.id) // Hanya check route baru
        .map((s: any) => s.route.trim());

      if (routesToCheck.length > 0) {
        const placeholders = routesToCheck.map(() => "?").join(", ");
        const [duplicates] = await connection.execute<RowDataPacket[]>(
          `SELECT route FROM sub_menus WHERE route IN (${placeholders}) AND parent_menu_id != ?`,
          [...routesToCheck, menuId]
        );

        if (duplicates.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            {
              error: `Route submenu "${duplicates[0].route}" sudah digunakan`,
            },
            { status: 400 }
          );
        }
      }

      // Check duplikasi dalam submenu yang diedit
      const editedRoutes = validSubMenus
        .filter((s: any) => s.id)
        .map((s: any) => ({ id: s.id, route: s.route.trim() }));

      for (const edited of editedRoutes) {
        const [dup] = await connection.execute<RowDataPacket[]>(
          `SELECT id FROM sub_menus WHERE route = ? AND id != ? AND parent_menu_id != ?`,
          [edited.route, edited.id, menuId]
        );

        if (dup.length > 0) {
          await connection.rollback();
          return NextResponse.json(
            { error: `Route submenu "${edited.route}" sudah digunakan` },
            { status: 400 }
          );
        }
      }
    }

    // ===== PROSES SUBMENU: UPDATE YANG ADA, INSERT BARU, DELETE YANG DIHAPUS =====
    const submenuIdsToKeep = validSubMenus
      .filter((s: any) => s.id)
      .map((s: any) => s.id);

    // Hapus submenu yang tidak ada di list baru (user menghapusnya dari form)
    const existingIds = existingSubMenus.map((sm: any) => sm.id);
    const idsToDelete = existingIds.filter(
      (id: number) => !submenuIdsToKeep.includes(id)
    );

    if (idsToDelete.length > 0) {
      const deletePlaceholders = idsToDelete.map(() => "?").join(", ");
      await connection.execute(
        `DELETE FROM sub_menus WHERE id IN (${deletePlaceholders})`,
        idsToDelete
      );
    }

    // Update atau Insert submenu
    for (const subMenu of validSubMenus) {
      if (subMenu.id) {
        // UPDATE submenu yang sudah ada
        await connection.execute(
          `UPDATE sub_menus 
           SET name = ?, route = ?
           WHERE id = ? AND parent_menu_id = ?`,
          [subMenu.name.trim(), subMenu.route.trim(), subMenu.id, menuId]
        );
      } else {
        // INSERT submenu baru
        await connection.execute(
          `INSERT INTO sub_menus (name, route, parent_menu_id, is_active, created_at) 
           VALUES (?, ?, ?, TRUE, NOW())`,
          [subMenu.name.trim(), subMenu.route.trim(), menuId]
        );
      }
    }

    // ===== LOG ACTIVITY =====
    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `update_menu:${menuId}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Menu berhasil diperbarui",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error updating menu:", error);
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
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

    // Hapus semua submenu terkait
    await connection.execute(
      "DELETE FROM sub_menus WHERE parent_menu_id = ?",
      [menuId]
    );

    // Hapus akses menu dari role_menu_access
    await connection.execute(
      "DELETE FROM role_menu_access WHERE menu_id = ?",
      [menuId]
    );

    // Hapus akses menu dari user_menu_access
    await connection.execute(
      "DELETE FROM user_menu_access WHERE menu_id = ?",
      [menuId]
    );

    // Hapus menu utama
    await connection.execute("DELETE FROM menus WHERE id = ?", [menuId]);

    // Log activity
    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `delete_menu:${menuId}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Menu berhasil dihapus permanen",
    });
  } catch (error: any) {
    await connection.rollback();
    console.error("Error deleting menu:", error);

    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return NextResponse.json(
        {
          error:
            "Menu tidak dapat dihapus karena masih digunakan oleh data lain",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}