// app/api/menus/all/route.ts
import { NextResponse } from "next/server";
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

export async function GET() {
  try {
    // Ambil SEMUA menu (termasuk yang tidak aktif)
    const menus = await query<Menu>(
      `SELECT * FROM menus ORDER BY id`
    );

    // Ambil SEMUA submenu (termasuk yang tidak aktif)
    const subMenus = await query<SubMenu>(
      `SELECT * FROM sub_menus ORDER BY parent_menu_id, id`
    );

    // Gabungkan menu dengan submenu
    const menusWithSubMenus = menus.map((menu) => ({
      ...menu,
      subMenus: subMenus.filter((sub) => sub.parent_menu_id === menu.id),
    }));

    return NextResponse.json(menusWithSubMenus);
  } catch (error) {
    console.error("Error fetching all menus:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}