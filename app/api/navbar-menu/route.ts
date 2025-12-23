import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface NavbarMenuRow extends RowDataPacket {
  id: number;
  parent_id: number | null;
  title: string;
  href: string | null;
  description: string | null;
  icon: string | null;
  is_mobile: boolean;
  is_dropdown: boolean;
  is_visible: boolean;
  position: number;
}

interface NavbarMenuItem extends NavbarMenuRow {
  items?: NavbarMenuItem[];
}

export async function GET() {
  try {
    // Query to fetch all visible menu items ordered by position
    const [rows] = await pool.query<NavbarMenuRow[]>(`
      SELECT * FROM navbar_menu 
      WHERE is_visible = true 
      ORDER BY position ASC
    `);

    // Organize data into hierarchical structure
    const menus = rows;

    // Build the menu tree structure
    const menuTree = menus
      .filter((menu: NavbarMenuRow) => menu.parent_id === null)
      .map((parent: NavbarMenuRow) => {
        // Filter out child items based on parent_id
        const childItems = menus.filter(
          (child: NavbarMenuRow) => child.parent_id === parent.id
        );

        // Only add child items if the menu is marked as a dropdown
        if (parent.is_dropdown && childItems.length > 0) {
          return {
            ...parent,
            items: childItems, // Attach child items as 'items'
            href: parent.href || '#', // Ensure href is set to "#" if empty
          };
        }

        // For menus without dropdown or children, just return the parent
        return {
          ...parent,
          items: childItems.length > 0 ? childItems : undefined,
          href: parent.href || '#', // Default to "#" for menu items with no link
        };
      });

    // Return the structured menu data
    return NextResponse.json(menuTree);

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}

