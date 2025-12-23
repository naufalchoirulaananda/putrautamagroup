// app/api/logistik/lokasi-logistik/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface LokasiLogistik {
  id: number;
  nama_lokasi: string;
  created_at: string;
}

interface CountResult {
  total: number;
}

// GET - Mendapatkan semua lokasi
export async function GET(request: NextRequest) {
  try {
    const results = await query<LokasiLogistik>(
      "SELECT * FROM lokasi_logistik ORDER BY nama_lokasi ASC"
    );

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data lokasi", details: error },
      { status: 500 }
    );
  }
}

// POST - Menambah lokasi baru
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nama_lokasi } = body;

    if (!nama_lokasi || nama_lokasi.trim() === "") {
      return NextResponse.json(
        { error: "Nama lokasi tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cek apakah lokasi sudah ada
    const checkExist = await query<LokasiLogistik>(
      "SELECT * FROM lokasi_logistik WHERE nama_lokasi = ?",
      [nama_lokasi.trim()]
    );

    if (checkExist.length > 0) {
      return NextResponse.json(
        { error: "Lokasi sudah terdaftar" },
        { status: 400 }
      );
    }

    // Insert lokasi baru
    await query(
      "INSERT INTO lokasi_logistik (nama_lokasi) VALUES (?)",
      [nama_lokasi.trim()]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Lokasi berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal menambahkan lokasi", details: error },
      { status: 500 }
    );
  }
}

// PUT - Update lokasi
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nama_lokasi } = body;

    if (!id || !nama_lokasi || nama_lokasi.trim() === "") {
      return NextResponse.json(
        { error: "ID dan nama lokasi tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cek apakah nama lokasi sudah digunakan oleh lokasi lain
    const checkExist = await query<LokasiLogistik>(
      "SELECT * FROM lokasi_logistik WHERE nama_lokasi = ? AND id != ?",
      [nama_lokasi.trim(), id]
    );

    if (checkExist.length > 0) {
      return NextResponse.json(
        { error: "Nama lokasi sudah digunakan" },
        { status: 400 }
      );
    }

    // Update lokasi
    await query(
      "UPDATE lokasi_logistik SET nama_lokasi = ? WHERE id = ?",
      [nama_lokasi.trim(), id]
    );

    return NextResponse.json({
      success: true,
      message: "Lokasi berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal memperbarui lokasi", details: error },
      { status: 500 }
    );
  }
}

// DELETE - Hapus lokasi
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID lokasi tidak ditemukan" },
        { status: 400 }
      );
    }

    // Ambil nama lokasi
    const lokasiData = await query<LokasiLogistik>(
      "SELECT nama_lokasi FROM lokasi_logistik WHERE id = ?",
      [id]
    );

    if (lokasiData.length === 0) {
      return NextResponse.json(
        { error: "Lokasi tidak ditemukan" },
        { status: 404 }
      );
    }

    const namaLokasi = lokasiData[0].nama_lokasi;

    // Cek apakah lokasi masih digunakan di tabel logistik (penerimaan)
    const checkLogistik = await query<CountResult>(
      "SELECT COUNT(*) as total FROM logistik WHERE lokasi = ?",
      [namaLokasi]
    );

    if (checkLogistik[0].total > 0) {
      return NextResponse.json(
        {
          error: "Lokasi tidak dapat dihapus karena masih digunakan dalam data penerimaan logistik",
        },
        { status: 400 }
      );
    }

    // Cek apakah lokasi masih digunakan di tabel stok_logistik
    const checkStok = await query<CountResult>(
      "SELECT COUNT(*) as total FROM stok_logistik WHERE lokasi = ?",
      [namaLokasi]
    );

    if (checkStok[0].total > 0) {
      return NextResponse.json(
        {
          error: "Lokasi tidak dapat dihapus karena masih digunakan dalam stok logistik",
        },
        { status: 400 }
      );
    }

    // Cek apakah lokasi masih digunakan di tabel riwayat_perbaikan_logistik
    const checkPerbaikan = await query<CountResult>(
      "SELECT COUNT(*) as total FROM riwayat_perbaikan_logistik WHERE lokasi = ?",
      [namaLokasi]
    );

    if (checkPerbaikan[0].total > 0) {
      return NextResponse.json(
        {
          error: "Lokasi tidak dapat dihapus karena masih digunakan dalam riwayat perbaikan",
        },
        { status: 400 }
      );
    }

    // Hapus lokasi
    await query("DELETE FROM lokasi_logistik WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Lokasi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Gagal menghapus lokasi", details: error },
      { status: 500 }
    );
  }
}