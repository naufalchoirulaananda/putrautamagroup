// File: app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { existsSync } from "fs";

interface UserProfile {
  id: number;
  name: string;
  kode_pegawai: string;
  tanggal_lahir: string | null;
  foto_profil: string | null;
  password: string;
  role_id: number;
  role_name: string;
  status: string;
  cabang_id: string | null;
}

// GET - Fetch current user profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile with role information
    const userProfile = await query<UserProfile>(
      `SELECT u.id, u.name, u.kode_pegawai, 
              DATE_FORMAT(u.tanggal_lahir, '%Y-%m-%d') as tanggal_lahir, 
              u.foto_profil, u.password,
              u.role_id, u.status, u.cabang_id,
              r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [session.user.id]
    );

    if (userProfile.length === 0) {
      return NextResponse.json(
        { error: "User tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        ...userProfile[0],
        foto_profil: userProfile[0].foto_profil
          ? `${userProfile[0].foto_profil.startsWith("/") ? "" : "/"}${
              userProfile[0].foto_profil
            }`
          : null,
      },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const name = formData.get("name") as string;
    const kode_pegawai = formData.get("kode_pegawai") as string;
    const tanggal_lahir = formData.get("tanggal_lahir") as string;
    const password = formData.get("password") as string;
    const foto_profil = formData.get("foto_profil") as File | null;

    // Validasi input
    if (!name || !kode_pegawai) {
      return NextResponse.json(
        { error: "Nama dan kode pegawai harus diisi" },
        { status: 400 }
      );
    }

    // Cek apakah kode_pegawai sudah digunakan user lain
    const existingUser = await query<{ id: number }>(
      "SELECT id FROM users WHERE kode_pegawai = ? AND id != ?",
      [kode_pegawai, session.user.id]
    );

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Kode pegawai sudah digunakan" },
        { status: 400 }
      );
    }

    let foto_profil_path: string | null = null;

    // Handle file upload jika ada
    if (foto_profil && foto_profil.size > 0) {
      // Ambil foto profil lama untuk dihapus
      const oldProfile = await query<{ foto_profil: string | null }>(
        "SELECT foto_profil FROM users WHERE id = ?",
        [session.user.id]
      );

      // Hapus file lama jika ada
      if (oldProfile.length > 0 && oldProfile[0].foto_profil) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          oldProfile[0].foto_profil
        );

        // Cek apakah file ada, lalu hapus
        if (existsSync(oldFilePath)) {
          try {
            await unlink(oldFilePath);
            console.log(`Old photo deleted: ${oldFilePath}`);
          } catch (error) {
            console.error("Error deleting old photo:", error);
            // Tidak perlu throw error, lanjutkan upload foto baru
          }
        }
      }

      const bytes = await foto_profil.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Validasi ukuran file (max 5MB)
      if (foto_profil.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Ukuran foto maksimal 5MB" },
          { status: 400 }
        );
      }

      // Validasi tipe file
      if (!foto_profil.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "File harus berupa gambar" },
          { status: 400 }
        );
      }

      // Create uploads directory if not exists
      const uploadDir = path.join(
        process.cwd(),
        "public",
        "uploads",
        "profiles"
      );
      await mkdir(uploadDir, { recursive: true });

      // Generate unique filename menggunakan user_id (akan menimpa file dengan id yang sama)
      const timestamp = Date.now();
      const filename = `profile_${session.user.id}_${timestamp}${path.extname(
        foto_profil.name
      )}`;
      const filepath = path.join(uploadDir, filename);

      // Save file
      await writeFile(filepath, buffer);
      foto_profil_path = `/uploads/profiles/${filename}`;
    }

    // Build update query dynamically
    let updateQuery = `UPDATE users SET name = ?, kode_pegawai = ?, tanggal_lahir = ?`;
    let queryParams: any[] = [name, kode_pegawai, tanggal_lahir || null];

    // Add foto_profil if uploaded
    if (foto_profil_path) {
      updateQuery += `, foto_profil = ?`;
      queryParams.push(foto_profil_path);
    }

    // Add password if provided
    if (password && password.trim() !== "") {
      updateQuery += `, password = ?`;
      queryParams.push(password);
    }

    updateQuery += ` WHERE id = ?`;
    queryParams.push(session.user.id);

    // Execute update
    await query(updateQuery, queryParams);

    // Log activity
    await query("INSERT INTO activity_logs (user_id, action) VALUES (?, ?)", [
      session.user.id,
      `update_profile:${session.user.id}`,
    ]);

    // Get updated user data
    const updatedUser = await query<UserProfile>(
      `SELECT u.id, u.name, u.kode_pegawai, 
              DATE_FORMAT(u.tanggal_lahir, '%Y-%m-%d') as tanggal_lahir, 
              u.foto_profil, u.password,
              u.role_id, u.status, u.cabang_id,
              r.name as role_name
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: "Profil berhasil diupdate",
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
