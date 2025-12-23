import { NextResponse } from "next/server";
import { query } from "@/lib/db_gmart_get";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const ADMIN_ROLES = [
  "SUPERADMIN",
  "PROGRAMMER",
  "PROGRAMMER JUNIOR",
  "OWNER",
  "DIREKTUR UTAMA",
  "DIREKTUR KEUANGAN",
  "DIREKTUR KSP",
  "DIREKTUR OTOMOTIF",
  "DIREKTUR MPU",
  "MANAGER GMART",
  "STAFF KEUANGAN GMART",
  "SPV LOGISTIK GMART",
  "SPV KEUANGAN GMART",
  "SPV PENGUNJUNG GMART",
  "HRD GMART",
  "PERSONALIA",
];

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { kode } = await req.json();
    const userRole = session.user.role;
    const isAdmin = ADMIN_ROLES.includes(userRole || "");
    const cabangId = session.user.cabang_id;

    let rows;

    if (isAdmin) {
      // ✅ Admin: Ambil SEMUA cabang yang memiliki item ini
      rows = await query<any[]>(
        `SELECT 
          s.KodeItem, 
          t.NamaItem, 
          s.Qty, 
          l.NamaLokasi, 
          t.HargaJual, 
          s.KodeCabang,
          CASE 
            WHEN s.KodeCabang = '01' THEN 'Cabang Nguter'
            WHEN s.KodeCabang = '02' THEN 'Cabang Combongan'
            WHEN s.KodeCabang = '03' THEN 'Cabang Klaten'
            WHEN s.KodeCabang = '04' THEN 'Cabang Plumbon'
            WHEN s.KodeCabang = '05' THEN 'Cabang Wirun'
            WHEN s.KodeCabang = '06' THEN 'Cabang Karanganyar'
            WHEN s.KodeCabang = '07' THEN 'Cabang Sragen'
            WHEN s.KodeCabang = '08' THEN 'Cabang Jatisumo'
            WHEN s.KodeCabang = '09' THEN 'Cabang Ponorogo'
            WHEN s.KodeCabang = '10' THEN 'Cabang Gubug'
            WHEN s.KodeCabang = '11' THEN 'Cabang Weleri'
            ELSE 'Cabang Lainnya'
          END AS NamaCabang,
          a.LokasiRak as ExistingLokasiRak,
          a.stockReal as LastStockReal
        FROM stockbarang s
        LEFT JOIN titem t ON s.KodeItem = t.KodeItem
        LEFT JOIN tlokasi l ON s.KodeLokasi = l.KodeLokasi
        LEFT JOIN audit_stock a ON s.KodeItem = a.KodeItem AND s.KodeCabang = a.KodeCabang
        WHERE s.KodeItem = ?
        ORDER BY s.KodeCabang ASC`,
        [kode]
      );
    } else {
      // ✅ User biasa: Hanya ambil data dari cabangnya
      if (!cabangId) {
        return NextResponse.json(
          { error: "Cabang tidak ditemukan" },
          { status: 403 }
        );
      }

      rows = await query<any[]>(
        `SELECT 
          s.KodeItem, 
          t.NamaItem, 
          s.Qty, 
          l.NamaLokasi, 
          t.HargaJual, 
          s.KodeCabang,
          a.LokasiRak as ExistingLokasiRak,
          a.stockReal as LastStockReal
        FROM stockbarang s
        LEFT JOIN titem t ON s.KodeItem = t.KodeItem
        LEFT JOIN tlokasi l ON s.KodeLokasi = l.KodeLokasi
        LEFT JOIN audit_stock a ON s.KodeItem = a.KodeItem AND s.KodeCabang = a.KodeCabang
        WHERE s.KodeItem = ? AND s.KodeCabang = ?
        LIMIT 1`,
        [kode, cabangId]
      );
    }

    if (rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    // ✅ Return format berbeda untuk admin vs user biasa
    return NextResponse.json({ 
      found: true, 
      data: isAdmin ? rows : rows[0],  // Array untuk admin, object untuk user
      isAdmin: isAdmin,
      totalCabang: rows.length
    });
  } catch (error) {
    console.error("Error checking item:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}