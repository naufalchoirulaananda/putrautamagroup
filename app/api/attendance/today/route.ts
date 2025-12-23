// app/api/attendance/today/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { query } from "@/lib/db";
import { getJakartaDate } from "@/lib/datetime";

interface Attendance {
  id: number;
  user_id: number;
  date: string;
  subjek_masuk: string | null;
  subjek_pulang: string | null;        // ⭐ Sesuai
  jam_masuk: string | null;
  jam_pulang: string | null;
  durasi: number | null;
  latitude_masuk: number | null;
  longitude_masuk: number | null;
  alamat_masuk: string | null;
  latitude_pulang: number | null;
  longitude_pulang: number | null;
  alamat_pulang: string | null;
  keterangan_masuk: string | null;
  keterangan_pulang: string | null;    // ⭐ Sesuai
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
    const today = getJakartaDate();

    const attendances = await query<Attendance>(
      `SELECT * FROM absensi 
       WHERE user_id = ? AND date = ?`,
      [userId, today]
    );

    return NextResponse.json({
      attendance: attendances[0] || null
    });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
