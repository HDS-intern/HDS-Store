import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { getUserBySession, getTokenFromRequest, requireStaffAccess } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requireStaffAccess(getUserBySession(getTokenFromRequest(request)))
    const db = getDb()
    const rows = db
      .prepare(
        `SELECT id, user_id, user_name, items, total, status, created_at, order_id
         FROM bulk_order_confirmations
         ORDER BY created_at DESC
         LIMIT 50`
      )
      .all() as Record<string, unknown>[]

    const confirmations = rows.map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userName: row.user_name as string,
      items: JSON.parse(row.items as string),
      total: row.total as number,
      status: row.status as string,
      createdAt: row.created_at as string,
      orderId: (row.order_id as string | null) || undefined,
    }))

    return NextResponse.json({ confirmations })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
