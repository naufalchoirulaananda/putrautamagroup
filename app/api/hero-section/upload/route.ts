// app/api/hero-section/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'image' or 'video'

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/ogg"];

    if (type === "image" && !allowedImageTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image type. Allowed: JPEG, PNG, WEBP, SVG" },
        { status: 400 }
      );
    }

    if (type === "video" && !allowedVideoTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid video type. Allowed: MP4, WEBM, OGG" },
        { status: 400 }
      );
    }

    // Batasi ukuran file (image: 5MB, video: 50MB)
    const maxSize = type === "image" ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Max size: ${type === "image" ? "5MB" : "50MB"}` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.name);
    const filename = `hero_${timestamp}_${randomStr}${ext}`;

    // Tentukan path berdasarkan tipe
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "hero-section",
      type
    );

    // Buat folder jika belum ada
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Convert file to buffer dan simpan
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Return path relatif untuk disimpan di database
    const relativePath = `/uploads/hero-section/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      filename: relativePath,
      originalName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}