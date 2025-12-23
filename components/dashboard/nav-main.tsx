// File: components/app-sidebar/nav-main.tsx (UPDATED)
"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { getIcon } from "@/lib/icon-mapping";
import { useSession } from "next-auth/react";

interface MenuItem {
  id: number;
  name: string;
  route: string;
  icon: string;
  parent_id: number | null;
  order_index: number;
  is_active: boolean;
  children?: MenuItem[];
}

export default function NavMain() {
  const { data: session } = useSession();
  const { isMobile, setOpenMobile } = useSidebar();
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set());
  // const [pendingCount, setPendingCount] = useState(0);
  const pathname = usePathname();

  // Fetch menus
  useEffect(() => {
    async function fetchMenus() {
      try {
        const response = await fetch("/api/menus", {
          cache: "no-store"
        });
        
        if (response.ok) {
          const data = await response.json();
          setMenus(data);

          const menusToExpand = new Set<number>();

          data.forEach((menu: MenuItem) => {
            if (menu.children && menu.children.length > 0) {
              const hasActiveChild = menu.children.some((child) =>
                pathname.startsWith(child.route)
              );

              if (hasActiveChild) {
                menusToExpand.add(menu.id);
              }
            }
          });

          setExpandedMenus(menusToExpand);
        }
      } catch (error) {
        console.error("Error fetching menus:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMenus();
  }, [pathname]);

  // // Fetch pending approval count
  // useEffect(() => {
  //   async function fetchPendingCount() {
  //     if (!session?.user) return;

  //     try {
  //       const response = await fetch("/api/notifications/count");
  //       const result = await response.json();

  //       if (result.success) {
  //         setPendingCount(result.count);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching pending count:", error);
  //     }
  //   }

  //   fetchPendingCount();

  //   // Poll every 30 seconds
  //   const interval = setInterval(fetchPendingCount, 30000);

  //   return () => clearInterval(interval);
  // }, [session]);

  // Update expanded menus when pathname changes
  useEffect(() => {
    if (menus.length === 0) return;

    const menusToExpand = new Set<number>();
    menus.forEach((menu: MenuItem) => {
      if (menu.children && menu.children.length > 0) {
        const hasActiveChild = menu.children.some((child) =>
          pathname.startsWith(child.route)
        );
        if (hasActiveChild) {
          menusToExpand.add(menu.id);
        }
      }
    });
    setExpandedMenus(menusToExpand);
  }, [pathname, menus]);

  const toggleMenu = (menuId: number) => {
    setExpandedMenus((prev) => {
      const updated = new Set(prev);
      updated.has(menuId) ? updated.delete(menuId) : updated.add(menuId);
      return updated;
    });
  };

  const isActiveRoute = (route: string | null) => {
    if (!route || route === "#") return false;
    if (route === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(route);
  };

  // Check if menu should show notification badge
  const shouldShowBadge = (menuRoute: string) => {
    // if (pendingCount === 0) return false;
    
    // Show badge for approval pages
    return (
      menuRoute === "/dashboard/portal-karyawan/daftar-permohonan-cuti" ||
      menuRoute === "/dashboard/portal-hr/daftar-permohonan-cuti"
    );
  };

  // Handler untuk close sidebar di mobile setelah klik menu
  const handleMenuClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  if (loading) {
    return (
      <SidebarGroup>
        <SidebarGroupLabel>Menu</SidebarGroupLabel>
        <div className="px-2 py-4 text-sm text-muted-foreground">
          Loading menu...
        </div>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>

      <SidebarMenu data-sidebar="menu">
        {menus.map((menu) => {
          const Icon = getIcon(menu.icon);
          const isActive = isActiveRoute(menu.route);
          const hasChildren = menu.children && menu.children.length > 0;
          const hasValidRoute = menu.route && menu.route !== "#";
          const showBadge = shouldShowBadge(menu.route);

          return (
            <Collapsible
              key={menu.id}
              asChild
              className="group/collapsible"
              open={expandedMenus.has(menu.id)}
              onOpenChange={() => toggleMenu(menu.id)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton 
                    tooltip={menu.name} 
                    asChild={!hasChildren && hasValidRoute ? true : undefined}
                  >
                    {hasChildren || !hasValidRoute ? (
                      <div className="flex gap-2 items-center w-full cursor-pointer">
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className={isActive ? "font-semibold" : ""}>
                          {menu.name}
                        </span>
                        {/* {showBadge && (
                          <span className="ml-auto mr-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {pendingCount}
                          </span>
                        )} */}
                        {hasChildren && (
                          <ChevronRight
                            className="ml-auto h-4 transition-transform duration-200 
                            group-data-[state=open]/collapsible:rotate-90"
                          />
                        )}
                      </div>
                    ) : (
                      <Link 
                        href={menu.route} 
                        className="flex items-center w-full"
                        onClick={handleMenuClick}
                      >
                        {Icon && <Icon className="w-4 h-4" />}
                        <span className={isActive ? "font-semibold" : ""}>
                          {menu.name}
                        </span>
                        {/* {showBadge && (
                          <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                            {pendingCount}
                          </span>
                        )} */}
                      </Link>
                    )}
                  </SidebarMenuButton>
                </CollapsibleTrigger>

                {hasChildren && (
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {menu.children!.map((child) => {
                        const isChildActive = pathname.startsWith(child.route || "");
                        const hasChildValidRoute = child.route && child.route !== "#";
                        const showChildBadge = shouldShowBadge(child.route);
                        
                        return (
                          <SidebarMenuSubItem key={child.id}>
                            <SidebarMenuSubButton asChild={hasChildValidRoute ? true : undefined}>
                              {hasChildValidRoute ? (
                                <Link 
                                  href={child.route} 
                                  className="flex items-center w-full"
                                  onClick={handleMenuClick}
                                >
                                  <span className={isChildActive ? "font-semibold" : ""}>
                                    {child.name}
                                  </span>
                                  {/* {showChildBadge && (
                                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                      {pendingCount}
                                    </span>
                                  )} */}
                                </Link>
                              ) : (
                                <div className="flex items-center w-full">
                                  <span className={isChildActive ? "font-semibold" : ""}>
                                    {child.name}
                                  </span>
                                  {/* {showChildBadge && (
                                    <span className="ml-auto px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                                      {pendingCount}
                                    </span>
                                  )} */}
                                </div>
                              )}
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        );
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                )}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}