import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("role_id") || "2"; // Default ke role 2 untuk testing

    // Test query untuk cek data
    const roles = await query("SELECT * FROM roles");
    const menus = await query("SELECT * FROM menus");
    const subMenus = await query("SELECT * FROM sub_menus");
    const roleMenuAccess = await query(
      `SELECT rma.*, r.name as role_name, m.name as menu_name 
       FROM role_menu_access rma 
       JOIN roles r ON rma.role_id = r.id 
       JOIN menus m ON rma.menu_id = m.id`
    );

    // Query menu untuk role tertentu
    const menusForRole = await query(
      `SELECT m.* 
       FROM menus m
       INNER JOIN role_menu_access rma ON m.id = rma.menu_id
       WHERE rma.role_id = ? AND m.is_active = TRUE
       ORDER BY m.id`,
      [roleId]
    );

    // Ambil submenu untuk setiap menu
    const menusWithSubMenus = await Promise.all(
      menusForRole.map(async (menu: any) => {
        const subMenus = await query(
          `SELECT sm.* 
           FROM sub_menus sm
           WHERE sm.parent_menu_id = ? AND sm.is_active = TRUE
           ORDER BY sm.id`,
          [menu.id]
        );
        return {
          ...menu,
          subMenus,
        };
      })
    );

    return NextResponse.json({
      debug: {
        roleId,
        totalRoles: roles.length,
        totalMenus: menus.length,
        totalSubMenus: subMenus.length,
        totalRoleMenuAccess: roleMenuAccess.length,
      },
      allData: {
        roles,
        menus,
        subMenus,
        roleMenuAccess,
      },
      menusForRole: menusWithSubMenus,
    }, { status: 200 });
  } catch (error) {
    console.error("Error in test-menus:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server", details: String(error) },
      { status: 500 }
    );
  }
}