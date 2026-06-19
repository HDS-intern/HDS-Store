import { randomUUID } from 'crypto'
import { getDb } from './db'

export function normalizeGuestChatId(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed.startsWith('guest-') || trimmed.length < 12) return null
  return trimmed
}

export function ensureGuestChatUser(guestId: string): string {
  const userId = normalizeGuestChatId(guestId)
  if (!userId) throw new Error('Invalid guest session')

  const db = getDb()
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId) as { id: string } | undefined
  if (existing) return userId

  const suffix = userId.slice(6, 14)
  const username = `guest_${suffix}`
  const email = `${username}@guest.hds.local`

  db.prepare(
    `INSERT INTO users (id, username, email, password_hash, name, role, created_at)
     VALUES (?, ?, ?, ?, ?, 'customer', ?)`
  ).run(userId, username, email, 'guest-no-login', 'Guest Visitor', new Date().toISOString())

  return userId
}

export function createGuestChatId(): string {
  return `guest-${randomUUID()}`
}
