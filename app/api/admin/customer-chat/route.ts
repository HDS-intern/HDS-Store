import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest, requireStaffAccess } from '@/lib/auth'
import {
  insertChatMessage,
  listChatMessages,
  listSupportThreads,
  markSupportMessagesRead,
} from '@/lib/customerChat'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    requireStaffAccess(getUserBySession(getTokenFromRequest(request)))
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (userId) {
      markSupportMessagesRead(userId, 'staff')
      const messages = listChatMessages(userId, 'support')
      return NextResponse.json({ messages, userId })
    }

    const threads = listSupportThreads()
    return NextResponse.json({ threads })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    const staff = requireStaffAccess(getUserBySession(getTokenFromRequest(request)))
    const { userId, message } = await request.json()

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const body = typeof message === 'string' ? message.trim() : ''
    if (!body) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const reply = insertChatMessage({
      userId,
      channel: 'support',
      sender: 'staff',
      body,
    })

    return NextResponse.json({ message: reply, staffName: staff.name })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
