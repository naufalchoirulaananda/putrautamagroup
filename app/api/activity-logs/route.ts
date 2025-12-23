import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  timestamp: string;
  user_name: string | null;
  kode_pegawai: string | null;
}

// GET: Fetch all activity logs
export async function GET() {
  try {
    const sql = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.timestamp,
        u.name as user_name,
        u.kode_pegawai
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ORDER BY al.timestamp DESC
    `;
    
    const logs = await query<ActivityLog>(sql);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}

// DELETE: Hapus semua activity logs
export async function DELETE() {
  try {
    const sql = `DELETE FROM activity_logs`;
    
    await query(sql);
    
    return NextResponse.json({ 
      message: 'All activity logs deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting activity logs:', error);
    return NextResponse.json(
      { error: 'Failed to delete activity logs' },
      { status: 500 }
    );
  }
}