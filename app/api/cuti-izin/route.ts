// File: app/api/cuti-izin/route.ts (Fixed - No Duplicate)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { generatePDFPengajuan } from "@/lib/pdf-generator";
import {
  notifyManagerNewRequest,
  notifyEmployeeSubmitted,
  notifyHRDNewRequest,
} from "@/lib/server/notification";

interface CutiIzinPayload {
  nama_lengkap: string;
  role_id: number;
  divisi_kode: string;
  jenis_izin: string;
  tanggal_izin: string | null;
  tanggal_cuti_mulai: string | null;
  tanggal_cuti_selesai: string | null;
  alasan: string;
  pic_pengganti?: string;
  pic_phone?: string;
  nomor_telepon_karyawan: string;
  bukti_file_path?: string;
  approver_id: number;
}

/**
 * Get HRD Approver berdasarkan divisi
 * Priority:
 * 1. HRD dengan role name yang match divisi (e.g., "HRD GMART")
 * 2. HRD generic (role name = "HRD")
 */
async function getHRDApproverForDivisi(
  connection: any,
  divisiKode: string
): Promise<number | null> {
  try {
    // 1. Cari HRD spesifik untuk divisi ini
    const [specificHRD] = await connection.execute(
      `SELECT ha.user_id 
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       WHERE ha.is_active = 1 
       AND u.status = 'active'
       AND ha.divisi_kode = ?
       LIMIT 1`,
      [divisiKode]
    );

    if ((specificHRD as any[]).length > 0) {
      console.log(`✅ Found specific HRD for divisi ${divisiKode}`);
      return (specificHRD as any[])[0].user_id;
    }

    // 2. Fallback: Cari HRD generic (divisi_kode = NULL)
    const [genericHRD] = await connection.execute(
      `SELECT ha.user_id 
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       WHERE ha.is_active = 1 
       AND u.status = 'active'
       AND ha.divisi_kode IS NULL
       LIMIT 1`
    );

    if ((genericHRD as any[]).length > 0) {
      console.log(`✅ Using generic HRD for divisi ${divisiKode}`);
      return (genericHRD as any[])[0].user_id;
    }

    // 3. Last resort: Ambil HRD pertama yang ada
    const [anyHRD] = await connection.execute(
      `SELECT ha.user_id 
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       WHERE ha.is_active = 1 
       AND u.status = 'active'
       LIMIT 1`
    );

    if ((anyHRD as any[]).length > 0) {
      console.log(`⚠️ Using fallback HRD for divisi ${divisiKode}`);
      return (anyHRD as any[])[0].user_id;
    }

    return null;
  } catch (error) {
    console.error("Error getting HRD approver:", error);
    return null;
  }
}

/**
 * Fix timezone offset for Indonesian dates (WIB = UTC+7)
 * Converts date to YYYY-MM-DD in WIB timezone
 */
