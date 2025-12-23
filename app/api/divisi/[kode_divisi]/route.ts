// File: app/api/divisi/[kode_divisi]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// PUT - Update divisi
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ kode_divisi: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kode_divisi } = await params;
    const body = await req.json();
    const { nama_divisi } = body;

    if (!nama_divisi) {
      return NextResponse.json(
        { error: "Nama divisi harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    const [result] = await connection.execute(
      "UPDATE divisi SET nama_divisi = ? WHERE kode_divisi = ?",
      [nama_divisi, kode_divisi]
    );

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `update_divisi:${kode_divisi}`]
    );

    await connection.commit();

    const [updatedDivisi] = await connection.execute(
      "SELECT id, kode_divisi, nama_divisi FROM divisi WHERE kode_divisi = ?",
      [kode_divisi]
    );

    return NextResponse.json({
      success: true,
      message: "Divisi berhasil diupdate",
      data: (updatedDivisi as any[])[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating divisi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE - Delete divisi
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ kode_divisi: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kode_divisi } = await params;

    await connection.beginTransaction();

    // Cek apakah divisi sedang digunakan oleh user
    const [usersUsingDivisi] = await connection.execute(
      "SELECT COUNT(*) as count FROM users WHERE divisi_kode = ?",
      [kode_divisi]
    );

    const count = (usersUsingDivisi as any[])[0].count;

    if (count > 0) {
      await connection.rollback();
      return NextResponse.json(
        { error: "Divisi tidak dapat dihapus karena masih digunakan oleh karyawan" },
        { status: 400 }
      );
    }

    const [result] = await connection.execute(
      "DELETE FROM divisi WHERE kode_divisi = ?",
      [kode_divisi]
    );

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `delete_divisi:${kode_divisi}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Divisi berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting divisi:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}