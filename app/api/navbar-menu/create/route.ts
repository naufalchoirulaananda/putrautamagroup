// app/api/navbar-menu/create/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      parent_id,
      title,
      href,
      description,
      icon,
      is_mobile,
      is_dropdown,
      is_visible,
      position
    } = body;

    // Validation
    if (!title || !href) {
      return NextResponse.json(
        { error: 'Title and href are required' },
        { status: 400 }
      );
    }

    // Insert new menu item
    const [result] = await pool.query(
      `INSERT INTO navbar_menu 
        (parent_id, title, href, description, icon, is_mobile, is_dropdown, is_visible, position) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        parent_id || null,
        title,
        href,
        description || null,
        icon || null,
        is_mobile ? 1 : 0,
        is_dropdown ? 1 : 0,
        is_visible ? 1 : 0,
        position || 0
      ]
    );

    return NextResponse.json(
      { 
        message: 'Menu created successfully',
        id: (result as any).insertId
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to create menu item' },
      { status: 500 }
    );
  }
}