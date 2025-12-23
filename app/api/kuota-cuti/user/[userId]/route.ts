// File: app/api/kuota-cuti/user/[userId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Get specific user's kuota
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun") || new Date().getFullYear();

    const connection = await pool.getConnection();

    const [kuota] = await connection.execute(
      `SELECT * FROM v_kuota_cuti_detail 
       WHERE user_id = ? AND tahun = ?`,
      [userId, tahun]
    );

    connection.release();

    if ((kuota as any[]).length === 0) {
      return NextResponse.json(
        { success: false, error: "Kuota tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (kuota as any[])[0],
    });
  } catch (error) {
    console.error("Error fetching user kuota:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update user's kuota manually (HRD only)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
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
          error: "Hanya HRD/PERSONALIA yang dapat mengubah kuota",
        },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const body = await req.json();
    const { tahun, kuota_total, alasan } = body;

    if (!tahun || kuota_total === undefined) {
      return NextResponse.json(
        { success: false, error: "Tahun dan kuota total harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Get current kuota
    const [currentKuota] = await connection.execute(
      `SELECT * FROM kuota_cuti_user WHERE user_id = ? AND tahun = ?`,
      [userId, tahun]
    );

    if ((currentKuota as any[]).length === 0) {
      // Create new kuota if not exists
      await connection.execute(
        `INSERT INTO kuota_cuti_user (user_id, tahun, kuota_total, kuota_sisa)
         VALUES (?, ?, ?, ?)`,
        [userId, tahun, kuota_total, kuota_total]
      );
    } else {
      const current = (currentKuota as any[])[0];

      // Calculate new kuota_sisa
      const newKuotaSisa =
        kuota_total - current.kuota_terpakai - current.kuota_pending;

      if (newKuotaSisa < 0) {
        await connection.rollback();
        return NextResponse.json(
          {
            success: false,
            error: `Kuota total tidak bisa kurang dari jumlah yang sudah terpakai dan pending (${
              current.kuota_terpakai + current.kuota_pending
            } hari)`,
          },
          { status: 400 }
        );
      }

      // Update kuota
      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_total = ?, kuota_sisa = ?
         WHERE user_id = ? AND tahun = ?`,
        [kuota_total, newKuotaSisa, userId, tahun]
      );
    }

    // Log the manual adjustment (optional - create activity log)
    await connection.execute(
      `INSERT INTO activity_logs (user_id, action, timestamp)
       VALUES (?, ?, NOW())`,
      [
        session.user.id,
        `Manual update kuota cuti user ${userId} tahun ${tahun}: ${kuota_total} hari. Alasan: ${
          alasan || "Tidak ada keterangan"
        }`,
      ]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Kuota berhasil diperbarui",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating kuota:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
