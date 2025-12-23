// File: app/api/admin/divisi-approver/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch all divisi approvers
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const connection = await pool.getConnection();
    const [approvers] = await connection.execute(
      `SELECT 
        da.*,
        u.name as approver_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi
       FROM divisi_approver da
       INNER JOIN users u ON da.approver_id = u.id
       INNER JOIN roles r ON da.approver_role_id = r.id
       INNER JOIN divisi d ON da.divisi_kode = d.kode_divisi
       ORDER BY d.nama_divisi, r.name`
    );
    connection.release();

    return NextResponse.json({
      success: true,
      data: approvers,
    });
  } catch (error) {
    console.error("Error fetching divisi approvers:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Add divisi approver
export async function POST(req: NextRequest) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { divisi_kode, approver_id, approver_role_id } = body;

    // Validasi
    if (!divisi_kode || !approver_id || !approver_role_id) {
      return NextResponse.json(
        { success: false, error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Cek apakah kombinasi sudah ada
    const [existing] = await connection.execute(
      `SELECT id FROM divisi_approver 
       WHERE divisi_kode = ? AND approver_id = ? AND is_active = 1`,
      [divisi_kode, approver_id]
    );

    if ((existing as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Approver sudah ditambahkan untuk divisi ini" },
        { status: 400 }
      );
    }

    // Insert
    await connection.execute(
      `INSERT INTO divisi_approver (divisi_kode, approver_id, approver_role_id, is_active)
       VALUES (?, ?, ?, 1)`,
      [divisi_kode, approver_id, approver_role_id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Approver berhasil ditambahkan",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error adding divisi approver:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
