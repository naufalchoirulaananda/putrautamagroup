import pool from "@/lib/db";

export async function updateKuotaAfterApproval(
  userId: number,
  tahun: number,
  jumlahHari: number,
  action: "approve" | "reject" | "pending"
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    if (action === "approve") {
      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_pending = kuota_pending - ?,
             kuota_terpakai = kuota_terpakai + ?,
             kuota_sisa = kuota_total - kuota_terpakai - ? - kuota_pending
         WHERE user_id = ? AND tahun = ?`,
        [jumlahHari, jumlahHari, jumlahHari, userId, tahun]
      );
    } else if (action === "reject") {
      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_pending = kuota_pending - ?,
             kuota_sisa = kuota_total - kuota_terpakai - kuota_pending + ?
         WHERE user_id = ? AND tahun = ?`,
        [jumlahHari, jumlahHari, userId, tahun]
      );
    } else if (action === "pending") {
      await connection.execute(
        `UPDATE kuota_cuti_user 
         SET kuota_pending = kuota_pending + ?,
             kuota_sisa = kuota_total - kuota_terpakai - kuota_pending - ?
         WHERE user_id = ? AND tahun = ?`,
        [jumlahHari, jumlahHari, userId, tahun]
      );
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    console.error("Error updating kuota:", error);
    return false;
  } finally {
    connection.release();
  }
}
