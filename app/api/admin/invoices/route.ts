import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest, requireStaffAccess } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { getAllInvoices } from '@/lib/invoices'

export const runtime = 'nodejs'

function canViewInvoices(user: NonNullable<ReturnType<typeof getUserBySession>>) {
  return (
    hasPermission(user, 'orders_view') ||
    hasPermission(user, 'orders_manage') ||
    hasPermission(user, 'payments_view') ||
    hasPermission(user, 'payments_manage')
  )
}

export async function GET(request: Request) {
  try {
    const user = requireStaffAccess(getUserBySession(getTokenFromRequest(request)))
    if (!canViewInvoices(user)) {
      throw new Error('Unauthorized')
    }

    const invoices = getAllInvoices()
    return NextResponse.json(
      { invoices },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    )
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
