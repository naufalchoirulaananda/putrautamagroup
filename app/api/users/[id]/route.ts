// File: app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function PUT(
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
    const body = await req.json();
    const { name, role_id, status, password, divisi_kode, cabang_id } = body;

    if (!name || !role_id || !status) {
      return NextResponse.json(
        { error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // TAMBAH INI: Cek status lama user
    const [currentUserData] = await connection.execute(
      "SELECT status FROM users WHERE id = ?",
      [userId]
    );

    const currentUser = (currentUserData as any[])[0];
    if (!currentUser) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    // TAMBAH INI: Tentukan update tanggal_nonaktif
    let tanggalNonaktifUpdate = "";
    
    if (currentUser.status === 'active' && status === 'inactive') {
      // Status berubah jadi inactive → set tanggal sekarang
      tanggalNonaktifUpdate = ", tanggal_nonaktif = NOW()";
    } else if (currentUser.status === 'inactive' && status === 'active') {
      // Status berubah jadi active → hapus tanggal nonaktif
      tanggalNonaktifUpdate = ", tanggal_nonaktif = NULL";
    }

    // Update dengan atau tanpa password
    let updateQuery = `
      UPDATE users 
      SET name = ?, role_id = ?, status = ?, divisi_kode = ?, cabang_id = ?${tanggalNonaktifUpdate}
      WHERE id = ?
    `;
    let queryParams: any[] = [
      name,
      role_id,
      status,
      divisi_kode || null,
      cabang_id || null,
      userId,
    ];

    if (password && password.trim() !== "") {
      updateQuery = `
        UPDATE users 
        SET name = ?, role_id = ?, status = ?, divisi_kode = ?, cabang_id = ?, password = ?${tanggalNonaktifUpdate}
        WHERE id = ?
      `;
      queryParams = [
        name,
        role_id,
        status,
        divisi_kode || null,
        cabang_id || null,
        password,
        userId,
      ];
    }

    const [result] = await connection.execute(updateQuery, queryParams);

    console.log("Update query:", updateQuery);
    console.log("Query params:", queryParams);
    console.log("Update result:", result);

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `update_user:${userId}`]
    );

    await connection.commit();

    // SELECT juga harus include tanggal_nonaktif
    const [updatedUser] = await connection.execute(
      `SELECT u.id, u.name, u.role_id, u.status, u.divisi_kode, u.cabang_id, u.tanggal_nonaktif,
              r.name as role_name, d.nama_divisi as divisi_name, c.nama_cabang as cabang_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON u.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       WHERE u.id = ?`,
      [userId]
    );

    console.log("Updated user data:", updatedUser);

    return NextResponse.json({
      success: true,
      message: "User berhasil diupdate",
      data: (updatedUser as any[])[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
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

    await connection.beginTransaction();

    const [result] = await connection.execute(
      "DELETE FROM users WHERE id = ?",
      [userId]
    );

    console.log("Delete result:", result);

    await connection.execute(
      "INSERT INTO activity_logs (user_id, action) VALUES (?, ?)",
      [session.user.id, `delete_user:${userId}`]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "User berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}