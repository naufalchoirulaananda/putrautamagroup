// app/api/users/[id]/menu-access/route.ts
import { NextResponse } from "next/server";
import { query, bulkInsert } from "@/lib/db";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Ambil akses menu user (override atau dari role)
export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    // Cek apakah user punya override akses
    const userMenuOverride = await query<{ menu_id: number }>(
      "SELECT menu_id FROM user_menu_access WHERE user_id = ?",
      [userId]
    );

    const userSubMenuOverride = await query<{ sub_menu_id: number }>(
      "SELECT sub_menu_id FROM user_submenu_access WHERE user_id = ?",
      [userId]
    );

    // Jika ada override, gunakan itu
    if (userMenuOverride.length > 0) {
      return NextResponse.json({
        menuIds: userMenuOverride.map(m => m.menu_id),
        subMenuIds: userSubMenuOverride.map(sm => sm.sub_menu_id)
      });
    }

    // Jika tidak ada override, ambil dari role
    const userResult = await query<{ role_id: number }>(
      "SELECT role_id FROM users WHERE id = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const roleId = userResult[0].role_id;

    // Ambil menu yang bisa diakses role ini
    const menuAccess = await query<{ menu_id: number }>(
      "SELECT menu_id FROM role_menu_access WHERE role_id = ?",
      [roleId]
    );

    // Ambil submenu yang bisa diakses role ini
    const subMenuAccess = await query<{ submenu_id: number }>(
      "SELECT submenu_id FROM role_submenu_access WHERE role_id = ?",
      [roleId]
    );

    return NextResponse.json({
      menuIds: menuAccess.map((m) => m.menu_id),
      subMenuIds: subMenuAccess.map((s) => s.submenu_id),
    });
  } catch (error) {
    console.error("Error fetching user menu access:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update akses menu user (simpan ke user_menu_access, bukan role)
export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const userId = parseInt(id);
    const body = await request.json();
    const { menuIds, subMenuIds } = body;

    console.log('=== SAVING USER ACCESS ===');
    console.log('User ID:', userId);
    console.log('Menu IDs:', menuIds);
    console.log('SubMenu IDs:', subMenuIds);

    // Validasi user exists
    const userResult = await query<{ id: number }>(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (userResult.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // Hapus akses menu user yang lama (override)
    await query("DELETE FROM user_menu_access WHERE user_id = ?", [userId]);

    // Hapus akses submenu user yang lama (override)
    await query("DELETE FROM user_submenu_access WHERE user_id = ?", [userId]);

    // Insert akses menu baru ke user_menu_access
    if (menuIds && menuIds.length > 0) {
      const menuValues = menuIds.map((menuId: number) => [userId, menuId]);
      console.log('Inserting menu access:', menuValues);
      await bulkInsert("user_menu_access", ["user_id", "menu_id"], menuValues);
    }

    // Insert akses submenu baru ke user_submenu_access
    if (subMenuIds && subMenuIds.length > 0) {
      const subMenuValues = subMenuIds.map((subMenuId: number) => [
        userId,
        subMenuId,
      ]);
      console.log('Inserting submenu access:', subMenuValues);
      await bulkInsert(
        "user_submenu_access",
        ["user_id", "sub_menu_id"],
        subMenuValues
      );
    }

    // Verify data tersimpan
    const savedMenus = await query("SELECT * FROM user_menu_access WHERE user_id = ?", [userId]);
    const savedSubMenus = await query("SELECT * FROM user_submenu_access WHERE user_id = ?", [userId]);
    
    console.log('Saved menus:', savedMenus);
    console.log('Saved submenus:', savedSubMenus);

    return NextResponse.json({ 
      success: true,
      message: "Akses menu berhasil diperbarui",
      debug: {
        savedMenus: savedMenus.length,
        savedSubMenus: savedSubMenus.length
      }
    });
  } catch (error) {
    console.error("Error updating user menu access:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}