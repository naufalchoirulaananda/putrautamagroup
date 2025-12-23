"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";

interface Menu {
  id: number;
  name: string;
  route: string;
  icon: string;
  parent_id: number | null;
  is_active: boolean;
  parent_menu_id: number;
  children: Menu[];
}

export default function DynamicBreadcrumb() {
  const pathname = usePathname();
  const [currentMenu, setCurrentMenu] = useState<string>("Dashboard");
  const [parentMenu, setParentMenu] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMenus() {
      try {
        const response = await fetch("/api/menus");
        const json = await response.json();

        // API bisa return object error -> ubah jadi array kosong
        const menus: Menu[] = Array.isArray(json) ? json : [];

        const findMenu = (
          items: Menu[],
          path: string
        ): { current: string; parent: string | null } | null => {
          if (!Array.isArray(items)) return null;

          for (const item of items) {
            if (item.route === path) {
              return { current: item.name, parent: null };
            }

            if (Array.isArray(item.children) && item.children.length > 0) {
              for (const child of item.children) {
                if (child.route === path) {
                  return { current: child.name, parent: item.name };
                }
              }
            }
          }
          return null;
        };

        function slugToTitle(slug: string) {
          return slug
            .replace(/-/g, " ") // ubah "-" jadi spasi
            .replace(/\b\w/g, (c) => c.toUpperCase()); // kapital tiap kata
        }

        const result = findMenu(menus, pathname);

        if (result) {
          setCurrentMenu(result.current);
          setParentMenu(result.parent);
        } else {
          const lastPart = pathname.split("/").pop() || "Dashboard";
          setCurrentMenu(slugToTitle(lastPart));
          setParentMenu(null);
        }
        
      } catch (error) {
        console.error("Error fetching menus:", error);
      }
    }

    fetchMenus();
  }, [pathname]);

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
        </BreadcrumbItem>

        {parentMenu && (
          <>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">{parentMenu}</BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentMenu}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
