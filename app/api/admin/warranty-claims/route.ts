import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest, requirePermission } from '@/lib/auth'
import { listWarrantyClaims } from '@/lib/warrantyClaims'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requirePermission(getUserBySession(getTokenFromRequest(request)), 'dashboard')
    const claims = listWarrantyClaims()
    return NextResponse.json({ claims })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
