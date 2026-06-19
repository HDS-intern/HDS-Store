import { randomBytes } from 'crypto'
import bcrypt from 'bcryptjs'
import { getDb, dbUserToUser, type DbUser } from './db'
import type { User } from './types'
import type { PermissionKey } from './permissions'
import { hasPermission } from './permissions'

const SESSION_DAYS = 7

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function createSession(userId: string): string {
  const db = getDb()
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS)

  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expiresAt.toISOString()
  )

  return token
}

export function deleteSession(token: string): void {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

export function getUserBySession(token: string | null): User | null {
  if (!token) return null

  const db = getDb()
  const session = db
    .prepare('SELECT user_id, expires_at FROM sessions WHERE token = ?')
    .get(token) as { user_id: string; expires_at: string } | undefined

  if (!session) return null
  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return null
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(session.user_id) as
    | DbUser
    | undefined
  if (!user) return null
  if (user.access_locked) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
    return null
  }
  return dbUserToUser(user)
}

export function getUserByLogin(login: string): DbUser | null {
  const db = getDb()
  const user = db
    .prepare('SELECT * FROM users WHERE username = ? OR email = ?')
    .get(login, login) as DbUser | undefined
  return user ?? null
}

export function requireRole(user: User | null, roles: User['role'][]): User {
  if (!user || !roles.includes(user.role)) {
    throw new Error('Unauthorized')
  }
  return user
}

export function requireStaffAccess(user: User | null): User {
  return requireRole(user, ['admin', 'staff'])
}

export function requirePermission(user: User | null, permission: PermissionKey): User {
  const u = requireStaffAccess(user)
  if (!hasPermission(u, permission)) {
    throw new Error('Unauthorized')
  }
  return u
}

export function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) return auth.slice(7)
  return request.headers.get('x-session-token')
}
