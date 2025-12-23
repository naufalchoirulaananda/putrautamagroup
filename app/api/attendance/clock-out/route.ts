// app/api/attendance/clock-out/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getJakartaDate, getJakartaTime } from "@/lib/datetime";
import { reverseGeocode } from "@/lib/geocoding";
import { sendSSENotification } from "@/lib/sse";

interface Attendance {
  jam_masuk: string;
  jam_pulang: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const userId = session.user.id;
    const today = getJakartaDate();

    // ⭐ Tambahan Baru
    const subjekPulang = formData.get("subjek_pulang") as string;
    const keteranganPulang = formData.get("keterangan_pulang") as string;

    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const jamPulang = getJakartaTime();

    // Cek presensi masuk
    const existing = await query<Attendance>(
      `SELECT jam_masuk, jam_pulang FROM absensi WHERE user_id = ? AND date = ?`,
      [userId, today]
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { error: "Anda belum melakukan presensi masuk hari ini" },
        { status: 400 }
      );
    }

    if (existing[0].jam_pulang) {
      return NextResponse.json(
        { error: "Anda sudah melakukan presensi pulang hari ini" },
        { status: 400 }
      );
    }

    // Ambil alamat dari koordinat
    const alamatPulang = await reverseGeocode(
      parseFloat(latitude),
      parseFloat(longitude)
    );

    // Hitung durasi
    const jamMasuk = existing[0].jam_masuk;
    const [hMasuk, mMasuk] = jamMasuk.split(":").map(Number);
    const [hPulang, mPulang] = jamPulang.split(":").map(Number);

    const durasiMenit = hPulang * 60 + mPulang - (hMasuk * 60 + mMasuk);

    // Simpan foto pulang
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
        const fileName = `${userId}_${Date.now()}_pulang_${i}.jpg`;
        const filePath = path.join(uploadDir, fileName);
        await writeFile(filePath, buffer);
        fotoPaths.push(`/uploads/attendance/${fileName}`);
      } else {
        fotoPaths.push("");
      }
    }

    // ⭐ UPDATE Database (Ditambahkan 2 field baru)
    await query(
      `UPDATE absensi 
       SET 
         jam_pulang = ?, 
         foto_pulang_1 = ?, 
         foto_pulang_2 = ?, 
         foto_pulang_3 = ?,
         latitude_pulang = ?, 
         longitude_pulang = ?, 
         alamat_pulang = ?, 
         durasi = ?,
         subjek_pulang = ?,          -- ⭐ Tambahan
         keterangan_pulang = ?       -- ⭐ Tambahan
       WHERE user_id = ? AND date = ?`,
      [
        jamPulang,
        fotoPaths[0],
        fotoPaths[1],
        fotoPaths[2],
        latitude,
        longitude,
        alamatPulang,
        durasiMenit,
        subjekPulang, // ⭐ Baru
        keteranganPulang, // ⭐ Baru
        userId,
        today,
      ]
    );

    // Response
    const durasiJam = Math.floor(durasiMenit / 60);
    const sisaMenit = durasiMenit % 60;

    try {
      await query(
        `
        INSERT INTO notifications (user_id, type, title, message, reference_type, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
      `,
        [
          userId,
          "attendance_clock_out",
          "Absensi Pulang Berhasil",
          `Anda telah melakukan absensi pulang pada ${jamPulang}. Total durasi kerja: ${durasiJam} jam ${sisaMenit} menit`,
          "attendance",
        ]
      );

      sendSSENotification(userId.toString(), {
        type: "attendance_clock_out",
        title: "Absensi Pulang Berhasil",
        message: `Total durasi kerja: ${durasiJam} jam ${sisaMenit} menit`,
        timestamp: new Date().toISOString(),
      });
    } catch (notifError) {
      console.error("Failed to send clock-out notification:", notifError);
    }

    return NextResponse.json({
      success: true,
      message: "Presensi pulang berhasil",
      jamPulang,
      alamatPulang,
      durasi: durasiMenit,
      durasiFormatted: `${durasiJam} jam ${sisaMenit} menit`,
    });
  } catch (error) {
    console.error("Error clock out:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
