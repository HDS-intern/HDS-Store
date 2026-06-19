import { randomBytes } from 'crypto'
import { getDb } from './db'

export type ContactMessage = {
  id: string
  name: string
  email: string
  phone?: string
  subject: string
  message: string
  createdAt: string
  read: boolean
}

type ContactMessageRow = {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string
  message: string
  created_at: string
  read_at: string | null
}

function rowToMessage(row: ContactMessageRow): ContactMessage {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? undefined,
    subject: row.subject,
    message: row.message,
    createdAt: row.created_at,
    read: Boolean(row.read_at),
  }
}

export function createContactMessage(input: {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}): ContactMessage {
  const db = getDb()
  const id = `MSG-${Date.now()}${randomBytes(3).toString('hex')}`
  const createdAt = new Date().toISOString()

  db.prepare(
    `INSERT INTO contact_messages (id, name, email, phone, subject, message, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    input.name.trim(),
    input.email.trim(),
    input.phone?.trim() || null,
    input.subject.trim(),
    input.message.trim(),
    createdAt
  )

  return {
    id,
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || undefined,
    subject: input.subject.trim(),
    message: input.message.trim(),
    createdAt,
    read: false,
  }
}

export function countUnreadContactMessages(): number {
  const db = getDb()
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM contact_messages WHERE read_at IS NULL')
    .get() as { count: number }
  return row.count ?? 0
}

export function markAllContactMessagesRead(): number {
  const db = getDb()
  const now = new Date().toISOString()
  const result = db
    .prepare('UPDATE contact_messages SET read_at = ? WHERE read_at IS NULL')
    .run(now)
  return result.changes
}

export function listContactMessages(): ContactMessage[] {
  const db = getDb()
  const rows = db
    .prepare('SELECT * FROM contact_messages ORDER BY created_at DESC')
    .all() as ContactMessageRow[]

  return rows.map(rowToMessage)
}

export function deleteContactMessage(id: string): boolean {
  const db = getDb()
  const result = db.prepare('DELETE FROM contact_messages WHERE id = ?').run(id)
  return result.changes > 0
}
