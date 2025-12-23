// app/api/attendance/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";

interface AttendanceHistory {
  id: number;
  date: string;
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Ambil riwayat kehadiran user yang login, urutkan dari terbaru
    const attendances = await query<AttendanceHistory>(
      `SELECT id, date, jam_masuk, jam_pulang, durasi
       FROM absensi 
       WHERE user_id = ?
       ORDER BY date DESC`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      data: attendances
    });
  } catch (error) {
    console.error("Error fetching attendance history:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}