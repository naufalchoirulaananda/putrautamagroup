// File: app/api/admin/hrd-approver/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/lib/db";

export async function GET() {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const connection = await pool.getConnection();
      const [approvers] = await connection.execute(
        `SELECT 
          ha.*,
          u.name,
          u.kode_pegawai,
          r.name as role_name
         FROM hrd_approver ha
         INNER JOIN users u ON ha.user_id = u.id
         INNER JOIN roles r ON u.role_id = r.id
         WHERE ha.is_active = 1
         ORDER BY u.name`
      );
      connection.release();
  
      return NextResponse.json({
        success: true,
        data: approvers,
      });
    } catch (error) {
      console.error("Error fetching HRD approvers:", error);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server" },
        { status: 500 }
      );
    }
  }
  
  // POST - Add HRD approver
  export async function POST(req: NextRequest) {
    const connection = await pool.getConnection();
  
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
      const body = await req.json();
      const { user_id } = body;
  
      if (!user_id) {
        return NextResponse.json(
          { success: false, error: "User ID harus diisi" },
          { status: 400 }
        );
      }
  
      await connection.beginTransaction();
  
      // Cek apakah user sudah menjadi HRD approver
      const [existing] = await connection.execute(
        `SELECT id FROM hrd_approver WHERE user_id = ? AND is_active = 1`,
        [user_id]
      );
  
      if ((existing as any[]).length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: "User sudah menjadi HRD approver" },
          { status: 400 }
        );
      }
  
      // Insert
      await connection.execute(
        `INSERT INTO hrd_approver (user_id, is_active) VALUES (?, 1)`,
        [user_id]
      );
  
      await connection.commit();
  
      return NextResponse.json({
        success: true,
        message: "HRD approver berhasil ditambahkan",
      });
    } catch (error) {
      await connection.rollback();
      console.error("Error adding HRD approver:", error);
      return NextResponse.json(
        { success: false, error: "Terjadi kesalahan server" },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  }