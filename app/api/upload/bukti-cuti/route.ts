// File: app/api/upload/bukti-cuti/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "File tidak ditemukan" },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Tipe file tidak didukung. Gunakan JPG, PNG, atau PDF" },
        { status: 400 }
      );
    }

    // Validasi ukuran file (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Ukuran file maksimal 5MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate nama file unik
    const timestamp = Date.now();
    const originalName = file.name.replace(/\s+/g, "_");
    const fileName = `bukti_${timestamp}_${originalName}`;

    // Path untuk menyimpan file
    const uploadDir = path.join(process.cwd(), "public", "uploads", "bukti-cuti");
    
    // Buat folder jika belum ada
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, fileName);

    // Simpan file
    await writeFile(filePath, buffer);

    // Return path relatif untuk disimpan di database
    const relativePath = `/uploads/bukti-cuti/${fileName}`;

    return NextResponse.json({
      success: true,
      message: "File berhasil diupload",
      filepath: relativePath,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { success: false, error: "Gagal upload file" },
      { status: 500 }
    );
  }
}