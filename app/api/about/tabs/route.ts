// app/api/about/tabs/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM about_tabs ORDER BY sort_order ASC'
    );
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slug, title, sort_order, is_active } = body;

    // Check if slug already exists
    const existing = await query(
      'SELECT id FROM about_tabs WHERE slug = ?',
      [slug]
    );

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Slug sudah digunakan' }, { status: 400 });
    }

    await query(
      'INSERT INTO about_tabs (slug, title, sort_order, is_active) VALUES (?, ?, ?, ?)',
      [slug, title, sort_order, is_active ? 1 : 0]
    );

    return NextResponse.json({ success: true, message: 'Tab berhasil dibuat' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, slug, title, sort_order, is_active } = body;

    // Check if slug already exists (except current record)
    const existing = await query(
      'SELECT id FROM about_tabs WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if (existing.length > 0) {
      return NextResponse.json({ success: false, message: 'Slug sudah digunakan' }, { status: 400 });
    }

    await query(
      'UPDATE about_tabs SET slug = ?, title = ?, sort_order = ?, is_active = ? WHERE id = ?',
      [slug, title, sort_order, is_active ? 1 : 0, id]
    );

    return NextResponse.json({ success: true, message: 'Tab berhasil diperbarui' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Delete related sections first
    await query('DELETE FROM about_tab_sections WHERE tab_id = ?', [id]);
    
    // Delete tab
    await query('DELETE FROM about_tabs WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Tab berhasil dihapus' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}