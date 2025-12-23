import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// Daftar role yang diperbolehkan (HARUS SAMA dengan route GET dan frontend)
const ALLOWED_ROLES = [
  "ASS KEPALA TOKO GMART",
  "HELPER GMART",
  "HRD GMART",
  "KASIR GMART",
  "KEPALA TOKO GMART",
  "MANAGER GMART",
  "MERCHANDISING GMART",
  "PRAMU-KASIR GMART",
  "KASIR GMART",
  "PRAMUNIAGA GMART",
  "SPV CABANG GMART",
  "SPV LOGISTIK GMART",
  "STAFF KEUANGAN GMART",
  "SPV PENGUNJUNG GMART",
  "SPV KEUANGAN GMART",
  "PERSONALIA",
];

// PUT - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();
  
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const userId = parseInt(id);
    const body = await req.json();
    
    // UPDATED: Tambahkan divisi_kode
    const { name, role_id, status, password, cabang_id, divisi_kode } = body;

    console.log("=== START UPDATE REQUEST ===");
    console.log("User ID:", userId);
    console.log("Request body:", { name, role_id, status, cabang_id, divisi_kode, password: password ? "***hidden***" : "empty" });

    // UPDATED: Validasi input termasuk divisi_kode
    if (!name || !role_id || !status || !cabang_id || !divisi_kode) {
      console.log("ERROR: Missing required fields");
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    // Validasi role
    const [roleCheck] = await connection.execute(
      "SELECT name FROM roles WHERE id = ?",
      [role_id]
    );

    if ((roleCheck as any[]).length === 0 || !ALLOWED_ROLES.includes((roleCheck as any[])[0].name)) {
      console.log("ERROR: Invalid role -", (roleCheck as any[])[0]?.name);
      return NextResponse.json(
        { error: "Role tidak diperbolehkan" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // UPDATED: Update user dengan divisi_kode
    let updateQuery = `
      UPDATE users 
      SET name = ?, role_id = ?, status = ?, cabang_id = ?, divisi_kode = ?
      WHERE id = ?
    `;
    let queryParams: any[] = [name, role_id, status, cabang_id, divisi_kode, userId];

    // Jika password diisi, update juga password
    if (password && password.trim() !== "") {
      updateQuery = `
        UPDATE users 
        SET name = ?, role_id = ?, status = ?, password = ?, cabang_id = ?, divisi_kode = ?
        WHERE id = ?
      `;
      queryParams = [name, role_id, status, password, cabang_id, divisi_kode, userId];
    }

    const [result] = await connection.execute(updateQuery, queryParams);

    console.log("Update query executed");
    console.log("Update result:", result);

    // Log activity (optional)
    try {
      await connection.execute(
        "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
        [session.user.id, `update_user:${userId}`]
      );
    } catch (logError) {
      console.warn("Failed to log activity (non-critical):", logError);
    }

    await connection.commit();

    // UPDATED: Ambil data user dengan JOIN divisi
    const [updatedUser] = await connection.execute(
      `SELECT u.id, u.name, u.kode_pegawai, u.role_id, u.status, u.cabang_id, u.divisi_kode,
              r.name as role_name, 
              c.nama_cabang as cabang_name,
              d.nama_divisi as divisi_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       WHERE u.id = ?`,
      [userId]
    );

    console.log("Updated user data:", updatedUser);
    console.log("=== END UPDATE REQUEST - SUCCESS ===");

    return NextResponse.json({
      success: true,
      message: "User berhasil diupdate",
      data: (updatedUser as any[])[0]
    });
  } catch (error) {
    await connection.rollback();
    console.error("=== ERROR IN UPDATE REQUEST ===");
    console.error("Error updating user:", error);
    console.error("Error message:", (error as Error).message);
    
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    console.log("=== START DELETE REQUEST ===");
    console.log("Deleting user ID:", userId);

    await connection.beginTransaction();

    // Hapus user
    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ?", 
      [userId]
    );

    console.log("Delete result:", result);

    // Log activity (optional)
    try {
      await connection.execute(
        "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
        [session.user.id, `delete_user:${userId}`]
      );
    } catch (logError) {
      console.warn("Failed to log activity (non-critical):", logError);
    }

    await connection.commit();

    console.log("=== END DELETE REQUEST - SUCCESS ===");

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("=== ERROR IN DELETE REQUEST ===");
    console.error("Error deleting user:", error);
    console.error("Error message:", (error as Error).message);
    
    return NextResponse.json(
      { 
        error: "Terjadi kesalahan server",
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}