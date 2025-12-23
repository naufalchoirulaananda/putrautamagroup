// app/api/logistik/perbaikan-logistik/route.ts
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { query } from "@/lib/db";

interface StokResult {
  qty_total: number;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const namaItem = formData.get("namaItem") as string;
    const tanggalPerbaikan = formData.get("tanggalPerbaikan") as string;
    const lokasi = formData.get("lokasi") as string;
    const periode = formData.get("periode") as string;
    const qtyString = formData.get("qty") as string;
    const keterangan = formData.get("keterangan") as string;

    console.log("=== DEBUG START ===");
    console.log("Tanggal diterima dari form:", tanggalPerbaikan);
    console.log("qty dari form:", qtyString, "type:", typeof qtyString);

    if (!namaItem || !tanggalPerbaikan || !lokasi || !qtyString) {
      return NextResponse.json(
        { error: "Data tidak lengkap. Mohon isi semua field yang wajib." },
        { status: 400 }
      );
    }

    // Parse qty dengan validasi ketat
    const qtyPerbaikan = Number(qtyString);
    console.log("qtyPerbaikan setelah Number():", qtyPerbaikan, "type:", typeof qtyPerbaikan);

    if (isNaN(qtyPerbaikan) || qtyPerbaikan <= 0 || !Number.isInteger(qtyPerbaikan)) {
      return NextResponse.json(
        { error: "Jumlah yang dimasukkan tidak valid (harus bilangan bulat positif)" },
        { status: 400 }
      );
    }

    // Cek stok tersedia dengan type yang benar
    const checkStok = await query<StokResult>(
      `SELECT qty_total FROM stok_logistik WHERE nama_item = ? AND lokasi = ?`,
      [namaItem, lokasi]
    );

    if (checkStok.length === 0) {
      return NextResponse.json(
        { error: "Item tidak ditemukan di stok" },
        { status: 400 }
      );
    }

    const currentQty = Number(checkStok[0].qty_total);
    console.log("currentQty dari DB:", currentQty, "type:", typeof currentQty);

    if (isNaN(currentQty)) {
      return NextResponse.json(
        { error: "Data stok tidak valid" },
        { status: 500 }
      );
    }

    if (currentQty < qtyPerbaikan) {
      return NextResponse.json(
        { error: `Stok tidak mencukupi. Stok tersedia: ${currentQty}` },
        { status: 400 }
      );
    }

    const newQty = currentQty - qtyPerbaikan;
    console.log("Perhitungan: ", currentQty, "-", qtyPerbaikan, "=", newQty);

    // ===== UPLOAD FOTO =====
    const uploadDir = path.join(process.cwd(), "public", "uploads", "logistik");
    await mkdir(uploadDir, { recursive: true });

    const fotoFiles: string[] = [];
    const timestamp = Date.now();

    for (let i = 1; i <= 10; i++) {
      const file = formData.get(`foto_${i}`) as File | null;

      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = `perbaikan_${timestamp}_foto${i}_${file.name}`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        fotoFiles.push(fileName);
      } else {
        fotoFiles.push("");
      }
    }

    // ===== FIX TIMEZONE: Langsung gunakan format YYYY-MM-DD =====
    const formattedDate = `${tanggalPerbaikan} 00:00:00`;
    console.log("📅 Tanggal diformat untuk DB:", formattedDate);
    // =============================================================

    // ===== INSERT RIWAYAT PERBAIKAN =====
    console.log("Insert ke riwayat dengan qty:", qtyPerbaikan);
    const insertResult = await query(
      `INSERT INTO riwayat_perbaikan_logistik 
       (nama_item, lokasi, qty, tanggal_perbaikan, periode, keterangan,
        foto_1, foto_2, foto_3, foto_4, foto_5, 
        foto_6, foto_7, foto_8, foto_9, foto_10)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        namaItem,
        lokasi,
        qtyPerbaikan,
        formattedDate,
        periode || null,
        keterangan || null,
        ...fotoFiles,
      ]
    );
    console.log("Insert result:", insertResult);

    // ===== UPDATE STOK LOGISTIK =====
    console.log("Update stok dengan qty_total:", newQty);
    const updateResult = await query(
      `UPDATE stok_logistik 
       SET qty_total = ?,
           tanggal_terakhir = ?,
           periode_terakhir = ?,
           keterangan_terakhir = ?
       WHERE nama_item = ? AND lokasi = ?`,
      [
        newQty,
        formattedDate,
        periode || null,
        keterangan || null,
        namaItem,
        lokasi
      ]
    );
    console.log("Update result:", updateResult);

    // Verify data yang tersimpan
    const verifyStok = await query<StokResult>(
      `SELECT qty_total FROM stok_logistik WHERE nama_item = ? AND lokasi = ?`,
      [namaItem, lokasi]
    );
    console.log("Stok setelah update:", verifyStok[0]?.qty_total);

    const verifyRiwayat = await query(
      `SELECT qty, tanggal_perbaikan FROM riwayat_perbaikan_logistik ORDER BY id DESC LIMIT 1`
    );
    console.log("Riwayat terakhir qty:", verifyRiwayat[0]?.qty);
    console.log("Riwayat terakhir tanggal:", verifyRiwayat[0]?.tanggal_perbaikan);
    console.log("=== DEBUG END ===");

    return NextResponse.json(
      {
        success: true,
        message: "Perbaikan logistik berhasil dicatat dan stok dikurangi",
        debug: {
          tanggalInput: tanggalPerbaikan,
          tanggalDisimpan: formattedDate,
          qtyInput: qtyString,
          qtyParsed: qtyPerbaikan,
          stokSebelum: currentQty,
          qtyDikurangi: qtyPerbaikan,
          stokTersisa: newQty,
          stokDiDB: verifyStok[0]?.qty_total,
          qtyRiwayatDiDB: verifyRiwayat[0]?.qty,
          tanggalRiwayatDiDB: verifyRiwayat[0]?.tanggal_perbaikan
        }
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