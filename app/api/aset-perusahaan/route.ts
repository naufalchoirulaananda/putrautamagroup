import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { existsSync } from "fs";
import { unlink } from "fs/promises";

// GET - Fetch all aset
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const divisi_id = searchParams.get("divisi_id");
    const search = searchParams.get("search");

    let sql = `
    SELECT 
      ap.*,
      ja.id as jenis_aset_id,
      ja.jenis_aset,
      d.id as divisi_id,
      d.kode_divisi,
      d.nama_divisi,
      cp.nama_cabang,
      u.name as nama_penanggung_jawab,
      u_prev.name as nama_penanggung_jawab_sebelumnya
    FROM aset_perusahaan ap
    LEFT JOIN jenis_aset ja ON ap.jenis_aset_id = ja.id
    LEFT JOIN divisi d ON ap.divisi_id = d.id
    LEFT JOIN cabang_perusahaan cp ON ap.kode_cabang = cp.kode_cabang
    LEFT JOIN users u ON ap.penanggung_jawab = u.kode_pegawai
    LEFT JOIN users u_prev ON ap.penanggung_jawab_sebelumnya = u_prev.kode_pegawai
    WHERE 1=1
  `;

    const params: any[] = [];

    if (divisi_id) {
      sql += " AND ap.divisi_id = ?";
      params.push(divisi_id);
    }

    if (search) {
      sql += " AND (ap.nama_aset LIKE ? OR ap.kode_aset LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += " ORDER BY ap.tgl_transaksi DESC";

    const aset = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: aset || [],
    });
  } catch (error) {
    console.error("Error fetching aset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data aset",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Menghapus aset beserta foto
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kode_aset = searchParams.get("kode_aset");

    if (!kode_aset) {
      return NextResponse.json(
        { success: false, message: "kode_aset tidak ditemukan" },
        { status: 400 }
      );
    }

    // Ambil path foto dari database
    const existing = await query(
      "SELECT foto_1, foto_2, foto_3, foto_4, foto_5, foto_6, foto_7, foto_8, foto_9, foto_10 FROM aset_perusahaan WHERE kode_aset = ?",
      [kode_aset]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aset tidak ditemukan" },
        { status: 404 }
      );
    }

    // 🔥 Hapus semua foto fisik yang ada
    let deletedFiles = 0;
    for (let i = 1; i <= 10; i++) {
      const fotoPath = existing[0][`foto_${i}`];
      if (fotoPath) {
        try {
          const filePath = path.join(process.cwd(), "public", fotoPath);

          console.log(`Attempting to delete: ${filePath}`);

          if (existsSync(filePath)) {
            await unlink(filePath);
            deletedFiles++;
            console.log(`✅ Deleted: ${filePath}`);
          } else {
            console.log(`⚠️ File not found: ${filePath}`);
          }
        } catch (err) {
          console.error(`Error deleting file ${fotoPath}:`, err);
        }
      }
    }

    console.log(`Total files deleted: ${deletedFiles}`);

    // Hapus record dari database
    const deleteSql = "DELETE FROM aset_perusahaan WHERE kode_aset = ?";
    await query(deleteSql, [kode_aset]);

    return NextResponse.json({
      success: true,
      message: `Aset dengan kode_aset ${kode_aset} berhasil dihapus (${deletedFiles} foto dihapus)`,
    });
  } catch (error) {
    console.error("Error deleting aset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus aset",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create new aset
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Validate required fields
    if (
      !formData.get("nama_aset") ||
      !formData.get("jenis_aset_id") ||
      !formData.get("divisi_id")
    ) {
      return NextResponse.json(
        { success: false, message: "Data aset tidak lengkap" },
        { status: 400 }
      );
    }

    // Generate kode_aset
    const lastAset = await query<{ kode_aset: string }>(
      "SELECT kode_aset FROM aset_perusahaan ORDER BY kode_aset DESC LIMIT 1"
    );

    let newKodeAset: string;
    if (lastAset.length > 0) {
      const lastCode = lastAset[0].kode_aset;
      const lastNumber = parseInt(lastCode.split("-")[2]);
      newKodeAset = `AST-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-${String(lastNumber + 1).padStart(4, "0")}`;
    } else {
      newKodeAset = `AST-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-0001`;
    }

    // Handle file uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads", "aset");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fotoUrls: { [key: string]: string | null } = {
      foto_1: null,
      foto_2: null,
      foto_3: null,
      foto_4: null,
      foto_5: null,
      foto_6: null,
      foto_7: null,
      foto_8: null,
      foto_9: null,
      foto_10: null,
    };

    // 🔥 CREATE MODE: Cari foto dengan prefix "new_foto_" (dari frontend)
    let photoIndex = 1;
    for (let i = 1; i <= 10; i++) {
      const file = formData.get(`new_foto_${i}`) as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${newKodeAset}-foto${photoIndex}-${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        fotoUrls[`foto_${photoIndex}`] = `/uploads/aset/${fileName}`;
        photoIndex++;
      }
    }

    // Validate at least one photo
    const hasPhotos = Object.values(fotoUrls).some((url) => url !== null);
    if (!hasPhotos) {
      return NextResponse.json(
        { success: false, message: "Minimal harus ada 1 foto" },
        { status: 400 }
      );
    }

    // Insert to database
    const insertSql = `
    INSERT INTO aset_perusahaan (
      kode_aset, nama_aset, jenis_aset_id,
      kode_cabang, divisi_id, luas_aset, jumlah_aset, latitude, longitude,
      keterangan, tgl_transaksi, periode, nama_pegawai,
      kode_pegawai, alamat, foto_1, foto_2, foto_3, foto_4, foto_5, 
      foto_6, foto_7, foto_8, foto_9, foto_10, status, tipe_penjualan,
      penanggung_jawab, nama_penanggung_jawab
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      newKodeAset,
      formData.get("nama_aset"),
      formData.get("jenis_aset_id"),
      formData.get("kode_cabang") || null,
      formData.get("divisi_id"),
      formData.get("luas_aset") || null,
      formData.get("jumlah_aset") || null, // BARU
      formData.get("latitude") || null,
      formData.get("longitude") || null,
      formData.get("keterangan") || null,
      formData.get("tgl_transaksi"),
      formData.get("periode"),
      formData.get("nama_pegawai"),
      formData.get("kode_pegawai"),
      formData.get("alamat") || null,
      fotoUrls.foto_1,
      fotoUrls.foto_2,
      fotoUrls.foto_3,
      fotoUrls.foto_4,
      fotoUrls.foto_5,
      fotoUrls.foto_6,
      fotoUrls.foto_7,
      fotoUrls.foto_8,
      fotoUrls.foto_9,
      fotoUrls.foto_10,
      formData.get("status") || "Belum Terjual",
      formData.get("tipe_penjualan") || "tidak_dijual", // BARU
      formData.get("penanggung_jawab") || null, // BARU
      formData.get("nama_penanggung_jawab") || null, // BARU (harus dikirim dari frontend)
    ];

    await query(insertSql, values);

    return NextResponse.json({
      success: true,
      message: "Aset berhasil ditambahkan",
      data: { kode_aset: newKodeAset },
    });
  } catch (error) {
    console.error("Error creating aset:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menambahkan aset",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// PUT - Update existing aset
export async function PUT(request: Request) {
  try {
    const formData = await request.formData();
    const kode_aset = formData.get("kode_aset");

    if (!kode_aset) {
      return NextResponse.json(
        { success: false, message: "kode_aset wajib dikirim" },
        { status: 400 }
      );
    }

    // Ambil data aset lama
    const existing = await query(
      "SELECT foto_1, foto_2, foto_3, foto_4, foto_5, foto_6, foto_7, foto_8, foto_9, foto_10 FROM aset_perusahaan WHERE kode_aset = ?",
      [kode_aset]
    );

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aset tidak ditemukan" },
        { status: 404 }
      );
    }

    const uploadDir = path.join(process.cwd(), "public", "uploads", "aset");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 🔥 STEP 1: Identifikasi foto yang dihapus user dan hapus file fisiknya
    const oldPhotos = existing[0];
    let deletedFilesCount = 0;

    for (let i = 1; i <= 10; i++) {
      const photoKey = `foto_${i}`;
      const oldPhotoUrl = oldPhotos[photoKey];
      const newPhotoUrl = formData.get(photoKey);

      // Jika foto lama ada, tapi di form baru tidak ada atau null
      if (
        oldPhotoUrl &&
        (!newPhotoUrl || newPhotoUrl === "null" || newPhotoUrl === "")
      ) {
        try {
          const filePath = path.join(process.cwd(), "public", oldPhotoUrl);

          console.log(`🗑️ Deleting removed photo: ${filePath}`);

          if (existsSync(filePath)) {
            await unlink(filePath);
            deletedFilesCount++;
            console.log(`✅ Successfully deleted: ${filePath}`);
          }
        } catch (err) {
          console.error(`Error deleting file ${oldPhotoUrl}:`, err);
        }
      }
    }

    console.log(`Total removed files deleted: ${deletedFilesCount}`);

    // 🔥 STEP 2: Inisialisasi foto URLs
    const fotoUrls: { [key: string]: string | null } = {
      foto_1: null,
      foto_2: null,
      foto_3: null,
      foto_4: null,
      foto_5: null,
      foto_6: null,
      foto_7: null,
      foto_8: null,
      foto_9: null,
      foto_10: null,
    };

    // 🔥 STEP 3: Handle existing photos dari form
    for (let i = 1; i <= 10; i++) {
      const existingKey = `foto_${i}`;
      const existingUrl = formData.get(existingKey);

      if (
        existingUrl &&
        existingUrl !== "null" &&
        existingUrl !== "" &&
        typeof existingUrl === "string"
      ) {
        fotoUrls[`foto_${i}`] = existingUrl as string;
      }
    }

    // 🔥 STEP 4: Upload foto baru
    const newFiles: File[] = [];
    for (let i = 1; i <= 10; i++) {
      const file = formData.get(`new_foto_${i}`) as File | null;
      if (file && file.size > 0) {
        newFiles.push(file);
      }
    }

    // Masukkan foto baru ke slot kosong
    let fileIndex = 0;
    for (let i = 1; i <= 10 && fileIndex < newFiles.length; i++) {
      if (!fotoUrls[`foto_${i}`]) {
        const file = newFiles[fileIndex];
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${kode_aset}-foto${Date.now()}-${i}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        fotoUrls[`foto_${i}`] = `/uploads/aset/${fileName}`;
        fileIndex++;
      }
    }

    // 🔥 STEP 5: Validasi minimal 1 foto
    const totalFotos = Object.values(fotoUrls).filter(
      (url) => url !== null && url !== undefined
    ).length;

    if (totalFotos === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Minimal harus ada 1 foto untuk setiap aset",
        },
        { status: 400 }
      );
    }

    // Update database
    const updateSql = `
    UPDATE aset_perusahaan SET
      nama_aset = ?,
      jenis_aset_id = ?,
      kode_cabang = ?,
      luas_aset = ?,
      jumlah_aset = ?,
      keterangan = ?,
      tgl_transaksi = ?,
      periode = ?,
      latitude = ?,
      longitude = ?,
      alamat = ?,
      status = ?,
      tipe_penjualan = ?,
      foto_1 = ?,
      foto_2 = ?,
      foto_3 = ?,
      foto_4 = ?,
      foto_5 = ?,
      foto_6 = ?,
      foto_7 = ?,
      foto_8 = ?,
      foto_9 = ?,
      foto_10 = ?
    WHERE kode_aset = ?
  `;

    const values = [
      formData.get("nama_aset") || null,
      formData.get("jenis_aset_id") || null,
      formData.get("kode_cabang") || null,
      formData.get("luas_aset") || null,
      formData.get("jumlah_aset") || null, // BARU
      formData.get("keterangan") || null,
      formData.get("tgl_transaksi") || null,
      formData.get("periode") || null,
      formData.get("latitude") || null,
      formData.get("longitude") || null,
      formData.get("alamat") || null,
      formData.get("status") || "Belum Terjual",
      formData.get("tipe_penjualan") || "tidak_dijual", // BARU
      fotoUrls.foto_1,
      fotoUrls.foto_2,
      fotoUrls.foto_3,
      fotoUrls.foto_4,
      fotoUrls.foto_5,
      fotoUrls.foto_6,
      fotoUrls.foto_7,
      fotoUrls.foto_8,
      fotoUrls.foto_9,
      fotoUrls.foto_10,
      kode_aset,
    ];

    await query(updateSql, values);

    return NextResponse.json({
      success: true,
      message: `Aset ${kode_aset} berhasil diperbarui${
        deletedFilesCount > 0 ? ` (${deletedFilesCount} foto lama dihapus)` : ""
      }`,
    });
  } catch (error) {
    console.error("Error updating aset:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Gagal memperbarui aset",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
