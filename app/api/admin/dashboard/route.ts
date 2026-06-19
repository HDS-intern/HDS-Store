import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserBySession, getTokenFromRequest, requirePermission } from '@/lib/auth'
import { buildSalesChartData } from '@/lib/dashboardSalesChart'
import { ensureDailyAbsences } from '@/lib/staffAttendance'
import type { DashboardStats } from '@/lib/types'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'dashboard')
    const db = getDb()
    const today = new Date().toISOString().slice(0, 10)
    ensureDailyAbsences(today)

    const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get() as { c: number }
    const orderStats = db.prepare(`
      SELECT
        SUM(CASE WHEN status != 'cancelled' THEN 1 ELSE 0 END) as total,
        COALESCE(SUM(
          CASE
            WHEN status != 'cancelled' AND payment_status = 'paid' THEN total
            ELSE 0
          END
        ), 0) as revenue,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(
          CASE
            WHEN status != 'cancelled' AND payment_status = 'pending' THEN 1
            ELSE 0
          END
        ) as pending_payments
      FROM orders
    `).get() as {
      total: number
      revenue: number
      pending_orders: number
      pending_payments: number
    }

    const liveStaff = db.prepare(
      "SELECT COUNT(*) as c FROM staff_records WHERE work_status = 'live'"
    ).get() as { c: number }

    const presentToday = db.prepare(
      "SELECT COUNT(*) as c FROM staff_attendance WHERE date = ? AND status = 'present' AND check_in IS NOT NULL"
    ).get(today) as { c: number }

    const salesChart = buildSalesChartData(db, 6)

    const attendanceRows = db.prepare(`
      SELECT a.id, a.staff_id, a.date, a.status, a.check_in, a.check_out, s.employee_name
      FROM staff_attendance a
      JOIN staff_records s ON s.id = a.staff_id
      WHERE a.date = ?
      ORDER BY a.check_in ASC
    `).all(today) as {
      id: string
      staff_id: string
      date: string
      status: string
      check_in: string | null
      check_out: string | null
      employee_name: string
    }[]

    const stats: DashboardStats = {
      totalProducts: productCount.c,
      totalOrders: orderStats.total ?? 0,
      totalRevenue: orderStats.revenue ?? 0,
      pendingOrders: orderStats.pending_orders ?? 0,
      pendingPayments: orderStats.pending_payments ?? 0,
      liveStaff: liveStaff.c,
      presentToday: presentToday.c,
      salesChart,
      attendanceToday: attendanceRows.map((r) => ({
        id: r.id,
        staffId: r.staff_id,
        employeeName: r.employee_name,
        date: r.date,
        status: r.status as 'present' | 'absent' | 'leave',
        checkIn: r.check_in ?? undefined,
        checkOut: r.check_out ?? undefined,
      })),
    }

    return NextResponse.json(stats)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
