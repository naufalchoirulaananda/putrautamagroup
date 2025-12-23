// File: app/api/roles/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET - Fetch all roles
export async function GET() {
  try {
    const roles = await query(
      "SELECT id, name, description FROM roles ORDER BY name"
    );

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// POST - Create new role
export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // Validasi input
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Nama role harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah role sudah ada
    const existingRole = await query(
      "SELECT id FROM roles WHERE LOWER(name) = LOWER(?)",
      [name.trim()]
    );

    if (existingRole.length > 0) {
      return NextResponse.json(
        { error: "Role dengan nama ini sudah ada" },
        { status: 400 }
      );
    }

    // Insert role baru
    await query(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      [name.trim(), ""]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Role berhasil ditambahkan",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
