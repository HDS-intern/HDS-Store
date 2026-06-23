import { randomUUID } from 'crypto'
import { getDb } from './db'
import type { ChatChannel, ChatMessage, ChatSender, ChatThreadSummary } from './chatTypes'

type ChatRow = {
  id: string
  user_id: string
  channel: string
  sender: string
  body: string
  created_at: string
  read_at: string | null
}

function rowToMessage(row: ChatRow): ChatMessage {
  return {
    id: row.id,
    userId: row.user_id,
    channel: row.channel as ChatChannel,
    sender: row.sender as ChatSender,
    body: row.body,
    createdAt: row.created_at,
    readAt: row.read_at ?? undefined,
  }
}

export function listChatMessages(userId: string, channel: ChatChannel): ChatMessage[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT id, user_id, channel, sender, body, created_at, read_at
       FROM chat_messages
       WHERE user_id = ? AND channel = ?
       ORDER BY created_at ASC`
    )
    .all(userId, channel) as ChatRow[]
  return rows.map(rowToMessage)
}

export function insertChatMessage(input: {
  userId: string
  channel: ChatChannel
  sender: ChatSender
  body: string
}): ChatMessage {
  const db = getDb()
  const id = randomUUID()
  const createdAt = new Date().toISOString()

  db.prepare(
    `INSERT INTO chat_messages (id, user_id, channel, sender, body, created_at, read_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`
  ).run(id, input.userId, input.channel, input.sender, input.body.trim(), createdAt)

  return {
    id,
    userId: input.userId,
    channel: input.channel,
    sender: input.sender,
    body: input.body.trim(),
    createdAt,
  }
}

export function markSupportMessagesRead(userId: string, forSender: 'customer' | 'staff') {
  const db = getDb()
  const targetSender = forSender === 'customer' ? 'staff' : 'customer'
  db.prepare(
    `UPDATE chat_messages
     SET read_at = ?
     WHERE user_id = ? AND channel = 'support' AND sender = ? AND read_at IS NULL`
  ).run(new Date().toISOString(), userId, targetSender)
}

export function countUnreadSupportForCustomer(userId: string): number {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM chat_messages
       WHERE user_id = ? AND channel = 'support' AND sender = 'staff' AND read_at IS NULL`
    )
    .get(userId) as { c: number }
  return row.c ?? 0
}

export function listSupportThreads(): ChatThreadSummary[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT m.user_id, u.name AS customer_name, u.email AS customer_email,
              m.body AS last_message, m.created_at AS last_message_at,
              (
                SELECT COUNT(*) FROM chat_messages um
                WHERE um.user_id = m.user_id AND um.channel = 'support'
                  AND um.sender = 'customer' AND um.read_at IS NULL
              ) AS unread_count
       FROM chat_messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.channel = 'support'
         AND m.created_at = (
           SELECT MAX(created_at) FROM chat_messages
           WHERE user_id = m.user_id AND channel = 'support'
         )
       ORDER BY m.created_at DESC`
    )
    .all() as {
    user_id: string
    customer_name: string
    customer_email: string
    last_message: string
    last_message_at: string
    unread_count: number
  }[]

  return rows.map((row) => ({
    userId: row.user_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    unreadCount: row.unread_count,
  }))
}

export function countUnreadSupportThreads(): number {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COUNT(DISTINCT user_id) as c FROM chat_messages
       WHERE channel = 'support' AND sender = 'customer' AND read_at IS NULL`
    )
    .get() as { c: number }
  return row.c ?? 0
}

export function countUnreadCustomerChatMessages(): number {
  const db = getDb()
  const row = db
    .prepare(
      `SELECT COUNT(*) as c FROM chat_messages
       WHERE channel = 'support' AND sender = 'customer' AND read_at IS NULL`
    )
    .get() as { c: number }
  return row.c ?? 0
}

export function deleteSupportChatMessage(messageId: string): boolean {
  const db = getDb()
  const result = db
    .prepare(`DELETE FROM chat_messages WHERE id = ? AND channel = 'support'`)
    .run(messageId)
  return result.changes > 0
}

export function deleteSupportThread(userId: string): number {
  const db = getDb()
  const result = db
    .prepare(`DELETE FROM chat_messages WHERE user_id = ? AND channel = 'support'`)
    .run(userId)
  return result.changes
}
