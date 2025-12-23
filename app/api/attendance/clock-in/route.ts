// app/api/attendance/clock-in/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getJakartaDate, getJakartaTime } from "@/lib/datetime";
import { reverseGeocode } from "@/lib/geocoding";
import { sendSSENotification } from "@/lib/sse";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = session.user.id;
    const today = getJakartaDate();

    const subjekMasuk = formData.get("subjek_masuk") as string;
    const keteranganMasuk = formData.get("keterangan_masuk") as string;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const jamMasuk = getJakartaTime();

    // Cek apakah sudah absen hari ini
    const existing = await query(
      `SELECT id FROM absensi WHERE user_id = ? AND date = ?`,
      [userId, today]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Anda sudah melakukan presensi masuk hari ini" },
        { status: 400 }
      );
    }

    // Konversi koordinat ke alamat
    const alamatMasuk = await reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    console.log("📍 Alamat Masuk:", alamatMasuk);

    // Simpan foto-foto
    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "attendance"
    );
    await mkdir(uploadDir, { recursive: true });

    const fotoPaths: string[] = [];
    for (let i = 1; i <= 3; i++) {
      const foto = formData.get(`foto_${i}`) as File;
      if (foto) {
        const bytes = await foto.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const fileName = `${userId}_${Date.now()}_masuk_${i}.jpg`;
        const filePath = path.join(uploadDir, fileName);

        await writeFile(filePath, buffer);
        fotoPaths.push(`/uploads/attendance/${fileName}`);
      } else {
        fotoPaths.push("");
      }
    }

    // Insert ke database dengan alamat
    await query(
      `INSERT INTO absensi 
       (user_id, date, subjek_masuk, jam_masuk, foto_masuk_1, foto_masuk_2, foto_masuk_3, 
        latitude_masuk, longitude_masuk, alamat_masuk, keterangan_masuk) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        today,
        subjekMasuk,
        jamMasuk,
        fotoPaths[0],
        fotoPaths[1],
        fotoPaths[2],
        latitude,
        longitude,
        alamatMasuk,
        keteranganMasuk,
      ]
    );

    try {
      await query(
        `
        INSERT INTO notifications (user_id, type, title, message, reference_type, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
        [
          userId,
          "attendance_clock_in",
          "Absensi Masuk Berhasil",
          `Anda telah melakukan absensi masuk pada ${jamMasuk}. Lokasi: ${alamatMasuk}`,
          "attendance",
        ]
      );

      sendSSENotification(userId.toString(), {
        type: "attendance_clock_in",
        title: "Absensi Masuk Berhasil",
        message: `Anda telah melakukan absensi masuk pada ${jamMasuk}`,
        timestamp: new Date().toISOString(),
      });
      
    } catch (notifError) {
      console.error("Failed to send clock-in notification:", notifError);
      // Jangan throw error, biar absensi tetap sukses
    }

    return NextResponse.json({
      success: true,
      message: "Presensi masuk berhasil",
      jamMasuk,
      alamatMasuk,
    });
  } catch (error) {
    console.error("Error clock in:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
