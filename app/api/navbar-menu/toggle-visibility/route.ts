// app/api/navbar-menu/toggle-visibility/route.ts
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { RowDataPacket } from 'mysql2';

export async function PATCH(request: NextRequest) {
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

    // Get current visibility status
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT is_visible FROM navbar_menu WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        { status: 404 }
      );
    }

    const currentStatus = rows[0].is_visible;
    const newStatus = currentStatus ? 0 : 1;

    // Toggle visibility (Soft Delete)
    await pool.query(
      'UPDATE navbar_menu SET is_visible = ? WHERE id = ?',
      [newStatus, id]
    );

    return NextResponse.json(
      { 
        message: 'Visibility toggled successfully',
        is_visible: newStatus === 1
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: 'Failed to toggle visibility' },
      { status: 500 }
    );
  }
}