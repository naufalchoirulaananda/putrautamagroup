import * as React from "react";
import Link from "next/link";
import {
  SearchIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
  UserRound,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEffect, useRef, useState } from "react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useScrollVisibility } from "@/hooks/useScrollVisibility";

interface NavbarMenuItem {
  id: number;
  parent_id: number | null;
  title: string;
  href: string;
  description: string | null;
  icon: string | null;
  is_mobile: boolean;
  is_dropdown: boolean;
  is_visible: boolean;
  position: number;
  items?: NavbarMenuItem[];
}

export function Navbar() {
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const [menuData, setMenuData] = useState<NavbarMenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [isScrolled, setIsScrolled] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setOpenDropdown(null);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await fetch("/api/navbar-menu");
        if (!response.ok) throw new Error("Failed to fetch menu data");
        const data = await response.json();
        setMenuData(data);
      } catch (error) {
        console.error("Error fetching menu:", error);
        setMenuData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();

    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    setOpenDropdown(null);
  };

  const toggleDropdown = (menu: string) => {
    setOpenDropdown(openDropdown === menu ? null : menu);
  };

  const isNavbarVisible = useScrollVisibility(800);

  const desktopMenus = menuData.filter((menu) => !menu.is_mobile);
  const mobileMenus = menuData.filter(
    (menu) => menu.is_mobile || !menu.is_mobile
  );

  return (
    <>
      <div
        className={`fixed z-50 top-0 left-0 w-full transition-transform duration-300 ${
          isNavbarVisible ? "translate-y-0" : "-translate-y-full"
        } ${isScrolled ? "bg-gray-900" : ""}`}
      >
        <div className="container mx-auto px-6 sm:px-[70px]">
          {/* Desktop & Mobile Header */}
          <div className="flex items-center justify-between h-24 sm:h-32">
            {/* Kolom Kiri - Logo */}
            <div className="shrink-0">
              <Link href="/">
                <div
                  className={`text-xl font-bold text-white transition-colors`}
                >
                  Putra Utama Group
                </div>
              </Link>
            </div>

            {/* Kolom Tengah - Desktop Menu */}
            <div className="hidden md:flex flex-1 justify-center">
              <NavigationMenu>
                <NavigationMenuList>
                  {desktopMenus.map((menu) => (
                    <NavigationMenuItem key={menu.id}>
                      {menu.is_dropdown &&
                      Array.isArray(menu.items) &&
                      menu.items.length > 0 ? (
                        <>
                          <NavigationMenuTrigger>
                            {menu.title}
                          </NavigationMenuTrigger>
                          <NavigationMenuContent>
                            {/* If menu id is 1, display a custom layout */}
                            {menu.id === 1 ? (
                              <ul className="grid gap-2 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                                <li className="row-span-3">
                                  <NavigationMenuLink asChild>
                                    <Link
                                      className="flex h-full w-full bg-[#002E9A] select-none flex-col justify-end rounded-md bg-linear-to-t from-muted/10 to-muted p-6 no-underline outline-none focus:shadow-md"
                                      href="/tentang-kami"
                                    >
                                      <div className="mb-2 mt-4 text-white text-lg font-medium">
                                        Sekilas Perusahaan
                                      </div>
                                      <p className="text-sm leading-tight text-white">
                                        Temukan sejarah, visi, misi, dan nilai
                                        yang menjadi dasar perusahaan kami.
                                      </p>
                                    </Link>
                                  </NavigationMenuLink>
                                </li>
                                {/* Render other items normally */}
                                {menu.items.map((item) => (
                                  <ListItem
                                    key={item.id}
                                    title={item.title}
                                    href={item.href}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </ul>
                            ) : (
                              <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                                {menu.items.map((item) => (
                                  <ListItem
                                    key={item.id}
                                    title={item.title}
                                    href={item.href}
                                  >
                                    {item.description}
                                  </ListItem>
                                ))}
                              </ul>
                            )}
                          </NavigationMenuContent>
                        </>
                      ) : (
                        <NavigationMenuLink asChild>
                          <Link
                            href={menu.href}
                            className={navigationMenuTriggerStyle()}
                          >
                            {menu.title}
                          </Link>
                        </NavigationMenuLink>
                      )}
                    </NavigationMenuItem>
                  ))}
                </NavigationMenuList>
              </NavigationMenu>
            </div>

            {/* Kolom Kanan - Icons */}
            <div className="flex items-center gap-4">
              <Link href="/" className={`transition-colors text-white`}>
                <SearchIcon size={20} />
              </Link>
              <span
                className={`border-[1.5px] 
                } h-6 mx-2 hidden md:block`}
              ></span>
              <Link href="/login" className={`transition-colors text-white`}>
                <UserRound size={20} />
              </Link>

              {/* Hamburger Menu - Mobile Only */}
              <button
                onClick={toggleMenu}
                className="md:hidden text-white transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobile && isMenuOpen && (
            <div
              ref={menuRef}
              className="md:hidden border-t bg-white rounded-md absolute top-full left-0 right-0 mx-4 mt-4 z-40"
            >
              <div className="py-4 space-y-2">
                {mobileMenus.map((menu) => (
                  <div key={menu.id}>
                    {menu.is_dropdown &&
                    Array.isArray(menu.items) &&
                    menu.items.length > 0 ? (
                      <>
                        <button
                          onClick={() => toggleDropdown(menu.id.toString())}
                          className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <span>{menu.title}</span>
                          <ChevronDownIcon
                            size={20}
                            className={`transform transition-transform ${
                              openDropdown === menu.id.toString()
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                        {openDropdown === menu.id.toString() && (
                          <div className="px-4 mt-2 space-y-2">
                            {menu.items.map((item) => (
                              <Link
                                key={item.id}
                                href={item.href}
                                className="block px-4 py-2 text-sm hover:bg-gray-50 rounded-md"
                                onClick={toggleMenu}
                              >
                                <div className="font-medium">{item.title}</div>
                                {item.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {item.description}
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={menu.href}
                        className="block px-4 py-2 hover:bg-gray-100 transition-colors"
                        onClick={toggleMenu}
                      >
                        <span>{menu.title}</span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string; title: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink href={href}>
        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </div>
      </NavigationMenuLink>
    </li>
  );
}
