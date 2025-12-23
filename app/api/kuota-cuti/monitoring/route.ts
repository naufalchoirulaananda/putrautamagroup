// File: app/api/kuota-cuti/monitoring/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();

    // Check if user is HRD/Direktur
    const [userRole] = await connection.execute(
      `SELECT r.name FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [session.user.id]
    );

    const roleName = (userRole as any[])[0]?.name?.toUpperCase() || "";
    if (
      !roleName.includes("HRD") &&
      !roleName.includes("DIREKTUR") &&
      !roleName.includes("PROGRAMMER JUNIOR") &&
      !roleName.includes("SUPERADMIN") &&
      !roleName.includes("PERSONALIA")
    ) {
      connection.release();
      return NextResponse.json(
        {
          success: false,
          error: "Akses ditolak. Hanya HRD/PERSONALIA yang dapat mengakses data ini",
        },
        { status: 403 }
      );
    }

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun") || new Date().getFullYear();

    // Get default kuota from config
    const [configData] = await connection.execute(
      `SELECT jumlah_hari FROM kuota_cuti_config WHERE tahun = ?`,
      [tahun]
    );
    const defaultKuota = (configData as any[])[0]?.jumlah_hari || 12;

    // Get ALL active users with their kuota (if exists)
    // Using LEFT JOIN so all active users appear, even without kuota
    const [kuotaData] = await connection.execute(
      `SELECT 
        u.id as user_id,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi as divisi_name,
        COALESCE(kcu.id, 0) as id,
        COALESCE(kcu.tahun, ?) as tahun,
        COALESCE(kcu.kuota_total, ?) as kuota_total,
        COALESCE(kcu.kuota_terpakai, 0) as kuota_terpakai,
        COALESCE(kcu.kuota_pending, 0) as kuota_pending,
        COALESCE(kcu.kuota_sisa, ?) as kuota_sisa,
        COALESCE(kcu.created_at, NOW()) as created_at,
        COALESCE(kcu.updated_at, NOW()) as updated_at
       FROM users u
       LEFT JOIN kuota_cuti_user kcu ON u.id = kcu.user_id AND kcu.tahun = ?
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       WHERE u.status = 'active'
       ORDER BY u.name ASC`,
      [tahun, defaultKuota, defaultKuota, tahun]
    );

    // Create kuota for users who don't have one yet
    const usersWithoutKuota = (kuotaData as any[]).filter(
      (item) => item.id === 0
    );

    if (usersWithoutKuota.length > 0) {
      const insertPromises = usersWithoutKuota.map((user: any) =>
        connection.execute(
          `INSERT INTO kuota_cuti_user (user_id, tahun, kuota_total, kuota_sisa)
           VALUES (?, ?, ?, ?)`,
          [user.user_id, tahun, defaultKuota, defaultKuota]
        )
      );

      await Promise.all(insertPromises);

      // Fetch updated data with newly created kuota
      const [updatedKuotaData] = await connection.execute(
        `SELECT 
          u.id as user_id,
          u.name as user_name,
          u.kode_pegawai,
          r.name as role_name,
          d.nama_divisi as divisi_name,
          kcu.id,
          kcu.tahun,
          kcu.kuota_total,
          kcu.kuota_terpakai,
          kcu.kuota_pending,
          kcu.kuota_sisa,
          kcu.created_at,
          kcu.updated_at
         FROM users u
         INNER JOIN kuota_cuti_user kcu ON u.id = kcu.user_id AND kcu.tahun = ?
         LEFT JOIN roles r ON u.role_id = r.id
         LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
         WHERE u.status = 'active'
         ORDER BY u.name ASC`,
        [tahun]
      );

      connection.release();

      // Calculate statistik
      const statistik = calculateStatistik(updatedKuotaData as any[]);

      return NextResponse.json({
        success: true,
        data: updatedKuotaData,
        statistik,
      });
    }

    connection.release();

    // Calculate statistik
    const statistik = calculateStatistik(kuotaData as any[]);

    return NextResponse.json({
      success: true,
      data: kuotaData,
      statistik,
    });
  } catch (error) {
    console.error("Error fetching monitoring data:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

function calculateStatistik(data: any[]) {
  const total_karyawan = data.length;
  const total_kuota_terpakai = data.reduce(
    (sum, item) => sum + (item.kuota_terpakai || 0),
    0
  );
  const total_kuota_pending = data.reduce(
    (sum, item) => sum + (item.kuota_pending || 0),
    0
  );
  const total_kuota_sisa = data.reduce(
    (sum, item) => sum + (item.kuota_sisa || 0),
    0
  );

  const rata_rata_penggunaan =
    total_karyawan > 0 ? total_kuota_terpakai / total_karyawan : 0;

  return {
    total_karyawan,
    total_kuota_terpakai,
    total_kuota_pending,
    total_kuota_sisa,
    rata_rata_penggunaan,
  };
}
