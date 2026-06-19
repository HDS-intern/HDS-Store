import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getDb, dbUserToUser } from '@/lib/db'
import { hashPassword, createSession } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { username, email, password, name, phone } = await request.json()

    if (!username?.trim() || !email?.trim() || !password || !name?.trim()) {
      return NextResponse.json(
        { error: 'Username, email, name, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 4) {
      return NextResponse.json(
        { error: 'Password must be at least 4 characters' },
        { status: 400 }
      )
    }

    const db = getDb()
    const existing = db
      .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
      .get(username.trim(), email.trim())

    if (existing) {
      return NextResponse.json({ error: 'Username or email already exists' }, { status: 409 })
    }

    const id = randomUUID()
    const hash = hashPassword(password)
    const now = new Date().toISOString()

    db.prepare(
      `INSERT INTO users (id, username, email, password_hash, name, role, phone, created_at)
       VALUES (?, ?, ?, ?, ?, 'customer', ?, ?)`
    ).run(id, username.trim(), email.trim(), hash, name.trim(), phone?.trim() || null, now)

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    const token = createSession(id)

    return NextResponse.json({ token, user: dbUserToUser(user as Parameters<typeof dbUserToUser>[0]) })
  } catch {
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