function formatDateForDB(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);

  // Force to WIB timezone (UTC+7)
  const wibDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);

  const year = wibDate.getUTCFullYear();
  const month = String(wibDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(wibDate.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Alternative: Format date using local timezone (WIB)
 */
function formatDateWIB(dateString: string | null): string | null {
  if (!dateString) return null;

  const date = new Date(dateString);

  // Format in WIB timezone (Asia/Jakarta)
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const parts = new Intl.DateTimeFormat("en-CA", options).format(date);
  return parts; // Returns YYYY-MM-DD
}

// GET - Fetch cuti/izin data
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("user_id");
    const status = searchParams.get("status");

    const connection = await pool.getConnection();

    // ✅ FIX: Gunakan query lengkap dengan JOIN, tanpa filter status
    let query = `
      SELECT 
        ci.*,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi,
        d.kode_divisi as divisi_kode,
        CASE 
          WHEN ci.jenis_izin = 'cuti' THEN 
            CASE 
              WHEN ci.jenis_izin = 'Cuti' THEN 'Cuti'
              WHEN ci.jenis_izin = 'sakit' THEN 'Sakit'
              WHEN ci.jenis_izin = 'izin' THEN 'Izin'
              WHEN ci.jenis_izin = 'datang_terlambat' THEN 'Datang Terlambat'
              WHEN ci.jenis_izin = 'meninggalkan_pekerjaan' THEN 'Meninggalkan Pekerjaan'
              ELSE ci.jenis_izin
            END
          ELSE ci.jenis_izin
        END as jenis_izin_nama,
        CASE 
          WHEN ci.jenis_izin = 'cuti' THEN DATEDIFF(ci.tanggal_cuti_selesai, ci.tanggal_cuti_mulai) + 1
          ELSE 1
        END as jumlah_hari_cuti,
        CASE
          WHEN ci.status = 'approved' THEN 100
          WHEN ci.status = 'waiting_hrd' THEN 50
          WHEN ci.status = 'waiting_manager' THEN 25
          WHEN ci.status LIKE 'rejected%' THEN 0
          ELSE 0
        END as progress_percentage,
        approver.name as current_approver_name
      FROM cuti_izin ci
      LEFT JOIN users u ON ci.user_id = u.id
      LEFT JOIN roles r ON ci.role_id = r.id
      LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
      LEFT JOIN users approver ON ci.current_approver_id = approver.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (userId) {
      query += " AND ci.user_id = ?";
      params.push(userId);
    }

    // ✅ PENTING: Jangan filter status rejected di sini
    // Biarkan semua status muncul untuk karyawan
    if (status) {
      query += " AND ci.status = ?";
      params.push(status);
    }

    query += " ORDER BY ci.created_at DESC";

    const [results] = await connection.execute(query, params);
    connection.release();

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📥 Received payload:", body);

    // ✅ CEK ROLE USER - HANYA SEKALI
    const [userRole] = await connection.execute(
      "SELECT name FROM roles WHERE id = ?",
      [body.role_id]
    );

    const roleName = (userRole as any[])[0]?.name?.toUpperCase() || "";
    const isDirektur =
      roleName.includes("DIREKTUR") || roleName.includes("DIRECTOR");

    // ✅ Validasi approver_id - SKIP untuk Direktur
    if (!isDirektur && !body.approver_id) {
      return NextResponse.json(
        { success: false, error: "Approver harus dipilih" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Format dates correctly for WIB timezone
    const tanggalIzin = formatDateForDB(body.tanggal_izin);
    const tanggalCutiMulai = formatDateForDB(body.tanggal_cuti_mulai);
    const tanggalCutiSelesai = formatDateForDB(body.tanggal_cuti_selesai);

    // Calculate jumlah hari for cuti
    let jumlahHari = 1;
    if (body.jenis_izin === "cuti" && tanggalCutiMulai && tanggalCutiSelesai) {
      const startDate = new Date(tanggalCutiMulai);
      const endDate = new Date(tanggalCutiSelesai);
      jumlahHari =
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    }

    // Check kuota cuti if jenis_izin is 'cuti'
    if (body.jenis_izin === "cuti") {
      const currentYear = new Date().getFullYear();

      let [kuotaData] = await connection.execute(
        `SELECT * FROM kuota_cuti_user WHERE user_id = ? AND tahun = ?`,
        [session.user.id, currentYear]
      );

      if ((kuotaData as any[]).length === 0) {
        const [configData] = await connection.execute(
          `SELECT jumlah_hari FROM kuota_cuti_config WHERE tahun = ?`,
          [currentYear]
        );

        const defaultKuota = (configData as any[])[0]?.jumlah_hari || 12;

        await connection.execute(
          `INSERT INTO kuota_cuti_user (user_id, tahun, kuota_total, kuota_sisa)
           VALUES (?, ?, ?, ?)`,
          [session.user.id, currentYear, defaultKuota, defaultKuota]
        );

        [kuotaData] = await connection.execute(
          `SELECT * FROM kuota_cuti_user WHERE user_id = ? AND tahun = ?`,
          [session.user.id, currentYear]
        );
      }

      const kuota = (kuotaData as any[])[0];

      if (kuota.kuota_sisa < jumlahHari) {
        await connection.rollback();
        return NextResponse.json(
          {
            success: false,
            error: `Kuota cuti tidak mencukupi. Sisa kuota Anda: ${kuota.kuota_sisa} hari, dibutuhkan: ${jumlahHari} hari`,
          },
          { status: 400 }
        );
      }

      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_pending = kuota_pending + ?,
             kuota_sisa = kuota_sisa - ?
         WHERE user_id = ? AND tahun = ?`,
        [jumlahHari, jumlahHari, session.user.id, currentYear]
      );
    }

    // ✅ Tentukan status dan level approval
    let status = "waiting_manager";
    let approvalLevel = 1;
    let maxApprovalLevel = 2;
    let currentApproverId = body.approver_id;
    let nextApproverId = null;

    // ✅ Handle Direktur Bypass - AUTO KE HRD
    if (isDirektur) {
      maxApprovalLevel = 1;
      approvalLevel = 1;
      status = "waiting_hrd";

      // ⭐ GET HRD BERDASARKAN DIVISI
      currentApproverId = await getHRDApproverForDivisi(
        connection,
        body.divisi_kode
      );

      if (!currentApproverId) {
        await connection.rollback();
        return NextResponse.json(
          {
            success: false,
            error:
              "Tidak ada HRD approver yang tersedia untuk divisi Anda. Hubungi admin.",
          },
          { status: 500 }
        );
      }

      console.log(
        "✅ Direktur bypass: Auto assign HRD ID:",
        currentApproverId,
        "for divisi:",
        body.divisi_kode
      );
    }

    // ✅ Insert data cuti_izin
    const [result] = await connection.execute(
      `INSERT INTO cuti_izin (
        user_id, nama_lengkap, role_id, divisi_kode, jenis_izin,
        tanggal_izin, tanggal_cuti_mulai, tanggal_cuti_selesai,
        alasan, pic_pengganti, pic_phone, nomor_telepon_karyawan,
        bukti_file_path, approval_level, max_approval_level,
        current_approver_id, next_approver_id, status, tanggal_pengajuan
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        session.user.id,
        body.nama_lengkap,
        body.role_id,
        body.divisi_kode,
        body.jenis_izin,
        tanggalIzin,
        tanggalCutiMulai,
        tanggalCutiSelesai,
        body.alasan,
        body.pic_pengganti || null,
        body.pic_phone || null,
        body.nomor_telepon_karyawan,
        body.bukti_file_path || null,
        approvalLevel,
        maxApprovalLevel,
        currentApproverId,
        nextApproverId,
        status,
      ]
    );

    const cutiIzinId = (result as any).insertId;

    // Generate PDF pengajuan
    const [cutiData] = await connection.execute(
      `SELECT ci.*, u.name as user_name, r.name as role_name, d.nama_divisi
       FROM cuti_izin ci
       LEFT JOIN users u ON ci.user_id = u.id
       LEFT JOIN roles r ON ci.role_id = r.id
       LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
       WHERE ci.id = ?`,
      [cutiIzinId]
    );

    const pdfPath = await generatePDFPengajuan((cutiData as any[])[0]);

    await connection.execute(
      "UPDATE cuti_izin SET pdf_pengajuan_path = ? WHERE id = ?",
      [pdfPath, cutiIzinId]
    );

    await connection.commit();

    // 🔔 SEND NOTIFICATIONS
    try {
      // 1. Notifikasi ke KARYAWAN - Permohonan berhasil dikirim
      await notifyEmployeeSubmitted(
        parseInt(session.user.id),
        body.jenis_izin,
        cutiIzinId
      );

      // 2. Notifikasi ke APPROVER
      if (isDirektur) {
        // ⭐ DIREKTUR: Notif langsung ke HRD
        await notifyHRDNewRequest(
          currentApproverId,
          body.nama_lengkap,
          body.jenis_izin,
          cutiIzinId
        );
        console.log("✅ Notification sent to HRD (Direktur bypass)");
      } else {
        // NON-DIREKTUR: Notif ke Manager/SPV
        await notifyManagerNewRequest(
          currentApproverId,
          body.nama_lengkap,
          body.jenis_izin,
          cutiIzinId
        );
        console.log("✅ Notification sent to Manager");
      }
    } catch (notifError: unknown) {
      const errorMsg =
        notifError instanceof Error ? notifError.message : String(notifError);
      console.error("Error sending notifications:", errorMsg);
      // Don't fail the request if notification fails
    }

    console.log("✅ Cuti/Izin created successfully with notifications");

    return NextResponse.json({
      success: true,
      message: "Permohonan berhasil diajukan",
      data: {
        id: cutiIzinId,
        status,
        pdf_path: pdfPath,
        jumlah_hari: jumlahHari,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
