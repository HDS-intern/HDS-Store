import { NextResponse } from 'next/server'
import { deleteSession, getTokenFromRequest, getUserBySession } from '@/lib/auth'
import { recordStaffLogout } from '@/lib/staffAttendance'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const token = getTokenFromRequest(request)
  if (token) {
    const user = getUserBySession(token)
    if (user?.role === 'staff') {
      recordStaffLogout(user.id)
    }
    deleteSession(token)
  }
  return NextResponse.json({ success: true })
}
