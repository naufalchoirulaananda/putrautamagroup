// File: app/api/approvers/hrd/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

interface HRDApprover {
  id: number;
  user_id: number;
  name: string;
  kode_pegawai: string;
  role_name: string;
}

// GET - Fetch all HRD approvers
export async function GET() {
  try {
    const connection = await pool.getConnection();
    
    const [hrdApprovers] = await connection.execute(
      `SELECT 
        ha.id,
        ha.user_id,
        ha.divisi_kode,
        u.name as user_name,
        u.kode_pegawai,
        r.name as role_name,
        d.nama_divisi as divisi_name,
        ha.is_active,
        ha.created_at
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       INNER JOIN roles r ON u.role_id = r.id
       LEFT JOIN divisi d ON ha.divisi_kode = d.kode_divisi
       WHERE u.status = 'active'
       ORDER BY d.nama_divisi ASC, u.name ASC`
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: hrdApprovers,
    });
  } catch (error) {
    console.error("Error fetching HRD approvers:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Add HRD approver
export async function POST(req: NextRequest) {
  let connection;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    console.log("📥 Received body:", body);

    const { user_id, divisi_kode } = body;

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: "User ID harus diisi" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if user exists and has appropriate role
    const [userData] = await connection.execute(
      `SELECT u.id, u.name, r.name as role_name
       FROM users u
       INNER JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND u.status = 'active'`,
      [user_id]
    );

    if ((userData as any[]).length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan atau tidak aktif" },
        { status: 404 }
      );
    }

    const user = (userData as any[])[0];
    const roleName = user.role_name.toUpperCase();

    // Validate that user has HRD or Director role
    if (!roleName.includes('HRD') && 
        !roleName.includes('DIREKTUR') && 
        !roleName.includes('PERSONALIA') && 
        !roleName.includes('DIRECTOR')) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "User harus memiliki role HRD atau Direktur" },
        { status: 400 }
      );
    }

    // Check if already exists
    const [existing] = await connection.execute(
      `SELECT id FROM hrd_approver WHERE user_id = ?`,
      [user_id]
    );

    if ((existing as any[]).length > 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "User sudah menjadi HRD approver" },
        { status: 400 }
      );
    }

    // Insert new HRD approver
    await connection.execute(
      `INSERT INTO hrd_approver (user_id, divisi_kode, is_active, created_at)
       VALUES (?, ?, 1, NOW())`,
      [user_id, divisi_kode || null] 
    );

    console.log("✅ New HRD Approver added");

    await connection.commit();

    console.log("✅ HRD Approver added successfully");

    return NextResponse.json({
      success: true,
      message: "HRD approver berhasil ditambahkan",
    });
  } catch (error) {
    console.error("❌ Error adding HRD approver:", error);
    
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "Terjadi kesalahan server" 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// DELETE - Remove HRD approver
export async function DELETE(req: NextRequest) {
  let connection;

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

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Check if this is the last HRD approver
    const [totalCount] = await connection.execute(
      `SELECT COUNT(*) as count FROM hrd_approver`
    );

    if ((totalCount as any[])[0].count <= 1) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Tidak bisa menghapus HRD approver terakhir. Minimal harus ada 1 HRD approver." },
        { status: 400 }
      );
    }

    // Hard delete - permanently remove from database
    await connection.execute(
      `DELETE FROM hrd_approver WHERE id = ?`,
      [id]
    );

    await connection.commit();

    console.log("✅ HRD Approver deleted successfully");

    return NextResponse.json({
      success: true,
      message: "HRD approver berhasil dihapus",
    });
  } catch (error) {
    console.error("❌ Error deleting HRD approver:", error);
    
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Rollback error:", rollbackError);
      }
    }

    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}