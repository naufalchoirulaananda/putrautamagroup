// app/api/about/sections/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tabId = searchParams.get('tab_id');

    if (!tabId) {
      return NextResponse.json({ success: false, message: 'tab_id diperlukan' }, { status: 400 });
    }

    const result = await query(
      'SELECT * FROM about_tab_sections WHERE tab_id = ? ORDER BY sort_order ASC',
      [tabId]
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
    const { tab_id, section_type, title, content, image, sort_order } = body;

    await query(
      'INSERT INTO about_tab_sections (tab_id, section_type, title, content, image, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
      [tab_id, section_type, title || null, content || null, image || null, sort_order]
    );

    return NextResponse.json({ success: true, message: 'Section berhasil dibuat' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tab_id, section_type, title, content, image, sort_order } = body;

    await query(
      'UPDATE about_tab_sections SET tab_id = ?, section_type = ?, title = ?, content = ?, image = ?, sort_order = ? WHERE id = ?',
      [tab_id, section_type, title || null, content || null, image || null, sort_order, id]
    );

    return NextResponse.json({ success: true, message: 'Section berhasil diperbarui' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    await query('DELETE FROM about_tab_sections WHERE id = ?', [id]);

    return NextResponse.json({ success: true, message: 'Section berhasil dihapus' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}