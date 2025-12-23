// app/api/hero-section/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

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
}

// GET - Ambil single hero section by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const sql = "SELECT * FROM hero_section WHERE id = ?";
    const results = await query<HeroSection>(sql, [id]);

    if (results.length === 0) {
      return NextResponse.json(
        { error: "Hero section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: results[0],
    });
  } catch (error) {
    console.error("GET single hero section error:", error);
    return NextResponse.json(
      { error: "Failed to fetch hero section" },
      { status: 500 }
    );
  }
}

// PUT - Update hero section
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { type, file_name, title, subtitle, cta, button_link, queue, is_visible } = body;

    // Cek apakah hero section ada
    const existing = await query<HeroSection>(
      "SELECT * FROM hero_section WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Hero section not found" },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: any[] = [];

    if (type !== undefined) {
      updates.push("type = ?");
      values.push(type);
    }
    if (file_name !== undefined) {
      updates.push("file_name = ?");
      values.push(file_name);
    }
    if (title !== undefined) {
      updates.push("title = ?");
      values.push(title);
    }
    if (subtitle !== undefined) {
      updates.push("subtitle = ?");
      values.push(subtitle);
    }
    if (cta !== undefined) {
      updates.push("cta = ?");
      values.push(cta);
    }
    if (button_link !== undefined) {
      updates.push("button_link = ?");
      values.push(button_link);
    }
    if (queue !== undefined) {
      updates.push("queue = ?");
      values.push(queue);
    }
    if (is_visible !== undefined) {
      updates.push("is_visible = ?");
      values.push(is_visible);
    }

    updates.push("updated_at = NOW()");
    values.push(id);

    const sql = `UPDATE hero_section SET ${updates.join(", ")} WHERE id = ?`;
    await query(sql, values);

    return NextResponse.json({
      success: true,
      message: "Hero section updated successfully",
    });
  } catch (error) {
    console.error("PUT hero section error:", error);
    return NextResponse.json(
      { error: "Failed to update hero section" },
      { status: 500 }
    );
  }
}

// DELETE - Hard delete hero section
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Ambil data untuk hapus file
    const existing = await query<HeroSection>(
      "SELECT * FROM hero_section WHERE id = ?",
      [id]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Hero section not found" },
        { status: 404 }
      );
    }

    const heroSection = existing[0];

    // Hapus dari database
    await query("DELETE FROM hero_section WHERE id = ?", [id]);

    // Hapus file fisik jika ada
    try {
      const filePath = path.join(process.cwd(), "public", heroSection.file_name);
      if (existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (fileError) {
      console.error("Error deleting file:", fileError);
      // Lanjutkan meskipun gagal hapus file
    }

    return NextResponse.json({
      success: true,
      message: "Hero section deleted successfully",
    });
  } catch (error) {
    console.error("DELETE hero section error:", error);
    return NextResponse.json(
      { error: "Failed to delete hero section" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle visibility (soft delete)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { is_visible } = body;

    if (is_visible === undefined) {
      return NextResponse.json(
        { error: "is_visible field is required" },
        { status: 400 }
      );
    }

    await query(
      "UPDATE hero_section SET is_visible = ?, updated_at = NOW() WHERE id = ?",
      [is_visible ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: `Hero section ${is_visible ? "shown" : "hidden"} successfully`,
    });
  } catch (error) {
    console.error("PATCH hero section error:", error);
    return NextResponse.json(
      { error: "Failed to update visibility" },
      { status: 500 }
    );
  }
}