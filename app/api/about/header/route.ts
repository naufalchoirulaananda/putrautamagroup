// app/api/about/header/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM about_page_header WHERE is_active = 1 LIMIT 1'
    );
    return NextResponse.json({ success: true, data: result[0] || null });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, background_image, is_active } = body;

    await query(
      'INSERT INTO about_page_header (title, description, background_image, is_active) VALUES (?, ?, ?, ?)',
      [title, description, background_image, is_active ? 1 : 0]
    );

    return NextResponse.json({ success: true, message: 'Header berhasil dibuat' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, background_image, is_active } = body;

    if (id) {
      await query(
        'UPDATE about_page_header SET title = ?, description = ?, background_image = ?, is_active = ? WHERE id = ?',
        [title, description, background_image, is_active ? 1 : 0, id]
      );
    } else {
      // Update the active record
      await query(
        'UPDATE about_page_header SET title = ?, description = ?, background_image = ?, is_active = ? WHERE is_active = 1',
        [title, description, background_image, is_active ? 1 : 0]
      );
    }

    return NextResponse.json({ success: true, message: 'Header berhasil diperbarui' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
