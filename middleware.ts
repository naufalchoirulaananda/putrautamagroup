import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

const PUBLIC_DASHBOARD_ROUTES = [
  "/dashboard",
  "/dashboard/unauthorized",
  "/dashboard/portal-karyawan/settings-profile",
  "/dashboard/notifications",
];

let notifierInitialized = false;

// ================================
// Middleware helper: check access
// ================================
async function checkRouteAccess(
  userId: number,
  roleId: number,
  route: string
): Promise<boolean> {
  try {
    console.log(
      `[Middleware] Checking access for user ${userId}, role ${roleId} to route: ${route}`
    );

    // 1️⃣ Ambil semua menu & submenu user override jika ada
    const userMenuOverride = await query<{ menu_id: number }>(
      `SELECT menu_id FROM user_menu_access WHERE user_id = ?`,
      [userId]
    );
    const userSubMenuOverride = await query<{ sub_menu_id: number }>(
      `SELECT sub_menu_id FROM user_submenu_access WHERE user_id = ?`,
      [userId]
    );

    let accessibleMenuIds: number[] = [];
    let accessibleSubMenuIds: number[] = [];

    if (userMenuOverride.length > 0) {
      console.log(`[Middleware] Using user override access`);
      accessibleMenuIds = userMenuOverride.map((m) => m.menu_id);
      accessibleSubMenuIds = userSubMenuOverride.map((sm) => sm.sub_menu_id);
    } else {
      // 2️⃣ Jika tidak ada override, gunakan role-based access
      const roleMenuAccess = await query<{ menu_id: number }>(
        `SELECT menu_id FROM role_menu_access WHERE role_id = ?`,
        [roleId]
      );
      const roleSubMenuAccess = await query<{ submenu_id: number }>(
        `SELECT submenu_id FROM role_submenu_access WHERE role_id = ?`,
        [roleId]
      );

      accessibleMenuIds = roleMenuAccess.map((m) => m.menu_id);
      accessibleSubMenuIds = roleSubMenuAccess.map((sm) => sm.submenu_id);
    }

    // ================================
    // 3️⃣ Cek route terhadap submenu dulu
    // ================================
    const submenu = await query<{ id: number; parent_menu_id: number }>(
      `SELECT id, parent_menu_id FROM sub_menus WHERE route = ? AND is_active = TRUE`,
      [route]
    );

    if (submenu.length > 0) {
      const sub = submenu[0];
      const hasMenuAccess = accessibleMenuIds.includes(sub.parent_menu_id);
      const hasSubmenuAccess = accessibleSubMenuIds.includes(sub.id);

      console.log(
        `[Middleware] Submenu check: menu access=${hasMenuAccess}, submenu access=${hasSubmenuAccess}`
      );

      if (hasMenuAccess && hasSubmenuAccess) {
        console.log(`[Middleware] ✅ Access GRANTED via submenu`);
        return true;
      }
    }

    // ================================
    // 4️⃣ Cek route terhadap menu
    // ================================
    const menu = await query<{ id: number }>(
      `SELECT id FROM menus WHERE route = ? AND is_active = TRUE`,
      [route]
    );

    if (menu.length > 0) {
      const hasMenuAccess = accessibleMenuIds.includes(menu[0].id);
      console.log(`[Middleware] Menu check: access=${hasMenuAccess}`);
      if (hasMenuAccess) {
        console.log(`[Middleware] ✅ Access GRANTED via menu`);
        return true;
      }
    }

    // Jika tidak match, akses ditolak
    console.log(`[Middleware] ❌ No access found for route: ${route}`);
    return false;
  } catch (error) {
    console.error(`[Middleware] Error checking route access:`, error);
    return false;
  }
}

// ================================
// Middleware utama
// ================================
export default withAuth(
  async function middleware(req) {
    if (!notifierInitialized) {
      try {
        const { startAttendanceNotifier } = await import(
          "@/lib/attendance-notifier"
        );
        startAttendanceNotifier();
        notifierInitialized = true;
        console.log("[Middleware] 🔔 Attendance Notifier initialized");
      } catch (error) {
        console.error(
          "[Middleware] Failed to initialize attendance notifier:",
          error
        );
      }
    }

    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log(`[Middleware] Request to: ${path}`);

    if (!token) {
      console.log(`[Middleware] No token, redirecting to login`);
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const userId = token.id ? Number(token.id) : 0;
    const roleId = token.roleId ? Number(token.roleId) : 0;

    if (!userId || !roleId) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    if (PUBLIC_DASHBOARD_ROUTES.some((route) => path === route)) {
      console.log(`[Middleware] ✅ Public route allowed: ${path}`);
      return NextResponse.next();
    }

    const hasAccess = await checkRouteAccess(userId, roleId, path);

    if (!hasAccess) {
      console.log(
        `[Middleware] ❌ Access DENIED for user ${userId} to ${path}`
      );
      return NextResponse.redirect(new URL("/dashboard/unauthorized", req.url));
    }

    console.log(`[Middleware] ✅ Access GRANTED for user ${userId} to ${path}`);
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"],
  runtime: "nodejs",
};
