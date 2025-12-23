// lib/attendance-notifier.ts
import { query } from "@/lib/db";
import { sendSSENotification } from "@/lib/sse";

let isRunning = false;
let lastCheckMinute = -1;

export function startAttendanceNotifier() {
  if (isRunning) {
    console.log("⚠️ Attendance Notifier already running");
    return;
  }

  isRunning = true;
  console.log("🔔 Attendance Notifier started");

  // Cek setiap 1 menit
  setInterval(async () => {
    try {
      const now = new Date();
      const jakartaTime = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );
      const hour = jakartaTime.getHours();
      const minute = jakartaTime.getMinutes();
      const day = jakartaTime.getDay(); // 0=Minggu, 1-5=Senin-Jumat

      // Skip weekend
      if (day === 0 || day === 6) return;

      // Cegah duplicate notification di menit yang sama
      const currentMinute = hour * 60 + minute;
      if (currentMinute === lastCheckMinute) return;
      lastCheckMinute = currentMinute;

      // ⏰ REMINDER ABSEN MASUK (07:45)
      if (hour === 7 && minute === 45) {
        await sendClockInReminder();
      }

      // ⏰ REMINDER ABSEN PULANG (16:25)
      if (hour === 16 && minute === 25) {
        await sendClockOutReminder();
      }
    } catch (error) {
      console.error("❌ Error in attendance notifier:", error);
    }
  }, 60000); // 60 detik
}

async function sendClockInReminder() {
  console.log("⏰ Sending clock-in reminders...");

  try {
    const today = getJakartaDate();

    // Ambil semua user yang belum absen hari ini
    const users = await query(
      `
      SELECT u.id, u.name 
      FROM users u
      LEFT JOIN absensi a ON u.id = a.user_id AND a.date = ?
      WHERE a.id IS NULL AND u.is_active = 1
    `,
      [today]
    );

    let successCount = 0;

    for (const user of users as any[]) {
      try {
        // Insert ke database
        await query(
          `
          INSERT INTO notifications (user_id, type, title, message, reference_type, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `,
          [
            user.id,
            "attendance_reminder_clock_in",
            "Waktunya Absen Masuk",
            "Jangan lupa melakukan absensi masuk. Batas waktu: 07:50 WIB",
            "attendance",
          ]
        );

        // Kirim via SSE (real-time)
        sendSSENotification(user.id.toString(), {
          type: "attendance_reminder_clock_in",
          title: "Waktunya Absen Masuk",
          message:
            "Jangan lupa melakukan absensi masuk. Batas waktu: 07:50 WIB",
          timestamp: new Date().toISOString(),
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to send reminder to user ${user.id}:`, err);
      }
    }

    console.log(`✅ Sent ${successCount}/${users.length} clock-in reminders`);
  } catch (error) {
    console.error("❌ Error in sendClockInReminder:", error);
  }
}

async function sendClockOutReminder() {
  console.log("⏰ Sending clock-out reminders...");

  try {
    const today = getJakartaDate();

    // Ambil user yang sudah absen masuk tapi belum pulang
    const users = await query(
      `
      SELECT u.id, u.name, a.jam_masuk
      FROM users u
      INNER JOIN absensi a ON u.id = a.user_id AND a.date = ?
      WHERE a.jam_pulang IS NULL AND u.is_active = 1
    `,
      [today]
    );

    let successCount = 0;

    for (const user of users as any[]) {
      try {
        await query(
          `
          INSERT INTO notifications (user_id, type, title, message, reference_type, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `,
          [
            user.id,
            "attendance_reminder_clock_out",
            "Waktunya Absen Pulang",
            "Jangan lupa melakukan absensi pulang. Jam pulang: 16:30 WIB",
            "attendance",
          ]
        );

        sendSSENotification(user.id.toString(), {
          type: "attendance_reminder_clock_out",
          title: "Waktunya Absen Pulang",
          message:
            "Jangan lupa melakukan absensi pulang. Jam pulang: 16:30 WIB",
          timestamp: new Date().toISOString(),
        });

        successCount++;
      } catch (err) {
        console.error(`Failed to send reminder to user ${user.id}:`, err);
      }
    }

    console.log(`✅ Sent ${successCount}/${users.length} clock-out reminders`);
  } catch (error) {
    console.error("❌ Error in sendClockOutReminder:", error);
  }
}

// Helper function untuk tanggal Jakarta
function getJakartaDate(): string {
  const jakartaTime = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
  });
  const date = new Date(jakartaTime);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
