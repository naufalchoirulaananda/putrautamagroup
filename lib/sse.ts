// lib/sse.ts

// Simpan koneksi SSE aktif
export const sseConnections = new Map<
  string,
  ReadableStreamDefaultController
>();

// Helper kirim notifikasi via SSE
export function sendSSENotification(
  userId: string,
  notification: any
) {
  const controller = sseConnections.get(userId);

  if (!controller) {
    console.log(`⚠️ User ${userId} tidak punya koneksi SSE aktif`);
    return false;
  }

  try {
    const encoder = new TextEncoder();
    controller.enqueue(
      encoder.encode(
        `data: ${JSON.stringify({
          type: "notification",
          data: notification,
        })}\n\n`
      )
    );
    return true;
  } catch (err) {
    sseConnections.delete(userId);
    return false;
  }
}
