// app/api/navbar-menu/all/route.ts
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

interface NavbarMenuRow extends RowDataPacket {
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
}

export async function GET() {
  try {
    // Query to fetch ALL menu items (including hidden ones) for dashboard management
    const [rows] = await pool.query<NavbarMenuRow[]>(`
      SELECT * FROM navbar_menu 
      ORDER BY 
        CASE WHEN parent_id IS NULL THEN position ELSE 999999 END,
        parent_id,
        position ASC
    `);

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu data' },
      { status: 500 }
    );
  }
}