// app/api/navbar-menu/delete/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    // Validation
    if (!id) {
      return NextResponse.json(
        { error: 'Menu ID is required' },
        { status: 400 }
      );
    }

    // Check if this menu has children
    const [children] = await pool.query<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM navbar_menu WHERE parent_id = ?',
      [id]
    );

    if (children[0].count > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete menu with sub-items. Please delete or reassign child items first.',
          hasChildren: true
        },
        { status: 400 }
      );
    }

    // Hard Delete - permanently remove from database
    const [result] = await pool.query(
      'DELETE FROM navbar_menu WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: 'Menu deleted permanently' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      { status: 500 }
    );
  }
}