// File: lib/server/notification.ts
// Enhanced notification system for all user levels

import pool from "@/lib/db";

interface NotificationData {
  user_id: number;
  type: string;
  title: string;
  message: string;
  reference_id?: number;
  reference_type?: string;
}

async function createNotification(data: NotificationData) {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      `INSERT INTO notifications (user_id, type, title, message, reference_id, reference_type, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        data.user_id,
        data.type,
        data.title,
        data.message,
        data.reference_id || null,
        data.reference_type || null,
      ]
    );
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  } finally {
    connection.release();
  }
}

// 1. Notifikasi untuk KARYAWAN - Permohonan berhasil dikirim
export async function notifyEmployeeSubmitted(
  employeeId: number,
  jenisIzin: string,
  cutiIzinId: number
) {
  await createNotification({
    user_id: employeeId,
    type: "cuti_submitted",
    title: "Permohonan Berhasil Dikirim",
    message: `Permohonan ${jenisIzin} Anda telah berhasil dikirim dan menunggu persetujuan atasan.`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 2. Notifikasi untuk MANAGER/SPV/KOORDINATOR/DIREKTUR - Ada permohonan baru
export async function notifyManagerNewRequest(
  managerId: number,
  employeeName: string,
  jenisIzin: string,
  cutiIzinId: number
) {
  await createNotification({
    user_id: managerId,
    type: "cuti_request",
    title: "Permohonan Cuti/Izin Baru",
    message: `${employeeName} mengajukan permohonan ${jenisIzin}. Mohon untuk ditinjau.`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 3. Notifikasi untuk HRD - Ada permohonan yang sudah disetujui manager
export async function notifyHRDNewRequest(
  hrdId: number,
  employeeName: string,
  jenisIzin: string,
  cutiIzinId: number
) {
  await createNotification({
    user_id: hrdId,
    type: "cuti_waiting_hrd",
    title: "Permohonan Menunggu Persetujuan HRD",
    message: `Permohonan ${jenisIzin} dari ${employeeName} telah disetujui atasan dan menunggu persetujuan final dari HRD.`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 4. Notifikasi untuk KARYAWAN - Permohonan disetujui manager (level 1)
export async function notifyEmployeeManagerApproved(
  employeeId: number,
  jenisIzin: string,
  cutiIzinId: number,
  approverName: string
) {
  await createNotification({
    user_id: employeeId,
    type: "cuti_progress",
    title: "Permohonan Disetujui Atasan",
    message: `Permohonan ${jenisIzin} Anda telah disetujui oleh ${approverName}. Sedang menunggu persetujuan HRD.`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 5. Notifikasi untuk KARYAWAN - Permohonan disetujui penuh (final)
export async function notifyEmployeeApproved(
  employeeId: number,
  jenisIzin: string,
  cutiIzinId: number,
  approverName: string,
  notes?: string
) {
  await createNotification({
    user_id: employeeId,
    type: "cuti_approved",
    title: "Permohonan Disetujui",
    message: `Selamat! Permohonan ${jenisIzin} Anda telah disetujui oleh ${approverName}.${
      notes ? ` Catatan: ${notes}` : ""
    }`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 6. Notifikasi untuk KARYAWAN - Permohonan ditolak
export async function notifyEmployeeRejected(
  employeeId: number,
  jenisIzin: string,
  cutiIzinId: number,
  approverName: string,
  reason?: string
) {
  await createNotification({
    user_id: employeeId,
    type: "cuti_rejected",
    title: "Permohonan Ditolak",
    message: `Permohonan ${jenisIzin} Anda ditolak oleh ${approverName}.${
      reason ? ` Alasan: ${reason}` : ""
    }`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}

// 7. Notifikasi untuk ATASAN - Jika mereka juga punya permohonan yang diproses
export async function notifyManagerAboutOwnRequest(
  managerId: number,
  status: "approved" | "rejected",
  jenisIzin: string,
  cutiIzinId: number,
  approverName: string
) {
  const isApproved = status === "approved";
  await createNotification({
    user_id: managerId,
    type: isApproved ? "cuti_approved" : "cuti_rejected",
    title: isApproved ? "Permohonan Disetujui" : "Permohonan Ditolak",
    message: `Permohonan ${jenisIzin} Anda telah ${
      isApproved ? "disetujui" : "ditolak"
    } oleh ${approverName}.`,
    reference_id: cutiIzinId,
    reference_type: "cuti_izin",
  });
}