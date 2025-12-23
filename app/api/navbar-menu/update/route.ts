// app/api/navbar-menu/update/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      id,
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
    if (!id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    if (!title || !href) {
      return NextResponse.json(
        { error: 'Title and href are required' },
        { status: 400 }
      );
    }

    // Update menu item
    const [result] = await pool.query(
      `UPDATE navbar_menu 
      SET 
        parent_id = ?,
        title = ?,
        href = ?,
        description = ?,
        icon = ?,
        is_mobile = ?,
        is_dropdown = ?,
        is_visible = ?,
        position = ?
      WHERE id = ?`,
      [
        parent_id || null,
        title,
        href,
        description || null,
        icon || null,
        is_mobile ? 1 : 0,
        is_dropdown ? 1 : 0,
        is_visible ? 1 : 0,
        position || 0,
        id
      ]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Menu updated successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      { status: 500 }
    );
  }
}