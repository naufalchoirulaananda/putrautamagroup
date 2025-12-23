// File: app/api/dashboard/route.ts (FIXED)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import pool from "@/lib/db";
import { getJakartaDate } from "@/lib/datetime";

interface UserProfile {
  id: number;
  name: string;
  kode_pegawai: string;
  tanggal_lahir: string | null;
  password: string;
  foto_profil: string | null;
  role_name: string;
  divisi_name: string | null;
}

interface WeeklyAttendance {
  date: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
  status: "Belum Absen" | "Absen Masuk" | "Absen Lengkap";
}

interface TodayStatus {
  hasClockIn: boolean;
  hasClockOut: boolean;
  status: "Belum Absen" | "Sudah Absen Masuk" | "Sudah Absen Lengkap";
}

interface KuotaCuti {
  id: number;
  user_id: number;
  tahun: number;
  kuota_total: number;
  kuota_terpakai: number;
  kuota_pending: number;
  kuota_sisa: number;
}

interface CutiProgress {
  id: number;
  jenis_izin: string;
  jenis_izin_nama: string;
  status: string;
  progress_percentage: number;
  tanggal_pengajuan: string;
  current_approver_name: string | null;
}

export async function GET(req: NextRequest) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const currentYear = new Date().getFullYear();

    console.log("📊 Fetching dashboard data for user:", userId);

    // Get user profile
    const [userProfileData] = await connection.execute(
      `SELECT 
        u.id,
        u.name,
        u.kode_pegawai,
        u.tanggal_lahir,
        u.password,
        u.foto_profil,
        r.name as role_name,
        d.nama_divisi as divisi_name
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
      WHERE u.id = ?`,
      [userId]
    );

    const userProfile = userProfileData as UserProfile[];

    if (userProfile.length === 0) {
      connection.release();
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get today's status
    const today = getJakartaDate();
    const [todayAttendanceData] = await connection.execute(
      `SELECT jam_masuk, jam_pulang 
       FROM absensi 
       WHERE user_id = ? AND date = ?`,
      [userId, today]
    );

    const todayAttendance = todayAttendanceData as any[];

    let todayStatus: TodayStatus;
    if (todayAttendance.length === 0) {
      todayStatus = {
        hasClockIn: false,
        hasClockOut: false,
        status: "Belum Absen",
      };
    } else if (!todayAttendance[0].jam_pulang) {
      todayStatus = {
        hasClockIn: true,
        hasClockOut: false,
        status: "Sudah Absen Masuk",
      };
    } else {
      todayStatus = {
        hasClockIn: true,
        hasClockOut: true,
        status: "Sudah Absen Lengkap",
      };
    }

    // Get last 7 days attendance
    const [weeklyAttendanceData] = await connection.execute(
      `SELECT 
        date,
        jam_masuk,
        jam_pulang,
        durasi
      FROM absensi
      WHERE user_id = ?
      AND date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      ORDER BY date DESC`,
      [userId]
    );

    const weeklyAttendance = weeklyAttendanceData as WeeklyAttendance[];

    // Process weekly data to include status
    const processedWeekly = weeklyAttendance.map((att) => ({
      ...att,
      status: !att.jam_masuk
        ? ("Belum Absen" as const)
        : !att.jam_pulang
        ? ("Absen Masuk" as const)
        : ("Absen Lengkap" as const),
    }));

    // Get kuota cuti for current year with DETAILED LOGGING
    console.log("🔍 Checking kuota for user:", userId, "year:", currentYear);
    
    let [kuotaData] = await connection.execute(
      `SELECT * FROM kuota_cuti_user 
       WHERE user_id = ? AND tahun = ?`,
      [userId, currentYear]
    );

    let kuotaCuti = kuotaData as KuotaCuti[];
    console.log("📦 Initial kuota data:", kuotaCuti);

    // If no kuota exists, create one based on config
    if (kuotaCuti.length === 0) {
      console.log("⚠️ No kuota found, creating new one...");
      
      const [configData] = await connection.execute(
        `SELECT jumlah_hari FROM kuota_cuti_config WHERE tahun = ?`,
        [currentYear]
      );

      const configKuota = configData as any[];
      const defaultKuota = configKuota[0]?.jumlah_hari || 12;
      
      console.log("📋 Using default kuota:", defaultKuota);

      await connection.execute(
        `INSERT INTO kuota_cuti_user (user_id, tahun, kuota_total, kuota_terpakai, kuota_pending, kuota_sisa)
         VALUES (?, ?, ?, 0, 0, ?)`,
        [userId, currentYear, defaultKuota, defaultKuota]
      );

      [kuotaData] = await connection.execute(
        `SELECT * FROM kuota_cuti_user 
         WHERE user_id = ? AND tahun = ?`,
        [userId, currentYear]
      );
      
      kuotaCuti = kuotaData as KuotaCuti[];
      console.log("✅ Created new kuota:", kuotaCuti);
    }

    // RECALCULATE kuota based on actual cuti_izin data
    console.log("🔄 Recalculating kuota from cuti_izin...");
    
    const [cutiStats] = await connection.execute(
      `SELECT 
        SUM(CASE 
          WHEN status = 'approved' THEN 
            DATEDIFF(tanggal_cuti_selesai, tanggal_cuti_mulai) + 1
          ELSE 0
        END) as total_terpakai,
        SUM(CASE 
          WHEN status IN ('waiting_manager', 'waiting_hrd') THEN 
            DATEDIFF(tanggal_cuti_selesai, tanggal_cuti_mulai) + 1
          ELSE 0
        END) as total_pending
       FROM cuti_izin
       WHERE user_id = ? 
       AND jenis_izin = 'cuti'
       AND YEAR(tanggal_cuti_mulai) = ?`,
      [userId, currentYear]
    );

    const stats = (cutiStats as any[])[0];
    const actualTerpakai = stats.total_terpakai || 0;
    const actualPending = stats.total_pending || 0;
    
    console.log("📊 Actual stats from cuti_izin:", {
      terpakai: actualTerpakai,
      pending: actualPending
    });

    // Update kuota if different from calculated
    const currentKuota = kuotaCuti[0];
    if (currentKuota.kuota_terpakai !== actualTerpakai || 
        currentKuota.kuota_pending !== actualPending) {
      
      const newSisa = currentKuota.kuota_total - actualTerpakai - actualPending;
      
      console.log("🔧 Fixing kuota discrepancy:", {
        old_terpakai: currentKuota.kuota_terpakai,
        new_terpakai: actualTerpakai,
        old_pending: currentKuota.kuota_pending,
        new_pending: actualPending,
        new_sisa: newSisa
      });

      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_terpakai = ?,
             kuota_pending = ?,
             kuota_sisa = ?
         WHERE user_id = ? AND tahun = ?`,
        [actualTerpakai, actualPending, newSisa, userId, currentYear]
      );

      // Fetch updated data
      [kuotaData] = await connection.execute(
        `SELECT * FROM kuota_cuti_user 
         WHERE user_id = ? AND tahun = ?`,
        [userId, currentYear]
      );
      
      kuotaCuti = kuotaData as KuotaCuti[];
      console.log("✅ Updated kuota:", kuotaCuti);
    }

    // Get active cuti/izin progress (pending or waiting approval)
    const [cutiProgressData] = await connection.execute(
      `SELECT 
        id,
        jenis_izin,
        jenis_izin_nama,
        status,
        progress_percentage,
        tanggal_pengajuan,
        current_approver_name
       FROM v_cuti_izin_detail
       WHERE user_id = ?
       AND status IN ('pending', 'waiting_manager', 'waiting_hrd', 'approved')
       ORDER BY tanggal_pengajuan DESC
       LIMIT 5`,
      [userId]
    );

    const cutiProgress = cutiProgressData as CutiProgress[];

    connection.release();

    return NextResponse.json({
      success: true,
      data: {
        profile: userProfile[0],
        todayStatus,
        weeklyAttendance: processedWeekly,
        kuotaCuti: kuotaCuti[0] || null,
        cutiProgress: cutiProgress,
      },
    });
  } catch (error) {
    connection.release();
    console.error("❌ Error fetching dashboard data:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}