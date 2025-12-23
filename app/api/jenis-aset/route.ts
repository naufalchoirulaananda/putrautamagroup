import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET endpoint untuk mengambil jenis aset
export async function GET() {
  try {
    const jenisAset = await query<{
      id: number;
      jenis_aset: string;
    }>("SELECT id, jenis_aset FROM jenis_aset ORDER BY jenis_aset ASC");

    return NextResponse.json({
      success: true,
      data: jenisAset,
    });
  } catch (error) {
    console.error("Error fetching jenis aset:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil data jenis aset" },
      { status: 500 }
    );
  }
}

// POST endpoint untuk menambahkan jenis aset baru
export async function POST(req: Request) {
  try {
    const { jenis_aset } = await req.json();

    if (!jenis_aset) {
      return NextResponse.json(
        { success: false, message: "Nama jenis aset tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cek apakah jenis aset sudah ada
    const existing = await query(
      "SELECT id FROM jenis_aset WHERE jenis_aset = ?",
      [jenis_aset]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Jenis aset sudah ada" },
        { status: 400 }
      );
    }

    // Insert jenis aset baru ke dalam database
    await query(
      "INSERT INTO jenis_aset (jenis_aset) VALUES (?)",
      [jenis_aset]
    );

    // Gunakan LAST_INSERT_ID untuk mendapatkan ID jenis aset yang baru
    const lastInsertIdResult = await query("SELECT LAST_INSERT_ID() AS id");
    const newJenisAsetId = lastInsertIdResult[0]?.id;

    if (newJenisAsetId) {
      return NextResponse.json({
        success: true,
        message: "Jenis aset berhasil ditambahkan",
        data: { id: newJenisAsetId, jenis_aset },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Gagal menambahkan jenis aset" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error adding jenis aset:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menambahkan jenis aset" },
      { status: 500 }
    );
  }
}

// PUT endpoint untuk update jenis aset
export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    console.log("PUT Request - ID:", id); // Debug log
    
    const body = await req.json();
    const { jenis_aset } = body;
    
    console.log("PUT Request - Body:", body); // Debug log

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID jenis aset tidak ditemukan" },
        { status: 400 }
      );
    }

    if (!jenis_aset || jenis_aset.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Nama jenis aset tidak boleh kosong" },
        { status: 400 }
      );
    }

    // Cek apakah ID ada di database
    const checkId = await query(
      "SELECT id FROM jenis_aset WHERE id = ?",
      [id]
    );

    if (checkId.length === 0) {
      return NextResponse.json(
        { success: false, message: "Jenis aset tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah jenis aset dengan nama yang sama sudah ada (kecuali ID yang sedang diedit)
    const existing = await query(
      "SELECT id FROM jenis_aset WHERE jenis_aset = ? AND id != ?",
      [jenis_aset, id]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Jenis aset dengan nama tersebut sudah ada" },
        { status: 400 }
      );
    }

    // Update jenis aset
    await query(
      "UPDATE jenis_aset SET jenis_aset = ? WHERE id = ?",
      [jenis_aset, id]
    );

    console.log("Update success for ID:", id); // Debug log

    return NextResponse.json({
      success: true,
      message: "Jenis aset berhasil diperbarui",
      data: { id: parseInt(id), jenis_aset },
    });
  } catch (error) {
    console.error("Error updating jenis aset:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui jenis aset: " + (error instanceof Error ? error.message : "Unknown error") },
      { status: 500 }
    );
  }
}

// DELETE endpoint untuk menghapus jenis aset
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID jenis aset tidak ditemukan" },
        { status: 400 }
      );
    }

    // Cek apakah jenis aset sedang digunakan di tabel aset_perusahaan
    const isUsed = await query(
      "SELECT COUNT(*) as count FROM aset_perusahaan WHERE jenis_aset_id = ?",
      [id]
    );

    if (isUsed[0]?.count > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: "Jenis aset tidak dapat dihapus karena masih digunakan pada aset perusahaan" 
        },
        { status: 400 }
      );
    }

    // Hapus jenis aset
    await query("DELETE FROM jenis_aset WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: "Jenis aset berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting jenis aset:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus jenis aset" },
      { status: 500 }
    );
  }
}