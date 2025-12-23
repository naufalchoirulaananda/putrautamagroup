// app/api/menus/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import pool from "@/lib/db";

interface Menu {
  id: number;
  name: string;
  route: string;
  icon: string;
  parent_id: number | null;
  is_active: boolean;
  parent_menu_id: number;
}

// GET - Fetch menus with hybrid access (user override + role default)
export async function GET() {
    try {
      const session = await getServerSession(authOptions);
  
      if (!session?.user) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      const userId = session.user.id;
  
      // Cek apakah user punya override akses sendiri
      const userMenuOverride = await query<{ menu_id: number }>(
        `SELECT menu_id FROM user_menu_access WHERE user_id = ?`,
        [userId]
      );

      console.log('User ID:', userId);
      console.log('User Menu Override:', userMenuOverride);

      let accessibleMenuIds: number[];
      let accessibleSubMenuIds: number[];

      // Jika user punya override akses, gunakan itu (ignore role)
      if (userMenuOverride.length > 0) {
        console.log('Using user override access');
        accessibleMenuIds = userMenuOverride.map(m => m.menu_id);

        const userSubMenuOverride = await query<{ sub_menu_id: number }>(
          `SELECT sub_menu_id FROM user_submenu_access WHERE user_id = ?`,
          [userId]
        );
        accessibleSubMenuIds = userSubMenuOverride.map(sm => sm.sub_menu_id);
        
        console.log('Accessible Menu IDs:', accessibleMenuIds);
        console.log('Accessible SubMenu IDs:', accessibleSubMenuIds);
      } else {
        console.log('Using role-based access');
        // Jika tidak ada override, gunakan akses berdasarkan role
        const userRole = await query<{ role_id: number }>(
          "SELECT role_id FROM users WHERE id = ?",
          [userId]
        );

        if (userRole.length === 0) {
          return NextResponse.json([]);
        }

        const roleId = userRole[0].role_id;
        console.log('Role ID:', roleId);

        // Get menu IDs dari role
        const roleMenuAccess = await query<{ menu_id: number }>(
          `SELECT menu_id FROM role_menu_access WHERE role_id = ?`,
          [roleId]
        );
        accessibleMenuIds = roleMenuAccess.map(m => m.menu_id);

        // Get submenu IDs dari role
        const roleSubMenuAccess = await query<{ submenu_id: number }>(
          `SELECT submenu_id FROM role_submenu_access WHERE role_id = ?`,
          [roleId]
        );
        accessibleSubMenuIds = roleSubMenuAccess.map(sm => sm.submenu_id);
        
        console.log('Accessible Menu IDs (role):', accessibleMenuIds);
        console.log('Accessible SubMenu IDs (role):', accessibleSubMenuIds);
      }

      if (accessibleMenuIds.length === 0) {
        return NextResponse.json([]);
      }
  
      // Get menus that user has access to
      const placeholders = accessibleMenuIds.map(() => '?').join(',');
      const menus = await query<Menu>(
        `SELECT * FROM menus 
         WHERE id IN (${placeholders}) AND is_active = TRUE
         ORDER BY id`,
        accessibleMenuIds
      );
  
      // Get only submenus that user has access to
      let subMenus: Menu[] = [];
      if (accessibleSubMenuIds.length > 0) {
        const subPlaceholders = accessibleSubMenuIds.map(() => '?').join(',');
        subMenus = await query<Menu>(
          `SELECT * FROM sub_menus 
           WHERE id IN (${subPlaceholders}) AND is_active = TRUE
           ORDER BY parent_menu_id, id`,
          accessibleSubMenuIds
        );
      }
  
      // Organize menus with their accessible submenus
      const menusWithSubMenus = menus.map(menu => ({
        ...menu,
        children: subMenus.filter(sub => sub.parent_menu_id === menu.id)
      }));
  
      return NextResponse.json(menusWithSubMenus);
    } catch (error) {
      console.error("Error fetching menus:", error);
      return NextResponse.json(
        { error: "Terjadi kesalahan server" },
        { status: 500 }
      );
    }
}

// POST - Create new menu with optional submenus
export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { menuName, menuRoute, menuIcon, subMenus } = body;

    // Validasi input menu
    if (!menuName) {
      return NextResponse.json(
        { error: "Nama menu harus diisi" },
        { status: 400 }
      );
    }

    // Validasi route menu tidak duplikat jika route diisi
    if (menuRoute && menuRoute.trim() !== '') {
      const [existingMenu] = await connection.execute(
        "SELECT id FROM menus WHERE route = ?",
        [menuRoute]
      );

      if ((existingMenu as any[]).length > 0) {
        return NextResponse.json(
          { error: "Route menu sudah digunakan" },
          { status: 400 }
        );
      }
    }

    // Validasi route submenu jika ada
    if (subMenus && subMenus.length > 0) {
      for (const subMenu of subMenus) {
        if (!subMenu.name || !subMenu.route) {
          return NextResponse.json(
            { error: "Nama dan route submenu harus diisi" },
            { status: 400 }
          );
        }

        const [existingSubMenu] = await connection.execute(
          "SELECT id FROM sub_menus WHERE route = ?",
          [subMenu.route]
        );

        if ((existingSubMenu as any[]).length > 0) {
          return NextResponse.json(
            { error: `Route submenu "${subMenu.route}" sudah digunakan` },
            { status: 400 }
          );
        }
      }
    }

    await connection.beginTransaction();

    // Insert menu baru
    const [menuResult] = await connection.execute(
      `INSERT INTO menus (name, route, icon, is_active, created_at) 
       VALUES (?, ?, ?, TRUE, NOW())`,
      [menuName, menuRoute || '', menuIcon || 'LayoutDashboard']
    );

    const menuId = (menuResult as any).insertId;

    // Insert submenus jika ada
    if (subMenus && subMenus.length > 0) {
      for (const subMenu of subMenus) {
        await connection.execute(
          `INSERT INTO sub_menus (name, route, parent_menu_id, is_active, created_at) 
           VALUES (?, ?, ?, TRUE, NOW())`,
          [subMenu.name, subMenu.route, menuId]
        );
      }
    }

    // Log activity
    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `create_menu:${menuId}`]
    );

    await connection.commit();

    // Ambil data menu yang baru dibuat
    const [newMenu] = await connection.execute(
      `SELECT m.*, 
        (SELECT COUNT(*) FROM sub_menus WHERE parent_menu_id = m.id) as submenu_count
       FROM menus m
       WHERE m.id = ?`,
      [menuId]
    );

    return NextResponse.json({
      success: true,
      message: "Menu berhasil ditambahkan",
      data: (newMenu as any[])[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating menu:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}