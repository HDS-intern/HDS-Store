import { NextResponse } from 'next/server'
import { getUserBySession, getTokenFromRequest, requireRole } from '@/lib/auth'
import {
  countUnreadSupportForCustomer,
  insertChatMessage,
  listChatMessages,
  markSupportMessagesRead,
} from '@/lib/customerChat'
import { getBotGreeting, getBotReply } from '@/lib/chatbot'
import type { ChatChannel } from '@/lib/chatTypes'

export const runtime = 'nodejs'

function assertCustomer(request: Request) {
  return requireRole(getUserBySession(getTokenFromRequest(request)), ['customer'])
}

export async function GET(request: Request) {
  try {
    const user = assertCustomer(request)
    const { searchParams } = new URL(request.url)
    const channel = (searchParams.get('channel') || 'bot') as ChatChannel

    if (channel !== 'bot' && channel !== 'support') {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    if (searchParams.get('countOnly') === '1' && channel === 'support') {
      return NextResponse.json({ unreadSupport: countUnreadSupportForCustomer(user.id) })
    }

    let messages = listChatMessages(user.id, channel)

    if (channel === 'bot' && messages.length === 0) {
      const greeting = insertChatMessage({
        userId: user.id,
        channel: 'bot',
        sender: 'bot',
        body: getBotGreeting(),
      })
      messages = [greeting]
    }

    if (channel === 'support') {
      markSupportMessagesRead(user.id, 'customer')
    }

    const unreadSupport = countUnreadSupportForCustomer(user.id)

    return NextResponse.json({ messages, unreadSupport })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = assertCustomer(request)
    const { channel, message } = await request.json()
    const chatChannel = channel as ChatChannel

    if (chatChannel !== 'bot' && chatChannel !== 'support') {
      return NextResponse.json({ error: 'Invalid channel' }, { status: 400 })
    }

    const body = typeof message === 'string' ? message.trim() : ''
    if (!body) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const customerMessage = insertChatMessage({
      userId: user.id,
      channel: chatChannel,
      sender: 'customer',
      body,
    })

    if (chatChannel === 'bot') {
      const reply = insertChatMessage({
        userId: user.id,
        channel: 'bot',
        sender: 'bot',
        body: getBotReply(body),
      })
      return NextResponse.json({ messages: [customerMessage, reply] })
    }

    return NextResponse.json({
      messages: [customerMessage],
      notice: 'Your message was sent to our support team. We will reply here shortly.',
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
