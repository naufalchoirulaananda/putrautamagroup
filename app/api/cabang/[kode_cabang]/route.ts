// File: app/api/cabang/[kode_cabang]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// PUT - Update cabang
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ kode_cabang: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kode_cabang } = await params;
    const body = await req.json();
    const { nama_cabang, divisi_id } = body;

    if (!nama_cabang) {
      return NextResponse.json(
        { error: "Nama cabang harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      "UPDATE cabang_perusahaan SET nama_cabang = ?, divisi_id = ? WHERE kode_cabang = ?",
      [nama_cabang, divisi_id || null, kode_cabang]
    );

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `update_cabang:${kode_cabang}`]
    );

    await connection.commit();

    const [updatedCabang] = await connection.execute(
      "SELECT kode_cabang, nama_cabang, divisi_id FROM cabang_perusahaan WHERE kode_cabang = ?",
      [kode_cabang]
    );

    return NextResponse.json({
      success: true,
      message: "Cabang berhasil diupdate",
      data: (updatedCabang as any[])[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating cabang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE - Delete cabang
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ kode_cabang: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kode_cabang } = await params;

    await connection.beginTransaction();

    // Cek apakah cabang sedang digunakan oleh user
    const [usersUsingCabang] = await connection.execute(
      "SELECT COUNT(*) as count FROM users WHERE cabang_id = ?",
      [kode_cabang]
    );

    const count = (usersUsingCabang as any[])[0].count;

    if (count > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Cabang tidak dapat dihapus karena masih digunakan oleh karyawan" },
        { status: 400 }
      );
    }

    const [result] = await connection.execute(
      "DELETE FROM cabang_perusahaan WHERE kode_cabang = ?",
      [kode_cabang]
    );

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `delete_cabang:${kode_cabang}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Cabang berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting cabang:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}