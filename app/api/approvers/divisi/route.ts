// File: app/api/approvers/divisi/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

// GET - Fetch all divisi approvers (for management page)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const divisiKode = searchParams.get("divisi_kode");
    const roleId = searchParams.get("role_id");

    // If this is a request with divisi_kode, use the filter logic (for submission form)
    if (divisiKode) {
      return getFilteredApprovers(divisiKode, roleId);
    }

    // Otherwise, get all approvers for management page
    const connection = await pool.getConnection();
    const [approvers] = await connection.execute(
      `SELECT 
        da.id,
        da.divisi_kode,
        da.approver_id,
        da.approver_role_id,
        da.is_active,
        da.created_at,
        u.name as approver_name,
        u.kode_pegawai,
        u.cabang_id,
        r.name as approver_role_name,
        d.nama_divisi,
        c.nama_cabang as cabang_name
       FROM divisi_approver da
       INNER JOIN users u ON da.approver_id = u.id
       INNER JOIN roles r ON da.approver_role_id = r.id
       INNER JOIN divisi d ON da.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
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

// Helper function for filtered approvers (for submission form)
async function getFilteredApprovers(divisiKode: string, roleId: string | null) {
  try {
    const connection = await pool.getConnection();

    let [approvers] = await connection.execute(
      `SELECT 
        da.id,
        da.approver_id,
        u.name as approver_name,
        r.name as approver_role_name,
        u.kode_pegawai,
        u.cabang_id,
        da.divisi_kode,
        d.nama_divisi,
        c.nama_cabang as cabang_name
       FROM divisi_approver da
       INNER JOIN users u ON da.approver_id = u.id
       INNER JOIN roles r ON da.approver_role_id = r.id
       INNER JOIN divisi d ON da.divisi_kode = d.kode_divisi
       LEFT JOIN cabang_perusahaan c ON u.cabang_id = c.kode_cabang
       WHERE da.divisi_kode = ? 
       AND u.status = 'active'
       ORDER BY 
         CASE 
           WHEN UPPER(r.name) LIKE '%KOORDINATOR%' THEN 1
           WHEN UPPER(r.name) LIKE '%MANAGER%' THEN 2
           WHEN UPPER(r.name) LIKE '%SPV%' OR UPPER(r.name) LIKE '%SUPERVISOR%' THEN 3
           WHEN UPPER(r.name) LIKE '%DIREKTUR%' OR UPPER(r.name) LIKE '%DIRECTOR%' THEN 4
           ELSE 5
         END ASC`,
      [divisiKode]
    );

    // Filter based on role if provided
    if (roleId) {
      const [roleData] = await connection.execute(
        `SELECT name FROM roles WHERE id = ?`,
        [roleId]
      );

      if ((roleData as any[]).length > 0) {
        const roleName = (roleData as any[])[0].name.toUpperCase();

        approvers = (approvers as any[]).filter((a: any) => {
          const approverRole = a.approver_role_name.toUpperCase();
          
          const isManager = approverRole.includes('MANAGER');
          const isSPV = approverRole.includes('SPV') || approverRole.includes('SUPERVISOR');
          const isKoordinator = approverRole.includes('KOORDINATOR');
          const isDirektur = approverRole.includes('DIREKTUR') || approverRole.includes('DIRECTOR');

          // 1. KARYAWAN/STAFF → Manager, SPV, Koordinator, atau Direktur
          if (roleName.includes('KARYAWAN') || 
              roleName.includes('STAFF') || 
              roleName.includes('EMPLOYEE') ||
              (!roleName.includes('KOORDINATOR') && 
               !roleName.includes('MANAGER') && 
               !roleName.includes('SPV') && 
               !roleName.includes('SUPERVISOR') &&
               !roleName.includes('DIREKTUR') &&
               !roleName.includes('DIRECTOR') &&
               !roleName.includes('HRD') &&
               !roleName.includes('PERSONALIA'))) {
            return isManager || isSPV || isKoordinator || isDirektur;
          } 
          
          // 2. KOORDINATOR → Manager atau Direktur (tidak ke SPV karena sejajar)
          else if (roleName.includes('KOORDINATOR')) {
            return isManager || isDirektur;
          } 
          
          // 3. SPV → Manager atau Direktur
          else if (roleName.includes('SPV') || roleName.includes('SUPERVISOR')) {
            return isManager || isDirektur;
          }
          
          // 4. MANAGER → Direktur saja
          else if (roleName.includes('MANAGER')) {
            return isDirektur;
          }
          
          // 5. HRD/PERSONALIA → Manager atau Direktur
          else if (roleName.includes('HRD') || roleName.includes('PERSONALIA')) {
            return isManager || isDirektur;
          }
          
          return true;
        });
      }
    }

    connection.release();

    return NextResponse.json({
      success: true,
      data: approvers,
    });
  } catch (error) {
    console.error("Error fetching filtered approvers:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Add divisi approver
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
    console.log("🔥 Received body:", body);

    const { divisi_kode, approver_id } = body;

    if (!divisi_kode || !approver_id) {
      return NextResponse.json(
        { success: false, error: "Semua field harus diisi" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    // Get approver's role_id
    const [userData] = await connection.execute(
      `SELECT role_id FROM users WHERE id = ?`,
      [approver_id]
    );

    if ((userData as any[]).length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    const approverRoleId = (userData as any[])[0].role_id;

    // Check if already exists
    const [existing] = await connection.execute(
      `SELECT id FROM divisi_approver 
       WHERE divisi_kode = ? AND approver_id = ?`,
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
      [divisi_kode, approver_id, approverRoleId]
    );

    await connection.commit();

    console.log("✅ Approver added successfully");

    return NextResponse.json({
      success: true,
      message: "Approver berhasil ditambahkan",
    });
  } catch (error) {
    console.error("❌ Error adding divisi approver:", error);
    
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

// DELETE - Remove divisi approver (HARD DELETE)
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

    // Hard delete - permanently remove from database
    await connection.execute(
      `DELETE FROM divisi_approver WHERE id = ?`,
      [id]
    );

    await connection.commit();

    return NextResponse.json({
      success: true,
      message: "Approver berhasil dihapus",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Error deleting divisi approver:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}