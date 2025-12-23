// app/api/logistik/penerimaan-logistik/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { query } from "@/lib/db";

interface LokasiLogistik {
  id: number;
  nama_lokasi: string;
  created_at: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const namaItem = formData.get("namaItem") as string;
    const tanggalPembelian = formData.get("tanggalPembelian") as string;
    const lokasi = formData.get("lokasi") as string;
    const periode = formData.get("periode") as string;
    const qty = formData.get("qty") as string;
    const keterangan = formData.get("keterangan") as string;

    if (!namaItem || !tanggalPembelian || !lokasi || !qty) {
      return NextResponse.json(
        { error: "Data tidak lengkap. Mohon isi semua field yang wajib." },
        { status: 400 }
      );
    }

    // Parse qty menjadi INT
    const qtyInt = parseInt(qty);
    if (isNaN(qtyInt) || qtyInt <= 0) {
      return NextResponse.json(
        { error: "Jumlah yang dimasukkan tidak valid" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "logistik");
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (err) {
      // Folder sudah ada
    }

    const fotoFiles: string[] = [];
    const timestamp = Date.now();

    for (let i = 1; i <= 10; i++) {
      const file = formData.get(`foto_${i}`) as File | null;
      
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `logistik_${timestamp}_foto${i}_${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        fotoFiles.push(fileName);
      } else {
        fotoFiles.push("");
      }
    }

    const formattedDate = new Date(tanggalPembelian)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    // 1. Insert ke tabel logistik (Riwayat Penerimaan)
    const sqlInsert = `
      INSERT INTO logistik 
      (namaItem, tanggalPembelian, lokasi, periode, qty, keterangan,
       foto_1, foto_2, foto_3, foto_4, foto_5, 
       foto_6, foto_7, foto_8, foto_9, foto_10)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await query(sqlInsert, [
      namaItem,
      formattedDate,
      lokasi,
      periode,
      qtyInt, // Kirim INT langsung
      keterangan,
      ...fotoFiles,
    ]);

    // 2. Update atau Insert ke stok_logistik
    const checkStok = await query(
      `SELECT * FROM stok_logistik WHERE nama_item = ? AND lokasi = ?`,
      [namaItem, lokasi]
    );

    if (checkStok.length > 0) {
      // Update stok yang sudah ada
      const currentQty = checkStok[0].qty_total; // Sudah INT dari DB
      const newQty = currentQty + qtyInt;

      await query(
        `UPDATE stok_logistik 
         SET qty_total = ?,
             tanggal_terakhir = ?,
             periode_terakhir = ?,
             keterangan_terakhir = ?,
             foto_terakhir_1 = ?, foto_terakhir_2 = ?, foto_terakhir_3 = ?,
             foto_terakhir_4 = ?, foto_terakhir_5 = ?, foto_terakhir_6 = ?,
             foto_terakhir_7 = ?, foto_terakhir_8 = ?, foto_terakhir_9 = ?,
             foto_terakhir_10 = ?
         WHERE nama_item = ? AND lokasi = ?`,
        [
          newQty, // Kirim INT langsung
          formattedDate,
          periode,
          keterangan,
          ...fotoFiles,
          namaItem,
          lokasi
        ]
      );
    } else {
      // Insert stok baru
      await query(
        `INSERT INTO stok_logistik
         (nama_item, lokasi, qty_total, tanggal_terakhir, periode_terakhir, keterangan_terakhir,
          foto_terakhir_1, foto_terakhir_2, foto_terakhir_3, foto_terakhir_4, foto_terakhir_5,
          foto_terakhir_6, foto_terakhir_7, foto_terakhir_8, foto_terakhir_9, foto_terakhir_10)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          namaItem,
          lokasi,
          qtyInt, // Kirim INT langsung
          formattedDate,
          periode,
          keterangan,
          ...fotoFiles
        ]
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Data logistik berhasil disimpan dan stok diperbarui",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat memproses data", details: error },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "lokasi") {
      const results = await query<LokasiLogistik>(
        "SELECT * FROM lokasi_logistik ORDER BY nama_lokasi ASC"
      );

      return NextResponse.json({
        success: true,
        data: results,
      });
    }

    return NextResponse.json(
      { error: "Invalid request type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data", details: error },
      { status: 500 }
    );
  }
}