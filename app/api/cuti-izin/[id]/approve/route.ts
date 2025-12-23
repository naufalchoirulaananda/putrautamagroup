// File: app/api/cuti-izin/[id]/approve/route.ts (Updated with comprehensive notifications)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";
import { generateQRData, generateSimpleQR } from "@/lib/qr-generator";
import { generatePDFWithQR } from "@/lib/pdf-generator";
import {
  notifyEmployeeApproved,
  notifyEmployeeRejected,
  notifyHRDNewRequest,
  notifyEmployeeManagerApproved,
} from "@/lib/server/notification";

interface ApprovalPayload {
  action: "approve" | "reject";
  notes?: string;
}

interface ApprovalRecord {
  approver_name: string;
  approver_role: string;
  approval_level: number;
  approved_at: string;
  qr_data?: string;
  signature_code: string;
}

/**
 * Get HRD Approver berdasarkan divisi
 */
async function getHRDApproverForDivisi(
  connection: any,
  divisiKode: string
): Promise<number | null> {
  try {
    // 1. Cari HRD spesifik untuk divisi
    const [specificHRD] = await connection.execute(
      `SELECT ha.user_id 
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       WHERE ha.is_active = 1 
       AND u.status = 'active'
       AND ha.divisi_kode = ?
       LIMIT 1`,
      [divisiKode]
    );

    if ((specificHRD as any[]).length > 0) {
      return (specificHRD as any[])[0].user_id;
    }

    // 2. Fallback: HRD generic
    const [genericHRD] = await connection.execute(
      `SELECT ha.user_id 
       FROM hrd_approver ha
       INNER JOIN users u ON ha.user_id = u.id
       WHERE ha.is_active = 1 
       AND u.status = 'active'
       AND ha.divisi_kode IS NULL
       LIMIT 1`
    );

    if ((genericHRD as any[]).length > 0) {
      return (genericHRD as any[])[0].user_id;
    }

    return null;
  } catch (error) {
    console.error("Error getting HRD approver:", error);
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const connection = await pool.getConnection();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const cutiIzinId = parseInt(id);
    const body: ApprovalPayload = await req.json();

    await connection.beginTransaction();

    // Get current cuti_izin data
    const [cutiData] = await connection.execute(
      `SELECT ci.*, u.name as user_name, u.kode_pegawai as user_kode, 
              r.name as role_name, d.nama_divisi,
              CASE 
                WHEN ci.jenis_izin = 'cuti' THEN DATEDIFF(ci.tanggal_cuti_selesai, ci.tanggal_cuti_mulai) + 1
                ELSE 1
              END as jumlah_hari,
              approver.name as approver_name,
              approver.kode_pegawai as approver_kode,
              approver_role.name as approver_role_name
       FROM cuti_izin ci
       LEFT JOIN users u ON ci.user_id = u.id
       LEFT JOIN roles r ON ci.role_id = r.id
       LEFT JOIN divisi d ON ci.divisi_kode = d.kode_divisi
       LEFT JOIN users approver ON ci.current_approver_id = approver.id
       LEFT JOIN roles approver_role ON approver.role_id = approver_role.id
       WHERE ci.id = ?`,
      [cutiIzinId]
    );

    if ((cutiData as any[]).length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Data cuti tidak ditemukan" },
        { status: 404 }
      );
    }

    const cuti = (cutiData as any[])[0];

    // Validasi approver
    if (cuti.current_approver_id !== parseInt(session.user.id)) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: "Anda bukan approver untuk pengajuan ini" },
        { status: 403 }
      );
    }

    if (body.action === "reject") {
      // ==================== REJECT LOGIC ====================
      const rejectStatus =
        cuti.status === "waiting_manager" ? "rejected_manager" : "rejected_hrd";

      await connection.execute(
        `UPDATE cuti_izin 
         SET status = ?, rejected_by = ?, rejection_reason = ?, rejected_at = NOW()
         WHERE id = ?`,
        [
          rejectStatus,
          session.user.id,
          body.notes || "Tidak ada keterangan",
          cutiIzinId,
        ]
      );

      // Return kuota jika cuti
      if (cuti.jenis_izin === "cuti") {
        const tahunCuti = new Date(cuti.tanggal_cuti_mulai).getFullYear();
        const jumlahHari = cuti.jumlah_hari;

        await connection.execute(
          `UPDATE kuota_cuti_user 
           SET kuota_pending = GREATEST(kuota_pending - ?, 0),
               kuota_sisa = kuota_sisa + ?
           WHERE user_id = ? AND tahun = ?`,
          [jumlahHari, jumlahHari, cuti.user_id, tahunCuti]
        );
      }

      await connection.commit();

      // 🔔 NOTIFIKASI - Permohonan ditolak
      try {
        await notifyEmployeeRejected(
          cuti.user_id,
          cuti.jenis_izin,
          cutiIzinId,
          session.user.name || "Approver",
          body.notes
        );
      } catch (notifError) {
        console.error("Error sending rejection notification:", notifError);
      }

      return NextResponse.json({
        success: true,
        message: "Permohonan telah ditolak",
      });
    } else {
      // ==================== APPROVE LOGIC ====================
      const currentLevel = cuti.approval_level;
      const maxLevel = cuti.max_approval_level;
      const approvedAt = new Date().toISOString();

      // Generate QR Code
      const qrData = generateQRData(cutiIzinId, {
        name: session.user.name || "",
        role: session.user.role || "",
        kode_pegawai: cuti.approver_kode,
        approval_level: currentLevel,
        approved_at: approvedAt,
      });

      const qrCodeBase64 = await generateSimpleQR(cutiIzinId, {
        name: session.user.name || "",
        role: session.user.role || "",
        kode_pegawai: cuti.approver_kode,
        approval_level: currentLevel,
        approved_at: approvedAt,
      });

      const qrCodeDataURL = `data:image/png;base64,${qrCodeBase64}`;

      // Insert approval record
      await connection.execute(
        `INSERT INTO cuti_izin_approval (
          cuti_izin_id, approver_id, approver_name, approver_role,
          approval_level, status, notes, qr_data, signature_code, approved_at
        ) VALUES (?, ?, ?, ?, ?, 'approved', ?, ?, ?, NOW())`,
        [
          cutiIzinId,
          session.user.id,
          session.user.name,
          session.user.role,
          currentLevel,
          body.notes || "",
          qrData,
          qrCodeDataURL,
        ]
      );

      let newStatus = cuti.status;
      let newApprovalLevel = currentLevel;
      let newCurrentApproverId = cuti.current_approver_id;

      // Check if final approval
      if (currentLevel >= maxLevel) {
        // ==================== FINAL APPROVAL ====================
        newStatus = "approved";
        newApprovalLevel = maxLevel;

        // Update kuota: pending → terpakai
        if (cuti.jenis_izin === "cuti") {
          const tahunCuti = new Date(cuti.tanggal_cuti_mulai).getFullYear();
          const jumlahHari = cuti.jumlah_hari;

          await connection.execute(
            `UPDATE kuota_cuti_user 
             SET kuota_pending = GREATEST(kuota_pending - ?, 0),
                 kuota_terpakai = kuota_terpakai + ?
             WHERE user_id = ? AND tahun = ?`,
            [jumlahHari, jumlahHari, cuti.user_id, tahunCuti]
          );
        }

        // Get all approvals for final PDF
        const [allApprovals] = await connection.execute(
          `SELECT approver_name, approver_role, qr_data, signature_code, 
                  approval_level, approved_at
           FROM cuti_izin_approval
           WHERE cuti_izin_id = ?
           ORDER BY approval_level ASC`,
          [cutiIzinId]
        );

        // Generate final PDF
        const pdfPath = await generatePDFWithQR(
          cuti,
          allApprovals as any[],
          "final"
        );

        await connection.execute(
          `UPDATE cuti_izin 
           SET status = ?, approval_level = ?, pdf_final_path = ?
           WHERE id = ?`,
          [newStatus, newApprovalLevel, pdfPath, cutiIzinId]
        );

        // 🔔 NOTIFIKASI - Permohonan disetujui FINAL
        try {
          await notifyEmployeeApproved(
            cuti.user_id,
            cuti.jenis_izin,
            cutiIzinId,
            session.user.name || "HRD",
            body.notes
          );
        } catch (notifError) {
          console.error("Error sending notification:", notifError);
          const errorMessage =
            notifError instanceof Error
              ? notifError.message
              : String(notifError);
          await connection.execute(
            `INSERT INTO notification_errors (error_type, error_message, cuti_id, timestamp)
             VALUES (?, ?, ?, NOW())`,
            ["employee_approved", errorMessage, cutiIzinId]
          );
        }
      } else {
        // ==================== INTERMEDIATE APPROVAL (Manager Level) ====================
        newApprovalLevel = currentLevel + 1;

        if (newApprovalLevel === 2) {
          newStatus = "waiting_hrd";

          // ⭐ GET HRD BERDASARKAN DIVISI
          newCurrentApproverId = await getHRDApproverForDivisi(
            connection,
            cuti.divisi_kode
          );

          if (!newCurrentApproverId) {
            await connection.rollback();
            return NextResponse.json(
              {
                success: false,
                error: "Tidak ada HRD approver untuk divisi ini",
              },
              { status: 500 }
            );
          }

          console.log(
            `✅ Forward to HRD for divisi ${cuti.divisi_kode}, HRD ID: ${newCurrentApproverId}`
          );

          // Generate Level 1 PDF
          const approvalRecord: ApprovalRecord = {
            approver_name: session.user.name || "",
            approver_role: session.user.role || "",
            qr_data: qrData,
            signature_code: qrCodeDataURL,
            approval_level: currentLevel,
            approved_at: approvedAt,
          };

          const pdfLevel1Path = await generatePDFWithQR(
            cuti,
            [approvalRecord],
            "level1"
          );

          await connection.execute(
            `UPDATE cuti_izin 
             SET status = ?, approval_level = ?, current_approver_id = ?,
                 qr_code_manager = ?, pdf_level1_path = ?
             WHERE id = ?`,
            [
              newStatus,
              newApprovalLevel,
              newCurrentApproverId,
              qrCodeDataURL,
              pdfLevel1Path,
              cutiIzinId,
            ]
          );

          // 🔔 NOTIFIKASI - Ke KARYAWAN (Manager approved, waiting HRD)
          try {
            await notifyEmployeeManagerApproved(
              cuti.user_id,
              cuti.jenis_izin,
              cutiIzinId,
              session.user.name || "Manager"
            );
          } catch (notifError) {
            console.error(
              "Error sending manager approval notification:",
              notifError
            );
          }

          // 🔔 NOTIFIKASI - Ke HRD (Ada permohonan baru)
          try {
            await notifyHRDNewRequest(
              newCurrentApproverId,
              cuti.user_name,
              cuti.jenis_izin,
              cutiIzinId
            );
          } catch (notifError) {
            console.error("Error sending HRD notification:", notifError);
          }
        }
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message:
          newStatus === "approved"
            ? "✅ Permohonan telah disetujui sepenuhnya"
            : "✅ Permohonan telah disetujui dan diteruskan ke level berikutnya",
        data: {
          new_status: newStatus,
          approval_level: newApprovalLevel,
          qr_generated: true,
        },
      });
    }
  } catch (error) {
    await connection.rollback();
    console.error("❌ Error processing approval:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}
