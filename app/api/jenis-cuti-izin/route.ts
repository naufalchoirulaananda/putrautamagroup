// File: app/api/jenis-cuti-izin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch all jenis cuti/izin
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const activeOnly = searchParams.get("active_only") === "true";

    const connection = await pool.getConnection();
    
    let query = `
      SELECT 
        id,
        kode_jenis,
        nama_jenis,
        deskripsi,
        is_active,
        created_at,
        updated_at
      FROM jenis_cuti_izin
    `;

    if (activeOnly) {
      query += " WHERE is_active = 1";
    }

    query += " ORDER BY nama_jenis ASC";

    const [results] = await connection.execute(query);
    connection.release();

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Error fetching jenis cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new jenis cuti/izin
export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { kode_jenis, nama_jenis, deskripsi } = body;

    if (!kode_jenis || !nama_jenis) {
      return NextResponse.json(
        { success: false, error: "Kode jenis dan nama jenis harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Check if kode already exists
    const [existing] = await connection.execute(
      "SELECT id FROM jenis_cuti_izin WHERE kode_jenis = ?",
      [kode_jenis]
    );

    if ((existing as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Kode jenis sudah digunakan" },
        { status: 400 }
      );
    }

    // Insert new jenis
    await connection.execute(
      `INSERT INTO jenis_cuti_izin (kode_jenis, nama_jenis, deskripsi, is_active)
       VALUES (?, ?, ?, 1)`,
      [kode_jenis, nama_jenis, deskripsi || null]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Jenis cuti/izin berhasil ditambahkan",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error creating jenis cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// PUT - Update jenis cuti/izin
export async function PUT(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, kode_jenis, nama_jenis, deskripsi, is_active } = body;

    if (!id || !kode_jenis || !nama_jenis) {
      return NextResponse.json(
        { success: false, error: "ID, kode jenis, dan nama jenis harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Check if kode already exists (except current record)
    const [existing] = await connection.execute(
      "SELECT id FROM jenis_cuti_izin WHERE kode_jenis = ? AND id != ?",
      [kode_jenis, id]
    );

    if ((existing as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Kode jenis sudah digunakan" },
        { status: 400 }
      );
    }

    // Update jenis
    await connection.execute(
      `UPDATE jenis_cuti_izin 
       SET kode_jenis = ?, nama_jenis = ?, deskripsi = ?, is_active = ?
       WHERE id = ?`,
      [kode_jenis, nama_jenis, deskripsi || null, is_active ? 1 : 0, id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Jenis cuti/izin berhasil diupdate",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating jenis cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// DELETE - Delete jenis cuti/izin (with usage check)
export async function DELETE(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
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

    // Get kode_jenis
    const [jenisData] = await connection.execute(
      "SELECT kode_jenis, nama_jenis FROM jenis_cuti_izin WHERE id = ?",
      [id]
    );

    if ((jenisData as any[]).length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Jenis cuti/izin tidak ditemukan" },
        { status: 404 }
      );
    }

    const kodeJenis = (jenisData as any[])[0].kode_jenis;
    const namaJenis = (jenisData as any[])[0].nama_jenis;

    // Check if jenis is being used in cuti_izin table
    const [usageCheck] = await connection.execute(
      "SELECT COUNT(*) as count FROM cuti_izin WHERE jenis_izin = ?",
      [kodeJenis]
    );

    const usageCount = (usageCheck as any[])[0].count;

    if (usageCount > 0) {
      await connection.rollback();
      return NextResponse.json(
        {
          success: false,
          error: `Tidak dapat menghapus "${namaJenis}" karena masih digunakan oleh ${usageCount} pengajuan cuti/izin`,
          usage_count: usageCount,
        },
        { status: 400 }
      );
    }

    // If not used, delete it
    await connection.execute("DELETE FROM jenis_cuti_izin WHERE id = ?", [id]);

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Jenis cuti/izin berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting jenis cuti izin:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}