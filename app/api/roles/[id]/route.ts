// File: app/api/roles/[id]/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// PUT - Update role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { name } = await request.json();
    const { id: roleId } = await params;

    // Validasi input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama role harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah role exists
    const existingRole = await query("SELECT id FROM roles WHERE id = ?", [
      roleId,
    ]);

    if (existingRole.length === 0) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah nama role sudah digunakan oleh role lain
    const duplicateRole = await query(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER(?) AND id != ?",
      [name.trim(), roleId]
    );

    if (duplicateRole.length > 0) {
      return NextResponse.json(
        { error: "Role dengan nama ini sudah ada" },
        { status: 400 }
      );
    }

    // Update role
    await query("UPDATE roles SET name = ? WHERE id = ?", [
      name.trim(),
      roleId,
    ]);

    return NextResponse.json({
      success: true,
      message: "Role berhasil diupdate",
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// DELETE - Delete role
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: roleId } = await params;

    // Cek apakah role exists
    const existingRole = await query("SELECT id, name FROM roles WHERE id = ?", [
      roleId,
    ]);

    if (existingRole.length === 0) {
      return NextResponse.json(
        { error: "Role tidak ditemukan" },
        { status: 404 }
      );
    }

    // Cek apakah role masih digunakan oleh user
    const usersWithRole = await query(
      "SELECT COUNT(*) as count FROM users WHERE role_id = ?",
      [roleId]
    );

    if (usersWithRole[0].count > 0) {
      return NextResponse.json(
        {
          error: `Role "${existingRole[0].name}" tidak dapat dihapus karena masih digunakan oleh ${usersWithRole[0].count} user`,
        },
        { status: 400 }
      );
    }

    // Hapus role
    await query("DELETE FROM roles WHERE id = ?", [roleId]);

    return NextResponse.json({
      success: true,
      message: "Role berhasil dihapus",
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}