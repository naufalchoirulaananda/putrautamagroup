import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

// GET - Fetch riwayat mutasi
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kode_aset = searchParams.get("kode_aset");
    const tipe_mutasi = searchParams.get("tipe_mutasi");
    const divisi_id = searchParams.get("divisi_id");

    let sql = `
      SELECT 
        m.*,
        a.nama_aset
      FROM mutasi_aset m
      LEFT JOIN aset_perusahaan a ON m.kode_aset = a.kode_aset
      WHERE 1=1
    `;

    const params: any[] = [];

    if (kode_aset) {
      sql += " AND m.kode_aset = ?";
      params.push(kode_aset);
    }

    if (tipe_mutasi) {
      sql += " AND m.tipe_mutasi = ?";
      params.push(tipe_mutasi);
    }

    if (divisi_id) {
      sql += " AND (m.divisi_asal = ? OR m.divisi_tujuan = ?)";
      params.push(divisi_id, divisi_id);
    }

    sql += " ORDER BY m.tanggal_mutasi DESC";

    const mutasi = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: mutasi || [],
    });
  } catch (error) {
    console.error("Error fetching mutasi:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal mengambil data mutasi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// POST - Create mutasi baru dengan foto bukti
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();

    const kode_aset = formData.get("kode_aset");
    const tipe_mutasi = formData.get("tipe_mutasi");
    const divisi_tujuan = formData.get("divisi_tujuan");
    const cabang_tujuan = formData.get("cabang_tujuan");
    const penanggung_jawab_tujuan = formData.get("penanggung_jawab_tujuan");
    const alasan_mutasi = formData.get("alasan_mutasi");
    const keterangan = formData.get("keterangan");

    // Validasi
    if (!kode_aset || !tipe_mutasi || !divisi_tujuan) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Data tidak lengkap. Pastikan kode_aset, tipe_mutasi, dan divisi_tujuan diisi",
        },
        { status: 400 }
      );
    }

    // Ambil data aset dengan JOIN ke divisi
    const asetData = await query(
      `SELECT 
          a.*,
          d.kode_divisi as divisi_kode_asal,
          d.nama_divisi as nama_divisi_asal,
          cb.nama_cabang as nama_cabang_asal,
          u.name as nama_penanggung_jawab_asal
        FROM aset_perusahaan a
        LEFT JOIN divisi d ON a.divisi_id = d.id
        LEFT JOIN cabang_perusahaan cb ON a.kode_cabang = cb.kode_cabang
        LEFT JOIN users u ON a.penanggung_jawab = u.kode_pegawai
        WHERE a.kode_aset = ?`,
      [kode_aset]
    );

    if (!asetData || asetData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Aset tidak ditemukan" },
        { status: 404 }
      );
    }

    const aset = asetData[0];

    // Ambil data divisi tujuan
    const divisiTujuanData = await query(
      "SELECT kode_divisi, nama_divisi FROM divisi WHERE kode_divisi = ?",
      [divisi_tujuan]
    );

    if (!divisiTujuanData || divisiTujuanData.length === 0) {
      return NextResponse.json(
        { success: false, message: "Divisi tujuan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Ambil data cabang tujuan (jika ada)
    let cabangTujuanData = null;
    if (cabang_tujuan) {
      const result = await query(
        "SELECT nama_cabang FROM cabang_perusahaan WHERE kode_cabang = ?",
        [cabang_tujuan]
      );
      cabangTujuanData = result.length > 0 ? result[0] : null;
    }

    // Ambil data penanggung jawab tujuan (jika ada)
    let penanggungJawabTujuanData = null;
    if (penanggung_jawab_tujuan) {
      const result = await query(
        "SELECT name FROM users WHERE kode_pegawai = ?",
        [penanggung_jawab_tujuan]
      );
      penanggungJawabTujuanData = result.length > 0 ? result[0] : null;
    }

    // Generate kode mutasi
    const lastMutasi = await query(
      "SELECT kode_mutasi FROM mutasi_aset ORDER BY kode_mutasi DESC LIMIT 1"
    );

    let newKodeMutasi: string;
    if (lastMutasi.length > 0) {
      const lastCode = lastMutasi[0].kode_mutasi;
      const lastNumber = parseInt(lastCode.split("-")[2]);
      newKodeMutasi = `MUT-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-${String(lastNumber + 1).padStart(4, "0")}`;
    } else {
      newKodeMutasi = `MUT-${new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "")}-0001`;
    }

    // 📸 Handle foto bukti mutasi (maksimal 5, OPSIONAL)
    const uploadDir = path.join(process.cwd(), "public", "uploads", "mutasi");
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const fotoBukti: { [key: string]: string | null } = {
      foto_bukti_1: null,
      foto_bukti_2: null,
      foto_bukti_3: null,
      foto_bukti_4: null,
      foto_bukti_5: null,
    };

    let photoIndex = 1;
    for (let i = 1; i <= 5; i++) {
      const file = formData.get(`foto_bukti_${i}`) as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${newKodeMutasi}-foto${photoIndex}-${Date.now()}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        fotoBukti[`foto_bukti_${photoIndex}`] = `/uploads/mutasi/${fileName}`;
        photoIndex++;
      }
    }

    // Insert mutasi dengan foto bukti
    const insertMutasiSql = `
      INSERT INTO mutasi_aset (
        kode_mutasi,
        kode_aset,
        tipe_mutasi,
        divisi_asal,
        nama_divisi_asal,
        cabang_asal,
        nama_cabang_asal,
        penanggung_jawab_asal,
        nama_penanggung_jawab_asal,
        divisi_tujuan,
        nama_divisi_tujuan,
        cabang_tujuan,
        nama_cabang_tujuan,
        penanggung_jawab_tujuan,
        nama_penanggung_jawab_tujuan,
        alasan_mutasi,
        keterangan,
        foto_bukti_1,
        foto_bukti_2,
        foto_bukti_3,
        foto_bukti_4,
        foto_bukti_5,
        dibuat_oleh,
        nama_pembuat,
        tanggal_mutasi
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    await query(insertMutasiSql, [
      newKodeMutasi,
      kode_aset,
      tipe_mutasi,
      aset.divisi_kode_asal,
      aset.nama_divisi_asal,
      aset.kode_cabang || null,
      aset.nama_cabang_asal || null,
      aset.penanggung_jawab || null,
      aset.nama_penanggung_jawab_asal || null,
      divisi_tujuan,
      divisiTujuanData[0].nama_divisi,
      cabang_tujuan || null,
      cabangTujuanData?.nama_cabang || null,
      penanggung_jawab_tujuan || null,
      penanggungJawabTujuanData?.name || null,
      alasan_mutasi || null,
      keterangan || null,
      fotoBukti.foto_bukti_1,
      fotoBukti.foto_bukti_2,
      fotoBukti.foto_bukti_3,
      fotoBukti.foto_bukti_4,
      fotoBukti.foto_bukti_5,
      session.user.kode_pegawai,
      session.user.name,
    ]);

    // Update aset_perusahaan
    const divisiIdData = await query(
      "SELECT id FROM divisi WHERE kode_divisi = ?",
      [divisi_tujuan]
    );

    const divisi_id_tujuan = divisiIdData[0]?.id;

    const updateAsetSql = `
    UPDATE aset_perusahaan 
    SET 
      divisi_id = ?,
      kode_cabang = ?,
      penanggung_jawab_sebelumnya = penanggung_jawab,
      nama_penanggung_jawab_sebelumnya = nama_penanggung_jawab,
      penanggung_jawab = ?,
      nama_penanggung_jawab = ?
    WHERE kode_aset = ?
  `;

    await query(updateAsetSql, [
      divisi_id_tujuan,
      cabang_tujuan || null,
      penanggung_jawab_tujuan || null,
      penanggungJawabTujuanData?.name || null,
      kode_aset,
    ]);

    return NextResponse.json({
      success: true,
      message: "Mutasi berhasil dilakukan",
      data: { kode_mutasi: newKodeMutasi },
    });
  } catch (error) {
    console.error("Error creating mutasi:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal melakukan mutasi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// DELETE - Hapus mutasi (opsional, untuk rollback)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kode_mutasi = searchParams.get("kode_mutasi");

    if (!kode_mutasi) {
      return NextResponse.json(
        { success: false, message: "kode_mutasi tidak ditemukan" },
        { status: 400 }
      );
    }

    await query("DELETE FROM mutasi_aset WHERE kode_mutasi = ?", [kode_mutasi]);

    return NextResponse.json({
      success: true,
      message: "Mutasi berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting mutasi:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Gagal menghapus mutasi",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
