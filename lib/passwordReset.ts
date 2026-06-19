import { randomBytes } from 'crypto'
import { getDb } from './db'
import { getUserByLogin, hashPassword } from './auth'

const RESET_HOURS = 1

export function createPasswordResetToken(login: string): { token: string; role: string } | null {
  const user = getUserByLogin(login.trim())
  if (!user) return null

  const db = getDb()
  db.prepare('DELETE FROM password_reset_tokens WHERE user_id = ?').run(user.id)

  const token = randomBytes(32).toString('hex')
  const now = new Date()
  const expiresAt = new Date(now.getTime() + RESET_HOURS * 60 * 60 * 1000)

  db.prepare(
    `INSERT INTO password_reset_tokens (token, user_id, expires_at, created_at)
     VALUES (?, ?, ?, ?)`
  ).run(token, user.id, expiresAt.toISOString(), now.toISOString())

  return { token, role: user.role }
}

export function resetPasswordWithToken(
  token: string,
  newPassword: string
): { success: true; role: string } {
  if (!newPassword || newPassword.length < 4) {
    throw new Error('Password must be at least 4 characters')
  }

  const db = getDb()
  const row = db
    .prepare('SELECT user_id, expires_at FROM password_reset_tokens WHERE token = ?')
    .get(token) as { user_id: string; expires_at: string } | undefined

  if (!row) {
    throw new Error('Invalid or expired reset link')
  }

  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token)
    throw new Error('Reset link has expired. Please request a new one.')
  }

  const user = db.prepare('SELECT role FROM users WHERE id = ?').get(row.user_id) as
    | { role: string }
    | undefined
  if (!user) {
    throw new Error('Account not found')
  }

  const hash = hashPassword(newPassword)
  const cols = db.prepare('PRAGMA table_info(users)').all() as { name: string }[]
  const hasPlain = cols.some((c) => c.name === 'password_plain')

  if (hasPlain && (user.role === 'admin' || user.role === 'staff')) {
    db.prepare('UPDATE users SET password_hash = ?, password_plain = ? WHERE id = ?').run(
      hash,
      newPassword,
      row.user_id
    )
  } else {
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, row.user_id)
  }

  db.prepare('DELETE FROM password_reset_tokens WHERE token = ?').run(token)

  return { success: true, role: user.role }
}
