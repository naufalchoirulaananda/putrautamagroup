// app/api/hero-section/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface HeroSection {
  id: number;
  type: "image" | "video";
  file_name: string;
  title: string;
  subtitle: string | null;
  cta: string | null;
  button_link: string;
  queue: number;
  is_visible: number;
  created_at: string;
  updated_at: string;
}

// GET - Ambil semua data hero section
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const visibleOnly = searchParams.get("visible") === "true";

    let sql = `
      SELECT * FROM hero_section 
      ${visibleOnly ? "WHERE is_visible = 1" : ""}
      ORDER BY queue ASC, created_at DESC
    `;

    const results = await query<HeroSection>(sql);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("GET hero section error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero sections" },
      { status: 500 }
    );
  }
}

// POST - Tambah hero section baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, file_name, title, subtitle, cta, button_link, queue } = body;

    // Validasi input
    if (!type || !file_name || !title || !button_link) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Jika queue tidak diisi, ambil queue terakhir + 1
    let finalQueue = queue;
    if (!finalQueue) {
      const maxQueueResult = await query<{ max_queue: number }>(
        "SELECT COALESCE(MAX(queue), 0) as max_queue FROM hero_section"
      );
      finalQueue = maxQueueResult[0].max_queue + 1;
    }

    const sql = `
      INSERT INTO hero_section 
      (type, file_name, title, subtitle, cta, button_link, queue, is_visible, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, NOW(), NOW())
    `;

    await query(sql, [
      type,
      file_name,
      title,
      subtitle || null,
      cta || null,
      button_link,
      finalQueue,
    ]);

    return NextResponse.json({
      success: true,
      message: "Hero section created successfully",
    });
  } catch (error) {
    console.error("POST hero section error:", error);
    return NextResponse.json(
      { error: "Failed to create hero section" },
      { status: 500 }
    );
  }
}