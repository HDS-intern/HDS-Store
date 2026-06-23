import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserBySession, getTokenFromRequest, requirePermission } from '@/lib/auth'
import { buildSalesChartData } from '@/lib/dashboardSalesChart'
import { parseSalesChartFilter } from '@/lib/salesChartFilter'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'dashboard')
    const { searchParams } = new URL(request.url)
    const filter = parseSalesChartFilter(searchParams)
    const db = getDb()
    const salesChart = buildSalesChartData(db, filter ?? undefined, 6)

    return NextResponse.json({ salesChart, filter: filter ?? null })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
