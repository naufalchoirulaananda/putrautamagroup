// File: app/api/kuota-cuti/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch kuota cuti config
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();

    const [configs] = await connection.execute(
      `SELECT * FROM kuota_cuti_config ORDER BY tahun DESC`
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: configs,
    });
  } catch (error) {
    console.error("Error fetching kuota config:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create/Update kuota cuti config (HRD only)
export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is HRD
    const [userRole] = await connection.execute(
      `SELECT r.name FROM users u 
       INNER JOIN roles r ON u.role_id = r.id 
       WHERE u.id = ?`,
      [session.user.id]
    );

    const roleName = (userRole as any[])[0]?.name?.toUpperCase() || "";
    if (!roleName.includes("HRD") && !roleName.includes("DIREKTUR")) {
      return NextResponse.json(
        { success: false, error: "Hanya HRD yang dapat mengatur kuota cuti" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { tahun, jumlah_hari, keterangan } = body;

    if (!tahun || !jumlah_hari) {
      return NextResponse.json(
        { success: false, error: "Tahun dan jumlah hari harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Insert or update config
    await connection.execute(
      `INSERT INTO kuota_cuti_config (tahun, jumlah_hari, keterangan)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         jumlah_hari = VALUES(jumlah_hari),
         keterangan = VALUES(keterangan)`,
      [tahun, jumlah_hari, keterangan || null]
    );

    // Update existing user quotas for this year
    await connection.execute(
      `UPDATE kuota_cuti_user 
       SET kuota_total = ?,
           kuota_sisa = ? - kuota_terpakai - kuota_pending
       WHERE tahun = ?`,
      [jumlah_hari, jumlah_hari, tahun]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Konfigurasi kuota cuti berhasil disimpan",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error saving kuota config:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE - Delete kuota config
export async function DELETE(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    await connection.execute(
      `DELETE FROM kuota_cuti_config WHERE id = ?`,
      [id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Konfigurasi berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting kuota config:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}