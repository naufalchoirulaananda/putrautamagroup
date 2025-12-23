import { query } from "@/lib/db";

interface Menu {
  id: number;
  name: string;
  route: string;
  icon: string;
  parent_id: number | null;
  is_active: boolean;
}

interface SubMenu {
  id: number;
  name: string;
  route: string;
  parent_menu_id: number;
  is_active: boolean;
}

/**
 * Mendapatkan menu yang bisa diakses oleh role tertentu
 */
export async function getMenusByRoleId(roleId: number): Promise<Menu[]> {
  const menus = await query<Menu>(
    `SELECT m.* 
     FROM menus m
     INNER JOIN role_menu_access rma ON m.id = rma.menu_id
     WHERE rma.role_id = ? AND m.is_active = TRUE
     ORDER BY m.id`,
    [roleId]
  );

  return menus;
}

/**
 * Mendapatkan submenu berdasarkan parent menu id
 */
export async function getSubMenusByMenuId(menuId: number): Promise<SubMenu[]> {
  const subMenus = await query<SubMenu>(
    `SELECT * 
     FROM sub_menus 
     WHERE parent_menu_id = ? AND is_active = TRUE
     ORDER BY id`,
    [menuId]
  );

  return subMenus;
}

/**
 * Cek apakah user dengan role_id tertentu punya akses ke menu tertentu
 */
export async function hasMenuAccess(roleId: number, menuId: number): Promise<boolean> {
  const result = await query(
    `SELECT 1 
     FROM role_menu_access 
     WHERE role_id = ? AND menu_id = ?`,
    [roleId, menuId]
  );

  return result.length > 0;
}

/**
 * Cek apakah user punya akses ke route tertentu
 */
export async function hasRouteAccess(roleId: number, route: string): Promise<boolean> {
  const result = await query(
    `SELECT 1 
     FROM menus m
     INNER JOIN role_menu_access rma ON m.id = rma.menu_id
     WHERE rma.role_id = ? AND m.route = ? AND m.is_active = TRUE`,
    [roleId, route]
  );

  if (result.length > 0) return true;

  // Cek juga di sub_menus
  const subMenuResult = await query(
    `SELECT 1 
     FROM sub_menus sm
     INNER JOIN role_menu_access rma ON sm.parent_menu_id = rma.menu_id
     WHERE rma.role_id = ? AND sm.route = ? AND sm.is_active = TRUE`,
    [roleId, route]
  );

  return subMenuResult.length > 0;
}

/**
 * Mendapatkan struktur menu lengkap dengan submenu untuk role tertentu
 */
export async function getMenuStructure(roleId: number) {
  const menus = await getMenusByRoleId(roleId);
  
  const menuStructure = await Promise.all(
    menus.map(async (menu) => {
      const subMenus = await getSubMenusByMenuId(menu.id);
      return {
        ...menu,
        subMenus
      };
    })
  );

  return menuStructure;
}