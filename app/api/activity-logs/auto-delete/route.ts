import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// DELETE: Auto-delete logs older than 2 months
export async function DELETE() {
  try {
    // Hitung tanggal 2 bulan yang lalu
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    
    const sql = `
      DELETE FROM activity_logs 
      WHERE timestamp < ?
    `;
    
    await query(sql, [twoMonthsAgo]);
    
    return NextResponse.json({ 
      message: 'Old activity logs deleted successfully'
    });
  } catch (error) {
    console.error('Error auto-deleting old logs:', error);
    return NextResponse.json(
      { error: 'Failed to auto-delete old logs' },
      { status: 500 }
    );
  }
}